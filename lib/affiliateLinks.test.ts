import { test } from "node:test";
import assert from "node:assert/strict";
import { isAffiliateUrl, bodyHasAffiliateLink } from "./affiliateLinks";

test("isAffiliateUrl matches the Astromar Amazon associate tag only", () => {
  assert.equal(isAffiliateUrl("https://www.amazon.co.uk/dp/184907710X?tag=astromar-21"), true);
  assert.equal(isAffiliateUrl("https://www.amazon.co.uk/dp/184907710X"), false);
  assert.equal(isAffiliateUrl("https://example.com?tag=someone-else-21"), false);
  assert.equal(isAffiliateUrl(undefined), false);
});

test("bodyHasAffiliateLink finds a tag in a link mark's markDef href", () => {
  const body = [
    { _type: "block", children: [{ _type: "span", text: "buy one", marks: ["a1"] }], markDefs: [{ _key: "a1", _type: "link", href: "https://www.amazon.co.uk/dp/X?tag=astromar-21" }] },
  ];
  assert.equal(bodyHasAffiliateLink(body), true);
});

test("bodyHasAffiliateLink finds a tag deep inside a productTier block", () => {
  const body = [
    { _type: "productTier", tierTitle: "Under £20", products: [{ affiliateLink: { url: "https://amazon.co.uk/dp/X?tag=astromar-21" } }] },
  ];
  assert.equal(bodyHasAffiliateLink(body), true);
});

test("bodyHasAffiliateLink is false for a body with no affiliate links", () => {
  const body = [
    { _type: "block", children: [{ _type: "span", text: "plain prose" }] },
    { _type: "block", children: [{ _type: "span", text: "a link", marks: ["a1"] }], markDefs: [{ _key: "a1", _type: "link", href: "https://en.wikipedia.org/wiki/Polaris" }] },
  ];
  assert.equal(bodyHasAffiliateLink(body), false);
  assert.equal(bodyHasAffiliateLink(undefined), false);
});
