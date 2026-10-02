"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBasket } from "@/components/shop/useBasket";
import { formatDispatchWindow } from "@/lib/shop/pricing";
import { formatGBP } from "@/lib/shop/types";
import type { QuoteDto, QuoteLineDto } from "@/lib/shop/quoteDto";

// false while rendering on the server and during hydration, true after —
// without an effect-driven setState (the repo's lint forbids that).
const noopSubscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// The result of the latest quote request, tagged with the basket contents
// it was fetched for. Comparing that tag to the current basket tells us
// whether what's on screen is current or stale — no separate loading flag
// to keep in sync.
interface QuoteResult {
  key: string;
  quote?: QuoteDto;
  error?: boolean;
}

// The basket never trusts its own storage for money: it holds only
// {productId, variantKey, qty}, and everything shown here — names, prices,
// stock warnings, postage, the free-postage nudge — comes from
// /api/shop/quote on every change. The same pricing core then charges at
// checkout, so what's shown is what's paid.
export default function BasketView() {
  const { lines, setQty, remove } = useBasket();
  const hydrated = useHydrated();
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const linesKey = useMemo(() => JSON.stringify(lines), [lines]);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    const controller = new AbortController();
    fetch("/api/shop/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`quote ${res.status}`);
        setResult({ key: linesKey, quote: (await res.json()) as QuoteDto });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult((prev) => ({ key: linesKey, quote: prev?.quote, error: true }));
      });
    return () => controller.abort();
    // linesKey stands in for `lines` so the fetch re-runs only when the
    // basket's contents actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, linesKey]);

  const quote = result?.quote ?? null;
  const settled = result?.key === linesKey;
  const stale = lines.length > 0 && !settled;
  const failed = settled && result?.error === true;

  function applyFixes() {
    if (!quote) return;
    for (const line of quote.lines) {
      if (!line.issue) continue;
      if (line.issue.maxQty && line.issue.maxQty > 0) setQty(line.productId, line.variantKey, line.issue.maxQty);
      else remove(line.productId, line.variantKey);
    }
    setMessage(null);
  }

  async function handleCheckout() {
    setCheckoutBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        quote?: QuoteDto;
      };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (res.status === 409 && data.quote) setResult({ key: linesKey, quote: data.quote });
      setMessage(data.error ?? "Something went wrong starting checkout. Please try again.");
    } catch {
      setMessage("Couldn't reach the shop. Check your connection and try again.");
    }
    setCheckoutBusy(false);
  }

  if (!hydrated || (lines.length > 0 && !quote && !failed)) {
    return <p className="py-16 text-center text-star-500">Loading your basket…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-star-500">Your basket is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block border border-void-600 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-star-100 hover:text-star-100"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  if (failed && !quote) {
    return (
      <p className="border border-void-600 bg-void-900 px-5 py-4 text-sm text-star-500" role="alert">
        Your basket is saved, but prices can&apos;t be loaded right now. Check back shortly.
      </p>
    );
  }

  if (!quote) return null;

  return (
    <div className={`grid gap-10 lg:grid-cols-[1fr_20rem] ${stale ? "opacity-70" : ""}`}>
      <ul className="divide-y divide-void-700 border-y border-void-700">
        {quote.lines.map((line) => (
          <BasketLine
            key={`${line.productId}-${line.variantKey}`}
            line={line}
            onQty={(n) => setQty(line.productId, line.variantKey, n)}
            onRemove={() => remove(line.productId, line.variantKey)}
          />
        ))}
      </ul>

      <aside className="h-fit border border-void-700 bg-void-900 p-5 lg:sticky lg:top-28">
        <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">Order summary</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-star-500">Subtotal</dt>
            <dd className="font-mono text-star-100">{formatGBP(quote.subtotalPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-star-500">UK postage</dt>
            <dd className="font-mono text-star-100">
              {quote.subtotalPence === 0 ? "—" : quote.freeShipping ? "Free" : formatGBP(quote.shippingPence)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-void-700 pt-3 text-base">
            <dt className="text-star-100">Total</dt>
            <dd className="font-mono text-star-100">{formatGBP(quote.totalPence)}</dd>
          </div>
        </dl>

        {quote.amountToFreeShippingPence !== undefined && (
          <p className="mt-3 text-sm text-star-300">
            Add {formatGBP(quote.amountToFreeShippingPence)} more for free UK postage.
          </p>
        )}
        {quote.dispatch && (
          <p className="mt-3 text-sm text-star-500">
            Dispatched in {formatDispatchWindow(quote.dispatch)}.
          </p>
        )}

        {quote.hasIssues && (
          <div className="mt-4 border border-nebula-rose-500/60 p-3" role="alert">
            <p className="text-sm text-nebula-rose-400">
              Some items need attention before you can check out.
            </p>
            <button
              type="button"
              onClick={applyFixes}
              className="mt-2 font-mono text-xs uppercase tracking-widest text-star-300 underline hover:text-star-100"
            >
              Update my basket
            </button>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-nebula-rose-400" role="alert">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkoutBusy || quote.hasIssues || stale}
          className="mt-5 min-h-11 w-full border border-nebula-rose-400 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 disabled:cursor-not-allowed disabled:border-void-600 disabled:text-star-500 disabled:hover:bg-transparent"
        >
          {checkoutBusy ? "Redirecting to checkout…" : `Checkout — ${formatGBP(quote.totalPence)}`}
        </button>
        <p className="mt-3 text-xs text-star-500">
          Payment is taken securely by Stripe — card details never touch this site.{" "}
          <Link href="/shipping-returns" className="underline hover:text-star-300">
            Shipping &amp; returns
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}

function BasketLine({
  line,
  onQty,
  onRemove,
}: {
  line: QuoteLineDto;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const name = line.title ?? "Item no longer available";
  const max = line.maxQty ?? line.qty;
  return (
    <li className="flex gap-4 py-5">
      <div className="h-20 w-20 flex-none overflow-hidden border border-void-700 bg-void-900 sm:h-24 sm:w-24">
        {line.imageUrl && (
          <Image
            src={line.imageUrl}
            alt={line.imageAlt ?? ""}
            width={192}
            height={192}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.slug && line.issue?.code !== "unavailable" ? (
              <Link
                href={`/shop/${line.slug}`}
                className="font-mono text-lg uppercase tracking-wide text-star-100 hover:text-nebula-teal-400"
              >
                {name}
              </Link>
            ) : (
              <p className="font-mono text-lg uppercase tracking-wide text-star-500">{name}</p>
            )}
            {line.variantLabel && <p className="text-sm text-star-500">{line.variantLabel}</p>}
          </div>
          <p className="font-mono text-star-100">{line.issue ? "—" : formatGBP(line.linePence)}</p>
        </div>

        {line.issue && (
          <p className="mt-1 text-sm text-nebula-rose-400" role="alert">
            {line.issue.message}
          </p>
        )}

        <div className="mt-3 flex items-center gap-4">
          {!(line.issue && (line.issue.code === "unavailable" || line.issue.code === "variant_missing" || line.issue.code === "out_of_stock")) && (
            <div className="flex items-center border border-void-600" role="group" aria-label={`Quantity for ${name}`}>
              <button
                type="button"
                onClick={() => onQty(line.qty - 1)}
                aria-label={`Decrease quantity of ${name}`}
                className="h-9 w-9 font-mono text-star-300 transition-colors hover:text-star-100"
              >
                −
              </button>
              <span aria-live="polite" className="w-8 text-center font-mono text-sm text-star-100">
                {line.qty}
              </span>
              <button
                type="button"
                onClick={() => onQty(line.qty + 1)}
                disabled={line.qty >= max}
                aria-label={`Increase quantity of ${name}`}
                className="h-9 w-9 font-mono text-star-300 transition-colors hover:text-star-100 disabled:text-star-700"
              >
                +
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="font-mono text-xs uppercase tracking-widest text-star-500 underline transition-colors hover:text-star-100"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
