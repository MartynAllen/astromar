import type { AffiliateLink } from "@/lib/sanity.queries";

export default function AffiliateButton({ link }: { link: AffiliateLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 rounded-md bg-nebula-rose-400 px-4 py-2.5 font-display text-sm font-medium text-void-950 shadow-glow-rose transition-transform hover:scale-[1.02]"
    >
      {link.label}
      {link.retailer && <span className="text-void-800">· {link.retailer}</span>}
    </a>
  );
}
