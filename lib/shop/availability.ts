import type { ShopFulfilment, ShopVariant } from "@/lib/shop/types";

// One definition of "can this be bought, and how do we describe it", used by
// the cards, the product page, and the Product JSON-LD — so a sold-out item
// can't read "in stock" to a visitor and "InStock" to Google.

/** At or below this many left, a stocked variant is shown as "Only N left". */
export const LOW_STOCK_THRESHOLD = 3;

export type VariantAvailability =
  | { state: "madeToOrder" }
  | { state: "inStock" }
  | { state: "lowStock"; remaining: number }
  | { state: "soldOut" };

export function variantAvailability(
  fulfilment: ShopFulfilment,
  variant: Pick<ShopVariant, "stock">,
): VariantAvailability {
  if (fulfilment === "madeToOrder") return { state: "madeToOrder" };
  const stock = Math.max(0, variant.stock ?? 0);
  if (stock === 0) return { state: "soldOut" };
  if (stock <= LOW_STOCK_THRESHOLD) return { state: "lowStock", remaining: stock };
  return { state: "inStock" };
}

export function isPurchasable(
  fulfilment: ShopFulfilment,
  variant: Pick<ShopVariant, "stock">,
): boolean {
  return variantAvailability(fulfilment, variant).state !== "soldOut";
}

/** A product is available if at least one variant can be bought. */
export function productAvailable(product: {
  fulfilment: ShopFulfilment;
  variants: Pick<ShopVariant, "stock">[];
}): boolean {
  return product.variants.some((v) => isPurchasable(product.fulfilment, v));
}

export function priceRangePence(variants: Pick<ShopVariant, "pricePence">[]): {
  low: number;
  high: number;
} {
  const prices = variants.map((v) => v.pricePence);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

export function availabilityLabel(
  fulfilment: ShopFulfilment,
  variant: Pick<ShopVariant, "stock">,
  leadTimeDays?: number,
): string {
  const a = variantAvailability(fulfilment, variant);
  switch (a.state) {
    case "madeToOrder":
      return leadTimeDays ? `Made to order · about ${leadTimeDays} days` : "Made to order";
    case "inStock":
      return "In stock";
    case "lowStock":
      return `Only ${a.remaining} left`;
    case "soldOut":
      return "Sold out";
  }
}

/**
 * Google's recognised availability values only include InStock/OutOfStock
 * (not a "made to order" one), and a made-to-order item genuinely can be
 * ordered right now — so it maps to InStock, with the lead time stated in
 * the page copy rather than faked through a different schema value.
 */
export function schemaAvailability(product: {
  fulfilment: ShopFulfilment;
  variants: Pick<ShopVariant, "stock">[];
}): "https://schema.org/InStock" | "https://schema.org/OutOfStock" {
  return productAvailable(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}
