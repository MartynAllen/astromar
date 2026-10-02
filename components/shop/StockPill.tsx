import { availabilityLabel, variantAvailability } from "@/lib/shop/availability";
import type { ShopFulfilment, ShopVariant } from "@/lib/shop/types";

// Neutral on purpose (DESIGN.md's One Accent Rule): the card already carries
// the teal accent, so stock state is a grey label, not a second colour.
// Star 500 is the floor for readable text — star-700 fails contrast.
export default function StockPill({
  fulfilment,
  variant,
  leadTimeDays,
}: {
  fulfilment: ShopFulfilment;
  variant: Pick<ShopVariant, "stock">;
  leadTimeDays?: number;
}) {
  const soldOut = variantAvailability(fulfilment, variant).state === "soldOut";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest ${
        soldOut ? "border-void-700 text-star-500" : "border-void-600 text-star-300"
      }`}
    >
      {availabilityLabel(fulfilment, variant, leadTimeDays)}
    </span>
  );
}
