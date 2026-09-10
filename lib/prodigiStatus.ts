// Pure helpers for reading a Prodigi order back — no I/O, no env, no
// imports, so they're unit-testable in isolation. The fetching side lives
// in lib/prodigi.ts.

export type ProdigiStage = "InProgress" | "Complete" | "Cancelled";

export interface ProdigiShipment {
  dispatchDate?: string | null;
  status?: string | null;
  carrier?: { name?: string | null; service?: string | null } | null;
  tracking?: { number?: string | null; url?: string | null } | null;
}

export interface ProdigiOrder {
  id: string;
  merchantReference?: string | null;
  status?: {
    stage?: ProdigiStage;
    issues?: { errorCode?: string; description?: string }[];
  } | null;
  charges?: { totalCost?: { amount?: string; currency?: string } | null }[] | null;
  shipments?: ProdigiShipment[] | null;
}

export type FulfilmentStatus = "in_production" | "shipped" | "complete" | "cancelled";

export interface DerivedFulfilment {
  status: FulfilmentStatus;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  hasIssues: boolean;
}

/** Pull whatever id we can from a Prodigi callback body to look the order
 * up authoritatively. `data` may be the order itself or wrap it in
 * `.order` (CloudEvents payloads vary). */
export function extractOrderRef(body: unknown): { id?: string; merchantReference?: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const data = (b.data ?? b) as Record<string, unknown>;
  const order = ((data.order ?? data) ?? {}) as Record<string, unknown>;
  const ref: { id?: string; merchantReference?: string } = {};
  if (typeof order.id === "string") ref.id = order.id;
  if (typeof order.merchantReference === "string") ref.merchantReference = order.merchantReference;
  return ref;
}

export function deriveFulfilment(order: ProdigiOrder): DerivedFulfilment {
  const stage = order.status?.stage;
  const hasIssues = (order.status?.issues?.length ?? 0) > 0;

  if (stage === "Cancelled") return { status: "cancelled", hasIssues };

  const shipped = (order.shipments ?? []).find(
    (s) => s?.status === "Shipped" || s?.dispatchDate || s?.tracking?.number,
  );
  if (shipped) {
    return {
      status: "shipped",
      hasIssues,
      carrier: shipped.carrier?.name ?? undefined,
      trackingNumber: shipped.tracking?.number ?? undefined,
      trackingUrl: shipped.tracking?.url ?? undefined,
    };
  }

  if (stage === "Complete") return { status: "complete", hasIssues };
  return { status: "in_production", hasIssues };
}

/** Prodigi's total charge to the merchant, in pence, or null if the order
 * doesn't carry finalised costs yet. `totalCost.amount` is tax-inclusive. */
export function sumProdigiChargesPence(order: ProdigiOrder): number | null {
  const charges = order.charges;
  if (!charges?.length) return null;
  let total = 0;
  let sawAmount = false;
  for (const charge of charges) {
    const amount = charge?.totalCost?.amount;
    if (typeof amount === "string" && amount.trim() !== "") {
      const n = Number(amount);
      if (Number.isFinite(n)) {
        total += n;
        sawAmount = true;
      }
    }
  }
  return sawAmount ? Math.round(total * 100) : null;
}
