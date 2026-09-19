import type { Metadata } from "next";
import { urlFor } from "@/sanity/image";
import type { SanityImageSource } from "@sanity/image-url";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
export const SITE_NAME = "Astromar";

interface BuildMetadataInput {
  title: string;
  description?: string;
  path: string;
  image?: SanityImageSource;
  /** Astro photo pages only: mainImage carries a watermark baked into its
   * bottom-right corner, and this forced 1200x630 crop would otherwise cut
   * it away on tall/square sources — bottom-anchoring the crop keeps it in
   * frame. Other content types (reviews, guides, research) have no
   * watermark to protect and don't need this. */
  cropBottom?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  cropBottom,
}: BuildMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImageBuilder = image ? urlFor(image).width(1200).height(630).fit("crop") : undefined;
  const ogImage = ogImageBuilder
    ? [cropBottom ? ogImageBuilder.crop("bottom").url() : ogImageBuilder.url()]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: ogImage,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage,
    },
  };
}

export function breadcrumbListJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function imageObjectJsonLd(input: {
  name: string;
  description?: string;
  path: string;
  image: SanityImageSource;
  dateCreated?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: input.name,
    description: input.description,
    contentUrl: urlFor(input.image).width(1600).url(),
    url: `${SITE_URL}${input.path}`,
    creator: { "@type": "Person", name: "Martyn" },
    dateCreated: input.dateCreated,
  };
}

export function reviewJsonLd(input: {
  productName: string;
  rating: number;
  reviewBody?: string;
  path: string;
  datePublished?: string;
  /** First product photo, if there is one — gives itemReviewed enough to
   * qualify for a rich result image, not just the bare product name. */
  image?: SanityImageSource;
}) {
  const itemReviewed: Record<string, unknown> = {
    "@type": "Product",
    name: input.productName,
  };
  if (input.image) {
    itemReviewed.image = urlFor(input.image).width(1200).url();
  }
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed,
    reviewRating: {
      "@type": "Rating",
      ratingValue: input.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: { "@type": "Person", name: "Martyn" },
    reviewBody: input.reviewBody,
    url: `${SITE_URL}${input.path}`,
    datePublished: input.datePublished,
  };
}

export function articleJsonLd(input: {
  headline: string;
  description?: string;
  path: string;
  datePublished?: string;
  /** Whole minutes — emitted as an ISO 8601 duration (e.g. "PT4M"). */
  readingMinutes?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    author: { "@type": "Person", name: "Martyn" },
    datePublished: input.datePublished,
    ...(input.readingMinutes ? { timeRequired: `PT${input.readingMinutes}M` } : {}),
  };
}

/** Site-wide, rendered once in the (site) route group layout — not
 * per-page. Ties every page's authorship back to one identifiable person
 * rather than leaving Astromar as an anonymous domain, which is what
 * Google's guidance on entity/author recognition actually looks for on
 * gear-review content. */
export function personJsonLd(input: { sameAs?: string[] } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Martyn",
    url: SITE_URL,
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@type": "Person", name: "Martyn" },
  };
}

/** Only called when a guideArticle's optional howToSteps field is actually
 * populated (see the schema field's own description) — most How-To-tagged
 * articles are task-oriented explainers, not literal numbered procedures,
 * so defaulting every one of them to HowTo schema would describe content
 * (tips, background, criteria sections) as sequential steps it isn't. This
 * only fires for the subset an editor has explicitly confirmed really is
 * one; everything else keeps the generic articleJsonLd above. */
export function howToJsonLd(input: {
  name: string;
  description?: string;
  path: string;
  steps: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
  };
}

/** Only called for photos with availableAsPrint and at least one eligible
 * size (see printProductsForPhoto) — a photo with nothing currently
 * purchasable has no genuine Product/Offer to describe. AggregateOffer, not
 * a single Offer, because the real purchasable unit is "this photo, in
 * whichever of several sizes/framing options" — the same one-product,
 * multiple-variants shape schema.org's own examples use for size/colour
 * variants. Framed pricing (unframedPriceGBP + framingAddonPriceGBP) is
 * folded into the same price range rather than modelled as separate
 * offers, since Prodigi's framing add-on isn't a distinct sellable SKU on
 * its own. */
export function printProductJsonLd(input: {
  name: string;
  description?: string;
  path: string;
  image: SanityImageSource;
  products: { unframedPriceGBP: number; framingAddonPriceGBP?: number }[];
}) {
  const pricesGBP = input.products.flatMap((p) => {
    const unframed = p.unframedPriceGBP / 100;
    return p.framingAddonPriceGBP
      ? [unframed, unframed + p.framingAddonPriceGBP / 100]
      : [unframed];
  });
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${input.name} — Fine Art Print`,
    description: input.description,
    image: urlFor(input.image).width(1200).url(),
    url: `${SITE_URL}${input.path}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GBP",
      lowPrice: Math.min(...pricesGBP).toFixed(2),
      highPrice: Math.max(...pricesGBP).toFixed(2),
      offerCount: pricesGBP.length,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}${input.path}`,
    },
  };
}

export function eventJsonLd(input: {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    location: { "@type": "Place", name: "Astromar garden observatory" },
  };
}
