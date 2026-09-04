import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeBahtinovGeometry,
  validateBahtinovInputs,
  DEFAULT_ADVANCED,
  CONNECT_OVERLAP_MM,
  type BahtinovInputs,
  type StrutRect,
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

test("validateBahtinovInputs flags an out-of-range spine/divider width", () => {
  const errors = validateBahtinovInputs({ ...VALID_INPUTS, spineWidthMm: 10 });
  assert.ok(errors.spineWidthMm);
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

test("the spine is centered on x=0 and reaches past the wall's fill boundary", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const xs = geometry.spine.corners.map(([x]) => x);
  const ys = geometry.spine.corners.map(([, y]) => y);
  assert.ok(Math.min(...xs) < 0 && Math.max(...xs) > 0, "spine should straddle x=0");
  assert.ok(
    Math.abs(Math.max(...xs) - Math.min(...xs)) - VALID_INPUTS.spineWidthMm < 1e-9,
    "spine width should match spineWidthMm",
  );
  assert.ok(Math.max(...ys) > geometry.wallFillInnerRadiusMm, "spine should reach past the top inner rim fill");
  assert.ok(Math.min(...ys) < -geometry.wallFillInnerRadiusMm, "spine should reach past the bottom inner rim fill");
});

test("the divider is centered on y=0 and reaches past the wall's fill boundary", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const xs = geometry.divider.corners.map(([x]) => x);
  const ys = geometry.divider.corners.map(([, y]) => y);
  assert.ok(Math.min(...ys) < 0 && Math.max(...ys) > 0, "divider should straddle y=0");
  assert.ok(
    Math.abs(Math.max(...ys) - Math.min(...ys)) - VALID_INPUTS.dividerWidthMm < 1e-9,
    "divider height should match dividerWidthMm",
  );
  assert.ok(Math.max(...xs) > geometry.wallFillInnerRadiusMm, "divider should reach past the right inner rim fill");
  assert.ok(Math.min(...xs) < -geometry.wallFillInnerRadiusMm, "divider should reach past the left inner rim fill");
});

test("produces a substantial number of grating slats for typical inputs", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const max = 4 * VALID_INPUTS.slitsPerGroup; // 4 sub-zones: zone1-left, zone1-right, zone2, zone3
  assert.ok(geometry.struts.length > 0);
  assert.ok(geometry.struts.length <= max);
  assert.ok(geometry.struts.length >= max * 0.6, `expected most slats to survive, got ${geometry.struts.length}/${max}`);
});

test("slat count scales roughly with slitsPerGroup", () => {
  const fewer = computeBahtinovGeometry({ ...VALID_INPUTS, slitsPerGroup: 5 });
  const more = computeBahtinovGeometry({ ...VALID_INPUTS, slitsPerGroup: 15 });
  assert.ok(fewer.struts.length > 0);
  assert.ok(more.struts.length > fewer.struts.length);
});

test("every slat corner stays within the mounting wall's outer radius", () => {
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

function endTouchesStructure(
  corners: [number, number][],
  geometry: ReturnType<typeof computeBahtinovGeometry>,
  spineHalf: number,
  dividerHalf: number,
): boolean {
  return corners.some(([x, y]) => {
    const r = Math.sqrt(x * x + y * y);
    const touchesSpine = Math.abs(x) <= spineHalf + 1e-6;
    const touchesDivider = Math.abs(y) <= dividerHalf + 1e-6;
    const touchesWall = r >= geometry.apertureRadiusMm - 1e-6;
    return touchesSpine || touchesDivider || touchesWall;
  });
}

test("every slat is genuinely anchored to the spine, divider, or wall at both ends", () => {
  // This is the actual structural requirement the cross-brace design exists
  // for: a slat whose end sits in open space, touching none of the three
  // structural members, would print as a disconnected fragment exactly
  // like the wedge design's floating spokes.
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const spineHalf = VALID_INPUTS.spineWidthMm / 2;
  const dividerHalf = VALID_INPUTS.dividerWidthMm / 2;
  for (const strut of geometry.struts) {
    const endA = strut.corners.slice(0, 2) as [number, number][];
    const endB = strut.corners.slice(2, 4) as [number, number][];
    assert.ok(
      endTouchesStructure(endA, geometry, spineHalf, dividerHalf),
      `slat end A ${JSON.stringify(endA)} touches neither spine, divider, nor wall`,
    );
    assert.ok(
      endTouchesStructure(endB, geometry, spineHalf, dividerHalf),
      `slat end B ${JSON.stringify(endB)} touches neither spine, divider, nor wall`,
    );
  }
});

test("every slat corner near the spine or divider reaches a real, non-hairline overlap depth", () => {
  // Regression test for a real bug found via a live 3D viewer: "the cross
  // struts don't fully connect to the central bar." endTouchesStructure
  // above only checks a corner is *inside* the spine/divider footprint at
  // all (any depth > 0 passes) — too lenient to catch a corner that
  // technically overlaps but only by a hairline.
  //
  // The actual bug: dInner and dOuter used to be forced through a single
  // shared t cut (the tighter of the two edges' own constraints). Whenever
  // that shared constraint came from a *different* member than the one a
  // given corner was meant to embed into (e.g. one edge's own bound came
  // from the divider, dragging the spine-bound edge along to the same t),
  // that corner overshot past its own target depth — confirmed on the real
  // default geometry: corners meant to embed CONNECT_OVERLAP_MM (2mm) into
  // the spine landing as shallow as 0.27mm, thin enough to look, in a 3D
  // viewer, like the strut doesn't reach the bar at all. Each edge is now
  // clipped independently (see computeBahtinovGeometry), so every corner
  // whose nearest connection is the spine or divider should reach close to
  // the full intended depth.
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const spineHalf = VALID_INPUTS.spineWidthMm / 2;
  const dividerHalf = VALID_INPUTS.dividerWidthMm / 2;
  // A generous floor, not the exact 2mm target — some corners legitimately
  // connect to the wall instead (excluded below), and slat pitch/width can
  // still trim a corner's own reach a little short of the full overlap
  // without it being a hairline connection.
  const MIN_DEPTH_MM = 1;

  for (const strut of geometry.struts) {
    for (const [x, y] of strut.corners) {
      const r = Math.hypot(x, y);
      const touchesWall = r >= geometry.apertureRadiusMm - 1e-6;
      if (touchesWall) continue; // wall connections aren't this test's concern

      const spineDepth = spineHalf - Math.abs(x);
      const dividerDepth = dividerHalf - Math.abs(y);
      const bestDepth = Math.max(spineDepth, dividerDepth);
      // Only assert on corners that are meant to connect here at all —
      // an interior corner far from both bars isn't a connection point.
      if (bestDepth <= 0) continue;

      assert.ok(
        bestDepth >= MIN_DEPTH_MM,
        `corner (${x.toFixed(3)}, ${y.toFixed(3)}) only embeds ${bestDepth.toFixed(3)}mm into the spine/divider ` +
          `(expected at least ${MIN_DEPTH_MM}mm, target ${CONNECT_OVERLAP_MM}mm) — a hairline connection like this ` +
          "is exactly what looked like a disconnected strut in a real 3D viewer.",
      );
    }
  }
});

test("every slat is a non-degenerate quadrilateral", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  for (const strut of geometry.struts) {
    const [a, b, c, d] = strut.corners;
    const area =
      0.5 *
      Math.abs(
        a[0] * b[1] -
          b[0] * a[1] +
          (b[0] * c[1] - c[0] * b[1]) +
          (c[0] * d[1] - d[0] * c[1]) +
          (d[0] * a[1] - a[0] * d[1]),
      );
    assert.ok(area > 1e-9, "slat quadrilateral has ~zero area");
  }
});

test("no slat is shorter than the minimum printable length (max(2x width, 5mm))", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  for (const strut of geometry.struts) {
    const [a, b, , d] = strut.corners;
    const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const length = Math.hypot(d[0] - a[0], d[1] - a[1]);
    const minLength = Math.max(2 * width, 5);
    assert.ok(
      length >= minLength - 1e-6,
      `slat length ${length} is shorter than the minimum ${minLength} (width ${width})`,
    );
  }
});

function isRoughlyHorizontal(strut: StrutRect): boolean {
  const [a, , c] = strut.corners;
  return Math.abs(c[0] - a[0]) > Math.abs(c[1] - a[1]);
}

test("Zone 1 slats (above the divider, split by the spine) run close to horizontal", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const dividerHalf = VALID_INPUTS.dividerWidthMm / 2;
  const zone1 = geometry.struts.filter((s) => s.corners.every(([, y]) => y > dividerHalf - 1e-6));
  assert.ok(zone1.length > 0, "expected some slats above the divider");
  for (const strut of zone1) {
    assert.ok(isRoughlyHorizontal(strut));
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
  assert.equal(geometry.wallInnerRadiusMm, 200 / 2 + VALID_INPUTS.fitClearanceMm);
});

test("the wall's solid fill always starts at the aperture radius, never leaving a gap when tube OD is much wider than the aperture", () => {
  // This is the exact scenario (a Newtonian/SCT-style tube well wider than
  // its clear aperture) that used to leave a genuine ring of open air
  // between the optical pattern's edge and where the mounting wall's mesh
  // began — slats stopped at their own clip radius short of the wall,
  // regardless of how far past apertureRadius that clip radius reached.
  const inputs = { ...VALID_INPUTS, apertureMm: 60, tubeOuterDiameterMm: 200 };
  const geometry = computeBahtinovGeometry(inputs);
  assert.ok(
    geometry.wallInnerRadiusMm > geometry.apertureRadiusMm,
    "sanity check: this case should actually produce a tube-OD-driven gap in the old model",
  );
  assert.equal(geometry.wallFillInnerRadiusMm, geometry.apertureRadiusMm);
  // Every slat corner must land at or past the aperture radius (their own
  // clip radius), which by the assertion above is now solidly inside the
  // wall's continuous fill — never short of it.
  const EPS = 1e-6;
  for (const strut of geometry.struts) {
    const maxR = Math.max(...strut.corners.map(([x, y]) => Math.hypot(x, y)));
    assert.ok(maxR >= geometry.apertureRadiusMm - EPS, `slat's farthest point (${maxR}) falls short of the aperture radius`);
  }
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
});

test("handles a large offset angle without producing degenerate geometry", () => {
  const geometry = computeBahtinovGeometry({ ...VALID_INPUTS, offsetAngleDeg: 59 });
  assert.ok(geometry.struts.length > 0);
});

test("handles the minimum spine/divider width without producing degenerate geometry", () => {
  const geometry = computeBahtinovGeometry({ ...VALID_INPUTS, spineWidthMm: 4, dividerWidthMm: 4 });
  assert.ok(geometry.struts.length > 0);
});
