import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { writeClient } from "@/sanity/client";
import { getShopProductsByIds } from "@/lib/sanity.queries";
import { findOversold, type StockUpdate } from "@/lib/shop/stockPlan";
import { processShopOrder, type ShopOrderDeps } from "@/lib/shop/processShopOrder";
import { sendShopOrderEmail, shopOrderEmailConfigured } from "@/lib/resend";
import { sendOpsAlert } from "@/lib/alert";

// Wires the real Stripe / Sanity / Resend implementations into
// processShopOrder (where the flow and its ordering rationale live, under
// test). Called by the Stripe webhook for a paid session whose PaymentIntent
// is marked orderType "shop"; the print flow (Prodigi) is the default and is
// untouched — see handleCheckoutCompleted in the webhook route.

async function applyStockDecrements(updates: StockUpdate[]) {
  if (updates.length === 0) return { oversold: [] };
  // Without a write token the decrement can't happen — say so loudly rather
  // than skipping silently and letting the shop keep selling phantom stock.
  if (!process.env.SANITY_API_TOKEN) {
    return { oversold: [], error: "SANITY_API_TOKEN is not set in this environment" };
  }
  try {
    const productIds = [...new Set(updates.map((u) => u.productId))];
    // A Studio draft of the same product holds its own copy of stock. If it
    // were left stale, publishing that draft would silently undo the sale.
    const draftIds: string[] = await writeClient.fetch(`*[_id in $ids]._id`, {
      ids: productIds.map((id) => `drafts.${id}`),
    });
    let tx = writeClient.transaction();
    for (const u of updates) {
      const path = `variants[_key=="${u.variantKey}"].stock`;
      tx = tx.patch(u.productId, (p) => p.dec({ [path]: u.qty }));
      if (draftIds.includes(`drafts.${u.productId}`)) {
        tx = tx.patch(`drafts.${u.productId}`, (p) => p.dec({ [path]: u.qty }));
      }
    }
    await tx.commit();

    const after: { _id: string; variants: { _key: string; stock?: number }[] }[] =
      await writeClient.fetch(`*[_id in $ids]{_id, "variants": variants[]{_key, stock}}`, {
        ids: productIds,
      });
    return { oversold: findOversold(updates, after) };
  } catch (err) {
    console.error("Shop stock decrement failed:", err);
    return { oversold: [], error: err instanceof Error ? err.message : "unknown error" };
  }
}

const realDeps: ShopOrderDeps = {
  async listLineItems(sessionId) {
    const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 20 });
    return items.data;
  },
  async updateMetadata(paymentIntentId, metadata) {
    await stripe.paymentIntents.update(paymentIntentId, { metadata });
  },
  emailConfigured: shopOrderEmailConfigured,
  sendOrderEmail: sendShopOrderEmail,
  loadProducts: getShopProductsByIds,
  applyStock: applyStockDecrements,
  alert: sendOpsAlert,
};

export async function handleShopOrder(
  session: Stripe.Checkout.Session,
  paymentIntent: Stripe.PaymentIntent,
) {
  const result = await processShopOrder(session, paymentIntent, realDeps);
  return NextResponse.json(result.body, { status: result.status });
}
