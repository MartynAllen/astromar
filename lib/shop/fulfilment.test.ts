import { test } from "node:test";
import assert from "node:assert/strict";
import { findOversold, isSafeKey, planStockUpdates } from "./stockPlan";
import { renderShopOrderEmail, stripePaymentUrl } from "./orderEmail";

const PRODUCTS = [
  {
    _id: "p-coaster",
    fulfilment: "stocked" as const,
    variants: [
      { _key: "blk4", label: "Black", sku: "COAST-BLK-4", pricePence: 1200, stock: 5 },
      { _key: "wht4", label: "White", sku: "COAST-WHT-4", pricePence: 1200, stock: 1 },
    ],
  },
  {
    _id: "p-clip",
    fulfilment: "madeToOrder" as const,
    variants: [{ _key: "std", label: "Standard", sku: "CLIP-STD", pricePence: 300 }],
  },
];

test("only stocked variants are decremented; made-to-order is ignored", () => {
  const { updates, unmatched } = planStockUpdates(
    [
      { sku: "COAST-BLK-4", productId: "p-coaster", variantKey: "blk4", qty: 2 },
      { sku: "CLIP-STD", productId: "p-clip", variantKey: "std", qty: 3 },
    ],
    PRODUCTS,
  );
  assert.deepEqual(updates, [
    { productId: "p-coaster", variantKey: "blk4", sku: "COAST-BLK-4", qty: 2 },
  ]);
  assert.deepEqual(unmatched, []);
});

test("items whose product or variant has vanished are reported, not silently dropped", () => {
  const { updates, unmatched } = planStockUpdates(
    [
      { sku: "GONE", productId: "ghost", variantKey: "x", qty: 1 },
      { sku: "COAST-OLD", productId: "p-coaster", variantKey: "old", qty: 1 },
    ],
    PRODUCTS,
  );
  assert.equal(updates.length, 0);
  assert.equal(unmatched.length, 2);
});

test("duplicate lines for one variant merge into a single decrement", () => {
  const { updates } = planStockUpdates(
    [
      { sku: "COAST-BLK-4", productId: "p-coaster", variantKey: "blk4", qty: 1 },
      { sku: "COAST-BLK-4", productId: "p-coaster", variantKey: "blk4", qty: 2 },
    ],
    PRODUCTS,
  );
  assert.deepEqual(updates.map((u) => u.qty), [3]);
});

test("unsafe variant keys never reach a patch path", () => {
  assert.equal(isSafeKey('abc"] || true'), false);
  assert.equal(isSafeKey("a1b2-c3_D4"), true);
  const { updates, unmatched } = planStockUpdates(
    [{ sku: "X", productId: "p-coaster", variantKey: 'blk4"]', qty: 1 }],
    [
      {
        _id: "p-coaster",
        fulfilment: "stocked",
        variants: [{ _key: 'blk4"]', label: "L", sku: "X", pricePence: 1, stock: 1 }],
      },
    ],
  );
  assert.equal(updates.length, 0);
  assert.equal(unmatched.length, 1);
});

test("oversold detection flags only variants that ended below zero", () => {
  const updates = [
    { productId: "p-coaster", variantKey: "blk4", sku: "COAST-BLK-4", qty: 2 },
    { productId: "p-coaster", variantKey: "wht4", sku: "COAST-WHT-4", qty: 2 },
  ];
  const after = [
    {
      _id: "p-coaster",
      variants: [
        { _key: "blk4", stock: 3 },
        { _key: "wht4", stock: -1 },
      ],
    },
  ];
  assert.deepEqual(findOversold(updates, after), [{ sku: "COAST-WHT-4", remaining: -1 }]);
});

test("landing exactly on zero is not oversold", () => {
  const updates = [{ productId: "p", variantKey: "v", sku: "S", qty: 1 }];
  assert.deepEqual(findOversold(updates, [{ _id: "p", variants: [{ _key: "v", stock: 0 }] }]), []);
});

const EMAIL_INPUT = {
  paymentIntentId: "pi_123",
  livemode: true,
  lines: [
    { description: "Coaster — Black, set of 4", quantity: 2, amountPence: 2400 },
    { description: "Cable clip", quantity: 1, amountPence: 300 },
  ],
  items: [
    { sku: "COAST-BLK-4", productId: "p1", variantKey: "k1", qty: 2 },
    { sku: "CLIP-STD", productId: "p2", variantKey: "k2", qty: 1 },
  ],
  postagePence: 0,
  totalPence: 2700,
  customer: {
    name: "A. Customer",
    email: "a@example.com",
    phone: null,
    address: { line1: "1 High St", line2: null, city: "Exeter", state: null, postalCode: "EX1 1AA", country: "GB" },
  },
};

test("order email lists items, pick list, address and a Stripe link", () => {
  const { subject, text } = renderShopOrderEmail(EMAIL_INPUT);
  assert.equal(subject, "New Astromar shop order — £27.00 (3 items)");
  assert.match(text, /2 × Coaster — Black, set of 4 — £24\.00/);
  assert.match(text, /Postage — free/);
  assert.match(text, /PICK LIST: COAST-BLK-4 × 2, CLIP-STD × 1/);
  assert.match(text, /1 High St\n {2}Exeter\n {2}EX1 1AA\n {2}GB/);
  assert.match(text, /https:\/\/dashboard\.stripe\.com\/payments\/pi_123/);
  assert.doesNotMatch(text, /Phone:/);
});

test("test-mode orders are clearly labelled and link the test dashboard", () => {
  const { subject, text } = renderShopOrderEmail({ ...EMAIL_INPUT, livemode: false });
  assert.match(subject, /\[TEST\]$/);
  assert.match(text, /TEST-MODE order/);
  assert.equal(stripePaymentUrl("pi_9", false), "https://dashboard.stripe.com/test/payments/pi_9");
});

test("a single item is singular in the subject", () => {
  const { subject } = renderShopOrderEmail({
    ...EMAIL_INPUT,
    items: [{ sku: "A", productId: "p", variantKey: "k", qty: 1 }],
  });
  assert.match(subject, /\(1 item\)/);
});
