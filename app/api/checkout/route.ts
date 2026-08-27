import { NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getPhotoBySlug, getPrintProducts } from "@/lib/sanity.queries";
import { urlFor } from "@/sanity/image";
import { SITE_URL } from "@/lib/seo";

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

  const { photoSlug, sku } = (body ?? {}) as { photoSlug?: unknown; sku?: unknown };

  if (
    typeof photoSlug !== "string" ||
    typeof sku !== "string" ||
    photoSlug.length === 0 ||
    sku.length === 0 ||
    photoSlug.length > 200 ||
    sku.length > 100
  ) {
    return NextResponse.json({ error: "Missing or invalid photoSlug/sku" }, { status: 400 });
  }

  const photo = await getPhotoBySlug(photoSlug);
  if (!photo || photo.availableAsPrint !== true) {
    return NextResponse.json({ error: "This photo isn't available as a print" }, { status: 400 });
  }

  const products = await getPrintProducts();
  const product = products.find((p) => p.sku === sku);
  if (!product) {
    return NextResponse.json({ error: "Unknown print product" }, { status: 400 });
  }

  // Sanity can't upscale past the original — this just asks for as large as
  // exists, which is what Prodigi's print quality actually needs.
  const imageUrl = urlFor(photo.mainImage).width(6000).format("jpg").quality(90).url();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: product.priceGBP,
            product_data: {
              name: `${photo.title} — ${product.title}`,
              images: [imageUrl],
            },
          },
          quantity: 1,
        },
      ],
      // v1 scope: GB shipping only. Each printProduct.priceGBP bakes in an
      // estimated UK shipping cost; international needs a live per-destination
      // Prodigi quote, deliberately deferred rather than silently mispriced.
      shipping_address_collection: { allowed_countries: ["GB"] },
      payment_intent_data: {
        metadata: {
          photoId: photo._id,
          photoSlug,
          sku: product.sku,
          imageUrl,
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
