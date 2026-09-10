import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { sendOpsAlert } from "@/lib/alert";
import {
  prodigiCallbackConfigured,
  callbackTokenValid,
  getProdigiOrder,
  extractOrderRef,
  deriveFulfilment,
  sumProdigiChargesPence,
} from "@/lib/prodigi";
import { createRateLimiter } from "@/lib/rateLimiter";
import { getClientIp } from "@/lib/getClientIp";
import { printShippedEmailConfigured, sendPrintShippedEmail } from "@/lib/resend";

// Prodigi POSTs here whenever one of our orders changes status. Its
// callbacks carry no signature (unlike Stripe's), so this route treats the
// body as an untrusted nudge only: it re-fetches the authoritative order
// from Prodigi's API with our own key and acts on that. The ?token gate is
// a cheap first filter against random scanners.
const { isRateLimited, pruneExpired } = createRateLimiter(60_000, 60);

// Below this gross margin — Prodigi's tax-inclusive charge against what the
// customer actually paid, before Stripe's own ~1.5%+20p fee — something has
// shifted and the catalog needs a look. Normal sits around 25%+ even after
// the £2 thank-you card.
const MARGIN_ALERT_FLOOR = 0.15;

export async function POST(request: Request) {
  if (!prodigiCallbackConfigured || !stripeConfigured) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const ip = getClientIp(request);
  if (Math.random() < 0.02) pruneExpired();
  if (isRateLimited(ip).limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!callbackTokenValid(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id: prodigiOrderId, merchantReference: bodyRef } = extractOrderRef(body);
  if (!prodigiOrderId) {
    console.error("Prodigi callback with no order id in body", bodyRef);
    return NextResponse.json({ received: true });
  }

  // Never trust the body — re-fetch the real order.
  const fetched = await getProdigiOrder(prodigiOrderId);
  if (!fetched.ok) {
    console.error("Prodigi callback: order re-fetch failed", prodigiOrderId, fetched.error);
    // 500 so Prodigi retries a transient blip; a later status callback
    // would re-fetch and catch up regardless.
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 500 });
  }
  const order = fetched.order;

  // merchantReference is the Stripe Checkout Session id we set at order time.
  const ref = order.merchantReference || bodyRef;
  if (!ref) {
    console.error("Prodigi order has no merchantReference", prodigiOrderId);
    return NextResponse.json({ received: true });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(ref, { expand: ["line_items"] });
  } catch (err) {
    // An order whose merchantReference isn't one of our Checkout sessions
    // (a manual Prodigi order, say) — nothing to reconcile, just ack.
    console.error(
      "Prodigi callback: no Stripe session for",
      ref,
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ received: true });
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) return NextResponse.json({ received: true });
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const fulfilment = deriveFulfilment(order);
  const prevStatus = paymentIntent.metadata.prodigiStatus;
  const nextMeta: Record<string, string> = { ...paymentIntent.metadata };
  const alerts: string[] = [];
  let changed = false;

  // Defensive: if the Stripe webhook placed the order but failed to write
  // the id back, capture it now so retries stay idempotent.
  if (!nextMeta.prodigiOrderId) {
    nextMeta.prodigiOrderId = order.id;
    changed = true;
  }

  if (prevStatus !== fulfilment.status) {
    nextMeta.prodigiStatus = fulfilment.status;
    changed = true;
  }

  if (
    fulfilment.trackingNumber &&
    paymentIntent.metadata.trackingNumber !== fulfilment.trackingNumber
  ) {
    nextMeta.trackingNumber = fulfilment.trackingNumber;
    if (fulfilment.trackingUrl) nextMeta.trackingUrl = fulfilment.trackingUrl;
    if (fulfilment.carrier) nextMeta.carrier = fulfilment.carrier;
    changed = true;
  }

  // "Your print is on its way" — once, when the order ships. Prodigi's
  // white-label fulfilment tells the customer nothing, and Stripe only
  // sends a payment receipt. Dormant until ORDERS_FROM_EMAIL is set (needs
  // a verified Resend domain). On failure we don't set the flag, so a
  // later "Complete" callback retries, and we alert so it can be sent by
  // hand.
  const customerEmail = session.customer_details?.email;
  if (
    fulfilment.status === "shipped" &&
    nextMeta.printShippedEmailSent !== "1" &&
    printShippedEmailConfigured &&
    customerEmail
  ) {
    const itemDescription =
      session.line_items?.data?.[0]?.description ?? "Your Astromar print";
    const sent = await sendPrintShippedEmail({
      to: customerEmail,
      itemDescription,
      carrier: fulfilment.carrier,
      trackingNumber: fulfilment.trackingNumber,
      trackingUrl: fulfilment.trackingUrl,
    });
    if (sent.ok) {
      nextMeta.printShippedEmailSent = "1";
      changed = true;
    } else {
      alerts.push(
        `⚠️ Order ${prodigiOrderId} shipped but the customer email didn't send (${sent.error}) — ${customerEmail}, tracking ${fulfilment.trackingUrl ?? fulfilment.trackingNumber ?? "n/a"}.`,
      );
    }
  }

  if (fulfilment.status === "cancelled" && prevStatus !== "cancelled") {
    alerts.push(
      `⚠️ Prodigi CANCELLED order ${prodigiOrderId} (PaymentIntent ${paymentIntentId}) — the customer has paid. Refund or reorder as needed.`,
    );
  }

  if (fulfilment.hasIssues && nextMeta.prodigiIssueAlerted !== "1") {
    nextMeta.prodigiIssueAlerted = "1";
    changed = true;
    alerts.push(
      `⚠️ Prodigi order ${prodigiOrderId} (PaymentIntent ${paymentIntentId}) reports an issue — check the Prodigi dashboard.`,
    );
  }

  // Cost-drift guard — runs once, as soon as the order carries finalised
  // charges. Prices are hardcoded in Sanity; this is the signal that
  // Prodigi's have moved out from under them.
  if (nextMeta.prodigiCostChecked !== "1") {
    const costPence = sumProdigiChargesPence(order);
    const paidPence = session.amount_total;
    if (costPence != null && paidPence != null && paidPence > 0) {
      nextMeta.prodigiCostChecked = "1";
      nextMeta.prodigiCostPence = String(costPence);
      changed = true;
      const margin = (paidPence - costPence) / paidPence;
      if (margin < MARGIN_ALERT_FLOOR) {
        alerts.push(
          `⚠️ Thin margin on order ${prodigiOrderId}: customer paid £${(paidPence / 100).toFixed(2)}, ` +
            `Prodigi charged £${(costPence / 100).toFixed(2)} (${(margin * 100).toFixed(1)}% before Stripe's fee). ` +
            `Time to reprice the catalog.`,
        );
      }
    }
  }

  if (changed) {
    await stripe.paymentIntents.update(paymentIntentId, { metadata: nextMeta });
  }
  for (const message of alerts) await sendOpsAlert(message);

  return NextResponse.json({ received: true });
}
