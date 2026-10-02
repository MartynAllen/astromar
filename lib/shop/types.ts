import type { AffiliateLink, ReviewGalleryImage } from "@/lib/sanity.queries";

// Type-only: keeps lib/shop/* pure and unit-testable without Sanity env vars.
// (sanity/client.ts asserts NEXT_PUBLIC_SANITY_* at import time.)

export type ShopFulfilment = "stocked" | "madeToOrder";

export interface ShopVariant {
  _key: string;
  label: string;
  sku: string;
  pricePence: number;
  /** Stocked products only. Missing/undefined on a stocked variant is treated as 0. */
  stock?: number;
}

export interface ShopProductSummary {
  _id: string;
  title: string;
  slug: { current: string };
  category: string;
  summary?: string;
  fulfilment: ShopFulfilment;
  leadTimeDays?: number;
  variants: ShopVariant[];
  /** Cards only need the cover image; the detail query returns them all. */
  images: ReviewGalleryImage[];
  sortOrder?: number;
}

export interface ShopProductDetail extends ShopProductSummary {
  description?: unknown[];
  material?: string;
  printer?: string;
  dimensions?: string;
  affiliateLinks?: AffiliateLink[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

/** What the pricing core needs — a subset of the summary, fetched fresh. */
export interface PricedProduct {
  _id: string;
  title: string;
  slug: { current: string };
  active: boolean;
  fulfilment: ShopFulfilment;
  leadTimeDays?: number;
  variants: ShopVariant[];
  images?: ReviewGalleryImage[];
}

export interface ShopSettings {
  flatShippingPence: number;
  /** Basket subtotal (pence) at or above which postage is free; undefined = never free. */
  freeShippingThresholdPence?: number;
  dispatchMinDays: number;
  dispatchMaxDays: number;
  maxQtyPerLine: number;
  /** Seller name + address, shown on the policy page and product pages when set. */
  sellerDetails?: string;
}

// Used when the shopSettings document hasn't been created yet, so the shop
// still behaves sensibly rather than throwing.
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  flatShippingPence: 350,
  freeShippingThresholdPence: undefined,
  dispatchMinDays: 1,
  dispatchMaxDays: 3,
  maxQtyPerLine: 10,
};

export interface BasketLine {
  productId: string;
  variantKey: string;
  qty: number;
}

export function formatGBP(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
