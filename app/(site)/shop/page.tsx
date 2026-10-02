import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ShopIndex from "@/components/shop/ShopIndex";
import { getAllShopProducts, getHeroPhoto, getShopSettings } from "@/lib/sanity.queries";
import { buildMetadata } from "@/lib/seo";
import { formatGBP } from "@/lib/shop/types";

export const revalidate = 60;

const TITLE = "Shop";
const DESCRIPTION =
  "Small 3D-printed things made on my own printer — filter boxes, tripod mounts, clips, coasters and the odd cookie cutter. Posted from the UK.";

export async function generateMetadata(): Promise<Metadata> {
  const [heroPhoto, products] = await Promise.all([
    getHeroPhoto(4),
    getAllShopProducts().catch(() => []),
  ]);
  const meta = buildMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/shop",
    image: heroPhoto?.mainImage,
    cropBottom: true,
  });
  // An empty shop page isn't worth indexing — it'd be a thin page that
  // outranks nothing and tells search engines the section is a placeholder.
  return products.length === 0 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function ShopPage() {
  // Track a genuine fetch failure separately from "no products yet" — the
  // same distinction /prints draws, so an outage doesn't read as an empty
  // shop.
  const [heroPhoto, productsResult, settings] = await Promise.all([
    getHeroPhoto(4),
    getAllShopProducts()
      .then((data) => ({ ok: true as const, data }))
      .catch((err) => {
        console.error("getAllShopProducts failed on /shop:", err);
        return { ok: false as const, data: [] as Awaited<ReturnType<typeof getAllShopProducts>> };
      }),
    getShopSettings(),
  ]);
  const products = productsResult.data;

  return (
    <>
      <PageHero photo={heroPhoto} className="h-72 sm:h-96">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Breadcrumbs items={[{ name: "Shop", path: "/shop" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100 sm:text-5xl">
            Shop
          </h1>
          <p className="mt-3 max-w-xl text-star-300">
            Small things I print myself — filter boxes, tripod mounts, clips, coasters and the odd
            cookie cutter. Made and posted from the UK.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 grid gap-6 border border-void-700 bg-void-900/40 p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
              Printed by me
            </p>
            <p className="mt-2 text-sm text-star-500">
              Every item is made on my own printer — nothing is resold or dropshipped.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
              UK postage
            </p>
            <p className="mt-2 text-sm text-star-500">
              {formatGBP(settings.flatShippingPence)} flat
              {settings.freeShippingThresholdPence
                ? `, free on orders over ${formatGBP(settings.freeShippingThresholdPence)}`
                : ""}
              . UK addresses only for now.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
              In stock or made to order
            </p>
            <p className="mt-2 text-sm text-star-500">
              Each item says which, and how long it takes.{" "}
              <Link href="/shipping-returns" className="underline hover:text-star-300">
                Shipping &amp; returns
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="mb-10 text-sm text-star-500">
          Looking for photo prints of the images on this site?{" "}
          <Link href="/prints" className="text-nebula-rose-400 hover:underline">
            See the prints →
          </Link>
        </p>

        {!productsResult.ok && (
          <p className="mb-10 border border-void-600 bg-void-900 px-5 py-4 text-sm text-star-500">
            The shop is temporarily unavailable — nothing is wrong with your basket, the products
            just can&apos;t be loaded right now. Check back shortly.
          </p>
        )}

        {products.length > 0 ? (
          <Suspense>
            <ShopIndex products={products} />
          </Suspense>
        ) : (
          productsResult.ok && (
            <p className="py-16 text-center text-star-500">
              Nothing in the shop just yet — check back soon.
            </p>
          )
        )}
      </div>
    </>
  );
}
