import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
import { formatCaptureDate, formatShotSummary } from "@/lib/astro/shotDetails";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

export default function PhotoCard({
  photo,
  fromPriceGBP,
  showShotSummary,
  returnTo,
}: {
  photo: AstroPhotoSummary;
  /** Cheapest active print size, in pence. Pass this from any page that
   * already fetches the print catalog so the "buy this" signal is visible
   * while browsing, not just after switching on a filter. */
  fromPriceGBP?: number;
  /** Adds a mono instrument-readout line (subs × exposure · integration ·
   * filter) below the capture date — the real EXIF-verified data that's the
   * site's actual differentiator, per PRODUCT.md. Opt-in per page rather
   * than sitewide: the plain gallery/homepage grid stays at its established
   * density, and only /prints — where that proof is doing real work toward
   * a purchase decision — turns it on. Silently omitted for single-exposure
   * shots (aurora, star trails) that have no sub/exposure data to show. */
  showShotSummary?: boolean;
  /** Where this card's own list actually lives — e.g. "/prints", or
   * "/gallery?prints=true" when reached through the gallery's own filter —
   * so the detail page's back link returns here instead of always falling
   * back to the plain, unfiltered /gallery. See GalleryBackLink. */
  returnTo?: string;
}) {
  const dims = photo.mainImage.dimensions;
  const width = dims?.width ?? 1200;
  const height = dims?.height ?? 800;
  const captureDate = formatCaptureDate(photo.shotDetails?.captureDate);
  const shotSummary =
    showShotSummary && photo.shotDetails ? formatShotSummary(photo.shotDetails) : undefined;
  const showPrintBadge = photo.availableAsPrint && typeof fromPriceGBP === "number";
  const href = returnTo
    ? `/gallery/${photo.slug.current}?from=${encodeURIComponent(returnTo)}`
    : `/gallery/${photo.slug.current}`;

  return (
    <Link
      href={href}
      data-photo-slug={photo.slug.current}
      // A masonry grid can show 30+ of these — eagerly prefetching every
      // visible card's RSC payload (next/link's default) is a real request-
      // count spike with no benefit until a card is actually clicked.
      prefetch={false}
      className="group relative mb-4 block break-inside-avoid overflow-hidden border border-void-700 bg-void-900"
    >
      <Image
        src={urlFor(photo.mainImage).width(1000).url()}
        alt={photo.caption || photo.title}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
        className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {showPrintBadge && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-nebula-rose-400/80 bg-void-950/80 px-3 py-1 font-mono text-xs uppercase tracking-widest text-nebula-rose-300 backdrop-blur-sm">
          Prints from £{Math.round(fromPriceGBP / 100)}
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void-950/90 via-void-950/50 to-transparent p-3 pt-8">
        <p className="font-mono text-lg uppercase tracking-wide text-star-100">{photo.title}</p>
        {/* Not italic — this is a data readout (Mono-Does-More rule), not
            prose, and italic is otherwise reserved for the one sanctioned
            blockquote case sitewide (The Italic Rule). */}
        {captureDate && <p className="text-xs text-star-500">{captureDate}</p>}
        {shotSummary && <p className="font-mono text-xs text-star-500">{shotSummary}</p>}
      </div>
    </Link>
  );
}
