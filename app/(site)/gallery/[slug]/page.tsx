import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PhotoDetail from "@/components/gallery/PhotoDetail";
import CheckoutStatusBanner from "@/components/gallery/CheckoutStatusBanner";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getPhotoBySlug, getPhotoSlugs, getPrintProducts } from "@/lib/sanity.queries";
import { buildMetadata, imageObjectJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPhotoSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) return {};
  return buildMetadata({
    title: photo.seo?.metaTitle || photo.title,
    description: photo.seo?.metaDescription || photo.caption,
    path: `/gallery/${slug}`,
    image: photo.seo?.ogImage || photo.mainImage,
  });
}

export default async function PhotoPage(props: PageProps<"/gallery/[slug]">) {
  const { slug } = await props.params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) notFound();

  // getPrintProducts() previously had no .catch() here — a transient Sanity
  // failure would take down the whole photo page (not just the buy panel)
  // for every print-eligible photo. Now it degrades to a visible notice in
  // PhotoDetail instead of crashing the route.
  let printProducts: Awaited<ReturnType<typeof getPrintProducts>> | undefined;
  let printCatalogUnavailable = false;
  if (photo.availableAsPrint) {
    try {
      printProducts = await getPrintProducts();
    } catch (err) {
      console.error("getPrintProducts failed on photo page:", err);
      printCatalogUnavailable = true;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <JsonLd
        data={imageObjectJsonLd({
          name: photo.title,
          description: photo.caption,
          path: `/gallery/${slug}`,
          image: photo.mainImage,
          dateCreated: photo.shotDetails?.captureDate,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Gallery", path: "/gallery" },
          { name: photo.title, path: `/gallery/${slug}` },
        ]}
      />
      <Suspense>
        <CheckoutStatusBanner />
      </Suspense>
      <PhotoDetail
        photo={photo}
        printProducts={printProducts}
        printCatalogUnavailable={printCatalogUnavailable}
      />
    </div>
  );
}
