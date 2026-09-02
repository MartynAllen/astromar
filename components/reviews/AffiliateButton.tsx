import type { AffiliateLink } from "@/lib/sanity.queries";
import { isSafeHref } from "@/lib/safeUrl";

export default function AffiliateButton({ link }: { link: AffiliateLink }) {
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
        className="inline-flex items-center gap-2 border border-nebula-rose-400 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
      >
        {link.label}
      </a>
      {link.priceComparisonNote && (
        <p className="mt-1.5 max-w-xs break-words text-xs text-star-500">{link.priceComparisonNote}</p>
      )}
    </div>
  );
}
