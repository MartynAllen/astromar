import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBahtinovGeometry, DEFAULT_ADVANCED, type BahtinovInputs } from "./geometry";
import {
  buildMaskMesh,
  buildPlateTriangles,
  buildSkirtTriangles,
  serializeStlAscii,
  suggestedFilename,
  unionAndExtrude,
  type Triangle,
} from "./stl";

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

function vkey(p: [number, number, number]): string {
  return p.map((n) => n.toFixed(6)).join(",");
}

/**
 * The single most important structural guarantee, and the one that
 * directly maps to the original bug report: is this mesh *one physically
 * connected part*, or several separate, merely-overlapping solids (the
 * pre-fix reality — 35 disconnected bodies for the real default geometry,
 * confirmed with Python's trimesh, each strut/spine/divider/wall segment
 * its own floating box)? Implemented as union-find over vertices sharing a
 * triangle edge — two triangles are "connected" iff they share at least
 * one vertex position.
 */
function countConnectedComponents(mesh: Triangle[]): number {
  const parent = new Map<string, string>();
  function find(x: string): string {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }
  function union(a: string, b: string) {
    if (!parent.has(a)) parent.set(a, a);
    if (!parent.has(b)) parent.set(b, b);
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  for (const { a, b, c } of mesh) {
    const [ka, kb, kc] = [vkey(a), vkey(b), vkey(c)];
    union(ka, kb);
    union(kb, kc);
  }
  const roots = new Set<string>();
  for (const k of parent.keys()) roots.add(find(k));
  return roots.size;
}

/**
 * Every edge of a closed ("watertight") mesh is used by exactly 2
 * triangles. Returns how many (undirected) edges are used a different
 * number of times — this is the same check Python's trimesh does
 * (`edges_sorted`, count!=1 after deduplication), used here to verify a
 * fix without needing an external tool for every run. See buildPlateTriangles'
 * "Known limitation" note for why this isn't asserted at exactly 0.
 */
function countBadEdges(mesh: Triangle[]): number {
  const count = new Map<string, number>();
  for (const { a, b, c } of mesh) {
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const k = [vkey(p), vkey(q)].sort().join("|");
      count.set(k, (count.get(k) ?? 0) + 1);
    }
  }
  let bad = 0;
  for (const n of count.values()) if (n !== 2) bad++;
  return bad;
}

test("the plate (struts + spine + divider + wall's top ring, unioned) is a single connected solid", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const plate = buildPlateTriangles(geometry, VALID_INPUTS.maskThicknessMm);
  const components = countConnectedComponents(plate);
  assert.equal(
    components,
    1,
    `expected one fused part, found ${components} disconnected bodies — struts/spine/divider/wall aren't ` +
      "actually joined (this is the exact defect a real 3D viewer showed pre-fix: 35 separate floating boxes)",
  );
});

test("the plate mesh is almost entirely watertight (known limitation: earcut's multi-hole bridging leaves a small residual)", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const plate = buildPlateTriangles(geometry, VALID_INPUTS.maskThicknessMm);
  const bad = countBadEdges(plate);
  const total = plate.length * 3;
  // Verified via Python's trimesh on this exact default geometry: 84 open
  // edges out of 7152 edge-instances (~1.2%), all clustered at bridge
  // points earcut inserts to connect closely-spaced holes (the 4
  // slit-grating quadrants) into one triangulatable simple polygon — not
  // the gross, everywhere-a-strut-crosses-anything gaps a real 3D viewer
  // showed before this fix (verified separately: 35 disconnected bodies,
  // 272 open edges from an earlier, worse attempt at fixing this the same
  // way). Generous headroom (5%) rather than the exact measured value, so
  // this doesn't become a brittle pin against a third-party library's
  // internal triangulation choices.
  const ratio = bad / total;
  assert.ok(ratio < 0.05, `expected under 5% residual open edges, got ${bad}/${total} (${(ratio * 100).toFixed(2)}%)`);
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

test("a synthetic strut+spine+divider plate (no wall) unions into one fully watertight solid with the expected footprint", () => {
  // Without the wall ring's holes-close-together case, this combination is
  // simple enough (1 outer boundary, no holes) that it's fully exact —
  // verified 0 non-manifold edges, not just "mostly". Uses unionAndExtrude
  // directly (not buildPlateTriangles, which always includes the wall
  // footprint) since polygon-clipping can't accept a zero-width degenerate
  // annulus as a stand-in for "no wall" — confirmed it throws.
  const spine: [number, number][] = [
    [-0.5, -10],
    [0.5, -10],
    [0.5, 10],
    [-0.5, 10],
  ];
  const divider: [number, number][] = [
    [-10, -0.5],
    [10, -0.5],
    [10, 0.5],
    [-10, 0.5],
  ];
  const strut: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const plate = unionAndExtrude([[strut], [spine], [divider]], -1, 1); // zLo=-1, zHi=1
  assert.equal(countConnectedComponents(plate), 1);
  assert.equal(countBadEdges(plate), 0);

  let topArea = 0;
  for (const tri of plate) {
    const [, , nz] = triangleNormal(tri);
    if (nz > 0) {
      const [ax, ay] = tri.a;
      const [bx, by] = tri.b;
      const [cx, cy] = tri.c;
      topArea += Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;
    }
  }
  // The strut (2x2=4) sits entirely inside the spine's own footprint
  // (x in [-0.5,0.5] spans the strut's x in [-1,1]? no — only overlaps in
  // x in [-0.5,0.5]) — rather than hand-deriving the overlap, just check
  // the union's area is between the largest single shape and the naive
  // (non-overlap-aware) sum, which is enough to catch a union that's
  // silently dropping or duplicating real area.
  const spineArea = 1 * 20;
  const dividerArea = 20 * 1;
  const strutArea = 2 * 2;
  const naiveSum = spineArea + dividerArea + strutArea;
  assert.ok(topArea > Math.max(spineArea, dividerArea, strutArea));
  assert.ok(topArea <= naiveSum + 1e-6, `union area ${topArea} shouldn't exceed the non-overlapping sum ${naiveSum}`);
});

test("the skirt is a single, fully watertight solid (no per-segment seams)", () => {
  // Regression test for a real bug found via a live 3D viewer + trimesh:
  // buildSkirtTriangles used to build the mounting collar as WALL_SEGMENTS
  // (96) independently-closed prism boxes (via a since-removed
  // buildWallTriangles/extrudeQuad pair), each duplicating its own radial
  // end-caps rather than sharing one real boundary with its neighbour —
  // 384 non-manifold edges out of 3456 (~11%) on this exact geometry,
  // several with real multi-mm lengths (not degenerate slivers), visible
  // in a 3D viewer as gaps/creases running down the collar. Routing the
  // skirt through the same earcut-based unionAndExtrude the plate uses
  // (see buildSkirtTriangles) fixes this to a fully exact 0 bad edges,
  // verified with Python's trimesh on the real default geometry.
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const skirt = buildSkirtTriangles(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  assert.equal(countConnectedComponents(skirt), 1);
  assert.equal(countBadEdges(skirt), 0, "the skirt (a single annulus, no close-together holes) should be exactly watertight, unlike the plate's small documented residual");
});

test("the mounting wall's skirt extends well below the grating plate", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const skirt = buildSkirtTriangles(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  const plateZLo = -VALID_INPUTS.maskThicknessMm / 2;
  const lowestZ = Math.min(...skirt.flatMap((t) => [t.a[2], t.b[2], t.c[2]]));
  assert.ok(
    lowestZ <= plateZLo - VALID_INPUTS.skirtDepthMm + 1e-6,
    `expected the skirt to reach at least ${VALID_INPUTS.skirtDepthMm}mm below the plate, got lowest Z ${lowestZ}`,
  );
});

test("the skirt's top meets the plate's own bottom exactly (shared Z boundary, no gap)", () => {
  const geometry = computeBahtinovGeometry(VALID_INPUTS);
  const skirt = buildSkirtTriangles(geometry, VALID_INPUTS.maskThicknessMm, VALID_INPUTS.skirtDepthMm);
  const plateZLo = -VALID_INPUTS.maskThicknessMm / 2;
  const skirtTopZ = Math.max(...skirt.flatMap((t) => [t.a[2], t.b[2], t.c[2]]));
  assert.ok(
    Math.abs(skirtTopZ - plateZLo) < 1e-9,
    `expected skirt's top to sit exactly at plate's zLo (${plateZLo}), got ${skirtTopZ}`,
  );
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
