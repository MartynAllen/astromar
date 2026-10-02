"use client";

import Link from "next/link";
import { useBasket } from "@/components/shop/useBasket";

// Header basket indicator. Renders nothing for an empty basket, so visitors
// who aren't shopping never see it — and since the server always renders an
// empty basket, it simply appears after hydration for those who are.
export default function BasketLink() {
  const { count } = useBasket();
  if (count === 0) return null;
  return (
    <Link
      href="/shop/basket"
      aria-label={`Basket, ${count} ${count === 1 ? "item" : "items"}`}
      className="inline-flex min-h-11 items-center gap-2 border border-void-600 px-3 py-2 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
    >
      Basket
      <span className="font-mono text-nebula-teal-400" aria-hidden="true">
        {count}
      </span>
    </Link>
  );
}
