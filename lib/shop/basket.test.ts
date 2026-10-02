import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_BASKET_LINES,
  MAX_QTY_HARD,
  addToBasket,
  basketCount,
  deserialiseBasket,
  parseBasketLines,
  removeLine,
  serialiseBasket,
  setLineQty,
} from "./basket";

test("addToBasket creates a line, then merges quantity into it", () => {
  let b = addToBasket([], "p1", "v1");
  b = addToBasket(b, "p1", "v1", 2);
  assert.deepEqual(b, [{ productId: "p1", variantKey: "v1", qty: 3 }]);
});

test("different variants of one product are separate lines", () => {
  let b = addToBasket([], "p1", "v1");
  b = addToBasket(b, "p1", "v2");
  assert.equal(b.length, 2);
  assert.equal(basketCount(b), 2);
});

test("addToBasket never exceeds the hard quantity ceiling", () => {
  const b = addToBasket([{ productId: "p1", variantKey: "v1", qty: MAX_QTY_HARD }], "p1", "v1", 5);
  assert.equal(b[0].qty, MAX_QTY_HARD);
});

test("addToBasket refuses a new line past the line limit but still merges existing ones", () => {
  let b = [] as ReturnType<typeof addToBasket>;
  for (let i = 0; i < MAX_BASKET_LINES; i++) b = addToBasket(b, `p${i}`, "v");
  assert.equal(b.length, MAX_BASKET_LINES);
  const blocked = addToBasket(b, "extra", "v");
  assert.equal(blocked.length, MAX_BASKET_LINES);
  const merged = addToBasket(b, "p0", "v");
  assert.equal(merged.find((l) => l.productId === "p0")?.qty, 2);
});

test("addToBasket ignores a non-positive or fractional quantity", () => {
  assert.deepEqual(addToBasket([], "p1", "v1", 0), []);
  assert.deepEqual(addToBasket([], "p1", "v1", 1.5), []);
});

test("setLineQty updates, and 0 removes the line", () => {
  const b = [{ productId: "p1", variantKey: "v1", qty: 2 }];
  assert.equal(setLineQty(b, "p1", "v1", 4)[0].qty, 4);
  assert.deepEqual(setLineQty(b, "p1", "v1", 0), []);
});

test("removeLine only removes the matching product+variant", () => {
  const b = [
    { productId: "p1", variantKey: "v1", qty: 1 },
    { productId: "p1", variantKey: "v2", qty: 1 },
  ];
  assert.deepEqual(removeLine(b, "p1", "v1"), [{ productId: "p1", variantKey: "v2", qty: 1 }]);
});

test("parseBasketLines accepts a valid basket and merges duplicates", () => {
  const parsed = parseBasketLines([
    { productId: "p1", variantKey: "v1", qty: 1 },
    { productId: "p1", variantKey: "v1", qty: 2 },
  ]);
  assert.deepEqual(parsed, [{ productId: "p1", variantKey: "v1", qty: 3 }]);
});

test("parseBasketLines rejects malformed input outright", () => {
  assert.equal(parseBasketLines("nope"), null);
  assert.equal(parseBasketLines({}), null);
  assert.equal(parseBasketLines([{ productId: "p1", variantKey: "v1" }]), null);
  assert.equal(parseBasketLines([{ productId: "p1", variantKey: "v1", qty: 0 }]), null);
  assert.equal(parseBasketLines([{ productId: "p1", variantKey: "v1", qty: 1.5 }]), null);
  assert.equal(parseBasketLines([{ productId: "p1", variantKey: "v1", qty: -1 }]), null);
  assert.equal(parseBasketLines([{ productId: "", variantKey: "v1", qty: 1 }]), null);
  assert.equal(parseBasketLines([{ productId: "x".repeat(65), variantKey: "v1", qty: 1 }]), null);
  assert.equal(parseBasketLines([{ productId: 1, variantKey: "v1", qty: 1 }]), null);
  assert.equal(parseBasketLines([null]), null);
});

test("parseBasketLines rejects merged quantities over the ceiling and too many lines", () => {
  assert.equal(
    parseBasketLines([
      { productId: "p1", variantKey: "v1", qty: 60 },
      { productId: "p1", variantKey: "v1", qty: 60 },
    ]),
    null,
  );
  const tooMany = Array.from({ length: MAX_BASKET_LINES + 1 }, (_, i) => ({
    productId: `p${i}`,
    variantKey: "v",
    qty: 1,
  }));
  assert.equal(parseBasketLines(tooMany), null);
});

test("serialise then deserialise round-trips", () => {
  const b = [
    { productId: "p1", variantKey: "v1", qty: 2 },
    { productId: "p2", variantKey: "v9", qty: 1 },
  ];
  assert.deepEqual(deserialiseBasket(serialiseBasket(b)), b);
});

test("corrupt or tampered storage degrades to an empty basket", () => {
  assert.deepEqual(deserialiseBasket(null), []);
  assert.deepEqual(deserialiseBasket(""), []);
  assert.deepEqual(deserialiseBasket("{not json"), []);
  assert.deepEqual(deserialiseBasket(JSON.stringify([{ productId: "p", qty: "lots" }])), []);
});
