import { test } from "node:test";
import assert from "node:assert/strict";
import { matWidthIn } from "./printFrameColors";

// Real Prodigi Classic Frame tiers (support.prodigi.com/hc/en-us/articles/
// 13137070879772): 10x10" or below -> 1", 11x14" or below -> 1.5", 12x16"
// or above -> 2".
test("matWidthIn follows Prodigi's real mount-width tiers", () => {
  assert.equal(matWidthIn(8), 1);
  assert.equal(matWidthIn(10), 1);
  assert.equal(matWidthIn(11), 1.5);
  assert.equal(matWidthIn(14), 1.5);
  assert.equal(matWidthIn(16), 2);
  assert.equal(matWidthIn(32), 2);
});
