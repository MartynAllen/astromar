import { NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getPhotoBySlug, getPrintProducts } from "@/lib/sanity.queries";
import { urlFor } from "@/sanity/image";
import { SITE_URL } from "@/lib/seo";
import { frameColorLabel, isValidFrameColor } from "@/lib/printFrameColors";

const RATE_LIMIT_WINDOW_MS = 60_000;
// Tighter than /api/geocode — this triggers a real Stripe API call (and,
// on success, a real Checkout Session), not a free lookup.
const RATE_LIMIT_MAX_REQUESTS = 10;

// In-memory per-instance limiter — see /api/geocode/route.ts for why this
// (not Redis) is the right amount of infra for a personal blog's traffic.
const requestLog = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now >= entry.resetAt) {
    requestLog.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return { limited: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfterSeconds: 0 };
}

function pruneExpired() {
  const now = Date.now();
  for (const [ip, entry] of requestLog) {
    if (now >= entry.resetAt) requestLog.delete(ip);
  }
}

// Starts a hosted Stripe Checkout session for one print of one photo.
// No cart, no client-supplied price — everything that affects the charge
// is re-fetched server-side from Sanity, keyed only by photoSlug + sku.
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limited, retryAfterSeconds } = isRateLimited(ip);
  if (Math.random() < 0.01) pruneExpired();

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  if (!stripeConfigured) {
    return NextResponse.json({ error: "Checkout is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { photoSlug, printProductId, framed, frameColor } = (body ?? {}) as {
    photoSlug?: unknown;
    printProductId?: unknown;
    framed?: unknown;
    frameColor?: unknown;
  };

  if (
    typeof photoSlug !== "string" ||
    typeof printProductId !== "string" ||
    photoSlug.length === 0 ||
    printProductId.length === 0 ||
    photoSlug.length > 200 ||
    printProductId.length > 200 ||
    typeof framed !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid photoSlug/printProductId/framed" },
      { status: 400 },
    );
  }

  // Only meaningful (and required) when framed — an unframed print has no
  // colour attribute at all. Validated against the same real Prodigi-backed
  // list the buy panel renders from, never trusted as freeform input.
  if (framed && !isValidFrameColor(frameColor)) {
    return NextResponse.json({ error: "Missing or invalid frameColor" }, { status: 400 });
  }

  const photo = await getPhotoBySlug(photoSlug);
  if (!photo || photo.availableAsPrint !== true) {
    return NextResponse.json({ error: "This photo isn't available as a print" }, { status: 400 });
  }

  // mainImage is watermarked (see astroPhoto schema) — printMasterImage is
  // the clean original a physical print must actually use. Refuse outright
  // rather than falling back to mainImage: a silent fallback here would
  // ship a paying customer a watermarked print.
  if (!photo.printMasterImage?.asset) {
    console.error(`Checkout blocked: no printMasterImage for photo ${photo._id} (${photoSlug})`);
    return NextResponse.json(
      { error: "This photo isn't fully set up for printing yet — check back shortly" },
      { status: 400 },
    );
  }

  const products = await getPrintProducts();
  const product = products.find((p) => p._id === printProductId);
  if (!product) {
    return NextResponse.json({ error: "Unknown print product" }, { status: 400 });
  }

  // Never trust a client-supplied sku or price — both are derived here from
  // the size + framed flag, against the product doc just re-fetched above.
  let sku: string;
  let priceGBP: number;
  let productLabel: string;
  if (framed) {
    if (!product.framedSku || !product.framingAddonPriceGBP) {
      return NextResponse.json(
        { error: "Framing isn't available for this size" },
        { status: 400 },
      );
    }
    sku = product.framedSku;
    priceGBP = product.unframedPriceGBP + product.framingAddonPriceGBP;
    productLabel = `${product.title} (Framed — ${frameColorLabel(frameColor as string)})`;
  } else {
    sku = product.unframedSku;
    priceGBP = product.unframedPriceGBP;
    productLabel = product.title;
  }

  // The clean, unwatermarked master — never mainImage (watermarked) here.
  // Sanity can't upscale past the original — this just asks for as large as
  // exists, which is what Prodigi's print quality actually needs. Also used
  // as the Stripe line item's thumbnail, which is correct: it's showing the
  // customer what they're actually about to receive, unwatermarked.
  // photo.printRotation (see astroPhoto schema) is applied here too — it
  // must match BuyPrintPanel's Quick View preview exactly, since Prodigi
  // crops this exact rotated image to the ordered SKU's shape. Rotating
  // only the preview and not this would mean the physical print doesn't
  // match what the customer was shown before paying.
  const printMasterBuilder = urlFor(photo.printMasterImage)
    .width(6000)
    .format("jpg")
    .quality(90);
  const imageUrl = (
    photo.printRotation ? printMasterBuilder.orientation(photo.printRotation) : printMasterBuilder
  ).url();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: priceGBP,
            product_data: {
              name: `${photo.title} — ${productLabel}`,
              images: [imageUrl],
            },
          },
          quantity: 1,
        },
      ],
      // v1 scope: GB shipping only. Each printProduct price bakes in an
      // estimated UK shipping cost; international needs a live per-destination
      // Prodigi quote, deliberately deferred rather than silently mispriced.
      shipping_address_collection: { allowed_countries: ["GB"] },
      payment_intent_data: {
        metadata: {
          photoId: photo._id,
          photoSlug,
          sku,
          imageUrl,
          // Only set for framed orders — the webhook falls back to
          // DEFAULT_FRAME_COLOR for unframed SKUs, which don't take a
          // colour attribute at all, so this is never actually read there.
          ...(framed ? { frameColor: frameColor as string } : {}),
          prodigiStatus: "pending",
        },
      },
      success_url: `${SITE_URL}/gallery/${photoSlug}?checkout=success`,
      cancel_url: `${SITE_URL}/gallery/${photoSlug}?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
