import { SITE_URL, SITE_NAME } from "@/lib/seo";
import {
  getAllGuideArticles,
  getAllReviews,
  getAllResearchProjects,
  getFeaturedPhotos,
} from "@/lib/sanity.queries";

export const revalidate = 3600;

// llms.txt (see llmstxt.org) — a curated, human-readable index for AI
// systems that fetch a page before crawling further, distinct from
// sitemap.xml (a complete, machine-oriented URL list for search engine
// crawlers). Generated from the same Sanity content as the rest of the
// site rather than hand-maintained, so it can't silently drift out of date
// the way a static file would; capped per section (see LIMIT) so it stays
// a curated highlight list rather than a full content dump — that's the
// whole point of the format versus just linking sitemap.xml.
const LIMIT = 10;

function section(title: string, items: { title: string; href: string; note?: string }[]): string {
  if (items.length === 0) return "";
  const lines = items.map((item) => `- [${item.title}](${item.href})${item.note ? `: ${item.note}` : ""}`);
  return `## ${title}\n\n${lines.join("\n")}\n`;
}

export async function GET() {
  const [reviews, articles, research, featuredPhotos] = await Promise.all([
    getAllReviews(),
    getAllGuideArticles(),
    getAllResearchProjects(),
    getFeaturedPhotos(LIMIT),
  ]);

  const sections = [
    section("Gallery", [
      { title: "Full gallery", href: `${SITE_URL}/gallery` },
      ...featuredPhotos.slice(0, LIMIT).map((p) => ({
        title: p.title,
        href: `${SITE_URL}/gallery/${p.slug.current}`,
        note: p.caption,
      })),
    ]),
    section("Prints", [{ title: "Buy a print", href: `${SITE_URL}/prints` }]),
    section(
      "Gear Reviews",
      reviews.slice(0, LIMIT).map((r) => ({
        title: r.title,
        href: `${SITE_URL}/reviews/${r.slug.current}`,
        note: r.verdict,
      })),
    ),
    section(
      "Learn",
      articles.slice(0, LIMIT).map((a) => ({
        title: a.title,
        href: `${SITE_URL}/learn/${a.slug.current}`,
        note: a.summary,
      })),
    ),
    section("Calendar & Sky Map", [{ title: "Calendar", href: `${SITE_URL}/calendar` }]),
    section(
      "Workshop",
      research.slice(0, LIMIT).map((r) => ({
        title: r.title,
        href: `${SITE_URL}/research/${r.slug.current}`,
        note: r.summary,
      })),
    ),
    section("About", [{ title: "About Martyn and the setup", href: `${SITE_URL}/about` }]),
  ].filter(Boolean);

  const body = `# ${SITE_NAME}

> A personal astrophotography blog documenting real deep-sky imaging from a back garden
> in Devon, UK — every photo, gear opinion, and how-to guide traces back to one real,
> verifiable rig (a ZWO Seestar S50 and a manual Nikon D5300 + Askar 71F setup), not
> stock imagery or secondhand advice.

${sections.join("\n")}`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
