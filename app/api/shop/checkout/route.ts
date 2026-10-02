import { NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getShopProductsByIds, getShopSettings } from "@/lib/sanity.queries";
import { urlFor } from "@/sanity/image";
import { SITE_URL } from "@/lib/seo";
import { parseBasketLines } from "@/lib/shop/basket";
import { priceBasket } from "@/lib/shop/pricing";
import { toQuoteDto } from "@/lib/shop/quoteDto";
import {
  buildOrderMetadata,
  buildShippingMessage,
  buildShippingOption,
  buildStripeLineItems,
} from "@/lib/shop/stripeSession";
import { getClientIp } from "@/lib/getClientIp";
import { isSameSiteRequest } from "@/lib/sameSiteRequest";
import { createRateLimiter } from "@/lib/rateLimiter";

// Same ceiling as the print checkout — this creates a real Stripe Checkout
// Session on every call.
const { isRateLimited, pruneExpired } = createRateLimiter(60_000, 10);

// Stripe requires a session to live at least 30 minutes; the extra minute
// keeps us clear of the boundary if our clock and theirs disagree slightly.
const SESSION_LIFETIME_SECONDS = 31 * 60;

// Starts a hosted Stripe Checkout for a whole basket. Mirrors
// /api/checkout (the photo prints): same-site check, rate limit, no
// client-supplied price. The client sends only {productId, variantKey,
// qty}; prices, stock, postage and the free-postage threshold are all
// re-derived here from a fresh Sanity read via the same priceBasket() the
// basket page used.
export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const ip = getClientIp(request);
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

  const lines = parseBasketLines((body as { lines?: unknown } | null)?.lines);
  if (!lines || lines.length === 0) {
    return NextResponse.json({ error: "Your basket is empty or invalid" }, { status: 400 });
  }

  let quote;
  try {
    const [products, settings] = await Promise.all([
      getShopProductsByIds([...new Set(lines.map((l) => l.productId))]),
      getShopSettings({ fresh: true }),
    ]);
    quote = priceBasket(lines, products, settings);
  } catch (err) {
    console.error("Shop checkout pricing failed:", err);
    return NextResponse.json({ error: "The shop is temporarily unavailable" }, { status: 502 });
  }

  // Something in the basket changed since it was last priced (sold out,
  // switched off, over the limit). Refuse rather than charge for a subset,
  // and hand back the fresh quote so the basket page can show exactly what.
  if (quote.hasIssues) {
    return NextResponse.json(
      {
        error: "Some items in your basket have changed — please review it.",
        quote: toQuoteDto(quote, (img) => urlFor(img.image).width(240).height(240).fit("crop").url()),
      },
      { status: 409 },
    );
  }
  if (quote.subtotalPence <= 0) {
    return NextResponse.json({ error: "Your basket is empty or invalid" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: buildStripeLineItems(quote.lines, (line) =>
        line.image?.image.asset
          ? urlFor(line.image.image).width(600).height(600).fit("crop").format("jpg").url()
          : undefined,
      ),
      // v1 scope: UK only, matching the flat UK postage rate.
      shipping_address_collection: { allowed_countries: ["GB"] },
      shipping_options: [buildShippingOption(quote)],
      custom_text: { shipping_address: { message: buildShippingMessage(quote.dispatch, SITE_URL) } },
      expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
      payment_intent_data: {
        description: "Astromar shop order",
        metadata: buildOrderMetadata(quote.lines),
      },
      success_url: `${SITE_URL}/shop/thanks`,
      cancel_url: `${SITE_URL}/shop/basket?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Shop Stripe checkout session creation failed:", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
