import { Suspense } from "react";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import LearnFilter from "@/components/learn/LearnFilter";
import { getAllGuideArticles, getHeroPhoto } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Practical how-to guides and explainers on the concepts behind astrophotography, from the smart-telescope side of the hobby.",
};

export default async function LearnPage() {
  const [articles, heroPhoto] = await Promise.all([
    getAllGuideArticles(),
    getHeroPhoto(2),
  ]);

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Learn", path: "/learn" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">Learn</h1>
          <p className="mt-2 text-star-500">
            Practical how-to guides and explainers on the ideas behind them —
            written from the smart-telescope side of the hobby.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {articles.length === 0 ? (
          <p className="mt-16 text-center text-star-500">
            No articles published yet.
          </p>
        ) : (
          <Suspense>
            <LearnFilter articles={articles} />
          </Suspense>
        )}
      </div>
    </>
  );
}
