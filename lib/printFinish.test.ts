import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidPrintFinish, printFinishLabel } from "./printFinish";

test("isValidPrintFinish accepts exactly matte, gloss and lustre", () => {
  assert.equal(isValidPrintFinish("matte"), true);
  assert.equal(isValidPrintFinish("gloss"), true);
  assert.equal(isValidPrintFinish("lustre"), true);
});

test("isValidPrintFinish rejects anything else, including untrusted input shapes", () => {
  assert.equal(isValidPrintFinish("glossy"), false);
  assert.equal(isValidPrintFinish(""), false);
  assert.equal(isValidPrintFinish(undefined), false);
  assert.equal(isValidPrintFinish(null), false);
  assert.equal(isValidPrintFinish(3), false);
});

test("printFinishLabel returns the real Prodigi-facing option's display label", () => {
  assert.equal(printFinishLabel("gloss"), "Gloss");
  assert.equal(printFinishLabel("lustre"), "Lustre");
});
