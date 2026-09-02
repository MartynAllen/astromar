import Link from "next/link";

// A lightweight "back to the list" wayfinding link for detail pages
// (Reviews, Guide, Research, Gallery). Styled as a nav-link, not a button —
// this is a secondary wayfinding aid sitting above the H1, not a primary
// action, so it stays quiet (text-star-500 at rest) rather than competing
// with the page's real content. The "←" mirrors the site's existing "→"
// convention used throughout (PageHero credits, footer CTAs, card links) —
// a plain character, not a drawn icon, for consistency with that pattern.
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-m-3 inline-block p-3 font-mono text-xs uppercase tracking-widest text-star-500 transition-colors hover:text-nebula-teal-400"
    >
      ← {label}
    </Link>
  );
}
