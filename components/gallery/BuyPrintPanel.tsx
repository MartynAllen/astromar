"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import type { AstroPhotoDetail, PrintProduct } from "@/lib/sanity.queries";
import { FRAME_COLORS, DEFAULT_FRAME_COLOR, frameColorLabel } from "@/lib/printFrameColors";

function formatGBP(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function QuickViewModal({
  photo,
  product,
  framed,
  frameColor,
  onClose,
}: {
  photo: AstroPhotoDetail;
  product: PrintProduct;
  framed: boolean;
  frameColor: string;
  onClose: () => void;
}) {
  const swatch = FRAME_COLORS.find((c) => c.value === frameColor)?.swatch ?? "#0a0a0a";
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const previewUrl = urlFor(photo.mainImage).width(900).url();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-void-950/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview — ${photo.title}, ${product.title}${framed ? `, framed (${frameColorLabel(frameColor)})` : ""}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="flex max-w-lg flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Approximate preview only — a CSS mat/frame treatment, not a real
            product photo, so it's built from what's already on hand rather
            than needing external mockup assets. Border width is scaled
            roughly toward the print's own aspect ratio, not exact. */}
        <div
          className={
            framed
              ? "bg-void-950 p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
              : ""
          }
          style={framed ? { border: `14px solid ${swatch}` } : undefined}
        >
          <Image
            src={previewUrl}
            alt={photo.caption || photo.title}
            width={900}
            height={900}
            className={`h-auto max-h-[70vh] w-auto ${framed ? "border border-void-800" : "border border-void-700"}`}
          />
        </div>
        <p className="mt-4 text-center text-sm text-star-500">
          {photo.title} — {product.title}
          {framed ? `, framed (${frameColorLabel(frameColor)})` : ""}
        </p>
        <p className="mt-1 text-center text-xs text-star-700">
          Approximate preview — actual framing, mat and colour may vary slightly.
        </p>
      </div>
    </div>
  );
}

export default function BuyPrintPanel({
  photo,
  products,
}: {
  photo: AstroPhotoDetail;
  products: PrintProduct[];
}) {
  const [selectedId, setSelectedId] = useState(products[0]?._id);
  const [framed, setFramed] = useState(false);
  const [frameColor, setFrameColor] = useState(DEFAULT_FRAME_COLOR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (products.length === 0) return null;

  const selected = products.find((p) => p._id === selectedId);
  const canFrame = Boolean(selected?.framedSku && selected?.framingAddonPriceGBP);
  const totalGBP = selected
    ? selected.unframedPriceGBP + (framed && canFrame ? (selected.framingAddonPriceGBP ?? 0) : 0)
    : 0;

  function selectProduct(id: string) {
    setSelectedId(id);
    // A size that can't be framed shouldn't silently keep "framed" checked
    // for the next selection.
    const next = products.find((p) => p._id === id);
    if (!next?.framedSku || !next?.framingAddonPriceGBP) setFramed(false);
  }

  async function handleBuy() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoSlug: photo.slug.current,
          printProductId: selected._id,
          framed: framed && canFrame,
          ...(framed && canFrame ? { frameColor } : {}),
        }),
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
          const isActive = product._id === selectedId;
          return (
            <button
              key={product._id}
              type="button"
              onClick={() => selectProduct(product._id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-nebula-rose-500 bg-nebula-rose-500/10 text-nebula-rose-400"
                  : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
              }`}
            >
              {product.title} — {formatGBP(product.unframedPriceGBP)}
            </button>
          );
        })}
      </div>

      {selected?.description && (
        <p className="mt-2 text-sm text-star-500">{selected.description}</p>
      )}

      {canFrame && (
        <>
          <label className="mt-3 flex items-center gap-2 text-sm text-star-300">
            <input
              type="checkbox"
              checked={framed}
              onChange={(e) => setFramed(e.target.checked)}
              className="h-4 w-4 accent-nebula-rose-500"
            />
            Add framing — +{formatGBP(selected!.framingAddonPriceGBP ?? 0)}
          </label>

          {framed && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-widest text-star-500">Frame colour</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FRAME_COLORS.map((color) => {
                  const isActive = color.value === frameColor;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFrameColor(color.value)}
                      aria-pressed={isActive}
                      title={color.label}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "border-nebula-rose-500 bg-nebula-rose-500/10 text-nebula-rose-400"
                          : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
                      }`}
                    >
                      <span
                        className="h-3 w-3 flex-none rounded-full border border-void-600"
                        style={{ backgroundColor: color.swatch }}
                        aria-hidden="true"
                      />
                      {color.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-nebula-rose-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          disabled={!selected}
          className="flex items-center justify-center gap-2 border border-void-600 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quick view
        </button>
        <button
          type="button"
          onClick={handleBuy}
          disabled={loading || !selected}
          className="flex flex-1 items-center justify-center gap-2 border border-nebula-rose-400 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-nebula-rose-400"
        >
          {loading ? "Redirecting to checkout…" : `Buy print — ${formatGBP(totalGBP)}`}
        </button>
      </div>

      <p className="mt-3 text-xs text-star-700">
        Made to order and shipped within the UK.{" "}
        <Link href="/shipping-returns" className="underline hover:text-star-500">
          Shipping &amp; returns
        </Link>
      </p>

      {previewOpen && selected && (
        <QuickViewModal
          photo={photo}
          product={selected}
          framed={framed && canFrame}
          frameColor={frameColor}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
