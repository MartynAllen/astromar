import { test } from "node:test";
import assert from "node:assert/strict";
import { cheapestPrintPriceGBP, printProductsForPhoto } from "./print";

const PRODUCTS = [
  { _id: "8x10", widthIn: 8, heightIn: 10, unframedPriceGBP: 1300 },
  { _id: "12x16", widthIn: 12, heightIn: 16, unframedPriceGBP: 1600 },
  { _id: "16x20", widthIn: 16, heightIn: 20, unframedPriceGBP: 2050 },
  { _id: "20x28", widthIn: 20, heightIn: 28, unframedPriceGBP: 2300 },
] as never;

test("cheapestPrintPriceGBP returns the lowest unframed price", () => {
  assert.equal(cheapestPrintPriceGBP(PRODUCTS), 1300);
});

test("cheapestPrintPriceGBP returns undefined for an empty catalog", () => {
  assert.equal(cheapestPrintPriceGBP([]), undefined);
});

test("printProductsForPhoto returns the full catalog when unset", () => {
  const photo = { maxPrintLongEdgeIn: undefined } as never;
  assert.equal(printProductsForPhoto(PRODUCTS, photo).length, 4);
});

test("printProductsForPhoto caps sizes to the photo's own resolution limit", () => {
  // e.g. the solar eclipse shot: 1080x1920 native, capped at 8x10 (long
  // edge 10) since anything bigger prints visibly soft.
  const photo = { maxPrintLongEdgeIn: 10 } as never;
  const allowed = printProductsForPhoto(PRODUCTS, photo);
  assert.deepEqual(
    allowed.map((p) => p._id),
    ["8x10"],
  );
});

test("printProductsForPhoto includes a size whose long edge exactly matches the cap", () => {
  const photo = { maxPrintLongEdgeIn: 16 } as never;
  const allowed = printProductsForPhoto(PRODUCTS, photo);
  assert.deepEqual(
    allowed.map((p) => p._id),
    ["8x10", "12x16"],
  );
});
