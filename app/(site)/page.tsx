import Image from "next/image";
import Link from "next/link";
import PhotoCard from "@/components/gallery/PhotoCard";
import { urlFor } from "@/sanity/image";
import { getFeaturedPhotos } from "@/lib/sanity.queries";
import { formatCaptureDate, formatShotSummary } from "@/lib/astro/shotDetails";

export const revalidate = 60;

const SECTION_TEASERS = [
  {
    href: "/reviews",
    title: "Gear Reviews",
    body: "Honest write-ups on the telescopes, filters and software actually used to make these images.",
    color: "group-hover:text-nebula-rose-400",
  },
  {
    href: "/guide",
    title: "Beginner's Guide",
    body: "Starting point for anyone new to astrophotography, written from the smart-telescope side of the hobby.",
    color: "group-hover:text-nebula-amber-400",
  },
  {
    href: "/calendar",
    title: "Astronomy Calendar",
    body: "Moon phase, major meteor showers, and upcoming observing plans in one timeline.",
    color: "group-hover:text-nebula-indigo-400",
  },
  {
    href: "/research",
    title: "Research",
    body: "Colour tracking, computer vision, exoplanet detection — turning the gallery into a dataset with Python.",
    color: "group-hover:text-nebula-green-400",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedPhotos();
  const heroPhoto = featured[0];
  const heroSummary = heroPhoto?.shotDetails
    ? formatShotSummary(heroPhoto.shotDetails)
    : undefined;
  const heroCaptureDate = formatCaptureDate(heroPhoto?.shotDetails?.captureDate);

  return (
    <>
      <section className="relative overflow-hidden">
        {heroPhoto?.mainImage?.asset && (
          <Image
            src={urlFor(heroPhoto.mainImage).width(2400).height(1400).fit("crop").url()}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-void-950/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/60 to-transparent" />
        <span className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-star-100/60 sm:left-6 sm:top-6" />
        <span className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-star-100/60 sm:bottom-6 sm:left-6" />
        <span className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-star-100/60 sm:bottom-6 sm:right-6" />
        {heroPhoto && (
          <Link
            href={`/gallery/${heroPhoto.slug.current}`}
            className="absolute right-4 top-4 z-10 bg-void-950/50 px-2 py-1 font-mono text-xs text-star-300 backdrop-blur-sm transition-colors hover:text-nebula-teal-400 sm:right-6 sm:top-6"
          >
            {heroPhoto.title}
            {heroCaptureDate && ` — ${heroCaptureDate}`} →
          </Link>
        )}

        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-24 sm:pb-20 sm:pt-32">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-nebula-teal-400">
            Field log · Astronomy &amp; Astrophotography
          </p>
          <h1 className="mt-6 max-w-3xl font-mono text-5xl font-bold uppercase leading-[1.05] tracking-wide text-star-100 sm:text-7xl">
            Deep-sky images from a{" "}
            <span className="text-nebula-rose-400">very ordinary garden</span>.
          </h1>
          <p className="hero-resolve mt-6 max-w-xl text-base leading-relaxed text-star-500 sm:text-lg">
            Nebulae, galaxies and the moon, captured one stacked exposure at a
            time — plus the gear reviews, beginner&apos;s notes and research
            that come with it.
          </p>
          {(heroPhoto?.shotDetails?.targetCommonName || heroSummary) && (
            <div className="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 border border-void-700 bg-void-950/50 px-4 py-2.5 backdrop-blur-sm">
              <span className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
                This shot
              </span>
              {heroPhoto?.shotDetails?.targetCommonName && (
                <span className="font-mono text-xs text-star-100">
                  {heroPhoto.shotDetails.targetCommonName}
                </span>
              )}
              {heroSummary && (
                <span className="font-mono text-xs text-star-500">{heroSummary}</span>
              )}
            </div>
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/gallery"
              className="border border-nebula-rose-400 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
            >
              View the gallery
            </Link>
            <Link
              href="/about"
              className="border border-void-600 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-star-100 hover:text-star-100"
            >
              About the setup
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-void-700 bg-void-900/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="divide-y divide-void-700 border-t border-void-700">
            {SECTION_TEASERS.map((teaser, i) => (
              <Link
                key={teaser.href}
                href={teaser.href}
                className="group flex items-baseline gap-5 py-6 sm:gap-8"
              >
                <span className="font-mono text-sm text-star-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h2 className={`font-mono text-2xl uppercase tracking-wide text-star-100 ${teaser.color}`}>
                    {teaser.title}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm text-star-500">{teaser.body}</p>
                </div>
                <span
                  className={`hidden font-mono text-sm text-star-500 sm:block ${teaser.color}`}
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 1 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-6 flex items-baseline justify-between border-b border-void-700 pb-4">
            <h2 className="font-mono text-3xl uppercase tracking-wide text-star-100">Featured shots</h2>
            <Link
              href="/gallery"
              className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400 hover:underline"
            >
              All photos →
            </Link>
          </div>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {featured.slice(1).map((photo) => (
              <PhotoCard key={photo._id} photo={photo} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
