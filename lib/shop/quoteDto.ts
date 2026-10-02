import type { ReviewGalleryImage } from "@/lib/sanity.queries";
import type { BasketQuote, DispatchEstimate, LineIssue } from "@/lib/shop/pricing";

// The JSON shape /api/shop/quote returns to the basket page. Same as the
// internal BasketQuote except each line's raw Sanity image object is
// replaced by a ready-to-use URL + alt — the browser has no business
// holding image-builder logic or asset references.

export interface QuoteLineDto {
  productId: string;
  variantKey: string;
  qty: number;
  title?: string;
  slug?: string;
  variantLabel?: string;
  sku?: string;
  maxQty?: number;
  unitPence: number;
  linePence: number;
  imageUrl?: string;
  imageAlt?: string;
  issue?: LineIssue;
}

export interface QuoteDto {
  lines: QuoteLineDto[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  freeShipping: boolean;
  amountToFreeShippingPence?: number;
  hasIssues: boolean;
  dispatch?: DispatchEstimate;
}

export function toQuoteDto(
  quote: BasketQuote,
  imageUrl: (image: ReviewGalleryImage) => string,
): QuoteDto {
  return {
    ...quote,
    lines: quote.lines.map(({ image, ...line }) => ({
      ...line,
      imageUrl: image?.image.asset ? imageUrl(image) : undefined,
      imageAlt: image?.alt,
    })),
  };
}
