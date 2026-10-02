import { test } from "node:test";
import assert from "node:assert/strict";
import { processShopOrder, type ShopOrderDeps } from "./processShopOrder";

// Minimal Stripe-shaped fixtures — only the fields the flow reads.
function makePaymentIntent(metadata: Record<string, string> = {}) {
  return {
    id: "pi_123",
    metadata: {
      orderType: "shop",
      shopStatus: "pending",
      itemCount: "2",
      item1: "COAST-BLK-4~p-coaster~blk4~2",
      item2: "CLIP-STD~p-clip~std~1",
      ...metadata,
    },
  } as never;
}

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_123",
    livemode: true,
    amount_total: 2700,
    shipping_cost: { amount_total: 0 },
    customer_details: { email: "a@example.com", phone: null },
    collected_information: {
      shipping_details: {
        name: "A. Customer",
        address: { line1: "1 High St", line2: null, city: "Exeter", state: null, postal_code: "EX1 1AA", country: "GB" },
      },
    },
    ...overrides,
  } as never;
}

const PRODUCTS = [
  {
    _id: "p-coaster",
    fulfilment: "stocked" as const,
    variants: [{ _key: "blk4", label: "Black", sku: "COAST-BLK-4", pricePence: 1200, stock: 5 }],
  },
  {
    _id: "p-clip",
    fulfilment: "madeToOrder" as const,
    variants: [{ _key: "std", label: "Standard", sku: "CLIP-STD", pricePence: 300 }],
  },
];

// A fake that records the order things happened in.
function makeDeps(overrides: Partial<ShopOrderDeps> = {}) {
  const calls: string[] = [];
  const metadataWrites: Record<string, string>[] = [];
  const alerts: string[] = [];
  const stockApplied: unknown[] = [];
  const deps: ShopOrderDeps = {
    listLineItems: async () => [
      { description: "Coaster — Black", quantity: 2, amount_total: 2400 },
      { description: "Cable clip", quantity: 1, amount_total: 300 },
    ],
    updateMetadata: async (_id, metadata) => {
      calls.push("flag");
      metadataWrites.push(metadata);
    },
    emailConfigured: true,
    sendOrderEmail: async () => {
      calls.push("email");
      return { ok: true };
    },
    loadProducts: async () => PRODUCTS,
    applyStock: async (updates) => {
      calls.push("stock");
      stockApplied.push(updates);
      return { oversold: [] };
    },
    alert: async (m) => {
      calls.push("alert");
      alerts.push(m);
    },
    ...overrides,
  };
  return { deps, calls, metadataWrites, alerts, stockApplied };
}

test("happy path: email, then flag, then stock, then a generic alert", async () => {
  const { deps, calls, metadataWrites, stockApplied, alerts } = makeDeps();
  const result = await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.equal(result.status, 200);
  assert.deepEqual(calls.slice(0, 3), ["email", "flag", "stock"]);
  assert.equal(metadataWrites[0].shopOrderProcessed, "1");
  assert.equal(metadataWrites[0].shopStatus, "to-ship");
  // Only the stocked coaster is decremented — the made-to-order clip isn't.
  assert.deepEqual(stockApplied[0], [
    { productId: "p-coaster", variantKey: "blk4", sku: "COAST-BLK-4", qty: 2 },
  ]);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0], /details are in your email/);
});

test("alerts never carry the customer's address or email", async () => {
  const { deps, alerts } = makeDeps({
    applyStock: async () => ({ oversold: [{ sku: "COAST-BLK-4", remaining: -1 }] }),
  });
  await processShopOrder(makeSession(), makePaymentIntent(), deps);
  for (const a of alerts) {
    assert.doesNotMatch(a, /High St|EX1 1AA|a@example\.com|Customer/);
  }
});

test("an already-processed order is a silent no-op (Stripe retry): no email, no stock, no flag", async () => {
  const { deps, calls } = makeDeps();
  const result = await processShopOrder(
    makeSession(),
    makePaymentIntent({ shopOrderProcessed: "1" }),
    deps,
  );
  assert.equal(result.status, 200);
  assert.deepEqual(calls, []);
});

test("if the email fails, return 500 and do NOTHING else — a retry can resend, and stock isn't touched", async () => {
  const { deps, calls, alerts } = makeDeps({
    sendOrderEmail: async () => {
      calls.push("email");
      return { ok: false, error: "Resend 500" };
    },
  });
  const result = await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.equal(result.status, 500);
  assert.ok(!calls.includes("flag"), "flag must not be set before the email succeeds");
  assert.ok(!calls.includes("stock"), "stock must not be touched before the email succeeds");
  assert.match(alerts[0], /order email failed/);
});

test("retrying after a failed email can still complete the order exactly once", async () => {
  // First attempt: email fails. Second: succeeds. Stock must change once.
  let attempt = 0;
  const first = makeDeps({
    sendOrderEmail: async () => (++attempt === 1 ? { ok: false, error: "x" } : { ok: true }),
  });
  const pi = makePaymentIntent();
  assert.equal((await processShopOrder(makeSession(), pi, first.deps)).status, 500);
  assert.equal(first.stockApplied.length, 0);
  assert.equal((await processShopOrder(makeSession(), pi, first.deps)).status, 200);
  assert.equal(first.stockApplied.length, 1);
});

test("unconfigured order email falls back to the alert + Stripe, and still records and decrements", async () => {
  const { deps, calls, alerts } = makeDeps({ emailConfigured: false });
  const result = await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.equal(result.status, 200);
  assert.ok(!calls.includes("email"));
  assert.ok(calls.includes("flag") && calls.includes("stock"));
  assert.match(alerts[0], /order emails aren't configured/);
});

test("a stock write failure alerts but does not fail the webhook (the order is already recorded)", async () => {
  const { deps, alerts } = makeDeps({
    applyStock: async () => ({ oversold: [], error: "SANITY_API_TOKEN is not set in this environment" }),
  });
  const result = await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.equal(result.status, 200);
  assert.ok(alerts.some((a) => /stock was NOT reduced/.test(a)));
});

test("a throwing product lookup also only alerts", async () => {
  const { deps, alerts } = makeDeps({
    loadProducts: async () => {
      throw new Error("sanity down");
    },
  });
  const result = await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.equal(result.status, 200);
  assert.ok(alerts.some((a) => /couldn't update stock/.test(a)));
});

test("oversold variants raise an alert naming the SKU", async () => {
  const { deps, alerts } = makeDeps({
    applyStock: async () => ({ oversold: [{ sku: "COAST-BLK-4", remaining: -1 }] }),
  });
  await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.ok(alerts.some((a) => /Oversold: COAST-BLK-4 is now at -1/.test(a)));
});

test("items that no longer match a product are called out", async () => {
  const { deps, alerts } = makeDeps({ loadProducts: async () => [] });
  await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.ok(alerts.some((a) => /no longer match a product/.test(a)));
});

test("a missing shipping address fails loudly and records why", async () => {
  const { deps, metadataWrites, alerts, calls } = makeDeps();
  const result = await processShopOrder(
    makeSession({ collected_information: { shipping_details: null } }),
    makePaymentIntent(),
    deps,
  );
  assert.equal(result.status, 500);
  assert.equal(metadataWrites[0].shopStatus, "failed");
  assert.ok(!calls.includes("email"));
  assert.match(alerts[0], /couldn't be processed/);
});

test("an order with no recorded items fails loudly", async () => {
  const { deps } = makeDeps();
  const pi = {
    id: "pi_9",
    metadata: { orderType: "shop", shopStatus: "pending" },
  } as never;
  const result = await processShopOrder(makeSession(), pi, deps);
  assert.equal(result.status, 500);
});

test("the email carries the address and the pick list", async () => {
  let sent = { subject: "", text: "" };
  const { deps } = makeDeps({
    sendOrderEmail: async (m) => {
      sent = m;
      return { ok: true };
    },
  });
  await processShopOrder(makeSession(), makePaymentIntent(), deps);
  assert.match(sent.text, /1 High St/);
  assert.match(sent.text, /PICK LIST: COAST-BLK-4 × 2, CLIP-STD × 1/);
  assert.match(sent.subject, /£27\.00 \(3 items\)/);
});
