import Image from "next/image";
import Link from "next/link";
import { heroCropUrl } from "@/sanity/image";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

// Small square contact-sheet-style thumbnail — same sharp-corner, hairline-
// border, no-shadow treatment as every other card on the site (Flat-By-
// Default and Sharp Edge rules both apply here same as anywhere else); a
// literal scrapbook/tapestry look (rotation, drop shadows, overlap) was
// the original ask, but that vocabulary doesn't exist anywhere else on
// this site and would read as a one-off detour rather than a considered
// addition. A contact sheet is the on-brand equivalent: a handful of real
// frames, no chrome beyond what a photo card already carries elsewhere.
function ClusterThumb({ photo, offsetClass }: { photo: AstroPhotoSummary; offsetClass?: string }) {
  return (
    <Link
      href={`/gallery/${photo.slug.current}`}
      aria-label={photo.title}
      className={`group block h-24 w-24 flex-none overflow-hidden border border-void-700 bg-void-900 lg:h-28 lg:w-28 ${offsetClass ?? ""}`}
    >
      <Image
        src={heroCropUrl(photo.mainImage, 224, 224)}
        alt={photo.title}
        width={224}
        height={224}
        sizes="112px"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
      />
    </Link>
  );
}

/**
 * The About page's hero: one dominant photo (the real aurora shot,
 * unchanged) with a loose scatter of smaller featured-photo thumbnails at
 * its flanks on wider screens — proximity plus a vertical stagger between
 * the two thumbnails on each side (same trick the gear tiles further down
 * this page already use) reads as "a handful of shots," not a rigid grid.
 * Below `lg:`, there's no real room either side of a `max-w-2xl` column to
 * scatter anything into, so the cluster collapses to a plain wrapped row
 * beneath the hero instead — the same "drop the offset/width band
 * entirely below a breakpoint" move the gear tiles make, not a new idea.
 */
export default function FeaturedPhotoCluster({
  clusterPhotos,
  children,
}: {
  clusterPhotos: AstroPhotoSummary[];
  /** The main hero <Image> + its caption, rendered by the caller (About
   * page) so this component only owns the surrounding layout/cluster, not
   * the hero image's own markup. */
  children: React.ReactNode;
}) {
  const left = clusterPhotos.slice(0, 2);
  const right = clusterPhotos.slice(2, 4);

  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-center lg:gap-5">
        {left.length > 0 && (
          <div className="hidden flex-none flex-col gap-4 lg:flex lg:w-28 lg:pt-10">
            {left.map((photo, i) => (
              <ClusterThumb key={photo._id} photo={photo} offsetClass={i === 1 ? "lg:mt-14" : undefined} />
            ))}
          </div>
        )}

        <div className="w-full max-w-2xl flex-none">{children}</div>

        {right.length > 0 && (
          <div className="hidden flex-none flex-col gap-4 lg:flex lg:w-28 lg:pt-24">
            {right.map((photo, i) => (
              <ClusterThumb key={photo._id} photo={photo} offsetClass={i === 1 ? "lg:mt-14" : undefined} />
            ))}
          </div>
        )}

        {clusterPhotos.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-3 lg:hidden">
            {clusterPhotos.map((photo) => (
              <ClusterThumb key={photo._id} photo={photo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
