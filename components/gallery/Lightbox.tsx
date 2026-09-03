"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SkyBackdrop from "./SkyBackdrop";
import { useFocusTrap } from "@/lib/useFocusTrap";

const SETTLE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Finds the grid thumbnail this modal was opened from (still mounted behind
 * it, since the gallery/home grid never unmounts under the parallel-route
 * modal) and the modal's own hero image, for a FLIP-style shared-element
 * transform between the two. Returns null if either side is missing —
 * direct links, refreshes, and reduced motion all fall through to a plain
 * fade instead.
 */
function findMorphPair(contentEl: HTMLElement | null, slug: string) {
  const modalImg = contentEl?.querySelector("img") ?? null;
  const originImg = document.querySelector<HTMLImageElement>(`[data-photo-slug="${slug}"] img`);
  if (!modalImg || !originImg) return null;
  return { modalImg, originImg };
}

function deltaTransform(from: DOMRect, to: DOMRect) {
  const x = from.left - to.left;
  const y = from.top - to.top;
  const scaleX = from.width / to.width;
  const scaleY = from.height / to.height;
  return `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`;
}

export default function Lightbox({
  slug,
  captureDate,
  children,
}: {
  slug: string;
  captureDate?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useFocusTrap(contentRef, true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    if (!prefersReducedMotion()) {
      const pair = findMorphPair(contentRef.current, slug);
      if (pair) {
        const { modalImg, originImg } = pair;
        const from = deltaTransform(originImg.getBoundingClientRect(), modalImg.getBoundingClientRect());
        modalImg.animate(
          [
            { transform: from, filter: "blur(2px)" },
            { transform: "none", filter: "blur(0)" },
          ],
          { duration: 420, easing: SETTLE_EASE },
        );
      }
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [slug]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    if (prefersReducedMotion()) {
      router.back();
      return;
    }

    const pair = findMorphPair(contentRef.current, slug);
    containerRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 160,
      easing: "ease-in",
      fill: "forwards",
    });

    if (!pair) {
      window.setTimeout(() => router.back(), 160);
      return;
    }

    const { modalImg, originImg } = pair;
    const to = deltaTransform(originImg.getBoundingClientRect(), modalImg.getBoundingClientRect());
    const shrink = modalImg.animate(
      [
        { transform: "none", filter: "blur(0)" },
        { transform: to, filter: "blur(2px)" },
      ],
      { duration: 200, easing: "ease-in", fill: "forwards" },
    );
    shrink.onfinish = () => router.back();
  }, [router, slug]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div
      ref={containerRef}
      className="lightbox-backdrop fixed inset-0 z-50 overflow-y-auto bg-void-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Photo detail"
    >
      <SkyBackdrop captureDate={captureDate} />
      <div ref={contentRef} className="lightbox-content relative mx-auto max-w-6xl px-6 py-10">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="sticky top-4 z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
