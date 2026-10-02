"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ShopProductCard from "@/components/shop/ShopProductCard";
import { SHOP_CATEGORIES } from "@/lib/shop/categories";
import type { ShopProductSummary } from "@/lib/shop/types";

// Read client-side rather than as a server prop — keeps /shop itself static
// (reading searchParams on the server would opt the whole route out of
// static generation just to seed this one default). Same approach as
// LearnFilter's ?type= param.
function useInitialCategory(available: string[]): string | undefined {
  const raw = useSearchParams().get("category");
  return available.find((c) => c === raw);
}

function orderCategories(present: string[]): string[] {
  return [...present].sort((a, b) => {
    const ai = SHOP_CATEGORIES.indexOf(a);
    const bi = SHOP_CATEGORIES.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function ShopIndex({ products }: { products: ShopProductSummary[] }) {
  const router = useRouter();
  const categories = useMemo(
    () => orderCategories(Array.from(new Set(products.map((p) => p.category)))),
    [products],
  );
  const [category, setCategory] = useState<string | undefined>(useInitialCategory(categories));

  const filtered = useMemo(
    () => products.filter((p) => !category || p.category === category),
    [products, category],
  );

  function select(next: string | undefined) {
    setCategory(next);
    router.replace(next ? `/shop?category=${encodeURIComponent(next)}` : "/shop", { scroll: false });
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[undefined, ...categories].map((c) => {
            const isActive = c === category;
            return (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => select(c)}
                aria-pressed={isActive}
                className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400"
                    : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
                }`}
              >
                {c ?? "All"}
              </button>
            );
          })}
        </div>
      )}

      <p aria-live="polite" className="mt-3 text-sm text-star-500">
        {category &&
          `Showing ${filtered.length} ${filtered.length === 1 ? "item" : "items"} in ${category}.`}
      </p>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <ShopProductCard key={product._id} product={product} />
        ))}
      </ul>
    </div>
  );
}
