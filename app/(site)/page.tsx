import Link from "next/link";
import PhotoCard from "@/components/gallery/PhotoCard";
import { getFeaturedPhotos } from "@/lib/sanity.queries";

export const revalidate = 60;

const SECTION_TEASERS = [
  {
    href: "/reviews",
    title: "Gear Reviews",
    body: "Honest write-ups on the telescopes, filters and software actually used to make these images.",
  },
  {
    href: "/discussions",
    title: "Weekly Discussion",
    body: "A new prompt every week — planning sessions, processing questions, whatever's worth talking through.",
  },
  {
    href: "/guide",
    title: "Beginner's Guide",
    body: "Starting point for anyone new to astrophotography, written from the smart-telescope side of the hobby.",
  },
  {
    href: "/calendar",
    title: "Astronomy Calendar",
    body: "Moon phase, major meteor showers, and upcoming observing plans in one timeline.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedPhotos();

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28">
        <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
          Astronomy · Astrophotography
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-star-100 sm:text-6xl">
          Deep-sky images from a{" "}
          <span className="text-gradient-nebula">very ordinary backyard</span>.
        </h1>
        <p className="mt-5 max-w-xl text-base text-star-500 sm:text-lg">
          Nebulae, galaxies and the moon, captured one stacked exposure at a time —
          plus the gear reviews, weekly discussion and beginner&apos;s notes that come with it.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/gallery"
            className="rounded-md bg-nebula-rose-400 px-5 py-2.5 font-display text-sm font-medium text-void-950 shadow-glow-rose transition-transform hover:scale-[1.02]"
          >
            View the gallery
          </Link>
          <Link
            href="/about"
            className="rounded-md border border-void-600 px-5 py-2.5 font-display text-sm font-medium text-star-100 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
          >
            About the setup
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold text-star-100">
              Featured shots
            </h2>
            <Link href="/gallery" className="text-sm text-nebula-teal-400 hover:underline">
              All photos →
            </Link>
          </div>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {featured.map((photo) => (
              <PhotoCard key={photo._id} photo={photo} />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-void-700 bg-void-900/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {SECTION_TEASERS.map((teaser) => (
              <Link
                key={teaser.href}
                href={teaser.href}
                className="group rounded-lg border border-void-700 bg-void-900 p-6 transition-colors hover:border-nebula-rose-500"
              >
                <h3 className="font-display text-lg font-semibold text-star-100 group-hover:text-nebula-rose-400">
                  {teaser.title}
                </h3>
                <p className="mt-2 text-sm text-star-500">{teaser.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
