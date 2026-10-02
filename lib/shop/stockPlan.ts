import type { OrderItem } from "@/lib/shop/orderMeta";
import type { PricedProduct } from "@/lib/shop/types";

// Pure planning for the stock decrement a paid shop order triggers, kept
// separate from the Sanity write itself so the rules are unit-testable.

export interface StockUpdate {
  productId: string;
  variantKey: string;
  sku: string;
  qty: number;
}

// Variant keys are interpolated into a Sanity patch path
// (variants[_key=="…"].stock), so only ever allow the plain characters
// Studio generates. They come from our own order metadata, not user input —
// this is belt and braces, not the primary defence.
const SAFE_KEY = /^[A-Za-z0-9_-]+$/;

export function isSafeKey(key: string): boolean {
  return SAFE_KEY.test(key);
}

export function planStockUpdates(
  items: OrderItem[],
  products: Pick<PricedProduct, "_id" | "fulfilment" | "variants">[],
): { updates: StockUpdate[]; unmatched: OrderItem[] } {
  const byId = new Map(products.map((p) => [p._id, p]));
  const merged = new Map<string, StockUpdate>();
  const unmatched: OrderItem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    const variant = product?.variants.find((v) => v._key === item.variantKey);
    if (!product || !variant || !isSafeKey(item.variantKey)) {
      unmatched.push(item);
      continue;
    }
    // Made-to-order items have no count to reduce.
    if (product.fulfilment !== "stocked") continue;
    const key = `${item.productId}\u0000${item.variantKey}`;
    const existing = merged.get(key);
    if (existing) existing.qty += item.qty;
    else
      merged.set(key, {
        productId: item.productId,
        variantKey: item.variantKey,
        sku: item.sku,
        qty: item.qty,
      });
  }
  return { updates: [...merged.values()], unmatched };
}

/** After the decrement: any updated variant now below zero was oversold (a last-item race). */
export function findOversold(
  updates: StockUpdate[],
  productsAfter: { _id: string; variants: { _key: string; stock?: number }[] }[],
): { sku: string; remaining: number }[] {
  const byId = new Map(productsAfter.map((p) => [p._id, p]));
  const oversold: { sku: string; remaining: number }[] = [];
  for (const u of updates) {
    const stock = byId.get(u.productId)?.variants.find((v) => v._key === u.variantKey)?.stock;
    if (typeof stock === "number" && stock < 0) oversold.push({ sku: u.sku, remaining: stock });
  }
  return oversold;
}
