import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

export default function PageHero({
  photo,
  className = "h-64 sm:h-80",
  children,
}: {
  photo: AstroPhotoSummary | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden border-b border-void-700 ${className}`}
    >
      {photo?.mainImage?.asset && (
        <Image
          src={urlFor(photo.mainImage)
            .width(1920)
            .height(800)
            .fit("crop")
            .url()}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-void-950/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/30 to-void-950/60" />
      <div className="relative flex h-full flex-col justify-end pb-8">
        {children}
      </div>
      {photo && (
        <Link
          href={`/gallery/${photo.slug.current}`}
          className="absolute right-4 top-4 z-10 font-mono text-[11px] text-star-500 transition-colors hover:text-nebula-teal-400"
        >
          {photo.title} →
        </Link>
      )}
    </div>
  );
}
