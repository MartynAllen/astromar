import type { BasketLine } from "@/lib/shop/types";

// Pure basket logic shared by the browser (localStorage) and the API routes
// (untrusted request bodies) — one validator for both, so what the client
// can store is never looser than what the server will accept.

export const MAX_BASKET_LINES = 10;
/** Absolute ceiling, independent of the editable per-line setting in shopSettings. */
export const MAX_QTY_HARD = 99;
const MAX_ID_LENGTH = 64;

function isBasketLine(value: unknown): value is BasketLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    v.productId.length > 0 &&
    v.productId.length <= MAX_ID_LENGTH &&
    typeof v.variantKey === "string" &&
    v.variantKey.length > 0 &&
    v.variantKey.length <= MAX_ID_LENGTH &&
    typeof v.qty === "number" &&
    Number.isInteger(v.qty) &&
    v.qty >= 1 &&
    v.qty <= MAX_QTY_HARD
  );
}

/**
 * Validates an untrusted value as a basket. Returns null if anything is
 * malformed (rather than silently dropping bad lines — an API caller sending
 * garbage should be told, not quietly given a smaller order). Merges
 * duplicate product+variant lines so a caller can't split one line into
 * several to dodge a per-line quantity limit.
 */
export function parseBasketLines(input: unknown): BasketLine[] | null {
  if (!Array.isArray(input) || input.length > MAX_BASKET_LINES * 2) return null;
  const merged = new Map<string, BasketLine>();
  for (const item of input) {
    if (!isBasketLine(item)) return null;
    const key = `${item.productId}\u0000${item.variantKey}`;
    const existing = merged.get(key);
    if (existing) {
      existing.qty += item.qty;
      if (existing.qty > MAX_QTY_HARD) return null;
    } else {
      merged.set(key, {
        productId: item.productId,
        variantKey: item.variantKey,
        qty: item.qty,
      });
    }
  }
  if (merged.size > MAX_BASKET_LINES) return null;
  return [...merged.values()];
}

export function basketCount(lines: BasketLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function canAddLine(lines: BasketLine[], productId: string, variantKey: string): boolean {
  const exists = lines.some((l) => l.productId === productId && l.variantKey === variantKey);
  return exists || lines.length < MAX_BASKET_LINES;
}

/** Adds qty to a line (creating it if new). No-ops rather than exceeding the line or qty limits. */
export function addToBasket(
  lines: BasketLine[],
  productId: string,
  variantKey: string,
  qty = 1,
): BasketLine[] {
  if (!Number.isInteger(qty) || qty < 1) return lines;
  if (!canAddLine(lines, productId, variantKey)) return lines;
  const existing = lines.find((l) => l.productId === productId && l.variantKey === variantKey);
  if (existing) {
    return lines.map((l) =>
      l === existing ? { ...l, qty: Math.min(MAX_QTY_HARD, l.qty + qty) } : l,
    );
  }
  return [...lines, { productId, variantKey, qty: Math.min(MAX_QTY_HARD, qty) }];
}

/** Sets an exact quantity; 0 (or less) removes the line. */
export function setLineQty(
  lines: BasketLine[],
  productId: string,
  variantKey: string,
  qty: number,
): BasketLine[] {
  if (!Number.isInteger(qty) || qty <= 0) return removeLine(lines, productId, variantKey);
  return lines.map((l) =>
    l.productId === productId && l.variantKey === variantKey
      ? { ...l, qty: Math.min(MAX_QTY_HARD, qty) }
      : l,
  );
}

export function removeLine(lines: BasketLine[], productId: string, variantKey: string): BasketLine[] {
  return lines.filter((l) => !(l.productId === productId && l.variantKey === variantKey));
}

export function serialiseBasket(lines: BasketLine[]): string {
  return JSON.stringify(lines);
}

/** Corrupt, tampered or missing storage degrades to an empty basket, never an error. */
export function deserialiseBasket(raw: string | null): BasketLine[] {
  if (!raw) return [];
  try {
    return parseBasketLines(JSON.parse(raw)) ?? [];
  } catch {
    return [];
  }
}
