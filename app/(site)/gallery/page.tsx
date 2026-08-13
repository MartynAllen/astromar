import Link from "next/link";
import type { Metadata } from "next";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
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

const CATEGORIES: { label: string; value: PhotoCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Deep Sky", value: "deep-sky" },
  { label: "Lunar", value: "lunar" },
  { label: "Planetary", value: "planetary" },
  { label: "Wide Field", value: "wide-field" },
  { label: "Gear", value: "gear" },
];

export default async function GalleryPage(props: PageProps<"/gallery">) {
  const searchParams = await props.searchParams;
  const rawCategory =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const category = CATEGORIES.find((c) => c.value === rawCategory)?.value;
  const [photos, heroPhoto] = await Promise.all([
    getAllPhotos(category),
    getHeroPhoto(1),
  ]);

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-6xl px-6">
          <Breadcrumbs items={[{ name: "Gallery", path: "/gallery" }]} />
          <h1 className="font-display text-4xl text-star-100">Gallery</h1>
          <p className="mt-2 max-w-2xl text-star-500">
            Every image here started as raw stacked subs — tap any photo for
            exposure details.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isActive = c.value === category;
            const href = c.value ? `/gallery?category=${c.value}` : "/gallery";
            return (
              <Link
                key={c.label}
                href={href}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400"
                    : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <PhotoGrid photos={photos} />
        </div>
      </div>
    </>
  );
}
