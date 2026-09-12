"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import PhotoLightbox from "@/components/reviews/PhotoLightbox";
import type { SanityImageWithDimensions } from "@/lib/sanity.queries";

export interface ImageRowItem {
  image: SanityImageWithDimensions;
  alt: string;
  caption?: string;
}

// Same click-to-expand pattern as ReviewPhotoGallery.tsx, reusing the same
// PhotoLightbox — for a bodyImageRow comparison shot, "click to see it
// closer" matters more than most inline images: the whole point of putting
// two photos side by side is a detail-level comparison that a ~300px-wide
// column can't really show.
export default function ExpandableImageRow({ images }: { images: ImageRowItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row">
      {images.map((item, i) => (
        <figure key={i} className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Expand ${item.alt}`}
            className="group relative block w-full overflow-hidden border border-void-700"
          >
            <Image
              src={urlFor(item.image).width(600).url()}
              alt={item.alt}
              width={600}
              height={400}
              sizes="(min-width: 640px) 220px, 100vw"
              className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center border border-void-600 bg-void-950/80 text-star-100 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          {item.caption && (
            <figcaption className="mt-2 text-center text-sm text-star-500">{item.caption}</figcaption>
          )}
        </figure>
      ))}

      {openIndex !== null && (
        <PhotoLightbox
          photos={images.map((item) => ({ image: item.image, alt: item.alt, caption: item.caption }))}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
}
