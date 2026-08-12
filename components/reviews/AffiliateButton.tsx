import type { AffiliateLink } from "@/lib/sanity.queries";

export default function AffiliateButton({ link }: { link: AffiliateLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 border border-nebula-rose-400 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
    >
      {link.label}
      {link.retailer && <span className="normal-case opacity-70">· {link.retailer}</span>}
    </a>
  );
}
