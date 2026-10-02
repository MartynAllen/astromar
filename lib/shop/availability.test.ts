import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availabilityLabel,
  isPurchasable,
  priceRangePence,
  productAvailable,
  schemaAvailability,
  variantAvailability,
} from "./availability";

test("made-to-order is always available, whatever stock says", () => {
  assert.deepEqual(variantAvailability("madeToOrder", { stock: 0 }), { state: "madeToOrder" });
  assert.equal(isPurchasable("madeToOrder", { stock: undefined }), true);
});

test("stocked: zero or missing stock is sold out", () => {
  assert.deepEqual(variantAvailability("stocked", { stock: 0 }), { state: "soldOut" });
  assert.deepEqual(variantAvailability("stocked", {}), { state: "soldOut" });
  assert.deepEqual(variantAvailability("stocked", { stock: -2 }), { state: "soldOut" });
});

test("stocked: low-stock boundary is 3", () => {
  assert.deepEqual(variantAvailability("stocked", { stock: 3 }), { state: "lowStock", remaining: 3 });
  assert.deepEqual(variantAvailability("stocked", { stock: 1 }), { state: "lowStock", remaining: 1 });
  assert.deepEqual(variantAvailability("stocked", { stock: 4 }), { state: "inStock" });
});

test("a stocked product is available if any one variant has stock", () => {
  assert.equal(productAvailable({ fulfilment: "stocked", variants: [{ stock: 0 }, { stock: 2 }] }), true);
  assert.equal(productAvailable({ fulfilment: "stocked", variants: [{ stock: 0 }, {}] }), false);
});

test("priceRangePence spans the variants", () => {
  assert.deepEqual(priceRangePence([{ pricePence: 1200 }, { pricePence: 800 }, { pricePence: 2000 }]), {
    low: 800,
    high: 2000,
  });
  assert.deepEqual(priceRangePence([{ pricePence: 500 }]), { low: 500, high: 500 });
});

test("labels read naturally", () => {
  assert.equal(availabilityLabel("madeToOrder", {}, 5), "Made to order · about 5 days");
  assert.equal(availabilityLabel("madeToOrder", {}), "Made to order");
  assert.equal(availabilityLabel("stocked", { stock: 10 }), "In stock");
  assert.equal(availabilityLabel("stocked", { stock: 2 }), "Only 2 left");
  assert.equal(availabilityLabel("stocked", { stock: 0 }), "Sold out");
});

test("schema.org availability: stocked follows stock, made-to-order is orderable", () => {
  assert.equal(
    schemaAvailability({ fulfilment: "stocked", variants: [{ stock: 2 }] }),
    "https://schema.org/InStock",
  );
  assert.equal(
    schemaAvailability({ fulfilment: "stocked", variants: [{ stock: 0 }] }),
    "https://schema.org/OutOfStock",
  );
  assert.equal(
    schemaAvailability({ fulfilment: "madeToOrder", variants: [{}] }),
    "https://schema.org/InStock",
  );
});
