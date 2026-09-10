import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import BackLink from "@/components/BackLink";
import BahtinovMaskGenerator from "@/components/guide/BahtinovMaskGenerator";
import BahtinovMaskFieldGuide from "@/components/guide/BahtinovMaskFieldGuide";
import AffiliateDisclosureBanner from "@/components/reviews/AffiliateDisclosureBanner";
import { getGuideArticleBySlug, getGuideSlugs } from "@/lib/sanity.queries";
import { buildMetadata, articleJsonLd } from "@/lib/seo";
import { estimateReadingMinutes, readingTimeLabel } from "@/lib/readingTime";
import { bodyHasAffiliateLink } from "@/lib/affiliateLinks";

export const revalidate = 60;

// e.g. "10 September 2026" — matches the site's one long-date format (see
// lib/astro/shotDetails.ts's formatCaptureDate).
function formatPublishedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function generateStaticParams() {
  const slugs = await getGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getGuideArticleBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.summary,
    path: `/learn/${slug}`,
    image: article.seo?.ogImage,
  });
}

export default async function LearnArticlePage(props: PageProps<"/learn/[slug]">) {
  const { slug } = await props.params;
  const article = await getGuideArticleBySlug(slug);
  if (!article) notFound();

  const readingMinutes = estimateReadingMinutes(article.body);
  const metaParts = [
    article.publishedAt ? formatPublishedDate(article.publishedAt) : null,
    readingTimeLabel(article.body),
  ].filter(Boolean);
  const hasAffiliateLink = bodyHasAffiliateLink(article.body);

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <JsonLd
        data={articleJsonLd({
          headline: article.title,
          description: article.summary,
          path: `/learn/${slug}`,
          datePublished: article.publishedAt,
          readingMinutes,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Learn", path: "/learn" },
          { name: article.title, path: `/learn/${slug}` },
        ]}
      />
      <BackLink href="/learn" label="Learn" />

      {hasAffiliateLink && (
        <div className="mt-4">
          <AffiliateDisclosureBanner />
        </div>
      )}

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-nebula-amber-400">
        {[article.contentType, article.section, article.difficulty].filter(Boolean).join(" · ")}
      </p>
      <h1 className="mt-2 font-mono text-4xl font-bold uppercase tracking-wide text-star-100">{article.title}</h1>
      {article.summary && <p className="mt-3 text-star-500">{article.summary}</p>}

      <p className="mt-3 font-mono text-xs text-star-500">{metaParts.join(" · ")}</p>

      <PortableTextContent value={article.body} />

      {slug === "bahtinov-mask-focusing" && (
        <div className="mt-12 space-y-6">
          <BahtinovMaskFieldGuide />
          <BahtinovMaskGenerator />
        </div>
      )}
    </div>
  );
}
