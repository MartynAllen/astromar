import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  "",
  "/gallery",
  "/reviews",
  "/learn",
  "/calendar",
  "/research",
  "/about",
  "/prints",
  "/disclosure",
  "/privacy",
  "/shipping-returns",
  "/contact",
];

interface SlugRow {
  pathPrefix: string;
  slug: string;
  updatedAt: string;
}

// Without this the sitemap is generated once, at build time, and never
// again — so anything published in Studio after a deploy (a new photo,
// review, or shop product) stayed out of it until the next deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows: SlugRow[] = await client.fetch(/* groq */ `*[
      (
        _type == "astroPhoto" || _type == "reviewPost" || _type == "guideArticle" || _type == "researchProject"
        || (_type == "shopProduct" && active == true && count(variants) > 0 && count(variants[!defined(pricePence)]) == 0)
      )
      && defined(slug.current)
    ]{
      "pathPrefix": select(
        _type == "astroPhoto" => "/gallery",
        _type == "reviewPost" => "/reviews",
        _type == "guideArticle" => "/learn",
        _type == "researchProject" => "/research",
        _type == "shopProduct" => "/shop"
      ),
      "slug": slug.current,
      "updatedAt": _updatedAt
    }`);

  // /shop is listed only once it has products (see hasActiveShopProducts) —
  // an empty shop index isn't worth a crawler's time.
  const shopLive = rows.some((r) => r.pathPrefix === "/shop");
  const staticRoutes = shopLive ? [...STATIC_ROUTES, "/shop"] : STATIC_ROUTES;

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
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
