import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDispatchWindow, priceBasket } from "./pricing";
import { decodeOrderItems } from "./orderMeta";
import {
  buildOrderMetadata,
  buildShippingMessage,
  buildShippingOption,
  buildStripeLineItems,
  lineItemName,
} from "./stripeSession";
import type { PricedProduct, ShopSettings } from "./types";

const SETTINGS: ShopSettings = {
  flatShippingPence: 350,
  freeShippingThresholdPence: 2500,
  dispatchMinDays: 1,
  dispatchMaxDays: 3,
  maxQtyPerLine: 10,
};

const PRODUCTS: PricedProduct[] = [
  {
    _id: "p-coaster",
    title: "Coaster",
    slug: { current: "coaster" },
    active: true,
    fulfilment: "stocked",
    variants: [
      { _key: "blk4", label: "Black, set of 4", sku: "COAST-BLK-4", pricePence: 1200, stock: 9 },
      { _key: "wht4", label: "White, set of 4", sku: "COAST-WHT-4", pricePence: 1200, stock: 9 },
    ],
  },
  {
    _id: "p-clip",
    title: "Cable clip",
    slug: { current: "clip" },
    active: true,
    fulfilment: "madeToOrder",
    leadTimeDays: 5,
    variants: [{ _key: "std", label: "Standard", sku: "CLIP-STD", pricePence: 300 }],
  },
];

const BASKET = [
  { productId: "p-coaster", variantKey: "blk4", qty: 2 },
  { productId: "p-clip", variantKey: "std", qty: 3 },
];

test("Stripe line items add up to the quote subtotal, plus postage equals the total", () => {
  const quote = priceBasket(BASKET, PRODUCTS, SETTINGS);
  const items = buildStripeLineItems(quote.lines, () => undefined);
  const itemsTotal = items.reduce(
    (sum, i) => sum + (i.price_data!.unit_amount as number) * (i.quantity as number),
    0,
  );
  assert.equal(itemsTotal, quote.subtotalPence);
  const shipping = buildShippingOption(quote).shipping_rate_data!.fixed_amount!.amount;
  assert.equal(itemsTotal + shipping, quote.totalPence);
});

test("line item names include the variant only when the product has several", () => {
  const quote = priceBasket(BASKET, PRODUCTS, SETTINGS);
  assert.equal(lineItemName(quote.lines[0]), "Coaster — Black, set of 4");
  assert.equal(lineItemName(quote.lines[1]), "Cable clip");
});

test("images are attached only when a URL exists", () => {
  const quote = priceBasket(BASKET, PRODUCTS, SETTINGS);
  const items = buildStripeLineItems(quote.lines, (l) =>
    l.productId === "p-coaster" ? "https://cdn.sanity.io/x.jpg" : undefined,
  );
  assert.deepEqual(items[0].price_data!.product_data!.images, ["https://cdn.sanity.io/x.jpg"]);
  assert.equal(items[1].price_data!.product_data!.images, undefined);
});

test("lines with issues are never sent to Stripe", () => {
  const quote = priceBasket(
    [...BASKET, { productId: "ghost", variantKey: "x", qty: 1 }],
    PRODUCTS,
    SETTINGS,
  );
  const items = buildStripeLineItems(quote.lines, () => undefined);
  assert.equal(items.length, 2);
});

test("shipping option is flat below the threshold and a zero-priced free option above it", () => {
  const flat = buildShippingOption({ shippingPence: 350, freeShipping: false }).shipping_rate_data!;
  assert.equal(flat.fixed_amount!.amount, 350);
  assert.equal(flat.display_name, "UK postage");
  const free = buildShippingOption({ shippingPence: 0, freeShipping: true }).shipping_rate_data!;
  assert.equal(free.fixed_amount!.amount, 0);
  assert.equal(free.display_name, "Free UK postage");
});

test("order metadata marks the order as shop and round-trips its items", () => {
  const quote = priceBasket(BASKET, PRODUCTS, SETTINGS);
  const meta = buildOrderMetadata(quote.lines);
  assert.equal(meta.orderType, "shop");
  assert.equal(meta.shopStatus, "pending");
  assert.equal(meta.itemCount, "2");
  assert.deepEqual(decodeOrderItems(meta), [
    { sku: "COAST-BLK-4", productId: "p-coaster", variantKey: "blk4", qty: 2 },
    { sku: "CLIP-STD", productId: "p-clip", variantKey: "std", qty: 3 },
  ]);
});

test("dispatch window wording", () => {
  assert.equal(formatDispatchWindow({ minDays: 1, maxDays: 3 }), "1–3 working days");
  assert.equal(formatDispatchWindow({ minDays: 5, maxDays: 5 }), "about 5 working days");
  assert.equal(formatDispatchWindow({ minDays: 1, maxDays: 1 }), "about 1 working day");
});

test("shipping message links the policy and omits dispatch when unknown", () => {
  const withEstimate = buildShippingMessage({ minDays: 1, maxDays: 3 }, "https://astromar.co.uk");
  assert.match(withEstimate, /1–3 working days/);
  assert.match(withEstimate, /\(https:\/\/astromar\.co\.uk\/shipping-returns\)/);
  assert.doesNotMatch(buildShippingMessage(undefined, "https://x.test"), /dispatched/);
});
