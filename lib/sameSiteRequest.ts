import { SITE_URL } from "@/lib/seo";

const SITE_ORIGIN = new URL(SITE_URL).origin;

/**
 * Rejects a cross-site POST before it reaches any real work. Both routes
 * this guards (checkout, contact) accept a plain JSON body with no custom
 * headers required, which means a cross-site `<form>` (or `fetch` with
 * `mode: "no-cors"`) can hit them without triggering a CORS preflight —
 * `Origin`/`Sec-Fetch-Site` are the only signal that catches that. Same-site
 * navigations and same-site fetches both send `Origin`; a same-origin
 * top-level form submission may omit it in some browsers but always sends
 * `Sec-Fetch-Site: same-origin`, so either passing is enough.
 */
export function isSameSiteRequest(request: Request): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "none") return true;

  const origin = request.headers.get("origin");
  if (origin) return origin === SITE_ORIGIN;

  // No Origin and no Sec-Fetch-Site (older browser, or a non-browser
  // client) — fall back to Referer rather than failing open.
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === SITE_ORIGIN;
    } catch {
      return false;
    }
  }

  return false;
}
