"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import type { ReviewGalleryImage } from "@/lib/sanity.queries";

function PhotoCredit({ photo }: { photo: ReviewGalleryImage }) {
  if (!photo.caption && !photo.creditText) return null;
  return (
    <>
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
    </>
  );
}

function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: ReviewGalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < photos.length - 1) onNavigate(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, photos.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-void-950/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Photo detail"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          aria-label="Previous photo"
          className="fixed left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          aria-label="Next photo"
          className="fixed right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <figure className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <Image
          src={urlFor(photo.image).width(1600).url()}
          alt={photo.alt}
          width={photo.image.dimensions?.width ?? 1600}
          height={photo.image.dimensions?.height ?? 1067}
          sizes="90vw"
          className="max-h-[80vh] w-auto"
        />
        <figcaption className="mt-3 text-sm text-star-500">
          <PhotoCredit photo={photo} />
        </figcaption>
      </figure>
    </div>
  );
}

export default function ReviewPhotoGallery({ photos }: { photos: ReviewGalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);

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
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`View ${photo.alt} in more detail`}
                className="group block w-full overflow-hidden border border-void-700"
              >
                <Image
                  src={urlFor(photo.image).width(800).url()}
                  alt={photo.alt}
                  width={width}
                  height={height}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </button>
              {(photo.caption || photo.creditText) && (
                <figcaption className="mt-2 text-sm text-star-500">
                  <PhotoCredit photo={photo} />
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {openIndex !== null && (
        <PhotoLightbox photos={photos} index={openIndex} onClose={close} onNavigate={setOpenIndex} />
      )}
    </div>
  );
}
