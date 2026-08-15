import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeBahtinovGeometry,
  validateBahtinovInputs,
  DEFAULT_ADVANCED,
  type BahtinovInputs,
} from "./geometry";

const VALID_INPUTS: BahtinovInputs = {
  focalLengthMm: 900,
  apertureMm: 102,
  tubeOuterDiameterMm: 108,
  rimWidthMm: 6,
  ...DEFAULT_ADVANCED,
};

test("validateBahtinovInputs accepts a fully valid input set", () => {
  const errors = validateBahtinovInputs(VALID_INPUTS);
  assert.deepEqual(errors, {});
});

test("validateBahtinovInputs flags missing required fields", () => {
  const errors = validateBahtinovInputs({});
  assert.equal(errors.focalLengthMm, "Required");
  assert.equal(errors.apertureMm, "Required");
  assert.equal(errors.tubeOuterDiameterMm, "Required");
  assert.equal(errors.rimWidthMm, "Required");
});

test("validateBahtinovInputs flags out-of-range values", () => {
  const errors = validateBahtinovInputs({ ...VALID_INPUTS, focalLengthMm: 10 });
  assert.ok(errors.focalLengthMm);
});

test("validateBahtinovInputs rejects aperture larger than tube OD", () => {
  const errors = validateBahtinovInputs({
    ...VALID_INPUTS,
    apertureMm: 120,
    tubeOuterDiameterMm: 108,
  });
  assert.equal(errors.apertureMm, "Can't exceed tube outer diameter");
});

test("validateBahtinovInputs rejects non-finite values", () => {
  const errors = validateBahtinovInputs({ ...VALID_INPUTS, focalLengthMm: NaN });
  assert.equal(errors.focalLengthMm, "Required");
});

test("produces close to slitsPerGroup struts per group for typical inputs", () => {
  // Not exact: a strut whose t-range is bounded by a wedge's angular edge
  // rather than the aperture circle is dropped as a disconnected sliver
  // (see the "genuinely overlap" test below) — normally just the last one
  // or two per group, near each wedge's tip.
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const max = 3 * VALID_INPUTS.slitsPerGroup;
  assert.ok(geometry.struts.length <= max);
  assert.ok(geometry.struts.length >= max * 0.7, `expected most struts to survive, got ${geometry.struts.length}/${max}`);
});

test("strut count scales roughly with slitsPerGroup", () => {
  const fewer = computeBahtinovGeometry({ ...VALID_INPUTS, slitsPerGroup: 5 });
  const more = computeBahtinovGeometry({ ...VALID_INPUTS, slitsPerGroup: 15 });
  assert.ok(fewer.struts.length <= 15 && fewer.struts.length > 0);
  assert.ok(more.struts.length <= 45 && more.struts.length > fewer.struts.length);
});

test("every strut corner stays within the mounting wall's outer radius", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const EPS = 1e-6;
  for (const strut of geometry.struts) {
    for (const [x, y] of strut.corners) {
      const r = Math.sqrt(x * x + y * y);
      assert.ok(
        r <= geometry.wallOuterRadiusMm + EPS,
        `corner (${x}, ${y}) at radius ${r} pokes past the wall's outer radius ${geometry.wallOuterRadiusMm}`,
      );
    }
  }
});

test("struts genuinely overlap the mounting wall rather than merely touching it", () => {
  // A strut whose farthest corner stops exactly at (or short of) the
  // aperture radius would only touch the wall at a single point — not
  // enough for a slicer to fuse the two into one printable part. Every
  // strut's outermost reach must go past apertureRadius by a real margin.
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  for (const strut of geometry.struts) {
    const maxR = Math.max(...strut.corners.map(([x, y]) => Math.sqrt(x * x + y * y)));
    assert.ok(
      maxR > geometry.apertureRadiusMm + 0.5,
      `strut's farthest point (r=${maxR}) doesn't meaningfully overlap the wall (aperture radius ${geometry.apertureRadiusMm})`,
    );
  }
});

test("every strut is a non-degenerate quadrilateral", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  for (const strut of geometry.struts) {
    const [a, b, c, d] = strut.corners;
    // Shoelace formula — zero would mean the 4 corners are collinear/coincident.
    const area =
      0.5 *
      Math.abs(
        a[0] * b[1] -
          b[0] * a[1] +
          (b[0] * c[1] - c[0] * b[1]) +
          (c[0] * d[1] - d[0] * c[1]) +
          (d[0] * a[1] - a[0] * d[1]),
      );
    assert.ok(area > 1e-9, "strut quadrilateral has ~zero area");
  }
});

test("group 0 (reference grating) struts run close to horizontal", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const group0 = geometry.struts.slice(0, VALID_INPUTS.slitsPerGroup);
  for (const strut of group0) {
    const [a, , c] = strut.corners;
    // long axis of the strut (a -> c, opposite corners) should be far more
    // horizontal than vertical for a 0deg grating.
    const dx = Math.abs(c[0] - a[0]);
    const dy = Math.abs(c[1] - a[1]);
    assert.ok(dx > dy, `expected a roughly horizontal strut, got dx=${dx} dy=${dy}`);
  }
});

test("mounting wall spans from the aperture edge outward by the rim width", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  assert.ok(geometry.wallInnerRadiusMm >= geometry.apertureRadiusMm);
  assert.equal(geometry.wallOuterRadiusMm - geometry.wallInnerRadiusMm, VALID_INPUTS.rimWidthMm);
});

test("wall inner radius follows tube OD when tube OD dominates the aperture", () => {
  const geometry = computeBahtinovGeometry({
    ...VALID_INPUTS,
    apertureMm: 60,
    tubeOuterDiameterMm: 200,
  });
  assert.equal(
    geometry.wallInnerRadiusMm,
    200 / 2 + VALID_INPUTS.fitClearanceMm,
  );
});

test("wall inner radius follows aperture when aperture and tube OD are equal", () => {
  const geometry = computeBahtinovGeometry({
    ...VALID_INPUTS,
    apertureMm: 100,
    tubeOuterDiameterMm: 100,
  });
  assert.equal(geometry.wallInnerRadiusMm, 50 + VALID_INPUTS.fitClearanceMm);
});

test("focal ratio is focal length divided by aperture", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  assert.equal(geometry.focalRatio, 900 / 102);
});

test("handles a small offset angle without producing degenerate geometry", () => {
  const geometry = computeBahtinovGeometry({ ...VALID_INPUTS, offsetAngleDeg: 1 });
  assert.ok(geometry.struts.length > 0);
  assert.ok(geometry.struts.length <= 3 * VALID_INPUTS.slitsPerGroup);
});

test("handles a large offset angle without producing degenerate geometry", () => {
  const geometry = computeBahtinovGeometry({ ...VALID_INPUTS, offsetAngleDeg: 59 });
  assert.ok(geometry.struts.length > 0);
  assert.ok(geometry.struts.length <= 3 * VALID_INPUTS.slitsPerGroup);
});
