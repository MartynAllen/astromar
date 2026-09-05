import Link from "next/link";

// A lightweight "back to the list" wayfinding link for detail pages
// (Reviews, Learn, Research, Gallery). Styled as a nav-link, not a button —
// this is a secondary wayfinding aid sitting above the H1, not a primary
// action, so it stays quiet (text-star-500 at rest) rather than competing
// with the page's real content. The "←" mirrors the site's existing "→"
// convention used throughout (PageHero credits, footer CTAs, card links) —
// a plain character, not a drawn icon, for consistency with that pattern.
//
// Sticky, pinned at top-20 — directly below Header's own sticky bar (h-20,
// top-0, z-40) — so it stays reachable on long detail pages (reviews,
// research write-ups) without scrolling all the way back up. z-30 keeps it
// under the header; bg-void-950/85 + backdrop-blur mirrors the header's own
// treatment so page content doesn't show through once it's pinned mid-scroll
// (harmless at rest too, since it matches the body's own void-950 ground).
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="sticky top-20 z-30 -mx-6 bg-void-950/85 px-6 backdrop-blur">
      <Link
        href={href}
        className="-m-3 inline-block p-3 font-mono text-xs uppercase tracking-widest text-star-500 transition-colors hover:text-nebula-teal-400"
      >
        ← {label}
      </Link>
    </div>
  );
}
