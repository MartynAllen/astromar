/**
 * Geometry for a cross-braced Bahtinov mask: a solid vertical spine (x=0)
 * and horizontal divider (y=0) split the aperture into three grating zones
 * — Zone 1 (top, horizontal reference grating, mirrored left/right of the
 * spine), Zone 2 (bottom-left, angled) and Zone 3 (bottom-right, angled,
 * mirrored from Zone 2). Every slat's inner edge is bounded by whichever
 * structural member closes off its zone (spine and/or divider) and its
 * outer edge by the mounting wall, each clipped with a small overlap past
 * the member's own edge rather than an exact touch — so every slat is
 * guaranteed to fuse into solid structure at both ends by construction,
 * not by checking afterwards whether it happened to reach far enough. The
 * earlier design (three 120° wedges radiating from a point) let a slat's
 * inner end land in open space with nothing to connect to; that's the
 * defect this shape avoids structurally rather than patching around.
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
  spineWidthMm: number;
  dividerWidthMm: number;
}

export const DEFAULT_ADVANCED: Pick<
  BahtinovInputs,
  | "maskThicknessMm"
  | "slitsPerGroup"
  | "strutWidthPercent"
  | "offsetAngleDeg"
  | "fitClearanceMm"
  | "skirtDepthMm"
  | "spineWidthMm"
  | "dividerWidthMm"
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
  spineWidthMm: 5,
  dividerWidthMm: 5,
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
  spineWidthMm: [4, 6],
  dividerWidthMm: [4, 6],
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
  /** Where the wall's solid mesh actually starts filling — apertureRadius,
   *  always, so there's never a gap between the optical pattern and the
   *  wall even when wallInnerRadiusMm (the tube-fit surface) sits further out. */
  wallFillInnerRadiusMm: number;
  wallOuterRadiusMm: number;
  /** Vertical structural bar at x=0, reaching top and bottom rim. */
  spine: StrutRect;
  /** Horizontal structural bar at y=0, reaching left and right rim. */
  divider: StrutRect;
  /** The grating slats only — spine/divider are separate, always-solid fields. */
  struts: StrutRect[];
  focalRatio: number;
}

/** t-interval where d(fixed) + t*dir(theta) lies inside a circle of given radius, centered at origin. */
function circleInterval(d: number, radius: number): [number, number] {
  const disc = radius * radius - d * d;
  if (disc <= 0) return [Infinity, -Infinity];
  const bound = Math.sqrt(disc);
  return [-bound, bound];
}

/**
 * t-interval where the line d*perp(theta) + t*dir(theta) has its x or y
 * coordinate on the requested side of `boundary` — a straight structural
 * edge (the spine or the divider), not necessarily through the origin,
 * unlike the wedge boundaries the previous design clipped against.
 */
function axisHalfPlaneInterval(
  d: number,
  theta: number,
  axis: "x" | "y",
  boundary: number,
  keepBelow: boolean,
): [number, number] {
  // P(t).x = -d*sin(theta) + t*cos(theta); P(t).y = d*cos(theta) + t*sin(theta)
  const coeff = axis === "x" ? Math.cos(theta) : Math.sin(theta);
  const base = axis === "x" ? -d * Math.sin(theta) : d * Math.cos(theta);
  const EPS = 1e-9;
  if (Math.abs(coeff) < EPS) {
    const holds = keepBelow ? base <= boundary : base >= boundary;
    return holds ? [-Infinity, Infinity] : [Infinity, -Infinity];
  }
  const tBound = (boundary - base) / coeff;
  if (keepBelow) {
    return coeff > 0 ? [-Infinity, tBound] : [tBound, Infinity];
  }
  return coeff > 0 ? [tBound, Infinity] : [-Infinity, tBound];
}

function intersect3(a: [number, number], b: [number, number], c: [number, number]): [number, number] {
  return [Math.max(a[0], b[0], c[0]), Math.min(a[1], b[1], c[1])];
}

interface ZoneConfig {
  theta: number;
  xBoundary: number;
  xKeepBelow: boolean;
  yBoundary: number;
  yKeepBelow: boolean;
}

/** Clips a grating line (fixed d, angle theta) against a zone's circle + 2 straight edges. */
function clipZone(d: number, theta: number, radius: number, zone: ZoneConfig): [number, number] {
  return intersect3(
    intersect3(circleInterval(d, radius), axisHalfPlaneInterval(d, theta, "x", zone.xBoundary, zone.xKeepBelow), [
      -Infinity,
      Infinity,
    ]),
    axisHalfPlaneInterval(d, theta, "y", zone.yBoundary, zone.yKeepBelow),
    [-Infinity, Infinity],
  );
}

/**
 * A zone's usable d-range (perpendicular offset where some t makes the line
 * satisfy all 3 constraints) isn't a simple closed form once the grating
 * angle and the zone's straight edges aren't aligned — found numerically,
 * same reasoning as the wedge design this replaces: it's the same
 * clipZone test the real slat placement uses, so it can't drift out of
 * sync with it, and at mask scale the cost of a few hundred samples is
 * irrelevant.
 */
function findUsableDRange(theta: number, radius: number, zone: ZoneConfig, samples = 400): [number, number] | null {
  let dMin = Infinity;
  let dMax = -Infinity;
  for (let k = 0; k <= samples; k++) {
    const d = -radius + (2 * radius * k) / samples;
    const [tLo, tHi] = clipZone(d, theta, radius, zone);
    if (tLo < tHi && Number.isFinite(tLo) && Number.isFinite(tHi)) {
      dMin = Math.min(dMin, d);
      dMax = Math.max(dMax, d);
    }
  }
  return dMin < dMax ? [dMin, dMax] : null;
}

const DEG = Math.PI / 180;
// How far a slat is required to penetrate past a structural member's own
// face into its solid interior — a slat that merely touches the spine,
// divider, or wall at a single point is exactly the failure mode this
// design replaces; a real volumetric overlap is what actually fuses two
// independently-triangulated solids into one printable part.
const CONNECT_OVERLAP_MM = 2;

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
    spineWidthMm,
    dividerWidthMm,
  } = inputs;

  const apertureRadius = apertureMm / 2;
  // wallInnerRadius is the tube-fit surface — must track tube OD for the
  // mask to physically slide on, so it can genuinely exceed apertureRadius
  // (a Newtonian/SCT's tube is routinely wider than its clear aperture).
  // When it does, that gap between the optical pattern's edge and the
  // actual gripping surface was previously left as open air: the wall mesh
  // only filled from wallInnerRadius outward, and slats stopped at their
  // own clip radius short of it. wallFillInnerRadius removes that gap by
  // making the solid fill start at apertureRadius unconditionally, so
  // "clip every slat a little past apertureRadius" is *always* enough to
  // land inside solid material, with no separate case to get wrong.
  const wallInnerRadius = Math.max(apertureRadius, tubeOuterDiameterMm / 2 + fitClearanceMm);
  const wallOuterRadius = wallInnerRadius + rimWidthMm;
  const wallFillInnerRadius = Math.min(apertureRadius, wallInnerRadius);
  const strutClipRadius = apertureRadius + CONNECT_OVERLAP_MM;

  const spineHalf = spineWidthMm / 2;
  const dividerHalf = dividerWidthMm / 2;
  const spineOverlap = Math.min(CONNECT_OVERLAP_MM, spineHalf);
  const dividerOverlap = Math.min(CONNECT_OVERLAP_MM, dividerHalf);
  const barReach = strutClipRadius;

  const spine: StrutRect = {
    corners: [
      [-spineHalf, -barReach],
      [spineHalf, -barReach],
      [spineHalf, barReach],
      [-spineHalf, barReach],
    ],
  };
  const divider: StrutRect = {
    corners: [
      [-barReach, -dividerHalf],
      [barReach, -dividerHalf],
      [barReach, dividerHalf],
      [-barReach, dividerHalf],
    ],
  };

  const offsetRad = offsetAngleDeg * DEG;

  const zones: ZoneConfig[] = [
    // Zone 1, right half: horizontal reference grating, spine on the left, divider below.
    {
      theta: 0,
      xBoundary: spineHalf - spineOverlap,
      xKeepBelow: false,
      yBoundary: dividerHalf - dividerOverlap,
      yKeepBelow: false,
    },
    // Zone 1, left half: mirrored.
    {
      theta: 0,
      xBoundary: -(spineHalf - spineOverlap),
      xKeepBelow: true,
      yBoundary: dividerHalf - dividerOverlap,
      yKeepBelow: false,
    },
    // Zone 2, bottom-left: angled grating, spine on the right, divider above.
    {
      theta: offsetRad,
      xBoundary: -(spineHalf - spineOverlap),
      xKeepBelow: true,
      yBoundary: -(dividerHalf - dividerOverlap),
      yKeepBelow: true,
    },
    // Zone 3, bottom-right: mirrored.
    {
      theta: -offsetRad,
      xBoundary: spineHalf - spineOverlap,
      xKeepBelow: false,
      yBoundary: -(dividerHalf - dividerOverlap),
      yKeepBelow: true,
    },
  ];

  const struts: StrutRect[] = [];

  for (const zone of zones) {
    const { theta } = zone;
    const dir: [number, number] = [Math.cos(theta), Math.sin(theta)];
    const perp: [number, number] = [-Math.sin(theta), Math.cos(theta)];
    const toXY = (d: number, t: number): [number, number] => [
      d * perp[0] + t * dir[0],
      d * perp[1] + t * dir[1],
    ];

    const dRange = findUsableDRange(theta, strutClipRadius, zone);
    if (!dRange) continue;
    const [dMin, dMax] = dRange;
    const pitch = (dMax - dMin) / slitsPerGroup;
    const halfStrutWidth = (pitch * (strutWidthPercent / 100)) / 2;

    for (let i = 0; i < slitsPerGroup; i++) {
      const dCenter = dMin + pitch * (i + 0.5);
      const dInner = dCenter - halfStrutWidth;
      const dOuter = dCenter + halfStrutWidth;

      // Clip at both edges of the strut band, not just its centerline —
      // the circle constraint is nonlinear in d, so clipping only at
      // dCenter would let the outer edge's corners poke past whichever
      // boundary is curved. Using the tighter of the two edges keeps the
      // whole rectangle safely inside the true (non-rectangular) clipped
      // region, at the cost of a strut that's a hair shorter than
      // theoretically possible at one edge.
      const [tLo, tHi] = intersect3(
        clipZone(dInner, theta, strutClipRadius, zone),
        clipZone(dOuter, theta, strutClipRadius, zone),
        [-Infinity, Infinity],
      );

      if (!(tLo < tHi) || !Number.isFinite(tLo) || !Number.isFinite(tHi)) continue;

      // Every slat is now anchored to solid structure at both ends by
      // construction (see clipZone), but a slat can still come out too
      // short to be worth printing — a sliver right at a corner where two
      // constraints bind almost simultaneously. Drop those rather than
      // hand a slicer a fragile, near-zero-length fragment.
      const strutWidth = halfStrutWidth * 2;
      const minLength = Math.max(2 * strutWidth, 5);
      if (tHi - tLo < minLength) continue;

      struts.push({
        corners: [toXY(dInner, tLo), toXY(dOuter, tLo), toXY(dOuter, tHi), toXY(dInner, tHi)],
      });
    }
  }

  return {
    apertureRadiusMm: apertureRadius,
    wallInnerRadiusMm: wallInnerRadius,
    wallFillInnerRadiusMm: wallFillInnerRadius,
    wallOuterRadiusMm: wallOuterRadius,
    spine,
    divider,
    struts,
    focalRatio: focalLengthMm / apertureMm,
  };
}
