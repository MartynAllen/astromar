"use client";

import { useRef } from "react";
import Image from "next/image";

// Expand icon echoes the site's own viewfinder-corner-bracket motif (see
// PageHero) rather than a generic diagonal-arrows glyph — four open
// brackets reading as "this frame can grow," consistent with the same
// visual language used for photo framing elsewhere on the site.
function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The photo detail page's hero media (image or video) plus an
 * expand-to-fullscreen control — split out from PhotoDetail specifically
 * because requestFullscreen needs a client component, while PhotoDetail
 * itself stays server-rendered otherwise.
 *
 * `compact` caps the image's own display height (used only inside the
 * gallery lightbox, whose fixed-viewport modal has much less room to
 * spare than a standalone page) — the expand button exists in both modes,
 * since viewing an astrophoto at true fullscreen is worth having
 * everywhere, not just where space is tight. See img:fullscreen in
 * app/globals.css for why the height cap doesn't also apply once
 * fullscreened.
 */
export default function PhotoHeroImage({
  posterUrl,
  videoUrl,
  alt,
  width,
  height,
  compact = false,
}: {
  posterUrl: string;
  videoUrl?: string;
  alt: string;
  width: number;
  height: number;
  compact?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  function handleExpand() {
    const el = imgRef.current;
    if (!el) return;
    const request =
      el.requestFullscreen?.bind(el) ??
      (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(el);
    // requestFullscreen() rejects (not throws) when the browser or an
    // embedding context (an iframe missing allow="fullscreen", some
    // automated/sandboxed environments) denies the request — swallow that
    // rather than an unhandled rejection, since there's nothing more this
    // button can do about it. The older webkit-prefixed fallback returns
    // void rather than a promise, hence the instanceof guard.
    const result = request?.();
    if (result instanceof Promise) result.catch(() => {});
  }

  return (
    <div
      className={
        compact
          ? "relative mx-auto w-fit max-w-full overflow-hidden border border-void-700 bg-void-900"
          : "relative overflow-hidden border border-void-700 bg-void-900"
      }
    >
      {videoUrl ? (
        // Native <video controls> already carries its own fullscreen
        // button — a second custom one here would be redundant.
        <video src={videoUrl} poster={posterUrl} controls playsInline className="h-auto w-full" />
      ) : (
        <>
          <Image
            ref={imgRef}
            src={posterUrl}
            alt={alt}
            width={width}
            height={height}
            sizes={compact ? "90vw" : "100vw"}
            priority
            className={compact ? "mx-auto max-h-[45vh] w-auto object-contain sm:max-h-[60vh]" : "h-auto w-full"}
          />
          <button
            type="button"
            onClick={handleExpand}
            aria-label="View full screen"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-void-600 bg-void-950/70 text-star-100 backdrop-blur-sm transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
          >
            <ExpandIcon />
          </button>
        </>
      )}
    </div>
  );
}
