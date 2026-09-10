import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { DEFAULT_FRAME_COLOR, isValidFrameColor } from "@/lib/printFrameColors";
import { isValidPrintFinish } from "@/lib/printFinish";
import { placeProdigiOrder } from "@/lib/prodigi";
import { sendOpsAlert } from "@/lib/alert";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) {
    console.error("Checkout session completed with no payment_intent:", session.id);
    return NextResponse.json({ received: true });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // Idempotency guard — no database, so the PaymentIntent's own metadata is
  // the ledger. Once an order exists at Prodigi it carries a prodigiOrderId;
  // a Stripe retry then is a silent no-op, not a second order. A "failed"
  // status has no orderId, so those still (re)attempt — which is the point
  // of returning 500 on failure.
  if (paymentIntent.metadata.prodigiOrderId) {
    return NextResponse.json({ received: true });
  }

  const sku = paymentIntent.metadata.sku;
  const imageUrl = paymentIntent.metadata.imageUrl;
  // Set by checkout only for framed orders; falls back defensively for any
  // in-flight session created before this field existed rather than failing
  // an otherwise-good order over a missing colour.
  const frameColor = isValidFrameColor(paymentIntent.metadata.frameColor)
    ? paymentIntent.metadata.frameColor
    : DEFAULT_FRAME_COLOR;
  // Only set by checkout for a gloss/lustre order — null (not a default)
  // when absent, since a matte order must send no finish attribute to
  // Prodigi at all rather than a made-up fallback value.
  const finish = isValidPrintFinish(paymentIntent.metadata.finish)
    ? paymentIntent.metadata.finish
    : null;
  const shipping = session.collected_information?.shipping_details;
  const addressLine1 = shipping?.address.line1;
  const addressCountry = shipping?.address.country;

  if (!sku || !imageUrl || !shipping || !addressLine1 || !addressCountry) {
    const error = "Missing sku/imageUrl on PaymentIntent metadata, or an incomplete shipping address";
    console.error(error, session.id);
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...paymentIntent.metadata, prodigiStatus: "failed", prodigiError: error },
    });
    await sendOpsAlert(`⚠️ Astromar print order ${session.id} couldn't be placed: ${error}`);
    return NextResponse.json({ error }, { status: 500 });
  }

  const result = await placeProdigiOrder({
    merchantReference: session.id,
    recipientName: shipping.name,
    email: session.customer_details?.email ?? null,
    phone: session.customer_details?.phone ?? null,
    address: {
      line1: addressLine1,
      line2: shipping.address.line2,
      city: shipping.address.city,
      state: shipping.address.state,
      postalCode: shipping.address.postal_code,
      country: addressCountry,
    },
    sku,
    imageUrl,
    frameColor,
    finish,
  });

  if (result.ok) {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...paymentIntent.metadata, prodigiStatus: "created", prodigiOrderId: result.orderId },
    });
    return NextResponse.json({ received: true });
  }

  // Money's already been taken; the print hasn't been ordered. This must
  // not fail silently — write the failure where it's visible in the Stripe
  // Dashboard, return 500 so Stripe auto-retries for ~3 days, and fire one
  // alert (best-effort — its own failure must never mask this 500).
  //
  // The full Prodigi error (result.error) is kept only in the PaymentIntent
  // metadata below — that's the one channel meant for this level of detail,
  // visible only to the account owner in the Stripe Dashboard. The alert
  // and the response back to Stripe deliberately stay generic: Prodigi's
  // validation errors can echo submitted field values back (e.g. a bad
  // postcode), and neither the alert channel nor Stripe's own webhook log
  // needs that level of detail to be useful — a PaymentIntent ID is enough
  // to look the rest up.
  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: { ...paymentIntent.metadata, prodigiStatus: "failed", prodigiError: result.error.slice(0, 450) },
  });
  await sendOpsAlert(
    `⚠️ Astromar print order paid but Prodigi order failed — check PaymentIntent ${paymentIntentId} in the Stripe Dashboard for details.`,
  );
  return NextResponse.json(
    { error: "Prodigi order failed — see PaymentIntent metadata for details" },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  if (!stripeConfigured || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Raw bytes required for HMAC verification — never call request.json()
  // first. App Router route handlers don't auto-parse the body, so no
  // special route config is needed for this to work.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    return handleCheckoutCompleted(event.data.object);
  }

  return NextResponse.json({ received: true });
}
