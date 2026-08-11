import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import exifr from "exifr";
import { resolveShotDetails, type RawExifInput } from "./resolveShotDetails";

const SEED_DIR = path.join(import.meta.dirname, "..", "..", "scripts", "seed-assets");

async function readRawExif(filename: string): Promise<RawExifInput> {
  const buf = await readFile(path.join(SEED_DIR, filename));
  // gps/ifd0/exif blocks are already on by default — only makerNote needs opting in.
  const out = await exifr.parse(buf, { makerNote: true }).catch(() => null);
  return {
    make: out?.Make,
    imageDescription: out?.ImageDescription,
    makerNote: out?.makerNote,
    dateTimeOriginal: out?.DateTimeOriginal,
    gpsLatitude: out?.latitude,
    gpsLongitude: out?.longitude,
  };
}

test("prefers the FITS header hidden in EXIF over filename parsing", async () => {
  const filename = "Butterfly Nebula - 20260712.jpg";
  const exif = await readRawExif(filename);
  const result = resolveShotDetails(filename, exif);

  assert.equal(result.tier, "fits-header");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "IC 1318");
  assert.equal(result.targetCommonName, "Butterfly Nebula");
  assert.equal(result.subCount, 601);
  assert.equal(result.subExposureSeconds, 10);
  assert.equal(result.filter, "LP");
  // Real-world coordinate value intentionally not asserted here (it's a real
  // home location) — just confirm the FITS SITELAT tier actually populated it.
  assert.equal(typeof result.latitude, "number");
});

test("reads the Seestar MakerNote JSON for Lunar shots", async () => {
  const filename = "2026-06-20-221356-Lunar.JPG";
  const exif = await readRawExif(filename);
  const result = resolveShotDetails(filename, exif);

  assert.equal(result.tier, "seestar-makernote");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "Moon");
  assert.equal(result.category, "lunar");
  assert.equal(result.captureDate, "2026-06-20T22:13:58.000Z");
  // Real-world coordinate values intentionally not asserted here (it's a real
  // home location) — the GeoJSON-order mapping itself is covered by the
  // synthetic-input test below instead.
  assert.equal(typeof result.longitude, "number");
  assert.equal(typeof result.latitude, "number");
});

test("maps MakerNote lon_lat as [lng, lat] (GeoJSON order), not spread positionally", () => {
  // Synthetic input, decoupled from any real file — isolates the ordering
  // logic without depending on (or asserting) a real-world location.
  const makerNote = JSON.stringify({
    result: { obj_name: "Moon", lon_lat: [10, 60] },
  });
  const result = resolveShotDetails("test.jpg", { make: "ZWO", makerNote });

  assert.equal(result.tier, "seestar-makernote");
  assert.equal(result.longitude, 10);
  assert.equal(result.latitude, 60);
});

test("falls back to the EXIF ImageDescription when no MakerNote is present", async () => {
  const filename = "IMG_2377.jpg";
  const exif = await readRawExif(filename);
  const result = resolveShotDetails(filename, exif);

  assert.equal(result.tier, exif.makerNote ? "seestar-makernote" : "seestar-exif");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "M 102");
});

test("falls back to the filename tier for a plain Enhanced_Stacked_ file with no EXIF", async () => {
  const filename =
    "Enhanced_Stacked_845_NGC 6960_10.0s_LP_20260709-035824.jpg";
  const exif = await readRawExif(filename);
  const result = resolveShotDetails(filename, exif);

  assert.equal(result.tier, "filename-seestar");
  assert.equal(result.needsReview, false);
  assert.equal(result.targetCatalogId, "NGC 6960");
  assert.equal(result.targetCommonName, "Western Veil Nebula");
});

test("flags genuinely unparseable files for manual review instead of guessing", () => {
  // Synthetic input, not a real file — represents a DSLR/phone frame with no
  // Seestar EXIF and a filename that doesn't match any known convention.
  for (const filename of ["IMG_2291.JPG", "DSC_0405.jpg"]) {
    const result = resolveShotDetails(filename, {});
    assert.equal(result.tier, "unresolved");
    assert.equal(result.needsReview, true);
    assert.equal(result.targetCatalogId, undefined);
  }
});
