import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import StatusBadge from "@/components/research/StatusBadge";
import PortableTextContent from "@/components/PortableTextContent";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { urlFor } from "@/sanity/image";
import {
  getResearchProjectBySlug,
  getResearchSlugs,
} from "@/lib/sanity.queries";
import { buildMetadata, articleJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getResearchSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/research/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getResearchProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    title: project.seo?.metaTitle || project.title,
    description: project.seo?.metaDescription || project.summary,
    path: `/research/${slug}`,
    image: project.seo?.ogImage || project.coverImage,
  });
}

export default async function ResearchProjectPage(
  props: PageProps<"/research/[slug]">,
) {
  const { slug } = await props.params;
  const project = await getResearchProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <JsonLd
        data={articleJsonLd({
          headline: project.title,
          description: project.summary,
          path: `/research/${slug}`,
          datePublished: project.publishedAt,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Research", path: "/research" },
          { name: project.title, path: `/research/${slug}` },
        ]}
      />

      <div className="flex items-center gap-3">
        <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">{project.title}</h1>
        <StatusBadge status={project.status} />
      </div>

      {project.summary && (
        <p className="mt-2 text-star-500">{project.summary}</p>
      )}

      {project.techniques && project.techniques.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.techniques.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-void-600 px-2.5 py-0.5 text-xs text-star-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {project.repoUrl && (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 border border-void-600 px-4 py-2 font-mono text-xs uppercase tracking-widest text-star-100 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
        >
          View code repository →
        </a>
      )}

      {project.coverImage?.asset && (
        <div className="mt-8 overflow-hidden border border-void-700">
          <Image
            src={urlFor(project.coverImage).width(1200).url()}
            alt=""
            width={project.coverImage.dimensions?.width ?? 1200}
            height={project.coverImage.dimensions?.height ?? 800}
            className="h-auto w-full"
          />
        </div>
      )}

      <PortableTextContent value={project.body} />
    </div>
  );
}
