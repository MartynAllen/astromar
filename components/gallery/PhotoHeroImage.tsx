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
 * Both modes cap the image's own height, not just width-fill — a plain
 * `w-full h-auto` treatment (the standalone page's original behaviour)
 * computes height from width divided by aspect ratio, and for a portrait
 * shot at typical container widths that height comfortably exceeds a full
 * viewport (a 1080x1920 source at ~1150px container width renders over
 * 2000px tall) — pushing the *entire image itself* below the fold before
 * a visitor even reaches the title, not just the content that follows it.
 * `max-height` + `w-auto` (both modes) lets the browser's normal
 * width-vs-height-constraint resolution pick whichever is actually
 * binding, so a landscape photo still fills the container edge to edge
 * exactly as before (its natural height rarely approaches the cap), while
 * a portrait photo instead letterboxes within the same full-width frame.
 * `compact` (the gallery lightbox only, a fixed-viewport modal with far
 * less room than a standalone page) uses a much tighter cap than the
 * standalone page's own — see PhotoDetail's own doc comment on `compact`.
 * The expand button exists in both modes, since viewing an astrophoto at
 * true fullscreen is worth having everywhere, not just where space is
 * tight. See img:fullscreen in app/globals.css for why neither cap also
 * applies once actually fullscreened.
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
          : "relative flex w-full items-center justify-center overflow-hidden border border-void-700 bg-void-900"
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
            className={
              compact
                ? "mx-auto max-h-[45vh] w-auto object-contain sm:max-h-[60vh]"
                : "h-auto max-h-[70vh] w-auto max-w-full object-contain sm:max-h-[85vh]"
            }
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
