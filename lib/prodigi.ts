import { SITE_URL } from "@/lib/seo";
import type { ProdigiOrder } from "@/lib/prodigiStatus";

export type {
  ProdigiOrder,
  ProdigiStage,
  ProdigiShipment,
  FulfilmentStatus,
  DerivedFulfilment,
} from "@/lib/prodigiStatus";
export { extractOrderRef, deriveFulfilment, sumProdigiChargesPence } from "@/lib/prodigiStatus";

// Server-only. Plain fetch against Prodigi's Print API v4.0 — no SDK,
// consistent with how the rest of this codebase talks to third parties.
const PRODIGI_API_BASE_URL = process.env.PRODIGI_API_BASE_URL;
const PRODIGI_API_KEY = process.env.PRODIGI_API_KEY;

// A random string set by the site owner in Vercel/.env.local. It's embedded
// in the per-order callbackUrl we hand Prodigi, and the callback route
// rejects anything that doesn't present it — a cheap first gate, since
// Prodigi's callbacks (unlike Stripe's webhooks) carry no signature. The
// real trust comes from the callback re-fetching the order from this API
// rather than believing the POST body.
const PRODIGI_CALLBACK_TOKEN = process.env.PRODIGI_CALLBACK_TOKEN;

export const prodigiConfigured = Boolean(PRODIGI_API_BASE_URL && PRODIGI_API_KEY);

// The status-callback feature is only live once a token is set — without
// one, orders are placed with no callbackUrl and the callback route stays
// dark (503).
export const prodigiCallbackConfigured = Boolean(prodigiConfigured && PRODIGI_CALLBACK_TOKEN);

// Every order ships with the same generated thank-you card (Prodigi's
// branding.postcard). Prodigi's servers fetch this URL once per order, so
// it must always resolve to a real image with no auth gate — see the route
// for why it's generated rather than a static asset. £2.00/order, absorbed
// into the catalog's prices, not a checkout line item.
const THANK_YOU_CARD_URL = `${SITE_URL}/api/print-assets/thank-you-card`;

/** The per-order callback URL, or null if no token is configured (in which
 * case orders are placed without one and the callback route stays dark). */
export function prodigiCallbackUrl(): string | null {
  if (!PRODIGI_CALLBACK_TOKEN) return null;
  return `${SITE_URL}/api/prodigi-callback?token=${encodeURIComponent(PRODIGI_CALLBACK_TOKEN)}`;
}

export function callbackTokenValid(token: string | null): boolean {
  return Boolean(
    PRODIGI_CALLBACK_TOKEN && token && timingSafeEqual(token, PRODIGI_CALLBACK_TOKEN),
  );
}

// Constant-time compare so a token guess can't be narrowed by response
// timing. Length is intentionally not short-circuited before the loop.
function timingSafeEqual(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

interface ProdigiOrderResult {
  ok: true;
  orderId: string;
}
interface ProdigiOrderFailure {
  ok: false;
  error: string;
}

export async function placeProdigiOrder(params: {
  merchantReference: string;
  recipientName: string;
  email: string | null;
  phone: string | null;
  address: {
    line1: string;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country: string;
  };
  sku: string;
  imageUrl: string;
  frameColor: string;
  finish: string | null;
}): Promise<ProdigiOrderResult | ProdigiOrderFailure> {
  if (!PRODIGI_API_BASE_URL || !PRODIGI_API_KEY) {
    return { ok: false, error: "Prodigi not configured" };
  }

  const callbackUrl = prodigiCallbackUrl();

  try {
    const res = await fetch(`${PRODIGI_API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PRODIGI_API_KEY,
      },
      body: JSON.stringify({
        merchantReference: params.merchantReference,
        // Closes a real race in the webhook's idempotency guard: two
        // near-simultaneous deliveries for the same session would both read
        // "not yet created" and both place an order. Prodigi's own
        // idempotencyKey returns the *original* order (outcome
        // "alreadyExists", still 200) on a duplicate. session.id is used
        // rather than merchantReference because Prodigi's docs note
        // merchantReference isn't required to be unique per request.
        idempotencyKey: params.merchantReference,
        // Status-change callbacks (dispatch + tracking, downstream
        // cancellation). Omitted entirely when no token is configured.
        ...(callbackUrl ? { callbackUrl } : {}),
        shippingMethod: "Standard",
        branding: { postcard: { url: THANK_YOU_CARD_URL } },
        recipient: {
          name: params.recipientName,
          email: params.email ?? undefined,
          phoneNumber: params.phone ?? undefined,
          address: {
            line1: params.address.line1,
            line2: params.address.line2 ?? undefined,
            townOrCity: params.address.city ?? undefined,
            stateOrCounty: params.address.state ?? undefined,
            postalOrZipCode: params.address.postalCode ?? undefined,
            countryCode: params.address.country,
          },
        },
        items: [
          {
            sku: params.sku,
            copies: 1,
            sizing: "fillPrintArea",
            assets: [{ printArea: "default", url: params.imageUrl }],
            // Classic Framed Print (GLOBAL-CFPM-*) requires a frame colour
            // attribute; the C-type photo paper line (GLOBAL-PHO-*) takes a
            // finish attribute instead. Both confirmed against Prodigi's
            // Products API (see lib/printFrameColors.ts / lib/printFinish.ts).
            // The two SKU families never overlap, so at most one applies.
            ...(params.sku.includes("CFPM") ? { attributes: { color: params.frameColor } } : {}),
            ...(params.sku.includes("PHO") && params.finish
              ? { attributes: { finish: params.finish } }
              : {}),
          },
        ],
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: `Prodigi ${res.status}: ${JSON.stringify(data).slice(0, 300)}` };
    }
    const orderId = data?.order?.id;
    if (!orderId) {
      return {
        ok: false,
        error: `Prodigi order created but no id in response: ${JSON.stringify(data).slice(0, 300)}`,
      };
    }
    return { ok: true, orderId };
  } catch (err) {
    return { ok: false, error: `Prodigi request failed: ${String(err).slice(0, 300)}` };
  }
}

// --- Reading orders back (for the status callback) -------------------------

export async function getProdigiOrder(
  orderId: string,
): Promise<{ ok: true; order: ProdigiOrder } | { ok: false; error: string }> {
  if (!PRODIGI_API_BASE_URL || !PRODIGI_API_KEY) {
    return { ok: false, error: "Prodigi not configured" };
  }
  try {
    const res = await fetch(`${PRODIGI_API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
      headers: { "X-API-Key": PRODIGI_API_KEY },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.order?.id) {
      return { ok: false, error: `Prodigi ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
    }
    return { ok: true, order: data.order as ProdigiOrder };
  } catch (err) {
    return { ok: false, error: `Prodigi request failed: ${String(err).slice(0, 200)}` };
  }
}

