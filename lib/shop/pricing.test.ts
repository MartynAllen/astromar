import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchEstimate, priceBasket, shippingFor } from "./pricing";
import type { PricedProduct, ShopSettings } from "./types";

const SETTINGS: ShopSettings = {
  flatShippingPence: 350,
  freeShippingThresholdPence: 2500,
  dispatchMinDays: 1,
  dispatchMaxDays: 3,
  maxQtyPerLine: 10,
};

const COASTER: PricedProduct = {
  _id: "p-coaster",
  title: "Coaster",
  slug: { current: "coaster" },
  active: true,
  fulfilment: "stocked",
  variants: [
    { _key: "blk4", label: "Black, set of 4", sku: "COAST-BLK-4", pricePence: 1200, stock: 5 },
    { _key: "wht4", label: "White, set of 4", sku: "COAST-WHT-4", pricePence: 1200, stock: 0 },
  ],
};

const CLIP: PricedProduct = {
  _id: "p-clip",
  title: "Cable clip",
  slug: { current: "clip" },
  active: true,
  fulfilment: "madeToOrder",
  leadTimeDays: 5,
  variants: [{ _key: "std", label: "Standard", sku: "CLIP-STD", pricePence: 300 }],
};

const PRODUCTS = [COASTER, CLIP];

test("prices a simple basket and adds flat postage", () => {
  const q = priceBasket([{ productId: "p-clip", variantKey: "std", qty: 2 }], PRODUCTS, SETTINGS);
  assert.equal(q.subtotalPence, 600);
  assert.equal(q.shippingPence, 350);
  assert.equal(q.totalPence, 950);
  assert.equal(q.freeShipping, false);
  assert.equal(q.hasIssues, false);
  assert.equal(q.amountToFreeShippingPence, 1900);
});

test("postage is free at exactly the threshold, not one penny below", () => {
  assert.deepEqual(shippingFor(2500, SETTINGS), { shippingPence: 0, freeShipping: true });
  const below = shippingFor(2499, SETTINGS);
  assert.equal(below.shippingPence, 350);
  assert.equal(below.freeShipping, false);
  assert.equal(below.amountToFreeShippingPence, 1);
});

test("no threshold configured means postage is never free", () => {
  const s = { ...SETTINGS, freeShippingThresholdPence: undefined };
  const r = shippingFor(99999, s);
  assert.equal(r.shippingPence, 350);
  assert.equal(r.amountToFreeShippingPence, undefined);
});

test("empty basket has no postage", () => {
  const q = priceBasket([], PRODUCTS, SETTINGS);
  assert.equal(q.totalPence, 0);
  assert.equal(q.shippingPence, 0);
  assert.equal(q.dispatch, undefined);
});

test("a mixed basket crossing the threshold gets free postage", () => {
  const q = priceBasket(
    [
      { productId: "p-coaster", variantKey: "blk4", qty: 2 }, // 2400
      { productId: "p-clip", variantKey: "std", qty: 1 }, // 300
    ],
    PRODUCTS,
    SETTINGS,
  );
  assert.equal(q.subtotalPence, 2700);
  assert.equal(q.freeShipping, true);
  assert.equal(q.totalPence, 2700);
});

test("sold-out variant is an issue and excluded from totals", () => {
  const q = priceBasket(
    [
      { productId: "p-coaster", variantKey: "wht4", qty: 1 },
      { productId: "p-clip", variantKey: "std", qty: 1 },
    ],
    PRODUCTS,
    SETTINGS,
  );
  assert.equal(q.hasIssues, true);
  assert.equal(q.lines[0].issue?.code, "out_of_stock");
  assert.equal(q.subtotalPence, 300);
});

test("asking for more than the stock gives insufficient_stock with the real max", () => {
  const q = priceBasket([{ productId: "p-coaster", variantKey: "blk4", qty: 6 }], PRODUCTS, SETTINGS);
  assert.equal(q.lines[0].issue?.code, "insufficient_stock");
  assert.equal(q.lines[0].issue?.maxQty, 5);
  assert.equal(q.subtotalPence, 0);
});

test("per-line limit applies to made-to-order items", () => {
  const q = priceBasket([{ productId: "p-clip", variantKey: "std", qty: 11 }], PRODUCTS, SETTINGS);
  assert.equal(q.lines[0].issue?.code, "qty_limit");
  assert.equal(q.lines[0].issue?.maxQty, 10);
});

test("made-to-order items are never out of stock, whatever the stock field says", () => {
  const odd: PricedProduct = {
    ...CLIP,
    variants: [{ ...CLIP.variants[0], stock: 0 }],
  };
  const q = priceBasket([{ productId: "p-clip", variantKey: "std", qty: 1 }], [odd], SETTINGS);
  assert.equal(q.hasIssues, false);
});

test("inactive and missing products and variants are unavailable, not silently dropped", () => {
  const inactive = { ...CLIP, active: false };
  const q = priceBasket(
    [
      { productId: "p-clip", variantKey: "std", qty: 1 },
      { productId: "ghost", variantKey: "x", qty: 1 },
      { productId: "p-coaster", variantKey: "nope", qty: 1 },
    ],
    [inactive, COASTER],
    SETTINGS,
  );
  assert.equal(q.lines.length, 3);
  assert.equal(q.lines[0].issue?.code, "unavailable");
  assert.equal(q.lines[1].issue?.code, "unavailable");
  assert.equal(q.lines[2].issue?.code, "variant_missing");
  assert.equal(q.totalPence, 0);
});

test("stocked stock of undefined is treated as sold out", () => {
  const p: PricedProduct = {
    ...COASTER,
    variants: [{ _key: "k", label: "L", sku: "S", pricePence: 100 }],
  };
  const q = priceBasket([{ productId: "p-coaster", variantKey: "k", qty: 1 }], [p], SETTINGS);
  assert.equal(q.lines[0].issue?.code, "out_of_stock");
});

test("dispatch estimate is the slowest line's, across stocked and made-to-order", () => {
  const q = priceBasket(
    [
      { productId: "p-coaster", variantKey: "blk4", qty: 1 },
      { productId: "p-clip", variantKey: "std", qty: 1 },
    ],
    PRODUCTS,
    SETTINGS,
  );
  assert.deepEqual(q.dispatch, { minDays: 5, maxDays: 5 });
  const stockedOnly = priceBasket(
    [{ productId: "p-coaster", variantKey: "blk4", qty: 1 }],
    PRODUCTS,
    SETTINGS,
  );
  assert.deepEqual(stockedOnly.dispatch, { minDays: 1, maxDays: 3 });
});

test("dispatch estimate ignores lines with issues", () => {
  const q = priceBasket(
    [
      { productId: "p-coaster", variantKey: "blk4", qty: 1 },
      { productId: "p-clip", variantKey: "std", qty: 99 },
    ],
    PRODUCTS,
    SETTINGS,
  );
  assert.deepEqual(dispatchEstimate(q.lines, SETTINGS), { minDays: 1, maxDays: 3 });
});

test("made-to-order with no lead time falls back to a sensible default", () => {
  const noLead: PricedProduct = { ...CLIP, leadTimeDays: undefined };
  const q = priceBasket([{ productId: "p-clip", variantKey: "std", qty: 1 }], [noLead], SETTINGS);
  assert.deepEqual(q.dispatch, { minDays: 5, maxDays: 5 });
});

test("a single-variant product carries no variant label; a multi-variant one does", () => {
  const single = priceBasket([{ productId: "p-clip", variantKey: "std", qty: 1 }], PRODUCTS, SETTINGS);
  assert.equal(single.lines[0].variantLabel, undefined);
  const multi = priceBasket([{ productId: "p-coaster", variantKey: "blk4", qty: 1 }], PRODUCTS, SETTINGS);
  assert.equal(multi.lines[0].variantLabel, "Black, set of 4");
});

test("each valid line reports the quantity ceiling it could be raised to", () => {
  const q = priceBasket(
    [
      { productId: "p-coaster", variantKey: "blk4", qty: 1 }, // stock 5 < limit 10
      { productId: "p-clip", variantKey: "std", qty: 1 }, // made to order -> limit 10
    ],
    PRODUCTS,
    SETTINGS,
  );
  assert.equal(q.lines[0].maxQty, 5);
  assert.equal(q.lines[1].maxQty, 10);
});

test("a variant with a missing, zero or fractional price is unavailable, never charged", () => {
  for (const bad of [undefined, 0, -5, 12.5, Number.NaN]) {
    const p: PricedProduct = {
      ...CLIP,
      variants: [{ ...CLIP.variants[0], pricePence: bad as never }],
    };
    const q = priceBasket([{ productId: "p-clip", variantKey: "std", qty: 1 }], [p], SETTINGS);
    assert.equal(q.lines[0].issue?.code, "variant_missing", `price ${String(bad)}`);
    assert.equal(q.totalPence, 0);
  }
});
