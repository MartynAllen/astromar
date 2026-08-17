import Image from "next/image";
import { urlFor } from "@/sanity/image";
import type { ReviewGalleryImage } from "@/lib/sanity.queries";

export default function ReviewPhotoGallery({ photos }: { photos: ReviewGalleryImage[] }) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="mt-12 border-t border-void-700 pt-8">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">Photos</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {photos.map((photo, i) => {
          const dims = photo.image.dimensions;
          const width = dims?.width ?? 1200;
          const height = dims?.height ?? 800;
          return (
            <figure key={photo.image.asset?._ref ?? i}>
              <span className="block overflow-hidden border border-void-700">
                <Image
                  src={urlFor(photo.image).width(800).url()}
                  alt={photo.alt}
                  width={width}
                  height={height}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </span>
              {(photo.caption || photo.creditText) && (
                <figcaption className="mt-2 text-sm text-star-500">
                  {photo.caption}
                  {photo.creditText && (
                    <span className="mt-1 block text-xs text-star-600">
                      Photo:{" "}
                      {photo.creditUrl ? (
                        <a
                          href={photo.creditUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-void-600 hover:text-nebula-teal-400"
                        >
                          {photo.creditText}
                        </a>
                      ) : (
                        photo.creditText
                      )}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}
