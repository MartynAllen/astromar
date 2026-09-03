import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPhaseFromValue } from "./moonPhase";

test("nextPhaseFromValue: exactly at full moon is 0 days to full", () => {
  const result = nextPhaseFromValue(0.5);
  assert.equal(result.target, "full");
  assert.ok(result.days < 0.01, `expected ~0 days, got ${result.days}`);
});

test("nextPhaseFromValue: exactly at new moon is 0 days to new", () => {
  const result = nextPhaseFromValue(0);
  assert.equal(result.target, "new");
  assert.ok(result.days < 0.01, `expected ~0 days, got ${result.days}`);
});

test("nextPhaseFromValue: just after new moon, full is next and further off than new would be next cycle", () => {
  // phase 0.25 (waxing, ~first quarter) — full is 0.25 of a cycle away,
  // new is 0.75 of a cycle away. Full should win.
  const result = nextPhaseFromValue(0.25);
  assert.equal(result.target, "full");
  assert.ok(Math.abs(result.days - 0.25 * 29.530588) < 0.01);
});

test("nextPhaseFromValue: just after full moon, new moon is next", () => {
  // phase 0.6 — new is 0.4 of a cycle away, full is 0.9 away (i.e. next cycle).
  const result = nextPhaseFromValue(0.6);
  assert.equal(result.target, "new");
  assert.ok(Math.abs(result.days - 0.4 * 29.530588) < 0.01);
});

test("nextPhaseFromValue: just before full moon, full wins by a hair over new", () => {
  const result = nextPhaseFromValue(0.49);
  assert.equal(result.target, "full");
  assert.ok(result.days < 1, `expected under a day, got ${result.days}`);
});
