import type { AffiliateLink } from "@/lib/sanity.queries";

export default function AffiliateButton({ link }: { link: AffiliateLink }) {
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
