import type { PrintProduct } from "@/lib/sanity.queries";

// Cheapest active size's unframed price, in pence — the "from £X" figure
// shown on cards and teasers. undefined if the catalog is empty, so callers
// naturally hide any print-badge UI rather than showing "from £NaN".
export function cheapestPrintPriceGBP(products: PrintProduct[]): number | undefined {
  if (products.length === 0) return undefined;
  return Math.min(...products.map((p) => p.unframedPriceGBP));
}
