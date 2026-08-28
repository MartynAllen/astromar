import AffiliateButton from "@/components/reviews/AffiliateButton";
import type { RecommendedAccessory } from "@/lib/sanity.queries";

interface ProductTierValue {
  tierTitle: string;
  tierNote?: string;
  newOptions?: RecommendedAccessory[];
  usedOptions?: RecommendedAccessory[];
}

function ProductCard({ item }: { item: RecommendedAccessory }) {
  return (
    <div className="border border-void-700 bg-void-900 p-4">
      <p className="font-mono uppercase tracking-wide text-star-100">{item.name}</p>
      {item.description && (
        <p className="mt-1.5 text-sm text-star-300">{item.description}</p>
      )}
      {item.compatibilityNote && (
        <p className="mt-1.5 text-xs text-star-600">{item.compatibilityNote}</p>
      )}
      <div className="mt-3">
        <AffiliateButton link={item.affiliateLink} />
      </div>
    </div>
  );
}

// Renders a productTier portable-text block — a price tier with New (Amazon)
// and Used (eBay) columns. Used gracefully shows a "coming soon" note
// instead of a blank column or a dead link until that affiliate program is
// actually set up; New shows the same honest fallback if a tier's picks
// haven't been written yet, rather than rendering an empty grid.
export default function ProductTierBlock({ value }: { value: ProductTierValue }) {
  const newOptions = value.newOptions ?? [];
  const usedOptions = value.usedOptions ?? [];

  return (
    <div className="mt-10 border-t border-void-700 pt-8">
      <h3 className="font-mono text-2xl uppercase tracking-wide text-star-100">
        {value.tierTitle}
      </h3>
      {value.tierNote && <p className="mt-2 text-star-300">{value.tierNote}</p>}

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-nebula-amber-400">
            New
          </p>
          {newOptions.length > 0 ? (
            <div className="mt-3 space-y-4">
              {newOptions.map((item) => (
                <ProductCard key={item.affiliateLink.url} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-star-600">
              Nothing picked for this tier yet.
            </p>
          )}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-nebula-amber-400">
            Used
          </p>
          {usedOptions.length > 0 ? (
            <div className="mt-3 space-y-4">
              {usedOptions.map((item) => (
                <ProductCard key={item.affiliateLink.url} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-star-600">
              Used listings coming soon — eBay affiliate link in progress.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
