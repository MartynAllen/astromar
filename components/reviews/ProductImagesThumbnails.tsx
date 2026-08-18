"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import PhotoLightbox from "@/components/reviews/PhotoLightbox";
import type { ReviewGalleryImage } from "@/lib/sanity.queries";

const THUMB_SIZE = 100;
const STACK_OFFSET = 10;
// Beyond this many layers, further photos stack at the same offset rather
// than growing the container indefinitely — realistic stacks don't fan out
// forever, and most reviews will only have a handful of product photos.
const MAX_STACK_DEPTH = 5;

export default function ProductImagesThumbnails({ images }: { images: ReviewGalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const depth = Math.min(images.length, MAX_STACK_DEPTH);
  const extra = (depth - 1) * STACK_OFFSET;

  return (
    <div className="flex-none">
      <div className="relative" style={{ width: THUMB_SIZE + extra, height: THUMB_SIZE + extra }}>
        {images.map((photo, i) => {
          const layer = Math.min(i, MAX_STACK_DEPTH - 1);
          const rotate = i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * (3 + layer);
          return (
            <button
              key={photo.image.asset?._ref ?? i}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`View ${photo.alt} in more detail`}
              className="group absolute top-0 left-0"
              style={{
                transform: `translate(${layer * STACK_OFFSET}px, ${layer * STACK_OFFSET}px) rotate(${rotate}deg)`,
                zIndex: images.length - i,
              }}
            >
              <Image
                src={urlFor(photo.image).width(200).height(200).url()}
                alt={photo.alt}
                width={THUMB_SIZE}
                height={THUMB_SIZE}
                className="border-2 border-void-950 bg-void-900 object-cover shadow-lg shadow-void-950/60 outline outline-1 outline-void-700 transition-transform duration-200 group-hover:scale-[1.04]"
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              />
            </button>
          );
        })}
      </div>

      {openIndex !== null && (
        <PhotoLightbox
          photos={images}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
}
