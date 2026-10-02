import type Stripe from "stripe";
import { decodeOrderItems } from "@/lib/shop/orderMeta";
import { renderShopOrderEmail } from "@/lib/shop/orderEmail";
import { planStockUpdates, type StockUpdate } from "@/lib/shop/stockPlan";
import type { PricedProduct } from "@/lib/shop/types";

// The paid-shop-order flow, with every side effect injected so the ORDER of
// operations — the part that decides whether a Stripe retry loses an order
// or double-reduces stock — is unit-tested without Stripe, Resend or Sanity.
// handleShopOrder.ts wires the real implementations to this.
//
// There's no database: the PaymentIntent's metadata is the order ledger, and
// `shopOrderProcessed` is the idempotency flag (the same idea as the print
// flow's `prodigiOrderId`).
//
// ORDER OF OPERATIONS matters. Stripe retries a webhook that returns 5xx for
// ~3 days, so:
//   1. Email Martyn first. If that fails we return 500 with nothing else done —
//      a retry just re-sends (a duplicate email is harmless; a lost order is not).
//   2. Then set the processed flag. After this a retry is a no-op, which is
//      what stops the NEXT step — the stock decrement, the only
//      non-idempotent one — from ever running twice.
//   3. Then decrement stock, best-effort: a failure alerts rather than failing
//      the webhook, because by now the order IS recorded and emailed.

export interface ShopOrderDeps {
  listLineItems(sessionId: string): Promise<
    { description: string | null; quantity: number | null; amount_total: number }[]
  >;
  updateMetadata(paymentIntentId: string, metadata: Record<string, string>): Promise<void>;
  emailConfigured: boolean;
  sendOrderEmail(message: {
    subject: string;
    text: string;
  }): Promise<{ ok: true } | { ok: false; error: string }>;
  loadProducts(ids: string[]): Promise<Pick<PricedProduct, "_id" | "fulfilment" | "variants">[]>;
  applyStock(updates: StockUpdate[]): Promise<{
    oversold: { sku: string; remaining: number }[];
    error?: string;
  }>;
  alert(message: string): Promise<void>;
}

export interface ShopOrderResult {
  status: 200 | 500;
  body: { received: true } | { error: string };
}

const RECEIVED: ShopOrderResult = { status: 200, body: { received: true } };

export async function processShopOrder(
  session: Stripe.Checkout.Session,
  paymentIntent: Stripe.PaymentIntent,
  deps: ShopOrderDeps,
): Promise<ShopOrderResult> {
  const metadata = paymentIntent.metadata;
  if (metadata.shopOrderProcessed === "1") return RECEIVED;

  const items = decodeOrderItems(metadata);
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address;

  if (items.length === 0 || !shipping || !address?.line1 || !address.country) {
    const error = "Shop order is missing its items or a complete shipping address";
    console.error(error, session.id);
    await deps.updateMetadata(paymentIntent.id, {
      ...metadata,
      shopStatus: "failed",
      shopError: error,
    });
    await deps.alert(
      `⚠️ Astromar shop order ${paymentIntent.id} couldn't be processed — check it in the Stripe Dashboard.`,
    );
    return { status: 500, body: { error } };
  }

  const lineItems = await deps.listLineItems(session.id);
  const { subject, text } = renderShopOrderEmail({
    paymentIntentId: paymentIntent.id,
    livemode: session.livemode,
    lines: lineItems.map((l) => ({
      description: l.description ?? "Item",
      quantity: l.quantity ?? 1,
      amountPence: l.amount_total,
    })),
    items,
    postagePence: session.shipping_cost?.amount_total,
    totalPence: session.amount_total ?? 0,
    customer: {
      name: shipping.name,
      email: session.customer_details?.email,
      phone: session.customer_details?.phone,
      address: {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
      },
    },
  });

  // 1. Tell Martyn. Only a configured-but-failing email blocks the order; an
  //    unconfigured one falls back to the ops alert + Stripe Dashboard.
  let emailed = false;
  if (deps.emailConfigured) {
    const sent = await deps.sendOrderEmail({ subject, text });
    if (!sent.ok) {
      await deps.alert(
        `⚠️ Astromar shop order paid but the order email failed (${sent.error}) — check PaymentIntent ${paymentIntent.id} in the Stripe Dashboard.`,
      );
      return { status: 500, body: { error: "Order email failed" } };
    }
    emailed = true;
  }

  // 2. Record it. Retries are no-ops from here on.
  await deps.updateMetadata(paymentIntent.id, {
    ...metadata,
    shopOrderProcessed: "1",
    shopStatus: "to-ship",
  });

  // 3. Reduce stock (stocked items only), best-effort.
  const alerts: string[] = [];
  try {
    const products = await deps.loadProducts([...new Set(items.map((i) => i.productId))]);
    const { updates, unmatched } = planStockUpdates(items, products);
    if (unmatched.length > 0) {
      alerts.push(
        `⚠️ Shop order ${paymentIntent.id}: ${unmatched.map((i) => i.sku).join(", ")} no longer match a product — adjust stock by hand.`,
      );
    }
    const result = await deps.applyStock(updates);
    if (result.error) {
      alerts.push(
        `⚠️ Shop order ${paymentIntent.id}: stock was NOT reduced (${result.error}) — update it in Studio.`,
      );
    }
    for (const o of result.oversold) {
      alerts.push(
        `⚠️ Oversold: ${o.sku} is now at ${o.remaining} after order ${paymentIntent.id}. Refund the order or print one to cover it.`,
      );
    }
  } catch (err) {
    console.error("Shop stock planning failed:", err);
    alerts.push(`⚠️ Shop order ${paymentIntent.id}: couldn't update stock — adjust it in Studio.`);
  }

  await deps.alert(
    emailed
      ? `🛒 New Astromar shop order — the details are in your email (and the Stripe Dashboard).`
      : `🛒 New Astromar shop order ${paymentIntent.id} — order emails aren't configured, so open the Stripe Dashboard for the details.`,
  );
  for (const message of alerts) await deps.alert(message);

  return RECEIVED;
}
