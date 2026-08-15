import type { BahtinovGeometry, BahtinovInputs } from "./geometry";

type Vec3 = [number, number, number];

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

export function buildMaskMesh(
  geometry: BahtinovGeometry,
  maskThicknessMm: number,
  skirtDepthMm: number,
): Triangle[] {
  const zLo = -maskThicknessMm / 2;
  const zHi = maskThicknessMm / 2;

  const triangles: Triangle[] = [];
  for (const strut of geometry.struts) {
    triangles.push(...extrudeQuad(strut.corners, zLo, zHi));
  }
  // The wall spans a taller Z range than the struts — same top surface
  // (zHi), but extended well below the plate as a plain cylindrical skirt
  // that slides over the tube, the way a lens cap or dew shield cap
  // actually grips: a flush ring flush with a 3mm plate has nowhere near
  // enough contact area to hold on by friction alone.
  triangles.push(
    ...buildWallTriangles(geometry.wallInnerRadiusMm, geometry.wallOuterRadiusMm, zLo - skirtDepthMm, zHi),
  );
  return triangles;
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
