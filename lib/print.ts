import type { AstroPhotoDetail, PrintProduct } from "@/lib/sanity.queries";

// Cheapest active size's unframed price, in pence — the "from £X" figure
// shown on cards and teasers. undefined if the catalog is empty, so callers
// naturally hide any print-badge UI rather than showing "from £NaN".
export function cheapestPrintPriceGBP(products: PrintProduct[]): number | undefined {
  if (products.length === 0) return undefined;
  return Math.min(...products.map((p) => p.unframedPriceGBP));
}

/**
 * The sizes a specific photo can actually be sold at — the full catalog,
 * unless the photo's own source resolution can't support the larger sizes
 * without looking visibly soft (see astroPhoto schema's
 * maxPrintLongEdgeIn). Called from both BuyPrintPanel (so an
 * under-resolved size is never even shown) and checkout's own
 * re-validation (so it can't be bought by posting its printProductId
 * directly, bypassing the UI) — the same size list must reach both, or
 * the restriction is cosmetic rather than real.
 */
export function printProductsForPhoto(
  products: PrintProduct[],
  photo: Pick<AstroPhotoDetail, "maxPrintLongEdgeIn">,
): PrintProduct[] {
  const maxEdge = photo.maxPrintLongEdgeIn;
  if (!maxEdge) return products;
  return products.filter((p) => Math.max(p.widthIn, p.heightIn) <= maxEdge);
}
