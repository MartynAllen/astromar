import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bestFitProductId,
  cropRatioCss,
  effectiveAspectRatio,
  previewCropWithSignatureExcluded,
  rawAspectRatio,
  retainedFraction,
  signatureSafeBottomFraction,
} from "./printFit";

// The site's real catalog as of the size-range expansion (see printProduct
// docs in Sanity) — kept inline rather than imported so this test doesn't
// depend on live content.
const PRODUCTS = [
  { _id: "8x10", widthIn: 8, heightIn: 10 },
  { _id: "12x16", widthIn: 12, heightIn: 16 },
  { _id: "16x20", widthIn: 16, heightIn: 20 },
  { _id: "20x28", widthIn: 20, heightIn: 28 },
  { _id: "24x32", widthIn: 24, heightIn: 32 },
];

test("effectiveAspectRatio treats a plain landscape source as landscape", () => {
  // Star Trails: 6000x4000, no printRotation.
  const ratio = effectiveAspectRatio({
    mainImage: { dimensions: { width: 6000, height: 4000 } },
  } as never);
  assert.ok(ratio > 1, `expected landscape (>1), got ${ratio}`);
  assert.equal(ratio, 1.5);
});

test("effectiveAspectRatio applies printRotation before judging orientation", () => {
  // Andromeda: raw asset is landscape (8192x5469) but printRotation: 90
  // turns it portrait for crop purposes — this must not regress.
  const ratio = effectiveAspectRatio({
    mainImage: { dimensions: { width: 8192, height: 5469 } },
    printRotation: 90,
  } as never);
  assert.ok(ratio < 1, `expected portrait (<1) after rotation, got ${ratio}`);
});

test("cropRatioCss flips to match a landscape source instead of forcing portrait", () => {
  const product = { widthIn: 12, heightIn: 16 };
  assert.equal(cropRatioCss(product, false), "12 / 16");
  assert.equal(cropRatioCss(product, true), "16 / 12");
});

test("retainedFraction is 1 when the shapes already match", () => {
  const product = { widthIn: 8, heightIn: 10 };
  assert.equal(retainedFraction(product, 0.8), 1);
});

test("retainedFraction drops as the crop diverges from the source shape", () => {
  const square = { widthIn: 10, heightIn: 10 };
  const closeMatch = { widthIn: 8, heightIn: 10 };
  const wideSource = 1.5; // e.g. Star Trails
  assert.ok(
    retainedFraction(closeMatch, wideSource) > retainedFraction(square, wideSource),
    "a portrait crop should keep more of a landscape source than a square crop",
  );
});

test("bestFitProductId picks the size closest to the source's own shape", () => {
  // All five catalog sizes are portrait-ish (0.71-0.8) — rotated landscape
  // for a wide source, that's a long/short ratio of 1.25-1.4. Star Trails'
  // source ratio is 1.5, so 20x28 (long/short 28/20 = 1.4, the closest of
  // the five to 1.5) should win over sizes whose rotated ratio sits further
  // away, even though 8x10 looks "more square" by its own catalogued shape.
  const landscapeSource = { mainImage: { dimensions: { width: 6000, height: 4000 } } } as never;
  assert.equal(bestFitProductId(PRODUCTS, landscapeSource), "20x28");
});

test("rawAspectRatio ignores printRotation, unlike effectiveAspectRatio", () => {
  // Andromeda: landscape asset, printRotation: 90 makes effectiveAspectRatio
  // say portrait (for the real order), but rawAspectRatio must still say
  // landscape (for the Quick View preview, kept matching the gallery page).
  const photo = {
    mainImage: { dimensions: { width: 8192, height: 5469 } },
    printRotation: 90,
  } as never;
  assert.ok(rawAspectRatio(photo) > 1, "rawAspectRatio should stay landscape");
  assert.ok(effectiveAspectRatio(photo) < 1, "effectiveAspectRatio should still flip to portrait");
});

test("effectiveAspectRatio and rawAspectRatio both apply printCrop, unlike printRotation", () => {
  // A 3024x3632 (0.8326) source with a chunk trimmed off the top and
  // bottom edges only — width untouched, height reduced, so the crop
  // alone should push the ratio up (less portrait) on both functions.
  const photo = {
    mainImage: { dimensions: { width: 3024, height: 3632 } },
    printCrop: { top: 0.09, bottom: 0.292 },
  } as never;
  const uncropped = 3024 / 3632;
  assert.ok(rawAspectRatio(photo) > uncropped, "printCrop should be reflected in rawAspectRatio");
  assert.ok(effectiveAspectRatio(photo) > uncropped, "printCrop should be reflected in effectiveAspectRatio");
});

test("bestFitProductId picks the size exactly matching a portrait source", () => {
  const portraitSource = { mainImage: { dimensions: { width: 4000, height: 5000 } } } as never; // 0.8
  assert.equal(bestFitProductId(PRODUCTS, portraitSource), "8x10");
});

test("signatureSafeBottomFraction scales with the source's own aspect ratio", () => {
  // Dumbbell Nebula: 8192x5608 (1.4608) — a landscape source needs more
  // bottom trim than a portrait one, since the watermark's height is a
  // fraction of *width*, not height.
  const landscape = signatureSafeBottomFraction({ width: 8192, height: 5608 });
  const portrait = signatureSafeBottomFraction({ width: 5608, height: 8192 });
  assert.ok(landscape > portrait, `landscape (${landscape}) should need more trim than portrait (${portrait})`);
  // Sanity-check the actual magnitude — should be a modest slice, not a
  // huge chunk of the frame, for a real photo's aspect ratio.
  assert.ok(landscape > 0.1 && landscape < 0.25, `expected a modest fraction, got ${landscape}`);
});

test("signatureSafeBottomFraction returns 0 for missing dimensions", () => {
  assert.equal(signatureSafeBottomFraction(undefined), 0);
});

test("previewCropWithSignatureExcluded takes the larger of printCrop's own bottom and the signature's", () => {
  const photoWithNoCrop = {
    mainImage: { dimensions: { width: 8192, height: 5608 } },
  } as never;
  const sigOnly = previewCropWithSignatureExcluded(photoWithNoCrop);
  assert.ok((sigOnly.bottom ?? 0) > 0, "should trim for the signature even with no editor printCrop set");
  assert.equal(sigOnly.top, undefined);
  assert.equal(sigOnly.left, undefined);
  assert.equal(sigOnly.right, undefined);

  // An editor-set printCrop that already trims more off the bottom than
  // the signature needs shouldn't get double-cropped.
  const photoWithBiggerCrop = {
    mainImage: { dimensions: { width: 8192, height: 5608 } },
    printCrop: { bottom: 0.5, left: 0.1 },
  } as never;
  const biggerWins = previewCropWithSignatureExcluded(photoWithBiggerCrop);
  assert.equal(biggerWins.bottom, 0.5);
  assert.equal(biggerWins.left, 0.1);

  // An editor-set printCrop whose own bottom trim is smaller than the
  // signature needs should be topped up, not left as-is.
  const photoWithSmallerCrop = {
    mainImage: { dimensions: { width: 8192, height: 5608 } },
    printCrop: { bottom: 0.01 },
  } as never;
  const sigWins = previewCropWithSignatureExcluded(photoWithSmallerCrop);
  assert.ok((sigWins.bottom ?? 0) > 0.01, "signature exclusion should top up an insufficient printCrop bottom");
});
