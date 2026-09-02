import AffiliateButton from "@/components/reviews/AffiliateButton";
import type { RecommendedAccessory } from "@/lib/sanity.queries";

interface ProductTierValue {
  tierTitle: string;
  tierNote?: string;
  products?: RecommendedAccessory[];
}

function ProductCard({ item }: { item: RecommendedAccessory }) {
  return (
    <div className="border border-void-700 bg-void-900 p-4">
      <p className="font-mono uppercase tracking-wide text-star-100">{item.name}</p>
      {item.description && (
        <p className="mt-1.5 break-words text-sm text-star-300">{item.description}</p>
      )}
      {item.compatibilityNote && (
        <p className="mt-1.5 break-words text-xs text-star-500">{item.compatibilityNote}</p>
      )}
      <div className="mt-3">
        <AffiliateButton link={item.affiliateLink} />
      </div>
    </div>
  );
}

// Renders a productTier portable-text block — a price tier with Amazon
// picks. No eBay column: that affiliate program isn't set up, and rather
// than a dead link or a permanent "coming soon" gap, every tier just points
// readers at the secondhand market themselves. Each product's own
// affiliateLink can still carry its own priceComparisonNote for a specific
// tip (same field the About page's gear tiles already use) — this standing
// note is the fallback that's always there regardless.
export default function ProductTierBlock({ value }: { value: ProductTierValue }) {
  const products = value.products ?? [];

  return (
    <div className="mt-10 border-t border-void-700 pt-8">
      <h3 className="font-mono text-2xl uppercase tracking-wide text-star-100">
        {value.tierTitle}
      </h3>
      {value.tierNote && <p className="mt-2 break-words text-star-300">{value.tierNote}</p>}

      {products.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {products.map((item) => (
            <ProductCard key={item.affiliateLink.url} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-star-500">Nothing picked for this tier yet.</p>
      )}

      <p className="mt-4 text-xs text-star-500">
        Prefer used? Worth checking Facebook Marketplace or eBay too — always
        worth comparing before buying new.
      </p>
    </div>
  );
}
