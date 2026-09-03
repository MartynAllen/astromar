// Server-only. Delivers the contact form to the site owner's own inbox via
// Resend's REST API (plain fetch, no SDK — consistent with how this
// codebase already talks to Prodigi) rather than exposing any personal
// email address anywhere in the site's markup or client bundle. Both
// RESEND_API_KEY and CONTACT_TO_EMAIL are set by the site owner directly in
// Vercel/`.env.local`, the same way every other third-party credential in
// this codebase is — never hardcoded, never passed through Claude.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL;

export const contactFormConfigured = Boolean(RESEND_API_KEY && CONTACT_TO_EMAIL);

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
