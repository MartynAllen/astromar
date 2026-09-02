import { test } from "node:test";
import assert from "node:assert/strict";
import { isSafeHref } from "./safeUrl";

test("isSafeHref accepts ordinary http(s)/mailto/tel links", () => {
  assert.equal(isSafeHref("https://www.firstlightoptics.com/thing"), true);
  assert.equal(isSafeHref("http://example.com"), true);
  assert.equal(isSafeHref("mailto:hello@example.com"), true);
  assert.equal(isSafeHref("tel:+441234567890"), true);
});

test("isSafeHref accepts relative paths and in-page anchors", () => {
  assert.equal(isSafeHref("/gallery"), true);
  assert.equal(isSafeHref("/guide/your-first-telescope"), true);
  assert.equal(isSafeHref("#section"), true);
});

test("isSafeHref rejects script-executing schemes", () => {
  assert.equal(isSafeHref("javascript:alert(1)"), false);
  assert.equal(isSafeHref("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isSafeHref("vbscript:msgbox(1)"), false);
});

test("isSafeHref rejects missing or unparseable values", () => {
  assert.equal(isSafeHref(undefined), false);
  assert.equal(isSafeHref(null), false);
  assert.equal(isSafeHref(""), false);
  assert.equal(isSafeHref("not a url"), false);
});
