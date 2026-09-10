// Server-only. Delivers the contact form to the site owner's own inbox via
// Resend's REST API (plain fetch, no SDK — consistent with how this
// codebase already talks to Prodigi) rather than exposing any personal
// email address anywhere in the site's markup or client bundle. Both
// RESEND_API_KEY and CONTACT_TO_EMAIL are set by the site owner directly in
// Vercel/`.env.local`, the same way every other third-party credential in
// this codebase is — never hardcoded, never passed through Claude.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL;
// Sending TO a customer (not just the owner's own inbox) needs a verified
// domain in Resend — the shared onboarding@resend.dev sender can only reach
// the account owner. Set this to e.g. "Astromar <prints@astromar.co.uk>"
// once astromar.co.uk is verified; leave it empty and the shipped-print
// email is simply skipped.
const ORDERS_FROM_EMAIL = process.env.ORDERS_FROM_EMAIL;

export const contactFormConfigured = Boolean(RESEND_API_KEY && CONTACT_TO_EMAIL);
export const printShippedEmailConfigured = Boolean(RESEND_API_KEY && ORDERS_FROM_EMAIL);

interface SendContactEmailParams {
  name: string;
  fromEmail: string;
  message: string;
}

export async function sendContactEmail({
  name,
  fromEmail,
  message,
}: SendContactEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    return { ok: false, error: "Contact form is not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Resend's own shared sending domain — works with zero DNS setup,
        // which is the point here: this only ever sends to the account
        // owner's own verified address (see CONTACT_TO_EMAIL), so a custom
        // verified sending domain buys nothing extra for this use case.
        from: "Astromar Contact Form <onboarding@resend.dev>",
        to: [CONTACT_TO_EMAIL],
        // A real visitor email as reply-to, not from — lets the owner hit
        // "reply" in their own inbox without the sending domain needing to
        // accept mail on the visitor's behalf.
        reply_to: fromEmail,
        subject: `New message from ${name} — Astromar contact form`,
        text: `From: ${name} <${fromEmail}>\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend send failed:", res.status, detail);
      return { ok: false, error: "Could not send message" };
    }

    return { ok: true };
  } catch (err) {
    console.error("Resend request failed:", err);
    return { ok: false, error: "Could not send message" };
  }
}

interface PrintShippedParams {
  to: string;
  /** The Stripe line-item description, e.g. "East Veil Nebula — 8×10". */
  itemDescription: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

// Sent once, from the Prodigi status callback, when an order ships —
// Prodigi's white-label fulfilment sends the customer nothing, and Stripe
// only sends a payment receipt, so without this the buyer hears nothing
// between paying and a parcel arriving.
export async function sendPrintShippedEmail(
  p: PrintShippedParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!RESEND_API_KEY || !ORDERS_FROM_EMAIL) {
    return { ok: false, error: "Shipped-print email is not configured" };
  }

  const trackingLine = p.trackingUrl
    ? `Track it here: ${p.trackingUrl}${p.carrier ? ` (${p.carrier})` : ""}`
    : p.trackingNumber
      ? `Tracking number: ${p.trackingNumber}${p.carrier ? ` (${p.carrier})` : ""}`
      : p.carrier
        ? `Shipped with ${p.carrier}.`
        : "";

  const text = [
    "Good news — your Astromar print has been dispatched.",
    "",
    p.itemDescription,
    trackingLine,
    "",
    "Every print is made to order, so thanks for your patience. If anything isn't right when it arrives, just reply to this email.",
    "",
    "— Martyn, Astromar",
    "https://astromar.co.uk",
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ORDERS_FROM_EMAIL,
        to: [p.to],
        // Replies land in the owner's own inbox (the contact address) when
        // there is one, so a customer can flag a problem by just replying.
        ...(CONTACT_TO_EMAIL ? { reply_to: CONTACT_TO_EMAIL } : {}),
        subject: "Your Astromar print is on its way",
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend shipped-print send failed:", res.status, detail);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend shipped-print request failed:", err);
    return { ok: false, error: "Request failed" };
  }
}
