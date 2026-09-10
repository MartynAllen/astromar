// Astromar's Amazon Associates tag — the definitive marker that a link is
// an affiliate link, whether it's a productTier block or an inline link
// mark in an article body.
const ASSOCIATE_TAG = "astromar-21";

export function isAffiliateUrl(href: unknown): boolean {
  return typeof href === "string" && href.includes(`tag=${ASSOCIATE_TAG}`);
}

// Recursively scan a Portable Text body for any affiliate URL, so a page
// can decide whether to show the affiliate-disclosure banner without the
// editor having to remember to tick a box. Matches the tag in a link
// mark's markDef href, a productTier's affiliateLink.url, anywhere.
export function bodyHasAffiliateLink(body: unknown): boolean {
  if (isAffiliateUrl(body)) return true;
  if (Array.isArray(body)) return body.some(bodyHasAffiliateLink);
  if (body && typeof body === "object") {
    return Object.values(body).some(bodyHasAffiliateLink);
  }
  return false;
}
