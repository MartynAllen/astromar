import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
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
}: {
  photo: AstroPhotoSummary | null;
  className?: string;
  children: React.ReactNode;
  /** Rotates just this hero's crop (via Sanity's `or` param) without
   * touching the underlying asset — the photo stays in its correct
   * orientation everywhere else it's used (gallery tile, detail page). */
  imageRotate?: 90 | 180 | 270;
}) {
  const captureDate = formatCaptureDate(photo?.shotDetails?.captureDate);

  return (
    <div className={`relative overflow-hidden border-b border-void-700 ${className}`}>
      {photo?.mainImage?.asset && (
        <Image
          src={urlFor(photo.mainImage)
            .width(1920)
            .height(800)
            .fit("crop")
            .orientation(imageRotate ?? 0)
            .url()}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
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
