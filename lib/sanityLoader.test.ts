import { test } from "node:test";
import assert from "node:assert/strict";
import sanityLoader from "./sanityLoader";

const BASE = "https://cdn.sanity.io/images/proj/prod/abc-4032x3024.jpg";

test("sanityLoader rescales height proportionally when a fixed-aspect crop's width changes", () => {
  // heroCropUrl-style request: explicit w+h (a 2.1:1 crop), then next/image
  // substitutes its own responsive width (1920) — the height must scale to
  // match, or the resulting w:h pair silently becomes a different (wider)
  // aspect ratio than the caller actually asked for.
  const src = `${BASE}?w=1344&h=640&fit=crop`;
  const result = sanityLoader({ src, width: 1920 });
  const url = new URL(result);
  assert.equal(url.searchParams.get("w"), "1920");
  // 1920 * 640 / 1344 = 914.28.. -> rounds to 914
  assert.equal(url.searchParams.get("h"), "914");
  // Aspect ratio preserved (within rounding).
  const ratio = 1920 / 914;
  assert.ok(Math.abs(ratio - 1344 / 640) < 0.01, `expected ~2.1:1, got ${ratio}`);
});

test("sanityLoader leaves height untouched when there was none to begin with", () => {
  // Plain urlFor(image).width(W).url() calls (most image usages on the
  // site) carry no h param at all — nothing to rescale, and no h should be
  // invented.
  const src = `${BASE}?w=1000`;
  const result = sanityLoader({ src, width: 1600 });
  const url = new URL(result);
  assert.equal(url.searchParams.get("w"), "1600");
  assert.equal(url.searchParams.get("h"), null);
});

test("sanityLoader sets quality and format params", () => {
  const result = sanityLoader({ src: `${BASE}?w=800`, width: 800, quality: 90 });
  const url = new URL(result);
  assert.equal(url.searchParams.get("q"), "90");
  assert.equal(url.searchParams.get("auto"), "format");
});

test("sanityLoader defaults quality to 75 when unspecified", () => {
  const result = sanityLoader({ src: `${BASE}?w=800`, width: 800 });
  const url = new URL(result);
  assert.equal(url.searchParams.get("q"), "75");
});
