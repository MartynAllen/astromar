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
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  return url.toString();
}
