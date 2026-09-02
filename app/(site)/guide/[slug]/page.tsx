import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import BackLink from "@/components/BackLink";
import BahtinovMaskGenerator from "@/components/guide/BahtinovMaskGenerator";
import BahtinovMaskFieldGuide from "@/components/guide/BahtinovMaskFieldGuide";
import { getGuideArticleBySlug, getGuideSlugs } from "@/lib/sanity.queries";
import { buildMetadata, articleJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getGuideArticleBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.summary,
    path: `/guide/${slug}`,
    image: article.seo?.ogImage,
  });
}

export default async function GuideArticlePage(props: PageProps<"/guide/[slug]">) {
  const { slug } = await props.params;
  const article = await getGuideArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <JsonLd
        data={articleJsonLd({
          headline: article.title,
          description: article.summary,
          path: `/guide/${slug}`,
          datePublished: article.publishedAt,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Guide", path: "/guide" },
          { name: article.title, path: `/guide/${slug}` },
        ]}
      />
      <BackLink href="/guide" label="Guide" />

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        {article.section}
        {article.difficulty ? ` · ${article.difficulty}` : ""}
      </p>
      <h1 className="mt-2 font-mono text-4xl font-bold uppercase tracking-wide text-star-100">{article.title}</h1>
      {article.summary && <p className="mt-3 text-star-500">{article.summary}</p>}

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
