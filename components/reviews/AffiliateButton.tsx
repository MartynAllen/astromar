import type { AffiliateLink } from "@/lib/sanity.queries";
import { isSafeHref } from "@/lib/safeUrl";

export default function AffiliateButton({
  link,
  accentClassName = "border-nebula-rose-400 text-nebula-rose-400 hover:bg-nebula-rose-400",
}: {
  link: AffiliateLink;
  /** Border/text/hover-fill colour classes — defaults to the site's rose
   * primary-CTA colour, correct for Reviews. Pass the surrounding section's
   * own colour when this button sits inside a colour-coded context (e.g.
   * the About page's gear tiles), so it doesn't clash with its own tile. */
  accentClassName?: string;
}) {
  // Affiliate URLs are free-text Studio fields — rules out a stored
  // javascript:/data: scheme executing on click. Not expected in practice,
  // but cheap insurance against a compromised or careless edit.
  if (!isSafeHref(link.url)) return null;

  return (
    <div>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`inline-flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors hover:text-void-950 ${accentClassName}`}
      >
        {link.label}
      </a>
      {link.priceComparisonNote && (
        <p className="mt-1.5 max-w-xs break-words text-xs text-star-500">{link.priceComparisonNote}</p>
      )}
    </div>
  );
}
