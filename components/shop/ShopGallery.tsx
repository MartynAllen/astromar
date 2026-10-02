"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import PhotoLightbox from "@/components/reviews/PhotoLightbox";
import type { ReviewGalleryImage } from "@/lib/sanity.queries";

// A large square main photo with a thumbnail strip beneath; clicking the
// main photo opens the same lightbox the review pages use. Square crop
// throughout so a mixed set of product photos reads as one set.
export default function ShopGallery({ images }: { images: ReviewGalleryImage[] }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) return null;
  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`View ${current.alt} larger`}
        className="block w-full border border-void-700 bg-void-900"
      >
        <Image
          src={urlFor(current.image).width(1000).height(1000).fit("crop").url()}
          alt={current.alt}
          width={1000}
          height={1000}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="aspect-square h-auto w-full object-cover"
        />
      </button>

      {images.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {images.map((photo, i) => (
            <li key={photo.image.asset?._ref ?? i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}: ${photo.alt}`}
                aria-current={i === active}
                className={`block border bg-void-900 transition-colors ${
                  i === active ? "border-nebula-teal-500" : "border-void-700 hover:border-void-600"
                }`}
              >
                <Image
                  src={urlFor(photo.image).width(160).height(160).fit("crop").url()}
                  alt=""
                  width={80}
                  height={80}
                  className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightboxOpen && (
        <PhotoLightbox
          photos={images}
          index={active}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setActive}
        />
      )}
    </div>
  );
}
