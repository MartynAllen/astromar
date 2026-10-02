import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeOrderItems, encodeOrderItems } from "./orderMeta";

const ITEMS = [
  { sku: "COAST-BLK-4", productId: "q9XabcDEF123456789abcd", variantKey: "a1b2c3d4e5f6", qty: 2 },
  { sku: "CLIP-STD", productId: "r1YabcDEF123456789abcd", variantKey: "f6e5d4c3b2a1", qty: 10 },
];

test("encode then decode round-trips in order", () => {
  assert.deepEqual(decodeOrderItems(encodeOrderItems(ITEMS)), ITEMS);
});

test("each line gets its own metadata key", () => {
  const meta = encodeOrderItems(ITEMS);
  assert.deepEqual(Object.keys(meta), ["item1", "item2"]);
});

test("a full 10-line basket stays well inside Stripe's metadata limits", () => {
  const ten = Array.from({ length: 10 }, (_, i) => ({
    sku: `SKU-${String(i).padStart(2, "0")}-LONG-CODE`,
    productId: "q9XabcDEF123456789abcd",
    variantKey: "a1b2c3d4e5f6",
    qty: 99,
  }));
  const meta = encodeOrderItems(ten);
  assert.ok(Object.keys(meta).length <= 10);
  for (const value of Object.values(meta)) assert.ok(value.length < 500);
  assert.equal(decodeOrderItems(meta).length, 10);
});

test("decode sorts numerically, so item10 comes after item2", () => {
  const items = Array.from({ length: 10 }, (_, i) => ({
    sku: `S${i}`,
    productId: "p",
    variantKey: "v",
    qty: i + 1,
  }));
  const decoded = decodeOrderItems(encodeOrderItems(items));
  assert.deepEqual(
    decoded.map((d) => d.qty),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test("decode ignores unrelated metadata and malformed items", () => {
  const meta = {
    orderType: "shop",
    shopStatus: "pending",
    item1: "SKU~p~v~2",
    item2: "broken",
    item3: "SKU~p~v~zero",
    item4: "SKU~p~v~0",
    itemCount: "4",
  };
  assert.deepEqual(decodeOrderItems(meta), [{ sku: "SKU", productId: "p", variantKey: "v", qty: 2 }]);
});

test("decode of metadata with no items is empty", () => {
  assert.deepEqual(decodeOrderItems({ orderType: "shop" }), []);
});

test("encode refuses fields containing the separator rather than corrupting the ledger", () => {
  assert.throws(() => encodeOrderItems([{ sku: "A~B", productId: "p", variantKey: "v", qty: 1 }]));
  assert.throws(() => encodeOrderItems([{ sku: "", productId: "p", variantKey: "v", qty: 1 }]));
});
