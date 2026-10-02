import type Stripe from "stripe";
import { formatDispatchWindow } from "@/lib/shop/pricing";
import type { BasketQuote, DispatchEstimate, PricedLine } from "@/lib/shop/pricing";
import { encodeOrderItems } from "@/lib/shop/orderMeta";

// Everything about shaping a basket into a Stripe Checkout Session lives
// here as pure functions: the one place line items are built, so that if
// Martyn registers for VAT later, `tax_behavior` / `automatic_tax` is added
// in one spot rather than hunted down across the checkout route.

type LineItem = Stripe.Checkout.SessionCreateParams.LineItem;
type ShippingOption = Stripe.Checkout.SessionCreateParams.ShippingOption;

export function lineItemName(line: Pick<PricedLine, "title" | "variantLabel">): string {
  const title = line.title ?? "Item";
  return line.variantLabel ? `${title} — ${line.variantLabel}` : title;
}

/** Only valid lines are charged; the route refuses to proceed if any line has an issue. */
export function buildStripeLineItems(
  lines: PricedLine[],
  imageUrl: (line: PricedLine) => string | undefined,
): LineItem[] {
  return lines
    .filter((l) => !l.issue)
    .map((line) => {
      const image = imageUrl(line);
      return {
        price_data: {
          currency: "gbp",
          unit_amount: line.unitPence,
          product_data: {
            name: lineItemName(line),
            ...(image ? { images: [image] } : {}),
          },
        },
        quantity: line.qty,
      };
    });
}

/**
 * Exactly one postage option, chosen server-side from the basket total —
 * the customer never picks (or sees) a rate that doesn't apply to them.
 * No delivery_estimate: Martyn hasn't committed to a courier service level,
 * and a made-up delivery window on a checkout page is worse than none.
 */
export function buildShippingOption(
  quote: Pick<BasketQuote, "shippingPence" | "freeShipping">,
): ShippingOption {
  return {
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: { amount: quote.shippingPence, currency: "gbp" },
      display_name: quote.freeShipping ? "Free UK postage" : "UK postage",
    },
  };
}

export function buildShippingMessage(estimate: DispatchEstimate | undefined, siteUrl: string): string {
  const dispatch = estimate
    ? `Your order will be dispatched in ${formatDispatchWindow(estimate)}. `
    : "";
  return `${dispatch}UK addresses only. Returns and postage details: [Shipping & returns](${siteUrl}/shipping-returns)`;
}

export function buildOrderMetadata(lines: PricedLine[]): Record<string, string> {
  const valid = lines.filter((l) => !l.issue && l.sku);
  return {
    orderType: "shop",
    shopStatus: "pending",
    itemCount: String(valid.length),
    ...encodeOrderItems(
      valid.map((l) => ({
        sku: l.sku as string,
        productId: l.productId,
        variantKey: l.variantKey,
        qty: l.qty,
      })),
    ),
  };
}
