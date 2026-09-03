"use client";

// Sanity's CDN already handles resizing, format negotiation (auto=format ->
// AVIF/WebP), quality, and hotspot-aware cropping — delegating straight to it
// avoids Vercel's image optimizer double-processing every photo.
export default function sanityLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const url = new URL(src);

  // A fixed-aspect crop request (heroCropUrl's ?w=&h=&fit=crop) carries an
  // explicit height alongside width — if one exists, next/image choosing a
  // different responsive width (its own srcset logic, independent of what
  // the component originally asked for) must not leave that height fixed:
  // the resulting w:h pair would no longer match the aspect ratio the
  // caller actually wanted, handing Sanity a *different* crop than
  // intended. That silently over/under-crops the image server-side, then
  // <Image>'s object-cover crops a second time to force it back into the
  // component's own box — with no idea what real content (a corner
  // signature, say) that second crop might cut through. Rescaling height
  // proportionally to the new width keeps the original aspect ratio
  // regardless of which width Next actually picks, so Sanity's own crop
  // (hotspot-aware, or at minimum content-blind-but-correct-ratio) is the
  // only crop that meaningfully happens. A plain width-only request (no
  // original h — most image usages on the site) is untouched, unaffected.
  const origWidth = Number(url.searchParams.get("w"));
  const origHeight = Number(url.searchParams.get("h"));
  if (origWidth > 0 && origHeight > 0) {
    url.searchParams.set("h", String(Math.round((width * origHeight) / origWidth)));
  }

  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  return url.toString();
}
