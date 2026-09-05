import Link from "next/link";

// A lightweight "back to the list" wayfinding link for detail pages
// (Reviews, Learn, Research, Gallery). Styled as a nav-link, not a button —
// this is a secondary wayfinding aid sitting above the H1, not a primary
// action, so it stays quiet (text-star-500 at rest) rather than competing
// with the page's real content. The "←" mirrors the site's existing "→"
// convention used throughout (PageHero credits, footer CTAs, card links) —
// a plain character, not a drawn icon, for consistency with that pattern.
//
// Sticky, pinned just below Header's own sticky bar (h-20, top-0, z-40) so
// it stays reachable on long detail pages (reviews, research write-ups)
// without scrolling all the way back up. A small floating chip — rounded,
// bordered, its own backdrop-blur — rather than a full-bleed bar, so it
// reads as a distinct pinned element (matching the site's other sticky/
// overlay chips: Lightbox's close button, PhotoCard's rounded-full tags)
// instead of looking like a second row bolted onto the header. z-30 keeps
// it under the header; top-24 leaves a visible gap between the two.
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="sticky top-24 z-30 inline-flex items-center gap-1.5 rounded-full border border-void-700 bg-void-950/80 px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-star-500 backdrop-blur-sm transition-colors hover:border-nebula-teal-400 hover:text-nebula-teal-400"
    >
      ← {label}
    </Link>
  );
}
