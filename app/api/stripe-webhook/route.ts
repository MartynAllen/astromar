import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { DEFAULT_FRAME_COLOR, isValidFrameColor } from "@/lib/printFrameColors";

const PRODIGI_API_BASE_URL = process.env.PRODIGI_API_BASE_URL;
const PRODIGI_API_KEY = process.env.PRODIGI_API_KEY;
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

interface ProdigiOrderResult {
  ok: true;
  orderId: string;
}
interface ProdigiOrderFailure {
  ok: false;
  error: string;
}

async function placeProdigiOrder(params: {
  merchantReference: string;
  recipientName: string;
  email: string | null;
  phone: string | null;
  address: {
    line1: string;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country: string;
  };
  sku: string;
  imageUrl: string;
  frameColor: string;
}): Promise<ProdigiOrderResult | ProdigiOrderFailure> {
  if (!PRODIGI_API_BASE_URL || !PRODIGI_API_KEY) {
    return { ok: false, error: "Prodigi not configured" };
  }

  try {
    const res = await fetch(`${PRODIGI_API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PRODIGI_API_KEY,
      },
      body: JSON.stringify({
        merchantReference: params.merchantReference,
        shippingMethod: "Standard",
        recipient: {
          name: params.recipientName,
          email: params.email ?? undefined,
          phoneNumber: params.phone ?? undefined,
          address: {
            line1: params.address.line1,
            line2: params.address.line2 ?? undefined,
            townOrCity: params.address.city ?? undefined,
            stateOrCounty: params.address.state ?? undefined,
            postalOrZipCode: params.address.postalCode ?? undefined,
            countryCode: params.address.country,
          },
        },
        items: [
          {
            sku: params.sku,
            copies: 1,
            sizing: "fillPrintArea",
            assets: [{ printArea: "default", url: params.imageUrl }],
            // Prodigi's Classic Framed Print line (GLOBAL-CFPM-*) requires a
            // frame color attribute — confirmed via a real sandbox order
            // that came back 400 ValidationFailed/MissingRequiredAttributes
            // without it. The buy panel now offers a real colour choice
            // (see lib/printFrameColors.ts); params.frameColor carries it
            // through from checkout's Stripe metadata.
            ...(params.sku.includes("CFPM") ? { attributes: { color: params.frameColor } } : {}),
          },
        ],
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: `Prodigi ${res.status}: ${JSON.stringify(data).slice(0, 300)}` };
    }
    const orderId = data?.order?.id;
    if (!orderId) {
      return { ok: false, error: `Prodigi order created but no id in response: ${JSON.stringify(data).slice(0, 300)}` };
    }
    return { ok: true, orderId };
  } catch (err) {
    return { ok: false, error: `Prodigi request failed: ${String(err).slice(0, 300)}` };
  }
}

async function sendAlert(message: string) {
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.error("Alert webhook failed:", err);
  }
}

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
  // the ledger. A Stripe retry of an event we've already fulfilled should
  // be a silent no-op, not a second Prodigi order.
  if (paymentIntent.metadata.prodigiStatus === "created") {
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
  const shipping = session.collected_information?.shipping_details;
  const addressLine1 = shipping?.address.line1;
  const addressCountry = shipping?.address.country;

  if (!sku || !imageUrl || !shipping || !addressLine1 || !addressCountry) {
    const error = "Missing sku/imageUrl on PaymentIntent metadata, or an incomplete shipping address";
    console.error(error, session.id);
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...paymentIntent.metadata, prodigiStatus: "failed", prodigiError: error },
    });
    await sendAlert(`⚠️ Astromar print order ${session.id} couldn't be placed: ${error}`);
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
  await sendAlert(
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
