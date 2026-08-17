import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import GallerySearch from "@/components/gallery/GallerySearch";
import {
  getAllPhotos,
  getHeroPhoto,
  type PhotoCategory,
} from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Deep-sky, lunar and wide-field astrophotography.",
};

const VALID_CATEGORIES: PhotoCategory[] = [
  "deep-sky",
  "lunar",
  "planetary",
  "wide-field",
  "gear",
];

export default async function GalleryPage(props: PageProps<"/gallery">) {
  const searchParams = await props.searchParams;
  const rawCategory =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const category = VALID_CATEGORIES.find((c) => c === rawCategory);
  const [photos, heroPhoto] = await Promise.all([
    getAllPhotos(),
    getHeroPhoto(1),
  ]);

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
        <GallerySearch photos={photos} initialCategory={category} />
      </div>
    </>
  );
}
