import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/getClientIp";
import { isSameSiteRequest } from "@/lib/sameSiteRequest";
import { createRateLimiter } from "@/lib/rateLimiter";
import { contactFormConfigured, sendContactEmail } from "@/lib/resend";

// Generous compared to checkout/geocode — a genuine visitor submits this
// once, maybe twice after fixing a typo. Still tight enough to blunt a
// scripted flood.
const { isRateLimited, pruneExpired } = createRateLimiter(60_000, 5);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends the site's contact form to the owner's own inbox via Resend —
// deliberately not a mailto: link or a visible email address anywhere in
// the markup (see Footer/Privacy — that was the whole point of building
// this rather than just publishing an address).
export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const { limited, retryAfterSeconds } = isRateLimited(ip);
  if (Math.random() < 0.01) pruneExpired();

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  if (!contactFormConfigured) {
    return NextResponse.json({ error: "Contact form is not configured yet" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, message, website } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
    website?: unknown; // honeypot — see below
  };

  // Honeypot: a hidden field real visitors never see or fill in. A bot that
  // fills every field in a scraped form submits this too — silently accept
  // and drop rather than send, no point tipping it off that it was caught.
  if (typeof website === "string" && website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    name.trim().length === 0 ||
    message.trim().length === 0 ||
    name.length > 200 ||
    email.length > 200 ||
    message.length > 5000 ||
    !EMAIL_RE.test(email.trim())
  ) {
    return NextResponse.json({ error: "Please fill in every field with a valid email" }, { status: 400 });
  }

  const result = await sendContactEmail({
    name: name.trim(),
    fromEmail: email.trim(),
    message: message.trim(),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
