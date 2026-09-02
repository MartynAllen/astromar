import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import { getPrintablePhotos, getPrintProducts } from "@/lib/sanity.queries";
import { cheapestPrintPriceGBP } from "@/lib/print";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Prints",
  description:
    "Fine-art prints of Astromar's own astrophotography — nebulae, galaxies, the moon and the aurora, made to order and shipped UK-wide.",
};

export default async function PrintsPage() {
  // A plain .catch(() => []) previously collapsed a genuine fetch failure
  // into the exact same shape as "no sizes configured" — every price badge
  // and the hero's "From £X" line would vanish with no indication anything
  // was wrong. Track the failure explicitly so the page can say so.
  const [photos, printProductsResult] = await Promise.all([
    getPrintablePhotos(),
    getPrintProducts()
      .then((data) => ({ ok: true as const, data }))
      .catch((err) => {
        console.error("getPrintProducts failed on /prints:", err);
        return { ok: false as const, data: [] as Awaited<ReturnType<typeof getPrintProducts>> };
      }),
  ]);
  const printProducts = printProductsResult.data;
  const catalogUnavailable = !printProductsResult.ok;
  // Pinned to the same shot as the homepage hero — Andromeda reads stronger
  // full-bleed than whichever photo happens to be newest (the previous
  // mechanical pick landed on a flatter, dimmer frame). Falls back to the
  // newest featured-and-printable photo, then the newest printable photo at
  // all, so the page still has a sensible hero if Andromeda is ever pulled
  // from the print catalog.
  const heroPhoto =
    photos.find((p) => p.slug.current === "andromeda-galaxy-2026-08-12") ??
    photos.find((p) => p.featured) ??
    photos[0] ??
    null;
  const fromPriceGBP = cheapestPrintPriceGBP(printProducts);

  return (
    <>
      <PageHero photo={heroPhoto} className="h-72 sm:h-96">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Breadcrumbs items={[{ name: "Prints", path: "/prints" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100 sm:text-5xl">
            Own a piece of the night sky
          </h1>
          <p className="mt-3 max-w-xl text-star-300">
            Fine-art prints of the shots on this site — real exposures from a
            very ordinary garden, made to order and shipped straight to you.
            {fromPriceGBP ? ` From £${Math.round(fromPriceGBP / 100)}.` : ""}
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 grid gap-6 border border-void-700 bg-void-900/40 p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
              Fine-art paper
            </p>
            <p className="mt-2 text-sm text-star-500">
              Printed giclée, true to the original exposure — not a
              consumer photo-lab print.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
              Framed or unframed
            </p>
            <p className="mt-2 text-sm text-star-500">
              Every size ships ready to hang, or add black framing at
              checkout for a couple of the larger sizes.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
              Made to order
            </p>
            <p className="mt-2 text-sm text-star-500">
              Nothing sits in a warehouse — each print is produced after you
              order it.{" "}
              <Link href="/shipping-returns" className="underline hover:text-star-300">
                Shipping &amp; returns
              </Link>
              .
            </p>
          </div>
        </div>

        {catalogUnavailable && (
          <p className="mb-10 border border-void-600 bg-void-900 px-5 py-4 text-sm text-star-500">
            Pricing is temporarily unavailable — the photos below are still
            real, current work, sizes and prices just can&apos;t be shown
            right now. Check back shortly.
          </p>
        )}

        {photos.length > 0 ? (
          <PhotoGrid photos={photos} fromPriceGBP={fromPriceGBP} showShotSummary returnTo="/prints" />
        ) : (
          <p className="py-16 text-center text-star-500">
            Nothing&apos;s available as a print just yet — check back soon.
          </p>
        )}
      </div>
    </>
  );
}
