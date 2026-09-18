"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFocusTrap } from "@/lib/useFocusTrap";

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

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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
 * exactly as before (its natural height rarely approaches the cap). The
 * wrapping frame itself is sized to the rendered image (`w-fit`), not a
 * fixed full width — an earlier version kept the frame full-width and let
 * a capped portrait photo float inside it, which read as a wall of dead
 * void-900 on both sides rather than a deliberate letterbox; hugging the
 * actual rendered size instead means the border only ever traces the
 * photo itself, at any ratio. `compact` (the gallery lightbox only, a
 * fixed-viewport modal with far less room than a standalone page) uses a
 * much tighter cap than the standalone page's own — see PhotoDetail's own
 * doc comment on `compact`.
 * The expand button exists in both modes, since viewing an astrophoto at
 * true fullscreen is worth having everywhere, not just where space is
 * tight. See img:fullscreen in app/globals.css for why neither cap also
 * applies once actually fullscreened.
 *
 * Falls back to a plain CSS full-viewport overlay when the real
 * Fullscreen API isn't usable — notably iOS Safari added to the home
 * screen (`display-mode: standalone`): WebKit exposes neither
 * `requestFullscreen` nor the webkit-prefixed fallback there at all
 * (there's no browser chrome left for "fullscreen" to hide), so the
 * button silently did nothing rather than erroring. The same fallback
 * also covers a `requestFullscreen` call that exists but rejects (e.g. an
 * embedding iframe missing `allow="fullscreen"`).
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  useFocusTrap(overlayRef, fallbackOpen);

  useEffect(() => {
    if (!fallbackOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFallbackOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [fallbackOpen]);

  async function handleExpand() {
    const el = imgRef.current;
    const request =
      el?.requestFullscreen?.bind(el) ??
      (el as unknown as { webkitRequestFullscreen?: () => void } | null)?.webkitRequestFullscreen?.bind(el);
    if (!request) {
      setFallbackOpen(true);
      return;
    }
    try {
      const result = request();
      if (result instanceof Promise) await result;
    } catch {
      // requestFullscreen() rejects (not throws) when the browser or an
      // embedding context denies the request — same fallback as the API
      // not existing at all, rather than an unhandled rejection with the
      // button otherwise doing nothing.
      setFallbackOpen(true);
    }
  }

  return (
    <div className="relative mx-auto w-fit max-w-full overflow-hidden border border-void-700 bg-void-900">
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
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-void-600 bg-void-950/70 text-star-100 backdrop-blur-sm transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
          >
            <ExpandIcon />
          </button>
          {fallbackOpen && (
            <div
              ref={overlayRef}
              className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/95 p-4"
              role="dialog"
              aria-modal="true"
              aria-label={`${alt || "Photo"} — full screen`}
              onClick={() => setFallbackOpen(false)}
            >
              <button
                type="button"
                onClick={() => setFallbackOpen(false)}
                aria-label="Exit full screen"
                className="fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
              >
                <CloseIcon />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- a
                  plain <img>, not next/image: this overlay's whole point is
                  showing the largest available render at true full-viewport
                  size, and next/image's `fill`/fixed-size modes both need a
                  sized ancestor to fill rather than "as large as the actual
                  viewport allows, capped by the image's own resolution." */}
              <img
                src={posterUrl}
                alt={alt}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
