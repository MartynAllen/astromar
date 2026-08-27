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
  gain?: number;
  raDec?: { ra?: number; dec?: number };
}

export type PhotoCategory =
  "deep-sky" | "lunar" | "planetary" | "wide-field" | "gear";

export interface AstroPhotoSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  mainImage: SanityImageWithDimensions;
  category: PhotoCategory;
  caption?: string;
  featured?: boolean;
  availableAsPrint?: boolean;
  shotDetails?: ShotDetails;
}

export interface AstroPhotoDetail extends AstroPhotoSummary {
  story?: unknown[];
  gearNotes?: string;
  videoUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImageSource;
  };
}

export interface SiteSettings {
  siteName: string;
  tagline?: string;
  logo?: SanityImageSource;
  socialLinks?: { platform: string; url: string }[];
  shopUrl?: string;
  defaultSeo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImageSource;
  };
}

const photoSummaryProjection = /* groq */ `{
  _id, title, slug, category, caption, featured, availableAsPrint, shotDetails,
  "mainImage": mainImage{..., "dimensions": asset->metadata.dimensions}
}`;

export async function getFeaturedPhotos(
  limit = 6,
): Promise<AstroPhotoSummary[]> {
  return client.fetch(
    /* groq */ `*[_type == "astroPhoto" && featured == true] | order(shotDetails.captureDate desc) [0...$limit] ${photoSummaryProjection}`,
    { limit },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

// Picks a stable-but-varied hero photo per page: different pages pass a
// different offset so they don't all show the same shot, without needing a
// dedicated "hero" flag in Studio.
export async function getHeroPhoto(
  offset = 0,
): Promise<AstroPhotoSummary | null> {
  const pool = await getFeaturedPhotos(8);
  if (pool.length === 0) return null;
  return pool[offset % pool.length];
}

export async function getAllPhotos(
  category?: PhotoCategory,
): Promise<AstroPhotoSummary[]> {
  const filter = category
    ? `_type == "astroPhoto" && category == $category`
    : `_type == "astroPhoto"`;
  return client.fetch(
    /* groq */ `*[${filter}] | order(shotDetails.captureDate desc) ${photoSummaryProjection}`,
    { category: category ?? "" },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

// Powers the dedicated /prints landing page — only ever the curated,
// opted-in subset, newest first so recent work leads.
export async function getPrintablePhotos(): Promise<AstroPhotoSummary[]> {
  return client.fetch(
    /* groq */ `*[_type == "astroPhoto" && availableAsPrint == true] | order(shotDetails.captureDate desc) ${photoSummaryProjection}`,
    {},
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

export async function getPhotoBySlug(
  slug: string,
): Promise<AstroPhotoDetail | null> {
  return client.fetch(
    /* groq */ `*[_type == "astroPhoto" && slug.current == $slug][0]{
      _id, title, slug, category, caption, featured, availableAsPrint, shotDetails, story, gearNotes, seo,
      "mainImage": mainImage{..., "dimensions": asset->metadata.dimensions},
      "videoUrl": video.asset->url
    }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export interface PrintProduct {
  _id: string;
  title: string;
  unframedSku: string;
  unframedPriceGBP: number;
  framedSku?: string;
  framingAddonPriceGBP?: number;
  description?: string;
}

export async function getPrintProducts(): Promise<PrintProduct[]> {
  return client.fetch(
    /* groq */ `*[_type == "printProduct" && active == true] | order(sortOrder asc, unframedPriceGBP asc) {
      _id, title, unframedSku, unframedPriceGBP, framedSku, framingAddonPriceGBP, description
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(
    /* groq */ `*[_type == "siteSettings"][0]{
      siteName, tagline, logo, socialLinks, shopUrl, defaultSeo
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export interface AffiliateLink {
  label: string;
  url: string;
  priceComparisonNote?: string;
}

export interface ReviewSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  productName: string;
  productType?: string;
  productImages?: ReviewGalleryImage[];
  rating: number;
  verdict?: string;
  publishedAt?: string;
}

export interface ReviewGalleryImage {
  image: SanityImageWithDimensions;
  alt: string;
  caption?: string;
  creditText?: string;
  creditUrl?: string;
}

export interface PrintableAccessory {
  name: string;
  url: string;
  designerCredit?: string;
  notes?: string;
  relatedGuideHref?: string;
}

export interface RecommendedAccessory {
  name: string;
  description?: string;
  compatibilityNote?: string;
  affiliateLink: AffiliateLink;
}

export interface ReviewDetail extends ReviewSummary {
  affiliateLinks?: AffiliateLink[];
  pros?: string[];
  cons?: string[];
  verdict?: string;
  body?: unknown[];
  galleryImages?: ReviewGalleryImage[];
  recommendedAccessories?: RecommendedAccessory[];
  printableAccessories?: PrintableAccessory[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImageSource;
  };
}

const reviewSummaryProjection = /* groq */ `{
  _id, title, slug, productName, productType, rating, verdict, publishedAt,
  "productImages": productImages[]{
    ..., "image": image{..., "dimensions": asset->metadata.dimensions}
  }
}`;

export async function getAllReviews(): Promise<ReviewSummary[]> {
  return client.fetch(
    /* groq */ `*[_type == "reviewPost"] | order(publishedAt desc) ${reviewSummaryProjection}`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getReviewSlugs(): Promise<string[]> {
  return client.fetch(
    /* groq */ `*[_type == "reviewPost" && defined(slug.current)].slug.current`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getReviewBySlug(
  slug: string,
): Promise<ReviewDetail | null> {
  return client.fetch(
    /* groq */ `*[_type == "reviewPost" && slug.current == $slug][0]{
      _id, title, slug, productName, productType, rating, publishedAt,
      affiliateLinks, pros, cons, verdict, body, recommendedAccessories, printableAccessories, seo,
      "productImages": productImages[]{
        ..., "image": image{..., "dimensions": asset->metadata.dimensions}
      },
      "galleryImages": galleryImages[]{
        ..., "image": image{..., "dimensions": asset->metadata.dimensions}
      }
    }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export type GuideDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface GuideArticleSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  section: string;
  order?: number;
  difficulty?: GuideDifficulty;
  summary?: string;
}

export interface GuideArticleDetail extends GuideArticleSummary {
  body?: unknown[];
  publishedAt?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImageSource;
  };
}

export async function getAllGuideArticles(): Promise<GuideArticleSummary[]> {
  return client.fetch(
    /* groq */ `*[_type == "guideArticle"] | order(section asc, order asc) {
      _id, title, slug, section, order, difficulty, summary
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getGuideSlugs(): Promise<string[]> {
  return client.fetch(
    /* groq */ `*[_type == "guideArticle" && defined(slug.current)].slug.current`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getGuideArticleBySlug(
  slug: string,
): Promise<GuideArticleDetail | null> {
  return client.fetch(
    /* groq */ `*[_type == "guideArticle" && slug.current == $slug][0]{
      _id, title, slug, section, order, difficulty, summary, body, publishedAt, seo
    }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export type ResearchStatus = "Idea" | "In progress" | "Complete";

export interface ResearchProjectSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  status: ResearchStatus;
  techniques?: string[];
  summary?: string;
  coverImage?: SanityImageWithDimensions;
  publishedAt?: string;
}

export interface ResearchProjectDetail extends ResearchProjectSummary {
  repoUrl?: string;
  body?: unknown[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImageSource;
  };
}

const researchSummaryProjection = /* groq */ `{
  _id, title, slug, status, techniques, summary, publishedAt,
  "coverImage": coverImage{..., "dimensions": asset->metadata.dimensions}
}`;

export async function getAllResearchProjects(): Promise<
  ResearchProjectSummary[]
> {
  return client.fetch(
    /* groq */ `*[_type == "researchProject"] | order(publishedAt desc) ${researchSummaryProjection}`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getResearchSlugs(): Promise<string[]> {
  return client.fetch(
    /* groq */ `*[_type == "researchProject" && defined(slug.current)].slug.current`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export async function getResearchProjectBySlug(
  slug: string,
): Promise<ResearchProjectDetail | null> {
  return client.fetch(
    /* groq */ `*[_type == "researchProject" && slug.current == $slug][0]{
      _id, title, slug, status, techniques, summary, repoUrl, body, publishedAt, seo,
      "coverImage": coverImage{..., "dimensions": asset->metadata.dimensions}
    }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export interface CalendarEvent {
  _id: string;
  title: string;
  eventType: "personal-plan" | "celestial-event" | "local-meetup" | "other";
  date: string;
  endDate?: string;
  description?: string;
  externalLink?: string;
}

export async function getUpcomingCalendarEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  now.setDate(now.getDate() - 1); // include events from earlier today
  return client.fetch(
    /* groq */ `*[_type == "calendarEvent" && date >= $since] | order(date asc) {
      _id, title, eventType, date, endDate, description, externalLink
    }`,
    { since: now.toISOString() },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export interface GearItem {
  name: string;
  category: "telescope" | "camera" | "accessory" | "software";
  image?: SanityImageWithDimensions;
  notes?: string;
  items?: string[];
  affiliateLink?: AffiliateLink;
}

export interface AboutPageContent {
  heroImage?: SanityImageWithDimensions;
  bio?: unknown[];
  gear?: GearItem[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImageSource;
  };
}

export async function getAboutPage(): Promise<AboutPageContent | null> {
  return client.fetch(
    /* groq */ `*[_type == "aboutPage"][0]{
      bio, gear, seo,
      "heroImage": heroImage{..., "dimensions": asset->metadata.dimensions}
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}
