import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFilename } from "./parseFilename";

// The 14 real Enhanced_Stacked_* filenames from scripts/seed-assets/.
const SEESTAR_FILENAMES = [
  "Enhanced_Stacked_389_mosaic_NGC 7000_10.0s_LP_20260718-020002.jpg",
  "Enhanced_Stacked_409_mosaic_M 33_10.0s_IRCUT_20260718-043001.jpg",
  "Enhanced_Stacked_466_SH2-108 - Sadr Region_10.0s_LP_20260722-000001.jpg",
  "Enhanced_Stacked_476_NGC 7023_10.0s_IRCUT_20260722-041002.jpg",
  "Enhanced_Stacked_495_mosaic_M 81_10.0s_IRCUT_20260722-020002.jpg",
  "Enhanced_Stacked_539_SH2-171 - Teddy Bear Nebula_10.0s_IRCUT_20260725-042003.JPG",
  "Enhanced_Stacked_542_mosaic_NGC 7000_10.0s_LP_20260727-012002.jpg",
  "Enhanced_Stacked_597_C 33 - East Veil Nebula_10.0s_LP_20260721-010001.jpg",
  "Enhanced_Stacked_607_IC 5070 - Pelican Nebula_10.0s_LP_20260721-042004.jpg",
  "Enhanced_Stacked_666_NGC 281 - Pacman Nebula_10.0s_LP_20260712-033001.jpg",
  "Enhanced_Stacked_703_mosaic_IC 1805_10.0s_LP_20260727-044003.jpg",
  "Enhanced_Stacked_728_mosaic_M 31_10.0s_IRCUT_20260713-040001.jpg",
  "Enhanced_Stacked_805_mosaic_NGC 7380_10.0s_IRCUT_20260720-041001.jpg",
  "Enhanced_Stacked_845_NGC 6960_10.0s_LP_20260709-035824.jpg",
];

test("parses every real Enhanced_Stacked_* filename", () => {
  for (const filename of SEESTAR_FILENAMES) {
    const result = parseFilename(filename);
    assert.ok(result, `expected a match for ${filename}`);
    assert.equal(result!.source, "filename-seestar");
    assert.ok(result!.targetCatalogId.length > 0);
    assert.ok(result!.subCount! > 0);
    assert.ok(result!.subExposureSeconds! > 0);
    assert.ok(["LP", "IRCUT"].includes(result!.filter!));
  }
});

test("splits compound hyphenated targets correctly", () => {
  const result = parseFilename(
    "Enhanced_Stacked_466_SH2-108 - Sadr Region_10.0s_LP_20260722-000001.jpg",
  );
  assert.equal(result!.targetCatalogId, "SH2-108");
  assert.equal(result!.targetCommonName, "Sadr Region");
});

test("detects the mosaic flag", () => {
  const mosaic = parseFilename(
    "Enhanced_Stacked_389_mosaic_NGC 7000_10.0s_LP_20260718-020002.jpg",
  );
  assert.equal(mosaic!.isMosaic, true);

  const single = parseFilename(
    "Enhanced_Stacked_476_NGC 7023_10.0s_IRCUT_20260722-041002.jpg",
  );
  assert.equal(single!.isMosaic, false);
});

test("fills in common names from the catalog for bare catalog IDs", () => {
  const result = parseFilename(
    "Enhanced_Stacked_389_mosaic_NGC 7000_10.0s_LP_20260718-020002.jpg",
  );
  assert.equal(result!.targetCommonName, "North America Nebula");
});

test("the two NGC 7000 shoots produce distinct capture dates", () => {
  const first = parseFilename(
    "Enhanced_Stacked_389_mosaic_NGC 7000_10.0s_LP_20260718-020002.jpg",
  );
  const second = parseFilename(
    "Enhanced_Stacked_542_mosaic_NGC 7000_10.0s_LP_20260727-012002.jpg",
  );
  assert.equal(first!.targetCatalogId, second!.targetCatalogId);
  assert.notEqual(first!.captureDate, second!.captureDate);
});

test("parses ad-hoc Lunar filenames, case-insensitive extension", () => {
  const result = parseFilename("2026-06-20-221356-Lunar.JPG");
  assert.ok(result);
  assert.equal(result!.source, "filename-lunar");
  assert.equal(result!.targetCatalogId, "Moon");
  assert.equal(result!.category, "lunar");
  assert.equal(result!.captureDate, "2026-06-20T22:13:56.000Z");
});

test("parses the ad-hoc 'Name - date' convention", () => {
  const result = parseFilename("Butterfly Nebula - 20260712.jpg");
  assert.ok(result);
  assert.equal(result!.source, "filename-dated-name");
  assert.equal(result!.targetCatalogId, "Butterfly Nebula");
});

test("returns null for filenames with no recognizable convention", () => {
  assert.equal(parseFilename("DSC_0405.jpg"), null);
  assert.equal(parseFilename("IMG_2291.JPG"), null);
  assert.equal(parseFilename("IMG_2377.jpg"), null);
});
