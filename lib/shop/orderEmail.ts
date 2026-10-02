import { formatGBP } from "@/lib/shop/types";
import type { OrderItem } from "@/lib/shop/orderMeta";

// The dispatch email Martyn gets for each paid shop order. Plain text, sent
// only to his own inbox — it carries the customer's delivery address, which
// is exactly why it never goes through the Discord/Slack ops alert (a
// shared channel) or Sanity (a public dataset).

export interface ShopOrderEmailInput {
  paymentIntentId: string;
  livemode: boolean;
  lines: { description: string; quantity: number; amountPence: number }[];
  items: OrderItem[];
  postagePence?: number;
  totalPence: number;
  customer: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string | null;
    };
  };
}

export function stripePaymentUrl(paymentIntentId: string, livemode: boolean): string {
  return `https://dashboard.stripe.com/${livemode ? "" : "test/"}payments/${paymentIntentId}`;
}

export function renderShopOrderEmail(input: ShopOrderEmailInput): { subject: string; text: string } {
  const itemCount = input.items.reduce((sum, i) => sum + i.qty, 0);
  const subject = `New Astromar shop order — ${formatGBP(input.totalPence)} (${itemCount} ${itemCount === 1 ? "item" : "items"})${input.livemode ? "" : " [TEST]"}`;

  const a = input.customer.address;
  const addressLines = [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(
    (l): l is string => Boolean(l && l.trim()),
  );

  const pickList = input.items.map((i) => `${i.sku} × ${i.qty}`).join(", ");

  const text = [
    input.livemode ? "New shop order." : "TEST-MODE order (Stripe test card) — nothing to ship.",
    "",
    "ITEMS",
    ...input.lines.map((l) => `  ${l.quantity} × ${l.description} — ${formatGBP(l.amountPence)}`),
    ...(input.postagePence !== undefined
      ? [`  Postage — ${input.postagePence === 0 ? "free" : formatGBP(input.postagePence)}`]
      : []),
    `  Total paid — ${formatGBP(input.totalPence)}`,
    "",
    `PICK LIST: ${pickList || "(none recorded — check Stripe)"}`,
    "",
    "SHIP TO",
    ...(input.customer.name ? [`  ${input.customer.name}`] : []),
    ...addressLines.map((l) => `  ${l}`),
    "",
    "CUSTOMER",
    `  Email: ${input.customer.email ?? "—"}`,
    ...(input.customer.phone ? [`  Phone: ${input.customer.phone}`] : []),
    "",
    `Stripe: ${stripePaymentUrl(input.paymentIntentId, input.livemode)}`,
    `Ref: ${input.paymentIntentId}`,
  ].join("\n");

  return { subject, text };
}
