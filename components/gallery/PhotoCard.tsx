import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
import { formatCaptureDate } from "@/lib/astro/shotDetails";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

export default function PhotoCard({ photo }: { photo: AstroPhotoSummary }) {
  const dims = photo.mainImage.dimensions;
  const width = dims?.width ?? 1200;
  const height = dims?.height ?? 800;
  const captureDate = formatCaptureDate(photo.shotDetails?.captureDate);

  return (
    <Link
      href={`/gallery/${photo.slug.current}`}
      data-photo-slug={photo.slug.current}
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void-950/90 via-void-950/50 to-transparent p-3 pt-8">
        <p className="text-lg text-star-100">{photo.title}</p>
        {captureDate && <p className="text-xs italic text-star-500">{captureDate}</p>}
      </div>
    </Link>
  );
}
