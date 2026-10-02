"use client";

import { useState } from "react";
import Link from "next/link";
import { useBasket } from "@/components/shop/useBasket";
import StockPill from "@/components/shop/StockPill";
import { canAddLine } from "@/lib/shop/basket";
import { isPurchasable, variantAvailability } from "@/lib/shop/availability";
import { formatGBP, type ShopFulfilment, type ShopVariant } from "@/lib/shop/types";

interface Props {
  productId: string;
  fulfilment: ShopFulfilment;
  leadTimeDays?: number;
  variants: ShopVariant[];
  maxQtyPerLine: number;
}

// The variant picker, quantity stepper and Add button for one product.
// Limits shown here (stock, per-line max, what's already in the basket) are
// a courtesy — the server re-checks every one of them at quote and checkout.
export default function AddToBasket({
  productId,
  fulfilment,
  leadTimeDays,
  variants,
  maxQtyPerLine,
}: Props) {
  const { lines, add } = useBasket();
  // Default to the first variant that can actually be bought.
  const firstBuyable = variants.find((v) => isPurchasable(fulfilment, v)) ?? variants[0];
  const [variantKey, setVariantKey] = useState(firstBuyable._key);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const variant = variants.find((v) => v._key === variantKey) ?? variants[0];
  const purchasable = isPurchasable(fulfilment, variant);

  const stock =
    variantAvailability(fulfilment, variant).state === "madeToOrder"
      ? Number.POSITIVE_INFINITY
      : Math.max(0, variant.stock ?? 0);
  const limit = Math.min(stock, maxQtyPerLine);
  const inBasket = lines.find((l) => l.productId === productId && l.variantKey === variant._key)?.qty ?? 0;
  const remaining = Math.max(0, limit - inBasket);
  const basketFull = !canAddLine(lines, productId, variant._key);

  const effectiveQty = Math.min(qty, Math.max(1, remaining));
  const canAdd = purchasable && remaining > 0 && !basketFull;

  let blockedReason: string | null = null;
  if (!purchasable) blockedReason = "Sold out";
  else if (basketFull) blockedReason = "Your basket is full — check out or remove something first.";
  else if (remaining === 0) blockedReason = "You already have the most available in your basket.";

  function handleAdd() {
    if (!canAdd) return;
    add(productId, variant._key, effectiveQty);
    setJustAdded(true);
    setQty(1);
  }

  return (
    <div>
      {variants.length > 1 && (
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-widest text-star-500">Option</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const isActive = v._key === variant._key;
              const buyable = isPurchasable(fulfilment, v);
              return (
                <button
                  key={v._key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setVariantKey(v._key);
                    setQty(1);
                    setJustAdded(false);
                  }}
                  className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400"
                      : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
                  } ${buyable ? "" : "line-through decoration-star-700"}`}
                >
                  {v.label} — {formatGBP(v.pricePence)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="font-mono text-3xl text-star-100">{formatGBP(variant.pricePence)}</p>
        <StockPill fulfilment={fulfilment} variant={variant} leadTimeDays={leadTimeDays} />
      </div>
      <p className="mt-1 text-xs text-star-500">Plus UK postage — shown at checkout.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-void-600" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={effectiveQty <= 1 || !canAdd}
            aria-label="Decrease quantity"
            className="h-11 w-11 font-mono text-lg text-star-300 transition-colors hover:text-star-100 disabled:text-star-700"
          >
            −
          </button>
          <span aria-live="polite" className="w-10 text-center font-mono text-star-100">
            {canAdd ? effectiveQty : 0}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(Math.max(1, remaining), q + 1))}
            disabled={effectiveQty >= remaining || !canAdd}
            aria-label="Increase quantity"
            className="h-11 w-11 font-mono text-lg text-star-300 transition-colors hover:text-star-100 disabled:text-star-700"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="min-h-11 border border-nebula-rose-400 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 disabled:cursor-not-allowed disabled:border-void-600 disabled:text-star-500 disabled:hover:bg-transparent"
        >
          {canAdd
            ? `Add to basket — ${formatGBP(variant.pricePence * effectiveQty)}`
            : purchasable
              ? "Add to basket"
              : "Sold out"}
        </button>
      </div>

      {!canAdd && purchasable && blockedReason && (
        <p className="mt-3 text-sm text-star-500">{blockedReason}</p>
      )}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-star-300">
        {justAdded && (
          <>
            Added to your basket.{" "}
            <Link href="/shop/basket" className="underline hover:text-star-100">
              View basket →
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
