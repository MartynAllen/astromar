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
}

export function buildMetadata({ title, description, path, image }: BuildMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ? [urlFor(image).width(1200).height(630).url()] : undefined;

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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "Product", name: input.productName },
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    author: { "@type": "Person", name: "Martyn" },
    datePublished: input.datePublished,
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
