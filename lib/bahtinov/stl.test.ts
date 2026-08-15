import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBahtinovGeometry, DEFAULT_ADVANCED, type BahtinovInputs } from "./geometry";
import { buildMaskMesh, serializeStlAscii, suggestedFilename, WALL_SEGMENTS, type Triangle } from "./stl";

const VALID_INPUTS: BahtinovInputs = {
  focalLengthMm: 900,
  apertureMm: 102,
  tubeOuterDiameterMm: 108,
  rimWidthMm: 6,
  ...DEFAULT_ADVANCED,
};

function triangleNormal(t: Triangle): [number, number, number] {
  const [ax, ay, az] = t.a;
  const [bx, by, bz] = t.b;
  const [cx, cy, cz] = t.c;
  const ux = bx - ax, uy = by - ay, uz = bz - az;
  const vx = cx - ax, vy = cy - ay, vz = cz - az;
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

test("triangle count matches (struts + spine + divider)*12 plus the wall ring's 12-per-segment", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const mesh = buildMaskMesh(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  const expected = (geometry.struts.length + 2) * 12 + WALL_SEGMENTS * 12;
  assert.equal(mesh.length, expected);
});

test("every triangle has a non-degenerate normal", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const mesh = buildMaskMesh(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  for (const tri of mesh) {
    const [nx, ny, nz] = triangleNormal(tri);
    const mag = Math.hypot(nx, ny, nz);
    assert.ok(mag > 1e-9, "triangle normal is ~zero (degenerate/collinear vertices)");
  }
});

test("a single axis-aligned strut extrudes with correct outward face normals", () => {
  const syntheticGeometry = {
    apertureRadiusMm: 10,
    wallInnerRadiusMm: 10,
    wallFillInnerRadiusMm: 10,
    wallOuterRadiusMm: 11,
    focalRatio: 5,
    spine: {
      corners: [
        [-0.5, -10],
        [0.5, -10],
        [0.5, 10],
        [-0.5, 10],
      ] as [number, number][],
    },
    divider: {
      corners: [
        [-10, -0.5],
        [10, -0.5],
        [10, 0.5],
        [-10, 0.5],
      ] as [number, number][],
    },
    struts: [
      {
        corners: [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ] as [number, number][],
      },
    ],
  };
  const mesh = buildMaskMesh(syntheticGeometry, 2, 5); // zLo=-1, zHi=1
  const strutTriangles = mesh.slice(0, 12);

  let topCount = 0;
  let bottomCount = 0;
  let sideCount = 0;

  for (const tri of strutTriangles) {
    const [nx, ny, nz] = triangleNormal(tri);
    const mag = Math.hypot(nx, ny, nz);
    const uz = nz / mag;
    if (uz > 0.99) topCount++;
    else if (uz < -0.99) bottomCount++;
    else if (Math.abs(uz) < 0.01) sideCount++;
  }

  assert.equal(topCount, 2, "expected 2 triangles with +Z normal (top face)");
  assert.equal(bottomCount, 2, "expected 2 triangles with -Z normal (bottom face)");
  assert.equal(sideCount, 8, "expected 8 triangles with horizontal normals (4 side faces)");
});

test("the mounting wall's skirt extends well below the grating plate", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const mesh = buildMaskMesh(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  const plateShapeCount = geometry.struts.length + 2; // + spine + divider
  const wallMesh = mesh.slice(plateShapeCount * 12);
  const plateZLo = -VALID_INPUTS.maskThicknessMm / 2;
  const lowestZ = Math.min(...wallMesh.flatMap((t) => [t.a[2], t.b[2], t.c[2]]));
  assert.ok(
    lowestZ <= plateZLo - VALID_INPUTS.skirtDepthMm + 1e-6,
    `expected the skirt to reach at least ${VALID_INPUTS.skirtDepthMm}mm below the plate, got lowest Z ${lowestZ}`,
  );
});

test("struts/spine/divider and the wall's skirt occupy overlapping Z ranges (fuse into one solid)", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const mesh = buildMaskMesh(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  const plateShapeCount = geometry.struts.length + 2;
  const plateMesh = mesh.slice(0, plateShapeCount * 12);
  const wallMesh = mesh.slice(plateShapeCount * 12);
  const plateZLo = Math.min(...plateMesh.flatMap((t) => [t.a[2], t.b[2], t.c[2]]));
  const wallZLo = Math.min(...wallMesh.flatMap((t) => [t.a[2], t.b[2], t.c[2]]));
  assert.ok(wallZLo < plateZLo, "wall skirt should reach below the plate's own Z range");
});

test("serializeStlAscii produces a well-formed ASCII STL", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const mesh = buildMaskMesh(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  const stl = serializeStlAscii(mesh, "test-mask");

  assert.ok(stl.startsWith("solid test-mask"));
  assert.ok(stl.trim().endsWith("endsolid test-mask"));
  const facetCount = (stl.match(/facet normal/g) ?? []).length;
  assert.equal(facetCount, mesh.length);
  const vertexCount = (stl.match(/vertex /g) ?? []).length;
  assert.equal(vertexCount, mesh.length * 3);
  assert.ok(!stl.includes("NaN"));
  assert.ok(!stl.includes("Infinity"));
});

test("serializeStlAscii sanitizes an unsafe solid name", () => {
  const stl = serializeStlAscii([], "my mask (102mm)!");
  assert.ok(stl.startsWith("solid my_mask__102mm__"));
});

test("serializeStlAscii throws on non-finite coordinates rather than emitting a broken file", () => {
  const badMesh: Triangle[] = [{ a: [0, 0, 0], b: [1, 0, 0], c: [0, NaN, 0] }];
  assert.throws(() => serializeStlAscii(badMesh, "bad"));
});

test("suggestedFilename embeds aperture and focal length", () => {
  const name = suggestedFilename(VALID_INPUTS);
  assert.equal(name, "bahtinov-mask-102mm-f900.stl");
});
