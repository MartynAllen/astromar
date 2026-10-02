// Encodes a shop order's lines into Stripe PaymentIntent metadata, and back.
//
// Stripe caps metadata at 50 keys with values up to 500 characters. One key
// per line (item1…itemN, each a short ~65-char value) keeps even a full
// 10-line basket far inside the limits, where one packed string would not.
// This is the order's whole ledger — there is no database — so the webhook
// decodes it to decrement stock and to write Martyn's dispatch email.

export interface OrderItem {
  sku: string;
  productId: string;
  variantKey: string;
  qty: number;
}

const FIELD_SEPARATOR = "~";
const ITEM_KEY = /^item(\d+)$/;

function assertSafe(field: string, value: string) {
  if (value.includes(FIELD_SEPARATOR) || value.length === 0) {
    throw new Error(`Cannot encode order item field "${field}": ${JSON.stringify(value)}`);
  }
}

export function encodeOrderItems(items: OrderItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  items.forEach((item, i) => {
    assertSafe("sku", item.sku);
    assertSafe("productId", item.productId);
    assertSafe("variantKey", item.variantKey);
    out[`item${i + 1}`] = [item.sku, item.productId, item.variantKey, String(item.qty)].join(
      FIELD_SEPARATOR,
    );
  });
  return out;
}

/** Tolerant of unrelated metadata keys; returns [] if there are no item keys. */
export function decodeOrderItems(metadata: Record<string, string | undefined>): OrderItem[] {
  const items: { index: number; item: OrderItem }[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    const match = ITEM_KEY.exec(key);
    if (!match || !value) continue;
    const [sku, productId, variantKey, qtyRaw] = value.split(FIELD_SEPARATOR);
    const qty = Number(qtyRaw);
    if (!sku || !productId || !variantKey || !Number.isInteger(qty) || qty < 1) continue;
    items.push({ index: Number(match[1]), item: { sku, productId, variantKey, qty } });
  }
  return items.sort((a, b) => a.index - b.index).map((e) => e.item);
}
