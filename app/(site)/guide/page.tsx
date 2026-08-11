import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getAllGuideArticles, getHeroPhoto } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Beginner's Guide",
  description:
    "Starting points for astrophotography, from the smart-telescope side of the hobby.",
};

export default async function GuidePage() {
  const [articles, heroPhoto] = await Promise.all([
    getAllGuideArticles(),
    getHeroPhoto(4),
  ]);
  const sections = Array.from(new Set(articles.map((a) => a.section)));

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Guide", path: "/guide" }]} />
          <h1 className="font-display text-3xl font-semibold text-star-100">
            Beginner&apos;s Guide
          </h1>
          <p className="mt-2 text-star-500">
            Written from the smart-telescope side of the hobby — no assumed
            background in manual mounts or PixInsight.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {sections.length === 0 ? (
          <p className="mt-16 text-center text-star-500">
            No guide articles published yet.
          </p>
        ) : (
          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <div key={section}>
                <h2 className="font-display text-lg font-semibold text-nebula-teal-400">
                  {section}
                </h2>
                <ul className="mt-3 divide-y divide-void-700">
                  {articles
                    .filter((a) => a.section === section)
                    .map((article) => (
                      <li key={article._id} className="py-4">
                        <Link
                          href={`/guide/${article.slug.current}`}
                          className="group block"
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-medium text-star-100 group-hover:text-nebula-teal-400">
                              {article.title}
                            </h3>
                            {article.difficulty && (
                              <span className="rounded-full border border-void-600 px-2 py-0.5 text-[11px] text-star-500">
                                {article.difficulty}
                              </span>
                            )}
                          </div>
                          {article.summary && (
                            <p className="mt-1 text-sm text-star-500">
                              {article.summary}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
