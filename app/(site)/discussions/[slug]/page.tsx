import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import GiscusComments from "@/components/discussions/GiscusComments";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getDiscussionBySlug, getDiscussionSlugs } from "@/lib/sanity.queries";
import { buildMetadata, discussionForumPostingJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getDiscussionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/discussions/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const discussion = await getDiscussionBySlug(slug);
  if (!discussion) return {};
  return buildMetadata({
    title: discussion.seo?.metaTitle || discussion.title,
    description: discussion.seo?.metaDescription || discussion.topic,
    path: `/discussions/${slug}`,
    image: discussion.seo?.ogImage,
  });
}

export default async function DiscussionPage(props: PageProps<"/discussions/[slug]">) {
  const { slug } = await props.params;
  const discussion = await getDiscussionBySlug(slug);
  if (!discussion) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <JsonLd
        data={discussionForumPostingJsonLd({
          headline: discussion.title,
          text: discussion.topic,
          path: `/discussions/${slug}`,
          datePublished: discussion.publishedAt,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Discussion", path: "/discussions" },
          { name: discussion.title, path: `/discussions/${slug}` },
        ]}
      />

      <h1 className="font-display text-3xl font-semibold text-star-100">{discussion.title}</h1>
      {discussion.topic && (
        <p className="mt-3 border-l-2 border-nebula-teal-500 pl-4 text-lg text-star-300">
          {discussion.topic}
        </p>
      )}

      <PortableTextContent value={discussion.body} />

      <GiscusComments />
    </div>
  );
}
