"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import PhotoLightbox from "@/components/reviews/PhotoLightbox";
import type { ReviewProductImage } from "@/lib/sanity.queries";

export default function ProductImageThumbnail({
  image,
  alt,
}: {
  image: ReviewProductImage;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-none">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${alt} in more detail`}
        className="group block"
      >
        <Image
          src={urlFor(image).width(240).height(240).url()}
          alt={alt}
          width={120}
          height={120}
          className="h-[120px] w-[120px] border border-void-700 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>
      {image.creditText && (
        <p className="mt-1 w-[120px] text-[10px] leading-tight text-star-500">
          Photo:{" "}
          {image.creditUrl ? (
            <a
              href={image.creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-void-600 hover:text-nebula-teal-400"
            >
              {image.creditText}
            </a>
          ) : (
            image.creditText
          )}
        </p>
      )}

      {open && (
        <PhotoLightbox
          photos={[{ image, alt, creditText: image.creditText, creditUrl: image.creditUrl }]}
          index={0}
          onClose={() => setOpen(false)}
          onNavigate={() => {}}
        />
      )}
    </div>
  );
}
