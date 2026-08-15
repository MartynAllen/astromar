/**
 * Pure geometry for a classic 3-sector Bahtinov mask: the clear aperture is
 * divided into three 120° wedges (bisectors at 90°, 210°, 330° — the
 * familiar "peace sign" layout), each filled with a parallel-slit grating at
 * its own angle. Group 0 (top wedge) is the horizontal reference grating;
 * groups 1/2 (lower wedges) are mirrored at ±offsetAngleDeg — the spike
 * angle that actually matters optically is the slit-line angle, not which
 * wedge it sits in, so wedge placement and grating angle are independent.
 *
 * Everything here is 2D (mm, origin at mask center); lib/bahtinov/stl.ts
 * extrudes it into a printable solid.
 */

export interface BahtinovInputs {
  focalLengthMm: number;
  apertureMm: number;
  tubeOuterDiameterMm: number;
  rimWidthMm: number;
  maskThicknessMm: number;
  slitsPerGroup: number;
  strutWidthPercent: number;
  offsetAngleDeg: number;
  fitClearanceMm: number;
  skirtDepthMm: number;
}

export const DEFAULT_ADVANCED: Pick<
  BahtinovInputs,
  | "maskThicknessMm"
  | "slitsPerGroup"
  | "strutWidthPercent"
  | "offsetAngleDeg"
  | "fitClearanceMm"
  | "skirtDepthMm"
> = {
  maskThicknessMm: 3,
  slitsPerGroup: 9,
  strutWidthPercent: 50,
  offsetAngleDeg: 20,
  fitClearanceMm: 0.4,
  // How far the mounting wall extends below the grating plate as a plain
  // cylindrical skirt, like a lens cap — a flush 3mm-thick ring only
  // contacts the tube along that same 3mm band, nowhere near enough
  // surface area for a secure friction fit. 15mm gives it real grip.
  skirtDepthMm: 15,
};

// [min, max] physically-sane bounds per field, and the required-field list.
const RANGES: Record<keyof BahtinovInputs, [number, number]> = {
  focalLengthMm: [50, 5000],
  apertureMm: [10, 1000],
  tubeOuterDiameterMm: [10, 1000],
  rimWidthMm: [2, 50],
  maskThicknessMm: [1, 20],
  slitsPerGroup: [1, 50],
  strutWidthPercent: [5, 95],
  offsetAngleDeg: [1, 60],
  fitClearanceMm: [0, 5],
  skirtDepthMm: [5, 40],
};

export type ValidationErrors = Partial<Record<keyof BahtinovInputs, string>>;

export function validateBahtinovInputs(inputs: Partial<BahtinovInputs>): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const key of Object.keys(RANGES) as (keyof BahtinovInputs)[]) {
    const value = inputs[key];
    const [min, max] = RANGES[key];
    if (value === undefined || !Number.isFinite(value)) {
      errors[key] = "Required";
    } else if (value < min || value > max) {
      errors[key] = `Must be ${min}–${max}`;
    }
  }
  if (
    !errors.apertureMm &&
    !errors.tubeOuterDiameterMm &&
    inputs.apertureMm! > inputs.tubeOuterDiameterMm!
  ) {
    errors.apertureMm = "Can't exceed tube outer diameter";
  }
  return errors;
}

export interface StrutRect {
  /** 4 corners, mm, global XY (origin = mask center). Winding not guaranteed CCW/CW. */
  corners: [number, number][];
}

export interface BahtinovGeometry {
  apertureRadiusMm: number;
  wallInnerRadiusMm: number;
  wallOuterRadiusMm: number;
  struts: StrutRect[];
  focalRatio: number;
}

/** t-interval where the line d(fixed) + t*dir(theta) lies inside a circle of given radius, centered at origin. */
function circleInterval(d: number, radius: number): [number, number] {
  const disc = radius * radius - d * d;
  if (disc <= 0) return [Infinity, -Infinity];
  const bound = Math.sqrt(disc);
  return [-bound, bound];
}

/**
 * t-interval where the line satisfies sign*cross((cos phi, sin phi), P(t)) >= 0,
 * i.e. is on one side of the ray through the origin at angle phi. Used to
 * clip a grating line to one wedge boundary.
 */
function halfPlaneInterval(d: number, theta: number, phi: number, sign: 1 | -1): [number, number] {
  const delta = phi - theta;
  const k = sign * Math.sin(delta);
  const c = sign * d * Math.cos(delta);
  const EPS = 1e-9;
  if (Math.abs(k) < EPS) {
    return c >= 0 ? [-Infinity, Infinity] : [Infinity, -Infinity];
  }
  const bound = c / k;
  return k > 0 ? [-Infinity, bound] : [bound, Infinity];
}

function intersect3(a: [number, number], b: [number, number], c: [number, number]): [number, number] {
  return [Math.max(a[0], b[0], c[0]), Math.min(a[1], b[1], c[1])];
}

/**
 * A wedge's footprint on the d-axis (perpendicular offset) doesn't line up
 * neatly with [-R, R] in general — it depends on the angle between the
 * grating direction and the wedge's own boundary rays, which differs per
 * group. Rather than deriving that footprint in closed form (error-prone
 * for three different wedge/angle combinations), scan it numerically: this
 * is the same tLo<tHi test the real clipping uses, so it can't drift out of
 * sync with it, and at mask scale (mm, a few hundred samples) the cost is
 * irrelevant.
 */
function findUsableDRange(
  theta: number,
  phi1: number,
  phi2: number,
  radius: number,
  samples = 400,
): [number, number] | null {
  let dMin = Infinity;
  let dMax = -Infinity;
  for (let k = 0; k <= samples; k++) {
    const d = -radius + (2 * radius * k) / samples;
    const [tLo, tHi] = intersect3(
      circleInterval(d, radius),
      halfPlaneInterval(d, theta, phi1, 1),
      halfPlaneInterval(d, theta, phi2, -1),
    );
    if (tLo < tHi && Number.isFinite(tLo) && Number.isFinite(tHi)) {
      dMin = Math.min(dMin, d);
      dMax = Math.max(dMax, d);
    }
  }
  return dMin < dMax ? [dMin, dMax] : null;
}

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function computeBahtinovGeometry(inputs: BahtinovInputs): BahtinovGeometry {
  const {
    apertureMm,
    tubeOuterDiameterMm,
    rimWidthMm,
    fitClearanceMm,
    slitsPerGroup,
    strutWidthPercent,
    offsetAngleDeg,
    focalLengthMm,
  } = inputs;

  const apertureRadius = apertureMm / 2;
  const wallInnerRadius = Math.max(apertureRadius, tubeOuterDiameterMm / 2 + fitClearanceMm);
  const wallOuterRadius = wallInnerRadius + rimWidthMm;

  // Struts are clipped to this radius, not apertureRadius — they need to
  // genuinely penetrate into the wall's solid volume, not merely touch its
  // inner edge at a single point (zero-overlap "touching" meshes routinely
  // fail to fuse into one printable part in a slicer, especially when
  // wallInnerRadius > apertureRadius and there'd otherwise be an actual gap
  // of open air between the strut tips and the wall). Capped well inside
  // the wall's own thickness so it never pokes out the far side.
  const strutClipRadius = Math.min(wallInnerRadius + 2, wallInnerRadius + rimWidthMm * 0.5);

  const offsetRad = offsetAngleDeg * DEG;
  const groupLineAngles = [0, offsetRad, -offsetRad];
  const halfWedge = TAU / 6; // 60°
  const wedgeBisectors = [Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 + (2 * TAU) / 3];

  const struts: StrutRect[] = [];

  for (let g = 0; g < 3; g++) {
    const theta = groupLineAngles[g];
    const bisector = wedgeBisectors[g];
    const phi1 = bisector - halfWedge;
    const phi2 = bisector + halfWedge;
    const dir: [number, number] = [Math.cos(theta), Math.sin(theta)];
    const perp: [number, number] = [-Math.sin(theta), Math.cos(theta)];
    const toXY = (d: number, t: number): [number, number] => [
      d * perp[0] + t * dir[0],
      d * perp[1] + t * dir[1],
    ];

    const dRange = findUsableDRange(theta, phi1, phi2, apertureRadius);
    if (!dRange) continue;
    const [dMin, dMax] = dRange;
    const pitch = (dMax - dMin) / slitsPerGroup;
    const halfStrutWidth = (pitch * (strutWidthPercent / 100)) / 2;

    for (let i = 0; i < slitsPerGroup; i++) {
      const dCenter = dMin + pitch * (i + 0.5);
      const dInner = dCenter - halfStrutWidth;
      const dOuter = dCenter + halfStrutWidth;

      // Clip at both edges of the strut, not just its centerline, and keep
      // the tighter interval — the circle constraint is nonlinear in d, so
      // clipping only at dCenter let the outer edge's corners poke past the
      // aperture radius by up to halfStrutWidth. Using the more restrictive
      // of the two edges keeps the whole rectangle safely inside the true
      // (non-rectangular) clipped region, at the cost of a strut that's a
      // hair shorter than theoretically possible at one edge.
      const [tLo, tHi] = intersect3(
        intersect3(
          circleInterval(dInner, strutClipRadius),
          halfPlaneInterval(dInner, theta, phi1, 1),
          halfPlaneInterval(dInner, theta, phi2, -1),
        ),
        intersect3(
          circleInterval(dOuter, strutClipRadius),
          halfPlaneInterval(dOuter, theta, phi1, 1),
          halfPlaneInterval(dOuter, theta, phi2, -1),
        ),
        [-Infinity, Infinity],
      );

      if (!(tLo < tHi) || !Number.isFinite(tLo) || !Number.isFinite(tHi)) continue;

      const corners: [number, number][] = [
        toXY(dInner, tLo),
        toXY(dOuter, tLo),
        toXY(dOuter, tHi),
        toXY(dInner, tHi),
      ];

      // Near a wedge's angular edges, a strut's t-range is bounded by the
      // wedge boundary itself rather than the aperture circle — it can end
      // up as a short sliver entirely landlocked well inside the aperture,
      // nowhere near the wall no matter how far strutClipRadius extends the
      // circle constraint (that constraint was never the limiting one for
      // this strut). Extending the radius can't connect a strut whose real
      // limit is angular, not radial — so drop it instead of printing a
      // disconnected fragment. It's always one of the last 1-2 struts at a
      // wedge's tip, never a meaningful loss to the pattern.
      const maxCornerRadius = Math.max(...corners.map(([x, y]) => Math.hypot(x, y)));
      if (maxCornerRadius <= apertureRadius) continue;

      struts.push({ corners });
    }
  }

  return {
    apertureRadiusMm: apertureRadius,
    wallInnerRadiusMm: wallInnerRadius,
    wallOuterRadiusMm: wallOuterRadius,
    struts,
    focalRatio: focalLengthMm / apertureMm,
  };
}
