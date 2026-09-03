/**
 * Extracts the real client IP from a request for rate-limiting purposes.
 *
 * `X-Forwarded-For` is a *client-appended* header: a proxy (Vercel's edge
 * network included) appends the connecting IP to whatever value the client
 * already sent, so the header reads `"<whatever the client put here>, <real
 * client IP>"`. The trustworthy value is therefore the LAST entry, not the
 * first — reading the first entry (an earlier bug in this codebase) lets
 * any client defeat rate limiting outright by sending a fresh random first
 * entry on every request.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim());
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  // Vercel also sets this directly — a reliable fallback if XFF is ever
  // absent or malformed.
  return request.headers.get("x-real-ip") || "unknown";
}
