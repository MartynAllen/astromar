import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
import { formatShotSummary } from "@/lib/astro/shotDetails";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

export default function PhotoCard({ photo }: { photo: AstroPhotoSummary }) {
  const dims = photo.mainImage.dimensions;
  const width = dims?.width ?? 1200;
  const height = dims?.height ?? 800;
  const summary = photo.shotDetails ? formatShotSummary(photo.shotDetails) : undefined;

  return (
    <Link
      href={`/gallery/${photo.slug.current}`}
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void-950/95 via-void-950/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="font-display text-base italic text-star-100">{photo.title}</p>
        {summary && (
          <p className="mt-0.5 font-mono text-xs text-nebula-teal-400">{summary}</p>
        )}
      </div>
    </Link>
  );
}
