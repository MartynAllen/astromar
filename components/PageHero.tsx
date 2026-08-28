import Image from "next/image";
import Link from "next/link";
import { urlFor, heroCropUrl } from "@/sanity/image";
import { formatCaptureDate } from "@/lib/astro/shotDetails";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

function CornerMarks() {
  return (
    <>
      <span className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-star-100/60" />
      <span className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-star-100/60" />
      <span className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-star-100/60" />
    </>
  );
}

export default function PageHero({
  photo,
  className = "h-64 sm:h-80",
  children,
  imageRotate,
  imagePosition = "object-center",
}: {
  photo: AstroPhotoSummary | null;
  className?: string;
  children: React.ReactNode;
  /** Rotates just this hero's crop (via Sanity's `or` param) without
   * touching the underlying asset — the photo stays in its correct
   * orientation everywhere else it's used (gallery tile, detail page). */
  imageRotate?: 90 | 180 | 270;
  /** Tailwind object-position class. The default center crop can land
   * squarely on the busiest part of a photo (see the Calendar hero) —
   * override to bias the crop toward a calmer region instead. */
  imagePosition?: string;
}) {
  const captureDate = formatCaptureDate(photo?.shotDetails?.captureDate);

  return (
    <div className={`relative overflow-hidden border-b border-void-700 ${className}`}>
      {photo?.mainImage?.asset && (
        <Image
          src={
            imageRotate
              ? // Skip Sanity's own pre-crop for a rotated hero — .height(800)
                // .fit("crop") throws away most of the image before the
                // browser ever sees it, leaving little room for
                // imagePosition to find a calmer window. Hand over the
                // full (rotated) square instead and let CSS object-cover
                // + imagePosition do all the cropping against the real
                // rendered box.
                urlFor(photo.mainImage).width(1920).orientation(imageRotate).url()
              : heroCropUrl(photo.mainImage, 1920, 800)
          }
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover ${imagePosition}`}
        />
      )}
      <div className="absolute inset-0 bg-void-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/50 to-transparent" />
      <CornerMarks />
      <div className="relative flex h-full flex-col justify-end pb-8">{children}</div>
      {photo && (
        <Link
          href={`/gallery/${photo.slug.current}`}
          className="absolute right-4 top-4 z-10 bg-void-950/50 px-2 py-1 font-mono text-xs text-star-300 backdrop-blur-sm transition-colors hover:text-nebula-teal-400"
        >
          {photo.title}
          {captureDate && ` — ${captureDate}`} →
        </Link>
      )}
    </div>
  );
}
