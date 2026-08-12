import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  "",
  "/gallery",
  "/reviews",
  "/guide",
  "/calendar",
  "/research",
  "/about",
  "/disclosure",
  "/privacy",
];

interface SlugRow {
  pathPrefix: string;
  slug: string;
  updatedAt: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows: SlugRow[] = await client.fetch(/* groq */ `*[
      (_type == "astroPhoto" || _type == "reviewPost" || _type == "guideArticle" || _type == "researchProject")
      && defined(slug.current)
    ]{
      "pathPrefix": select(
        _type == "astroPhoto" => "/gallery",
        _type == "reviewPost" => "/reviews",
        _type == "guideArticle" => "/guide",
        _type == "researchProject" => "/research"
      ),
      "slug": slug.current,
      "updatedAt": _updatedAt
    }`);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));

  const contentEntries: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${SITE_URL}${row.pathPrefix}/${row.slug}`,
    lastModified: row.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...contentEntries];
}
