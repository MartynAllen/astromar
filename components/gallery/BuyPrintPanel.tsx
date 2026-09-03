"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { applyPrintCrop, urlFor } from "@/sanity/image";
import type { AstroPhotoDetail, PrintProduct } from "@/lib/sanity.queries";
import { FRAME_COLORS, DEFAULT_FRAME_COLOR, frameColorLabel, matWidthIn } from "@/lib/printFrameColors";
import {
  cropRatioCss,
  effectiveAspectRatio,
  previewCropWithSignatureExcluded,
  rawAspectRatio,
  retainedFraction,
} from "@/lib/printFit";

function formatGBP(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

// Tiled diagonal watermark for the Quick View preview only — mainImage
// already carries a baked-in signature (see astroPhoto schema), but that's
// a small corner mark meant for normal browsing, not for a modal whose
// entire point is "here's a clean look at what you'd be paying for." A
// screenshot of this is still possible (nothing client-side can prevent
// that), but a full-frame repeating mark makes one much less useful to
// lift, same as any stock-photo preview.
const WATERMARK_PATTERN = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150">' +
    '<text x="130" y="80" transform="rotate(-28 130 80)" text-anchor="middle" ' +
    'font-family="monospace" font-size="17" fill="white" fill-opacity="0.16">ASTROMAR · PREVIEW</text>' +
    "</svg>",
)}`;

// Procedural grain for the moulding — a flat fill reads as a coloured
// plastic strip, not a physical material. feTurbulence generates the noise
// so this needs no external texture asset; blended at low opacity with
// mix-blend-mode below so it tints whatever frame colour is underneath
// rather than imposing its own.
const FRAME_GRAIN = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
    '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" ' +
    'numOctaves="2" seed="7" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/></filter>' +
    '<rect width="100%" height="100%" filter="url(#g)"/></svg>',
)}`;

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
  // Prodigi orders every print with sizing: "fillPrintArea" — a cover-crop
  // to whatever aspect ratio the chosen size actually is, not the source
  // photo's own ratio. None of the site's print sizes (0.71-0.8) match a
  // typical sensor's native ratio, so real cropping happens on every
  // order regardless of size — showing the full uncropped photo here
  // regardless of which size is selected would misrepresent what actually
  // arrives. object-cover + this exact ratio approximates Prodigi's own
  // crop (a plain geometric centre-crop, since no crop offset is sent to
  // their API) rather than a nicer hotspot-aware one this site could
  // render but Prodigi never actually applies.
  //
  // Prodigi also auto-rotates the physical substrate to match the submitted
  // image's own orientation rather than forcing every order into this
  // catalog's portrait-ish shape (confirmed via their docs) — so a
  // landscape source (e.g. a wide star-trail shot) gets cropped landscape,
  // not squeezed into a portrait crop that throws away most of the frame.
  //
  // rawAspectRatio, not effectiveAspectRatio — by request, this preview is
  // kept visually consistent with how the photo looks on the gallery page,
  // even for a photo like Andromeda where the real order (see previewUrl
  // and checkout's imageUrl) rotates the submitted image to keep the whole
  // diagonal galaxy in frame. That's a deliberate, known mismatch: this
  // preview no longer represents the true print orientation for a rotated
  // photo — see the notice rendered below the frame for exactly that case.
  const sourceIsLandscape = rawAspectRatio(photo) > 1;
  const aspectRatio = cropRatioCss(product, sourceIsLandscape);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Moves keyboard focus into the dialog on open, matching Lightbox.tsx's
    // existing pattern — without this, a keyboard user who opens Quick View
    // has focus left wherever it was, with no indication a dialog opened.
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Deliberately NOT applying photo.printRotation here (unlike checkout's
  // imageUrl, which still does) — by request, this preview always shows the
  // photo the same way round as the gallery page, even when the real print
  // will be rotated. See the sourceIsLandscape comment above for the
  // tradeoff this accepts.
  //
  // photo.mainImage, not printMasterImage — the watermarked public copy,
  // same one used everywhere else on the site. printMasterImage (the clean
  // original) never reaches the browser before checkout, on purpose.
  // printCrop, unlike printRotation above, is NOT a preview-only concern —
  // it exists to exclude something genuinely unwanted from the frame (a
  // roofline caught in shot, a foreground object), so unlike the deliberate
  // preview/order mismatch above, this should always match the real print.
  //
  // previewCropWithSignatureExcluded folds in one more, preview-only
  // exclusion on top of that: mainImage's own baked-in corner signature,
  // which a print/Quick-View crop can otherwise slice straight through
  // (half a signature reads as broken, not as a crop). printMasterImage
  // carries no signature at all, so this never touches the real order —
  // only this fetch. See lib/printFit.ts for the actual maths.
  const previewUrl = applyPrintCrop(
    urlFor(photo.mainImage),
    previewCropWithSignatureExcluded(photo),
    photo.mainImage.dimensions,
  )
    .width(900)
    .url();

  // Real Prodigi Classic Frame spec, not a guess (see matWidthIn) — every
  // framed print gets a conservation-grade mount between the glazing and
  // the print itself, so the visible artwork is a smaller inset window,
  // not the full crop running edge-to-edge under the glass. Mount width is
  // a fixed physical measurement, so as a fraction of the print it differs
  // per axis — expressed in cqw/cqh (container query units, resolved
  // against the crop box's own width/height below) rather than plain %
  // (which would resolve both axes against width alone and skew the mat).
  const matIn = matWidthIn(Math.max(product.widthIn, product.heightIn));
  const matPercentH = (matIn / product.widthIn) * 100;
  const matPercentV = (matIn / product.heightIn) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-void-950/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview — ${photo.title}, ${product.title}${framed ? `, framed (${frameColorLabel(frameColor)})` : ""}`}
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-void-600 bg-void-900 text-star-100 hover:border-nebula-teal-500 hover:text-nebula-teal-400"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="relative flex max-w-lg flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A flat black modal background swallows a drop shadow completely —
            real frame mockups (and real gallery walls) always sit against
            something a shade lighter than the frame's own shadow, or the
            "floating off the wall" depth cue this is going for is invisible.
            A soft radial glow behind the frame stands in for that, styled
            like a gallery spotlight rather than a plain wall to fit the
            site's own dark theme. */}
        {framed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-16 -z-10"
            style={{
              background: "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(255,255,255,0.10) 0%, transparent 70%)",
            }}
          />
        )}
        {/* Approximate preview only — a CSS mockup, not a real product
            photo, built from what's already on hand rather than needing
            external mockup assets. The moulding colour is exact (Prodigi's
            own 8 options), the mat follows their real mount-width spec (see
            matWidthIn), and the moulding gets a procedural grain rather than
            a flat fill. Still an approximation: no true moulding profile,
            and the mat is always their default off-white rather than a
            colour choice.
            The moulding is padding + background, not a CSS border — a
            border paints opaquely over its element's own background, so a
            border-based moulding couldn't actually show the grain texture
            sitting on that same background underneath it. */}
        <div
          className={framed ? "w-full max-w-md p-3.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]" : "w-full max-w-md"}
          style={
            framed
              ? {
                  backgroundColor: swatch,
                  backgroundImage: `url("${FRAME_GRAIN}")`,
                  backgroundBlendMode: "overlay",
                  // Fakes a bevelled moulding profile catching the light
                  // along two edges — the same trick real frame mockups use
                  // in place of an actual 3D profile.
                  boxShadow:
                    "inset 2px 2px 0 rgba(255,255,255,0.14), inset -2px -2px 0 rgba(0,0,0,0.4)",
                }
              : undefined
          }
        >
          {/* The recessed rabbet where glazing actually sits, a shade below
              the moulding's own surface — real frames aren't flush here. */}
          <div className={framed ? "bg-void-950 p-2.5" : undefined}>
            <div
              className={`relative w-full overflow-hidden ${framed ? "border border-void-800" : "border border-void-700"}`}
              style={{ aspectRatio, containerType: "size" }}
            >
              <Image
                src={previewUrl}
                alt={photo.caption || photo.title}
                fill
                sizes="(min-width: 640px) 448px, 90vw"
                className="object-cover"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 select-none"
                style={{
                  backgroundImage: `url("${WATERMARK_PATTERN}")`,
                  backgroundRepeat: "repeat",
                  backgroundSize: "182px 105px",
                }}
              />
              {framed && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderStyle: "solid",
                    borderColor: "#f4f1ea",
                    borderWidth: `${matPercentV}cqh ${matPercentH}cqw`,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              )}
              {/* Soft diagonal sheen, suggesting the glazing every Prodigi
                  frame ships with — real glass/acrylic reflects, a flat
                  photo print doesn't. framed-only: this was previously
                  showing unconditionally, so an unframed print (no glass
                  at all) got a "reflection" that made no physical sense —
                  and on a mostly black frame (a sparse starfield shot, say)
                  a flat white gradient wash reads as a visible, unexplained
                  bright patch rather than a glass reflection at all. */}
              {framed && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 22%, transparent 45%)",
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-star-500">
          {photo.title} — {product.title}
          {framed ? `, framed (${frameColorLabel(frameColor)})` : ""}
        </p>
        {/* text-star-500, not star-700 — this is real explanatory copy a
            buyer needs to read on the purchase path, not a decorative mark
            or placeholder. star-700 measures ~2.9:1 against this modal's
            void-950 background, failing WCAG AA; see DESIGN.md's own
            documented rule on this exact distinction. */}
        <p className="mt-1 text-center text-xs text-star-500">
          Crop approximates this size&apos;s actual print area — framing, mat and colour may vary slightly.
        </p>
        {photo.printRotation && (
          <p className="mt-1 max-w-sm text-center text-xs text-star-500">
            Shown here as it appears on the site — the print itself is rotated to keep the full frame, so it
            may arrive turned compared to this preview.
          </p>
        )}
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

  // Every size crops to fit (Prodigi's fillPrintArea), so nothing stops a
  // customer picking a size that throws away most of the frame — flag
  // whichever one actually matches this photo's own shape best, so they
  // don't find out only after a print arrives more cropped than expected.
  // Skipped entirely when every size fits this photo about equally well —
  // a badge that lands on every pill recommends nothing.
  const sourceRatio = effectiveAspectRatio(photo);
  const fitScores = products.map((p) => retainedFraction(p, sourceRatio));
  const bestFitScore = Math.max(...fitScores);
  const allFitEqually = fitScores.every((s) => Math.abs(s - bestFitScore) < 0.005);
  const recommendedId = allFitEqually ? null : products[fitScores.indexOf(bestFitScore)]._id;
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

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Print size">
        {products.map((product) => {
          const isActive = product._id === selectedId;
          const isRecommended = product._id === recommendedId;
          return (
            <button
              key={product._id}
              type="button"
              onClick={() => selectProduct(product._id)}
              aria-pressed={isActive}
              className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-nebula-rose-500 bg-nebula-rose-500/10 text-nebula-rose-400"
                  : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
              }`}
            >
              {product.title} — {formatGBP(product.unframedPriceGBP)}
              {isRecommended && (
                <span className="ml-1.5 text-xs text-nebula-teal-400">· Best fit</span>
              )}
            </button>
          );
        })}
      </div>

      {recommendedId && recommendedId !== selectedId && (
        <p className="mt-2 text-xs text-nebula-teal-400">
          {products.find((p) => p._id === recommendedId)?.title} keeps the most of this shot
          uncropped — other sizes trim more off the edges to fit.
        </p>
      )}

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
          className="flex min-h-11 items-center justify-center gap-2 border border-void-600 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quick view
        </button>
        <button
          type="button"
          onClick={handleBuy}
          disabled={loading || !selected}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-nebula-rose-400 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-nebula-rose-400"
        >
          {loading ? "Redirecting to checkout…" : `Buy print — ${formatGBP(totalGBP)}`}
        </button>
      </div>

      <p className="mt-3 text-xs text-star-500">
        Made to order and shipped within the UK.{" "}
        <Link href="/shipping-returns" className="underline hover:text-star-300">
          Shipping &amp; returns
        </Link>
      </p>
      <p className="mt-1 text-xs text-star-500">
        1% of this sale goes toward carbon removal, via{" "}
        <a
          href="https://climate.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-star-300"
        >
          Stripe Climate
        </a>
        .
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
