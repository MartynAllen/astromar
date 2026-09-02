import AffiliateButton from "@/components/reviews/AffiliateButton";
import type { RecommendedAccessory } from "@/lib/sanity.queries";

export default function RecommendedAccessories({
  accessories,
}: {
  accessories: RecommendedAccessory[];
}) {
  if (!accessories || accessories.length === 0) return null;

  return (
    <div className="mt-12 border-t border-void-700 pt-8">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
        Recommended Accessories
      </p>
      <p className="mt-2 text-sm text-star-500">
        Worth pairing with this if you&apos;re buying it.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {accessories.map((accessory) => (
          <div key={accessory.affiliateLink.url} className="border border-void-700 bg-void-900 p-4">
            <p className="font-mono uppercase tracking-wide text-star-100">{accessory.name}</p>
            {accessory.description && (
              <p className="mt-1.5 break-words text-sm text-star-300">{accessory.description}</p>
            )}
            {accessory.compatibilityNote && (
              <p className="mt-1.5 break-words text-xs text-star-500">{accessory.compatibilityNote}</p>
            )}
            <div className="mt-3">
              <AffiliateButton link={accessory.affiliateLink} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
