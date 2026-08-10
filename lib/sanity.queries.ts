import { client } from "@/sanity/client";
import type { SanityImageSource } from "@sanity/image-url";

export const REVALIDATE_SECONDS = 60;

export interface SanitySlug {
  current: string;
}

export interface SanityImageWithDimensions {
  asset?: { _ref: string };
  hotspot?: { x: number; y: number };
  dimensions?: { width: number; height: number; aspectRatio: number };
}

export interface ShotDetails {
  targetCatalogId?: string;
  targetCommonName?: string;
  subExposureSeconds?: number;
  subCount?: number;
  filter?: string;
  isMosaic?: boolean;
  captureDate?: string;
  telescope?: string;
  captureLocation?: { lat: number; lng: number };
  raDec?: { ra?: number; dec?: number };
}

export type PhotoCategory = "deep-sky" | "lunar" | "planetary" | "wide-field" | "gear";

export interface AstroPhotoSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  mainImage: SanityImageWithDimensions;
  category: PhotoCategory;
  caption?: string;
  featured?: boolean;
  shotDetails?: ShotDetails;
}

export interface AstroPhotoDetail extends AstroPhotoSummary {
  story?: unknown[];
  gearNotes?: string;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: SanityImageSource };
}

export interface SiteSettings {
  siteName: string;
  tagline?: string;
  logo?: SanityImageSource;
  homeObservingLocation?: { lat: number; lng: number };
  socialLinks?: { platform: string; url: string }[];
  defaultSeo?: { metaTitle?: string; metaDescription?: string; ogImage?: SanityImageSource };
}

const photoSummaryProjection = /* groq */ `{
  _id, title, slug, category, caption, featured, shotDetails,
  "mainImage": mainImage{..., "dimensions": asset->metadata.dimensions}
}`;

export async function getFeaturedPhotos(limit = 6): Promise<AstroPhotoSummary[]> {
  return client.fetch(
    /* groq */ `*[_type == "astroPhoto" && featured == true] | order(shotDetails.captureDate desc) [0...$limit] ${photoSummaryProjection}`,
    { limit },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getAllPhotos(category?: PhotoCategory): Promise<AstroPhotoSummary[]> {
  const filter = category
    ? `_type == "astroPhoto" && category == $category`
    : `_type == "astroPhoto"`;
  return client.fetch(
    /* groq */ `*[${filter}] | order(shotDetails.captureDate desc) ${photoSummaryProjection}`,
    { category: category ?? "" },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getPhotoSlugs(): Promise<string[]> {
  return client.fetch(
    /* groq */ `*[_type == "astroPhoto" && defined(slug.current)].slug.current`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getPhotoBySlug(slug: string): Promise<AstroPhotoDetail | null> {
  return client.fetch(
    /* groq */ `*[_type == "astroPhoto" && slug.current == $slug][0]{
      _id, title, slug, category, caption, featured, shotDetails, story, gearNotes, seo,
      "mainImage": mainImage{..., "dimensions": asset->metadata.dimensions}
    }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(
    /* groq */ `*[_type == "siteSettings"][0]{
      siteName, tagline, logo, homeObservingLocation, socialLinks, defaultSeo
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}
