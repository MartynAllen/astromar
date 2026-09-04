// polygon-clipping's own .d.ts declares named exports (union, intersection,
// ...) matching its CJS build, but the package's actual ESM build
// (dist/polygon-clipping.esm.js — what bundlers resolve for a client
// component like this one) only exports a single default object with
// those as properties: `export { index as default }`, no named exports at
// all. Turbopack correctly uses the real ESM file and fails on the named
// import ("Export union doesn't exist"); esModuleInterop's synthetic
// default (importing the whole declared module shape as `pc`) is what
// actually lines up with both the real runtime value and the .d.ts types.
import pc, { type Polygon as ClipPolygon } from "polygon-clipping";
import earcut, { flatten as earcutFlatten } from "earcut";
import type { BahtinovGeometry, BahtinovInputs } from "./geometry";

const { union } = pc;

type Vec3 = [number, number, number];
type Vec2 = [number, number];

export interface Triangle {
  a: Vec3;
  b: Vec3;
  c: Vec3;
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]);
  return len > 1e-12 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 1];
}

/**
 * Appends one triangle, flipping its winding if needed so the normal points
 * away from `solidCentroid` — this makes every face of a convex solid come
 * out with a correct outward normal regardless of what order its vertices
 * were supplied in, so the box/prism builders below don't need to reason
 * about winding by hand.
 */
function pushOutwardTriangle(list: Triangle[], a: Vec3, b: Vec3, c: Vec3, solidCentroid: Vec3) {
  const normal = cross(sub(b, a), sub(c, a));
  const triCentroid: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  const outward = sub(triCentroid, solidCentroid);
  const dot = normal[0] * outward[0] + normal[1] * outward[1] + normal[2] * outward[2];
  list.push(dot < 0 ? { a, b: c, c: b } : { a, b, c });
}

/**
 * Extrudes a flat quadrilateral (4 XY corners, any winding, must be convex —
 * true for every quad this module builds: rectangular struts and trapezoid
 * ring segments) into a solid prism between zLo and zHi. Used for both the
 * grating struts and the discretized mounting-wall ring, so there's no need
 * for a general polygon-with-holes triangulator anywhere in this tool.
 */
function extrudeQuad(corners: [number, number][], zLo: number, zHi: number): Triangle[] {
  const bottom: Vec3[] = corners.map(([x, y]) => [x, y, zLo]);
  const top: Vec3[] = corners.map(([x, y]) => [x, y, zHi]);
  const all = [...bottom, ...top];
  const centroid: Vec3 = all
    .reduce<Vec3>((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0])
    .map((n) => n / all.length) as Vec3;

  const triangles: Triangle[] = [];

  pushOutwardTriangle(triangles, bottom[0], bottom[1], bottom[2], centroid);
  pushOutwardTriangle(triangles, bottom[0], bottom[2], bottom[3], centroid);
  pushOutwardTriangle(triangles, top[0], top[1], top[2], centroid);
  pushOutwardTriangle(triangles, top[0], top[2], top[3], centroid);

  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    pushOutwardTriangle(triangles, bottom[i], bottom[j], top[j], centroid);
    pushOutwardTriangle(triangles, bottom[i], top[j], top[i], centroid);
  }

  return triangles;
}

export const WALL_SEGMENTS = 96;

/** Extrudes the mounting wall as a ring of quad prisms — see extrudeQuad. */
function buildWallTriangles(innerRadius: number, outerRadius: number, zLo: number, zHi: number): Triangle[] {
  const triangles: Triangle[] = [];
  for (let k = 0; k < WALL_SEGMENTS; k++) {
    const a0 = (k / WALL_SEGMENTS) * Math.PI * 2;
    const a1 = ((k + 1) / WALL_SEGMENTS) * Math.PI * 2;
    const corners: [number, number][] = [
      [innerRadius * Math.cos(a0), innerRadius * Math.sin(a0)],
      [outerRadius * Math.cos(a0), outerRadius * Math.sin(a0)],
      [outerRadius * Math.cos(a1), outerRadius * Math.sin(a1)],
      [innerRadius * Math.cos(a1), innerRadius * Math.sin(a1)],
    ];
    triangles.push(...extrudeQuad(corners, zLo, zHi));
  }
  return triangles;
}

/** A regular polygon approximating a circle, wound CCW (increasing angle) or
 * CW (`reverse`) — GeoJSON/polygon-clipping convention wants a hole ring
 * wound opposite to its containing outer ring. */
function circleRing(radius: number, segments: number, reverse = false): Vec2[] {
  const pts: Vec2[] = [];
  for (let k = 0; k < segments; k++) {
    const a = (k / segments) * Math.PI * 2 * (reverse ? -1 : 1);
    pts.push([radius * Math.cos(a), radius * Math.sin(a)]);
  }
  return pts;
}

/**
 * Unions a set of 2D footprints into one watertight solid and extrudes it
 * between zLo and zHi — this is what actually fixes the crossing-beam gaps
 * a real 3D viewer showed (see this function's call site in buildMaskMesh):
 * every strut, the spine, the divider, and the wall's own top-of-plate ring
 * all occupy the *same* Z range and are meant to fuse into one flat plate
 * with slit-shaped holes cut through it, not stay as separate,
 * independently-closed boxes that merely overlap in space. An earlier
 * attempt tried to fake this by skipping each shape's own end-cap faces
 * (reasoning that they're always embedded inside a neighbour's volume) —
 * that produced a *worse* mesh, confirmed with a real watertightness check
 * (trimesh): 272 open boundary edges, because deleting a face from an
 * independent, unconnected solid just leaves a hole in it rather than
 * actually joining it to its neighbour. A real 2D union (polygon-clipping)
 * plus a proper polygon-with-holes triangulation (earcut) is what actually
 * produces one connected, hole-free boundary.
 */
/**
 * polygon-clipping returns each ring GeoJSON-style: explicitly closed, its
 * last point a repeat of its first. Every consumer here (earcut, and the
 * side-wall loop below) instead assumes an *implicit* wraparound — feeding
 * a still-closed ring in produced a zero-length closing edge at every
 * single ring, which is both a degenerate triangle in its own right and
 * threw off edge-matching for real watertightness checks. Dropping the
 * duplicate last point is the fix.
 */
function openRing(ring: Vec2[]): Vec2[] {
  if (ring.length < 2) return ring;
  const [x0, y0] = ring[0];
  const [xLast, yLast] = ring[ring.length - 1];
  return Math.abs(x0 - xLast) < 1e-9 && Math.abs(y0 - yLast) < 1e-9 ? ring.slice(0, -1) : ring;
}

// Exported (only) so tests can union an arbitrary footprint set directly —
// e.g. without the wall ring, which polygon-clipping can't accept as a
// truly zero-width degenerate annulus (confirmed: it throws), making "just
// the plate shapes, no wall" otherwise impossible to construct through
// buildPlateTriangles's own fixed footprint list.
export function unionAndExtrude(footprints: Vec2[][][], zLo: number, zHi: number): Triangle[] {
  const [first, ...rest] = footprints;
  const merged = union(first as ClipPolygon, ...(rest as ClipPolygon[]));
  const triangles: Triangle[] = [];

  for (const polygon of merged) {
    const [outerRing, ...holeRings] = polygon.map(openRing);
    const allRings = [outerRing, ...holeRings];
    const flat = earcutFlatten(allRings);
    const indices = earcut(flat.vertices, flat.holes, flat.dimensions);

    const solidCentroid: Vec3 = [0, 0, (zLo + zHi) / 2];

    // Top and bottom faces share the same 2D triangulation, just at the
    // two different Z planes — pushOutwardTriangle sorts out which winding
    // each needs relative to the shared solid centroid, so there's no need
    // to reason about earcut's own triangle winding by hand.
    for (let i = 0; i < indices.length; i += 3) {
      const [ia, ib, ic] = [indices[i], indices[i + 1], indices[i + 2]];
      const p = (idx: number): Vec2 => [flat.vertices[idx * 2], flat.vertices[idx * 2 + 1]];
      const [ax, ay] = p(ia);
      const [bx, by] = p(ib);
      const [cx, cy] = p(ic);
      pushOutwardTriangle(triangles, [ax, ay, zLo], [bx, by, zLo], [cx, cy, zLo], solidCentroid);
      pushOutwardTriangle(triangles, [ax, ay, zHi], [bx, by, zHi], [cx, cy, zHi], solidCentroid);
    }

    // Side walls: every boundary ring (the outer silhouette, and every
    // hole — a hole is just as much a real boundary of the solid as the
    // outer edge is) gets its own vertical wall, one quad per ring edge.
    //
    // Deliberately NOT pushOutwardTriangle+solidCentroid here (unlike the
    // top/bottom faces above, where it's fine — see why below): a wall
    // segment's own outward direction is a genuine function of its XY
    // position, and a single global "inside" reference point isn't a
    // reliable stand-in for that once a ring can be a hole sitting
    // anywhere relative to the overall shape (verified the hard way: this
    // produced 208 non-manifold edges on a real geometry, mostly along the
    // wall-to-plate hole boundaries, before this fix). Top/bottom faces
    // don't have this problem — every one of their vertices shares the
    // same Z, so their raw cross-product normal is already purely
    // vertical regardless of XY position, making "which side of centroid.z"
    // the only real question, and that's reliable everywhere.
    //
    // The fix: polygon-clipping's rings are wound so solid material is
    // always to the left of the direction of travel — true for both a
    // CCW outer ring and a CW hole ring, by construction (the standard
    // GeoJSON convention). That means (P_bot, Q_bot, Q_top) and
    // (P_bot, Q_top, P_top), taken directly in the ring's own given
    // order, are already correctly outward-facing — no per-segment
    // orientation guess needed at all.
    for (const ring of allRings) {
      for (let i = 0; i < ring.length; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[(i + 1) % ring.length];
        triangles.push({ a: [x0, y0, zLo], b: [x1, y1, zLo], c: [x1, y1, zHi] });
        triangles.push({ a: [x0, y0, zLo], b: [x1, y1, zHi], c: [x0, y0, zHi] });
      }
    }
  }

  return triangles;
}

/**
 * The flat grating plate: struts, spine, divider, and the wall's own
 * top-of-plate annulus, unioned into one watertight solid — see
 * unionAndExtrude's doc comment for why this can't just be each shape
 * extruded independently. Exported separately from the skirt (rather than
 * folded directly into buildMaskMesh) so each half can be checked on its
 * own terms in tests instead of guessing where one ends and the other
 * begins inside a single concatenated triangle array — the plate's own
 * triangle count is a real triangulation result now, not a fixed count
 * per shape, so slicing a merged array by index no longer works.
 */
export function buildPlateTriangles(geometry: BahtinovGeometry, maskThicknessMm: number): Triangle[] {
  const zLo = -maskThicknessMm / 2;
  const zHi = maskThicknessMm / 2;
  const footprints: Vec2[][][] = [
    ...geometry.struts.map((s) => [s.corners as Vec2[]]),
    [geometry.spine.corners as Vec2[]],
    [geometry.divider.corners as Vec2[]],
    [
      circleRing(geometry.wallOuterRadiusMm, WALL_SEGMENTS),
      circleRing(geometry.wallFillInnerRadiusMm, WALL_SEGMENTS, true),
    ],
  ];
  return unionAndExtrude(footprints, zLo, zHi);
}

/**
 * The deep mounting collar below the plate — a separate Z range with
 * nothing else occupying it, so it's already one continuous ring on its
 * own and doesn't need the union treatment buildPlateTriangles needs. It
 * meets the plate's own wall-annulus portion exactly at their shared Z
 * boundary (zLo), which is a plain two-solids-touching-at-a-flat-shared-
 * footprint connection — not the crossing-at-odd-angles case the plate
 * has to solve — so it's safe for any slicer left exactly as is.
 */
export function buildSkirtTriangles(
  geometry: BahtinovGeometry,
  maskThicknessMm: number,
  skirtDepthMm: number,
): Triangle[] {
  const zLo = -maskThicknessMm / 2;
  return buildWallTriangles(geometry.wallFillInnerRadiusMm, geometry.wallOuterRadiusMm, zLo - skirtDepthMm, zLo);
}

export function buildMaskMesh(
  geometry: BahtinovGeometry,
  maskThicknessMm: number,
  skirtDepthMm: number,
): Triangle[] {
  return [
    ...buildPlateTriangles(geometry, maskThicknessMm),
    ...buildSkirtTriangles(geometry, maskThicknessMm, skirtDepthMm),
  ];
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error(`Non-finite coordinate in generated mesh: ${n}`);
  }
  // Avoid "-0" in output — cosmetic, but confusing in a hand-inspected file.
  const v = Object.is(n, -0) ? 0 : n;
  return v.toFixed(6);
}

export function serializeStlAscii(triangles: Triangle[], solidName: string): string {
  const safeName = solidName.replace(/[^a-zA-Z0-9_-]/g, "_") || "mask";
  const lines: string[] = [`solid ${safeName}`];

  for (const { a, b, c } of triangles) {
    const normal = normalize(cross(sub(b, a), sub(c, a)));
    lines.push(`facet normal ${fmt(normal[0])} ${fmt(normal[1])} ${fmt(normal[2])}`);
    lines.push("  outer loop");
    lines.push(`    vertex ${fmt(a[0])} ${fmt(a[1])} ${fmt(a[2])}`);
    lines.push(`    vertex ${fmt(b[0])} ${fmt(b[1])} ${fmt(b[2])}`);
    lines.push(`    vertex ${fmt(c[0])} ${fmt(c[1])} ${fmt(c[2])}`);
    lines.push("  endloop");
    lines.push("endfacet");
  }

  lines.push(`endsolid ${safeName}`);
  return lines.join("\n");
}

export function suggestedFilename(inputs: BahtinovInputs): string {
  const aperture = Math.round(inputs.apertureMm);
  const focal = Math.round(inputs.focalLengthMm);
  return `bahtinov-mask-${aperture}mm-f${focal}.stl`;
}
