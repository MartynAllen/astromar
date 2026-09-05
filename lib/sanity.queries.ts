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

export interface ProcessingTool {
  tool: string;
  role?: string;
}

export interface PrintCrop {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface AstroPhotoDetail extends AstroPhotoSummary {
  story?: unknown[];
  gearNotes?: string;
  processingTools?: ProcessingTool[];
  // Rotates the print/Quick-View crop only, never the gallery image — see
  // the schema field's own description for why some targets need this.
  printRotation?: 90 | 180 | 270;
  // Trims a strip off the raw frame before the print/Quick-View crop runs —
  // see the schema field's own description for why some targets need this.
  printCrop?: PrintCrop;
  // Caps which catalog sizes this photo can be sold at — see the schema
  // field's own description and lib/print.ts's printProductsForPhoto.
  maxPrintLongEdgeIn?: number;
  videoUrl?: string;
  // Clean, unwatermarked original — populated by the import pipeline,
  // read only by the checkout route for print orders. Never rendered
  // anywhere on the public site; mainImage (watermarked) is what every
  // page displays, including this one's own hero image.
  printMasterImage?: SanityImageWithDimensions;
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

// The photos three pages pin to a *specific* shot rather than rotating
// through the featured pool (Home pins Andromeda; Calendar pins East Veil
// Nebula, tuned specifically for that page's crop; Prints pins Aurora —
// Twin Pillars — see each page's own comment on why). Named here, in one
// place, so getHeroPhoto below can exclude them by default — every
// rotating page pulling from the same pool without this would risk
// re-picking one of these the moment the featured list changes shape,
// exactly what happened before this fix (East Veil Nebula ended up on both
// Calendar and Gallery, Andromeda on Home, Reviews *and* Prints).
export const PINNED_HERO_SLUGS = [
  "andromeda-galaxy-2026-08-12", // Home
  "east-veil-nebula-2026-08-22", // Calendar
  "aurora-northlew-2024-10-10-twin-pillars", // Prints
];

// Picks a stable-but-varied hero photo per page: different pages pass a
// different offset so they don't all show the same shot, without needing a
// dedicated "hero" flag in Studio. Always excludes PINNED_HERO_SLUGS (see
// above) so a rotating page can never re-collide with a pinned one; pass
// `excludeSlugs` too for any additional one-off exclusion. Offsets among
// the rotating pages should be sequential (0, 1, 2, 3, ...) rather than
// arbitrary spread-out numbers — indexing is modulo the *filtered* pool's
// actual length, so widely-spaced offsets (1, 2, 4, 6, ...) can collide
// with each other the moment the pool shrinks, which is exactly how the
// Andromeda/Reviews collision happened previously.
export async function getHeroPhoto(
  offset = 0,
  excludeSlugs: string[] = [],
): Promise<AstroPhotoSummary | null> {
  const excluded = new Set([...PINNED_HERO_SLUGS, ...excludeSlugs]);
  const pool = (await getFeaturedPhotos(12)).filter((p) => !excluded.has(p.slug.current));
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
      _id, title, slug, category, caption, featured, availableAsPrint, shotDetails, story, gearNotes, processingTools, printRotation, printCrop, maxPrintLongEdgeIn, seo,
      "mainImage": mainImage{..., "dimensions": asset->metadata.dimensions},
      "printMasterImage": printMasterImage{..., "dimensions": asset->metadata.dimensions},
      "videoUrl": video.asset->url
    }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}

export interface PrintProduct {
  _id: string;
  title: string;
  widthIn: number;
  heightIn: number;
  unframedSku: string;
  unframedPriceGBP: number;
  framedSku?: string;
  framingAddonPriceGBP?: number;
  description?: string;
}

export async function getPrintProducts(): Promise<PrintProduct[]> {
  return client.fetch(
    /* groq */ `*[_type == "printProduct" && active == true] | order(sortOrder asc, unframedPriceGBP asc) {
      _id, title, widthIn, heightIn, unframedSku, unframedPriceGBP, framedSku, framingAddonPriceGBP, description
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
export type GuideContentType = "How-To" | "Explainer";

export interface GuideArticleSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  section: string;
  order?: number;
  difficulty?: GuideDifficulty;
  contentType?: GuideContentType;
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
      _id, title, slug, section, order, difficulty, contentType, summary
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
      _id, title, slug, section, order, difficulty, contentType, summary, body, publishedAt, seo
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
    // date >= $since alone would drop a multi-day event (Kelling Heath
    // Star Party, say) the day after it *starts*, even with days still to
    // run — endDate >= $since keeps it listed for its whole real span.
    // Single-day events have no endDate, so they still fall back to date
    // alone.
    /* groq */ `*[_type == "calendarEvent" && (date >= $since || endDate >= $since)] | order(date asc) {
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
  /** Set only when heroImage is actually one of the gallery photos (see
   * aboutPage.ts's heroPhotoRef field) — the real, watermarked gallery
   * asset plus enough to link back to its own page and note whether it's
   * sold as a print. Preferred over heroImage when present. */
  heroPhoto?: {
    title: string;
    slug: { current: string };
    mainImage: SanityImageWithDimensions;
    availableAsPrint?: boolean;
  };
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
      "heroImage": heroImage{..., "dimensions": asset->metadata.dimensions},
      "heroPhoto": heroPhotoRef->{
        title,
        slug,
        availableAsPrint,
        "mainImage": mainImage{..., "dimensions": asset->metadata.dimensions}
      }
    }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
}
