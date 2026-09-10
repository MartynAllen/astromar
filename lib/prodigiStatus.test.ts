import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractOrderRef,
  deriveFulfilment,
  sumProdigiChargesPence,
  type ProdigiOrder,
} from "./prodigiStatus";

test("extractOrderRef reads a bare order body", () => {
  assert.deepEqual(extractOrderRef({ id: "ord_1", merchantReference: "cs_test_1" }), {
    id: "ord_1",
    merchantReference: "cs_test_1",
  });
});

test("extractOrderRef reads a CloudEvents body with data as the order", () => {
  const body = { specversion: "1.0", type: "com.prodigi.order.status", data: { id: "ord_2", merchantReference: "cs_2" } };
  assert.deepEqual(extractOrderRef(body), { id: "ord_2", merchantReference: "cs_2" });
});

test("extractOrderRef reads a CloudEvents body with data.order", () => {
  const body = { data: { order: { id: "ord_3", merchantReference: "cs_3" } } };
  assert.deepEqual(extractOrderRef(body), { id: "ord_3", merchantReference: "cs_3" });
});

test("extractOrderRef returns empty for junk", () => {
  assert.deepEqual(extractOrderRef(null), {});
  assert.deepEqual(extractOrderRef({ data: {} }), {});
});

const baseOrder = (over: Partial<ProdigiOrder>): ProdigiOrder => ({
  id: "ord_x",
  merchantReference: "cs_x",
  status: { stage: "InProgress", issues: [] },
  shipments: [],
  charges: [],
  ...over,
});

test("deriveFulfilment: cancelled stage wins", () => {
  const d = deriveFulfilment(baseOrder({ status: { stage: "Cancelled", issues: [] } }));
  assert.equal(d.status, "cancelled");
});

test("deriveFulfilment: a shipped shipment yields tracking", () => {
  const d = deriveFulfilment(
    baseOrder({
      shipments: [
        {
          status: "Shipped",
          carrier: { name: "Royal Mail" },
          tracking: { number: "AB123", url: "https://track/AB123" },
        },
      ],
    }),
  );
  assert.equal(d.status, "shipped");
  assert.equal(d.carrier, "Royal Mail");
  assert.equal(d.trackingNumber, "AB123");
  assert.equal(d.trackingUrl, "https://track/AB123");
});

test("deriveFulfilment: in production before any shipment", () => {
  assert.equal(deriveFulfilment(baseOrder({})).status, "in_production");
});

test("deriveFulfilment: Complete with no shipment falls back to complete", () => {
  assert.equal(
    deriveFulfilment(baseOrder({ status: { stage: "Complete", issues: [] } })).status,
    "complete",
  );
});

test("deriveFulfilment: issues are flagged", () => {
  const d = deriveFulfilment(
    baseOrder({ status: { stage: "InProgress", issues: [{ description: "asset too small" }] } }),
  );
  assert.equal(d.hasIssues, true);
});

test("sumProdigiChargesPence totals tax-inclusive charge amounts", () => {
  const order = baseOrder({
    charges: [
      { totalCost: { amount: "13.92", currency: "GBP" } },
      { totalCost: { amount: "2.00", currency: "GBP" } },
    ],
  });
  assert.equal(sumProdigiChargesPence(order), 1592);
});

test("sumProdigiChargesPence returns null when charges aren't populated yet", () => {
  assert.equal(sumProdigiChargesPence(baseOrder({ charges: [] })), null);
  assert.equal(sumProdigiChargesPence(baseOrder({ charges: null })), null);
});
