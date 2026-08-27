"use client";

import { useState } from "react";
import Link from "next/link";
import type { PrintProduct } from "@/lib/sanity.queries";

function formatGBP(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export default function BuyPrintPanel({
  photoSlug,
  products,
}: {
  photoSlug: string;
  products: PrintProduct[];
}) {
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (products.length === 0) return null;

  const selected = products.find((p) => p.sku === selectedSku);

  async function handleBuy() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoSlug, sku: selected.sku }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Something went wrong starting checkout");
      }
      // Full-page navigation to Stripe's own hosted Checkout (an external
      // origin) — router.push can't take us there, and there's nothing
      // left for this component to do once we leave the page. Using
      // .assign() rather than a `location.href =` assignment — the React
      // Compiler's eslint rule flags the latter as a component-external
      // mutation even from inside an event handler.
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border border-void-700 bg-void-900 p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
        Buy a print
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {products.map((product) => {
          const isActive = product.sku === selectedSku;
          return (
            <button
              key={product.sku}
              type="button"
              onClick={() => setSelectedSku(product.sku)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-nebula-rose-500 bg-nebula-rose-500/10 text-nebula-rose-400"
                  : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
              }`}
            >
              {product.title} — {formatGBP(product.priceGBP)}
            </button>
          );
        })}
      </div>

      {selected?.description && (
        <p className="mt-2 text-sm text-star-500">{selected.description}</p>
      )}

      {error && (
        <p className="mt-3 text-sm text-nebula-rose-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleBuy}
        disabled={loading || !selected}
        className="mt-3 flex w-full items-center justify-center gap-2 border border-nebula-rose-400 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-nebula-rose-400"
      >
        {loading
          ? "Redirecting to checkout…"
          : selected
            ? `Buy print — ${formatGBP(selected.priceGBP)}`
            : "Buy print"}
      </button>

      <p className="mt-3 text-xs text-star-700">
        Made to order and shipped within the UK.{" "}
        <Link href="/shipping-returns" className="underline hover:text-star-500">
          Shipping &amp; returns
        </Link>
      </p>
    </div>
  );
}
