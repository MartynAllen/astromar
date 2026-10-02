import type { ReviewGalleryImage } from "@/lib/sanity.queries";
import type { BasketLine, PricedProduct, ShopFulfilment, ShopSettings } from "@/lib/shop/types";

// The one place a basket becomes money. Used by BOTH the quote route (what
// the basket page shows) and the checkout route (what Stripe charges), so
// the number a visitor sees is always the number they're charged. The client
// never supplies a price — only product + variant + quantity.

export type LineIssueCode =
  | "unavailable" // product deleted or switched off
  | "variant_missing" // that variant no longer exists
  | "out_of_stock"
  | "insufficient_stock" // some stock, but fewer than asked for
  | "qty_limit"; // over the per-line maximum

export interface LineIssue {
  code: LineIssueCode;
  message: string;
  /** The largest quantity that would be accepted, when there is one. */
  maxQty?: number;
}

export interface PricedLine {
  productId: string;
  variantKey: string;
  qty: number;
  /** Present even for issue lines where the product still exists, so the UI can name them. */
  title?: string;
  slug?: string;
  variantLabel?: string;
  sku?: string;
  /** Largest quantity that would be accepted for this line (stock- and limit-aware). */
  maxQty?: number;
  fulfilment?: ShopFulfilment;
  leadTimeDays?: number;
  image?: ReviewGalleryImage;
  unitPence: number;
  linePence: number;
  issue?: LineIssue;
}

export interface DispatchEstimate {
  minDays: number;
  maxDays: number;
}

export interface BasketQuote {
  lines: PricedLine[];
  /** Sum of lines WITHOUT an issue — a problem line never silently inflates the total. */
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  freeShipping: boolean;
  /** How much more to spend for free postage; undefined when already free, no threshold, or empty. */
  amountToFreeShippingPence?: number;
  hasIssues: boolean;
  dispatch?: DispatchEstimate;
}

const DEFAULT_MADE_TO_ORDER_DAYS = 5;

function availableStock(fulfilment: ShopFulfilment, stock: number | undefined): number {
  if (fulfilment !== "stocked") return Number.POSITIVE_INFINITY;
  return Math.max(0, stock ?? 0);
}

function priceLine(
  line: BasketLine,
  product: PricedProduct | undefined,
  settings: ShopSettings,
): PricedLine {
  const base = { productId: line.productId, variantKey: line.variantKey, qty: line.qty };

  if (!product || !product.active) {
    return {
      ...base,
      title: product?.title,
      slug: product?.slug.current,
      unitPence: 0,
      linePence: 0,
      issue: { code: "unavailable", message: "This item is no longer available." },
    };
  }

  const variant = product.variants?.find((v) => v._key === line.variantKey);
  const named = {
    ...base,
    title: product.title,
    slug: product.slug.current,
    fulfilment: product.fulfilment,
    leadTimeDays: product.leadTimeDays,
    image: product.images?.[0],
  };
  if (!variant) {
    return {
      ...named,
      unitPence: 0,
      linePence: 0,
      issue: { code: "variant_missing", message: "That option is no longer available." },
    };
  }

  // A variant without a usable price must never be charged: treat it as gone
  // rather than passing NaN/0 to Stripe. (Studio validation prevents this on
  // publish; this covers a document written some other way.)
  if (!Number.isInteger(variant.pricePence) || variant.pricePence <= 0) {
    return {
      ...named,
      unitPence: 0,
      linePence: 0,
      issue: { code: "variant_missing", message: "That option is no longer available." },
    };
  }

  // A product with one "Standard" variant shouldn't read "Clip — Standard".
  const withVariant = {
    ...named,
    variantLabel: product.variants.length > 1 ? variant.label : undefined,
    sku: variant.sku,
    unitPence: variant.pricePence,
    linePence: variant.pricePence * line.qty,
  };

  const stock = availableStock(product.fulfilment, variant.stock);
  if (stock === 0) {
    return {
      ...withVariant,
      linePence: 0,
      maxQty: 0,
      issue: { code: "out_of_stock", message: "Sold out.", maxQty: 0 },
    };
  }

  const maxQty = Math.min(stock, settings.maxQtyPerLine);
  if (line.qty > maxQty) {
    const stockLimited = stock < settings.maxQtyPerLine;
    return {
      ...withVariant,
      linePence: 0,
      maxQty,
      issue: stockLimited
        ? {
            code: "insufficient_stock",
            message: `Only ${stock} left.`,
            maxQty,
          }
        : {
            code: "qty_limit",
            message: `Limit of ${settings.maxQtyPerLine} per order.`,
            maxQty,
          },
    };
  }

  return { ...withVariant, maxQty };
}

/**
 * Postage is flat unless the (valid-lines) subtotal reaches the free-postage
 * threshold. An empty basket has no postage.
 */
export function shippingFor(
  subtotalPence: number,
  settings: ShopSettings,
): { shippingPence: number; freeShipping: boolean; amountToFreeShippingPence?: number } {
  if (subtotalPence <= 0) return { shippingPence: 0, freeShipping: false };
  const threshold = settings.freeShippingThresholdPence;
  if (threshold !== undefined && subtotalPence >= threshold) {
    return { shippingPence: 0, freeShipping: true };
  }
  return {
    shippingPence: settings.flatShippingPence,
    freeShipping: false,
    amountToFreeShippingPence: threshold !== undefined ? threshold - subtotalPence : undefined,
  };
}

/**
 * Everything ships together, so the basket's estimate is the slowest line's:
 * stocked items use the shop-wide dispatch window, made-to-order items use
 * their own lead time (as a fixed figure — it's an estimate, not a range).
 */
export function dispatchEstimate(
  lines: PricedLine[],
  settings: ShopSettings,
): DispatchEstimate | undefined {
  const valid = lines.filter((l) => !l.issue);
  if (valid.length === 0) return undefined;
  let minDays = 0;
  let maxDays = 0;
  for (const l of valid) {
    const [lo, hi] =
      l.fulfilment === "madeToOrder"
        ? [l.leadTimeDays ?? DEFAULT_MADE_TO_ORDER_DAYS, l.leadTimeDays ?? DEFAULT_MADE_TO_ORDER_DAYS]
        : [settings.dispatchMinDays, settings.dispatchMaxDays];
    minDays = Math.max(minDays, lo);
    maxDays = Math.max(maxDays, hi);
  }
  return { minDays, maxDays: Math.max(minDays, maxDays) };
}

export function formatDispatchWindow(estimate: DispatchEstimate): string {
  const { minDays, maxDays } = estimate;
  if (minDays === maxDays) return `about ${maxDays} working ${maxDays === 1 ? "day" : "days"}`;
  return `${minDays}–${maxDays} working days`;
}

export function priceBasket(
  basket: BasketLine[],
  products: PricedProduct[],
  settings: ShopSettings,
): BasketQuote {
  const byId = new Map(products.map((p) => [p._id, p]));
  const lines = basket.map((line) => priceLine(line, byId.get(line.productId), settings));
  const subtotalPence = lines.reduce((sum, l) => sum + (l.issue ? 0 : l.linePence), 0);
  const { shippingPence, freeShipping, amountToFreeShippingPence } = shippingFor(
    subtotalPence,
    settings,
  );
  return {
    lines,
    subtotalPence,
    shippingPence,
    totalPence: subtotalPence + shippingPence,
    freeShipping,
    amountToFreeShippingPence,
    hasIssues: lines.some((l) => l.issue !== undefined),
    dispatch: dispatchEstimate(lines, settings),
  };
}
