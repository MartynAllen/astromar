import { Suspense } from "react";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import GallerySearch from "@/components/gallery/GallerySearch";
import { getAllPhotos, getHeroPhoto, getSiteSettings } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Deep-sky, lunar and wide-field astrophotography.",
};

export default async function GalleryPage() {
  const [photos, heroPhoto, settings] = await Promise.all([
    getAllPhotos(),
    getHeroPhoto(1),
    getSiteSettings().catch(() => null),
  ]);
  const shopUrl = settings?.shopUrl;

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-6xl px-6">
          <Breadcrumbs items={[{ name: "Gallery", path: "/gallery" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">Gallery</h1>
          <p className="mt-2 max-w-2xl text-star-500">
            Every image here started as raw stacked subs — tap any photo for
            exposure details.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {shopUrl && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-nebula-rose-400 bg-nebula-rose-400/10 px-5 py-4">
            <p className="text-sm text-star-300">
              Like what you see? Prints of these shots are available to buy.
            </p>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-none items-center gap-2 border border-nebula-rose-400 px-4 py-2 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
            >
              Shop Prints
            </a>
          </div>
        )}
        <Suspense>
          <GallerySearch photos={photos} />
        </Suspense>
      </div>
    </>
  );
}
