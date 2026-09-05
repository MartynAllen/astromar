import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveShotDetails } from "./resolveShotDetails";

// All fixtures below are synthetic, not read from real source photos —
// scripts/seed-assets/ is gitignored (raw files carry embedded GPS) and
// doesn't exist in a fresh checkout or CI, only on a dev machine that's
// actually run the import script.

test("prefers the FITS header hidden in EXIF over filename parsing", () => {
  const filename = "Butterfly Nebula - 20260712.jpg";
  const header = [
    "SIMPLE  = T / file does conform to FITS standard",
    "OBJECT  = 'IC 1318 - Butterfly Nebula'",
    "EXPTIME = 10",
    "STACKCNT= 601",
    "FILTER  = 'LP'",
    "DATE-OBS= '2026-07-12T00:00:00'",
    "SITELAT = 0.0",
    "SITELONG= 0.0",
  ].join("\n");
  const result = resolveShotDetails(filename, { imageDescription: header });

  assert.equal(result.tier, "fits-header");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "IC 1318");
  assert.equal(result.targetCommonName, "Butterfly Nebula");
  assert.equal(result.subCount, 601);
  assert.equal(result.subExposureSeconds, 10);
  assert.equal(result.filter, "LP");
  assert.equal(typeof result.latitude, "number");
});

test("resolves a bare Caldwell catalog ID (no ' - common name' in OBJECT) via the lookup table", () => {
  // Real-world case: an ASIAIR Plus + EQMod mount capture, plate-solved and
  // stacked in Siril, whose FITS header names the target by its Caldwell
  // number alone — unlike the Messier/NGC/IC fixture above, OBJECT here
  // carries no " - Common Name" suffix, so this only resolves if the
  // catalogue lookup table knows "C 4" (Caldwell 4 = NGC 7023).
  const header = [
    "SIMPLE  = T / file does conform to FITS standard",
    "OBJECT  = 'C 4     '",
    "EXPTIME = 180",
    "STACKCNT= 50",
  ].join("\n");
  const result = resolveShotDetails("result.jpg", { imageDescription: header });

  assert.equal(result.tier, "fits-header");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "C 4");
  assert.equal(result.targetCommonName, "Iris Nebula");
});

test("reads the Seestar MakerNote JSON for Lunar shots", () => {
  const filename = "2026-06-20-221356-Lunar.JPG";
  const makerNote = JSON.stringify({
    result: { obj_name: "Moon", lon_lat: [0, 0] },
  });
  const result = resolveShotDetails(filename, {
    make: "ZWO",
    makerNote,
    dateTimeOriginal: "2026.06.20 22:13:58",
  });

  assert.equal(result.tier, "seestar-makernote");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "Moon");
  assert.equal(result.category, "lunar");
  assert.equal(result.captureDate, "2026-06-20T22:13:58.000Z");
  assert.equal(typeof result.longitude, "number");
  assert.equal(typeof result.latitude, "number");
});

test("maps MakerNote lon_lat as [lng, lat] (GeoJSON order), not spread positionally", () => {
  const makerNote = JSON.stringify({
    result: { obj_name: "Moon", lon_lat: [10, 60] },
  });
  const result = resolveShotDetails("test.jpg", { make: "ZWO", makerNote });

  assert.equal(result.tier, "seestar-makernote");
  assert.equal(result.longitude, 10);
  assert.equal(result.latitude, 60);
});

test("falls back to the EXIF ImageDescription when no MakerNote is present", () => {
  const filename = "IMG_2377.jpg";
  const result = resolveShotDetails(filename, { make: "ZWO", imageDescription: "M 102" });

  assert.equal(result.tier, "seestar-exif");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "M 102");
});

test("falls back to the filename tier for a plain Enhanced_Stacked_ file with no EXIF", () => {
  const filename = "Enhanced_Stacked_845_NGC 6960_10.0s_LP_20260709-035824.jpg";
  const result = resolveShotDetails(filename, {});

  assert.equal(result.tier, "filename-seestar");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "NGC 6960");
  assert.equal(result.targetCommonName, "Western Veil Nebula");
});

test("flags genuinely unparseable files for manual review instead of guessing", () => {
  // Represents a DSLR/phone frame with no Seestar EXIF and a filename that
  // doesn't match any known convention.
  for (const filename of ["IMG_2291.JPG", "DSC_0405.jpg"]) {
    const result = resolveShotDetails(filename, {});
    assert.equal(result.tier, "unresolved");
    assert.equal(result.needsReview, true);
    assert.equal(result.targetCatalogId, undefined);
  }
});
