"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { isSafeHref } from "@/lib/safeUrl";
import { useFocusTrap } from "@/lib/useFocusTrap";
import type { SanityImageWithDimensions } from "@/lib/sanity.queries";

export interface LightboxPhoto {
  image: SanityImageWithDimensions;
  alt: string;
  caption?: string;
  creditText?: string;
  creditUrl?: string;
}

export function PhotoCredit({ photo }: { photo: LightboxPhoto }) {
  if (!photo.caption && !photo.creditText) return null;
  return (
    <>
      {photo.caption}
      {photo.creditText && (
        <span className="mt-1 block text-xs text-star-500">
          Photo:{" "}
          {isSafeHref(photo.creditUrl) ? (
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

export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[index];
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Matches Lightbox.tsx's pattern — without this, a keyboard user who
    // opens this modal has focus left wherever it was on the page behind
    // it, with no indication a dialog opened.
    closeButtonRef.current?.focus();
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
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-void-950/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Photo detail"
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
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
