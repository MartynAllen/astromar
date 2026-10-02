import { NextResponse } from "next/server";
import { getShopProductsByIds, getShopSettings } from "@/lib/sanity.queries";
import { urlFor } from "@/sanity/image";
import { parseBasketLines } from "@/lib/shop/basket";
import { priceBasket } from "@/lib/shop/pricing";
import { toQuoteDto } from "@/lib/shop/quoteDto";
import { getClientIp } from "@/lib/getClientIp";
import { isSameSiteRequest } from "@/lib/sameSiteRequest";
import { createRateLimiter } from "@/lib/rateLimiter";

// A visitor viewing or editing their basket fires this on every change, so
// it's looser than checkout — but it hits Sanity uncached, so it's still
// capped to blunt a scripted client.
const { isRateLimited, pruneExpired } = createRateLimiter(60_000, 60);

// Turns a basket (product + variant + quantity only) into a priced quote
// with current stock and postage. This is what the basket page renders and
// the same pricing core /api/shop/checkout charges from, so the number a
// visitor sees is the number they pay. Read-only: nothing is created.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lines = parseBasketLines((body as { lines?: unknown } | null)?.lines);
  if (!lines) {
    return NextResponse.json({ error: "Invalid basket" }, { status: 400 });
  }

  try {
    const [products, settings] = await Promise.all([
      getShopProductsByIds([...new Set(lines.map((l) => l.productId))]),
      getShopSettings({ fresh: true }),
    ]);
    const quote = priceBasket(lines, products, settings);
    return NextResponse.json(
      toQuoteDto(quote, (img) => urlFor(img.image).width(240).height(240).fit("crop").url()),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Shop quote failed:", err);
    return NextResponse.json({ error: "The shop is temporarily unavailable" }, { status: 502 });
  }
}
