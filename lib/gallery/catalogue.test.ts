import { test } from "node:test";
import assert from "node:assert/strict";
import { groupPhotosByObject, groupIntoSections, sortByLeadPriority } from "./catalogue";

function photo(overrides: Record<string, unknown>) {
  return {
    _id: overrides.title as string,
    title: "Untitled",
    slug: { current: "untitled" },
    mainImage: {},
    category: "deep-sky",
    ...overrides,
  } as never;
}

test("groupPhotosByObject groups by common name, not raw catalog ID", () => {
  // The real data case this exists for: East Veil Nebula shot under both
  // NGC 6992 and Caldwell 33 — same object, must collapse to one entry.
  const photos = [
    photo({ title: "East Veil A", shotDetails: { targetCommonName: "East Veil Nebula", targetCatalogId: "NGC 6992" } }),
    photo({ title: "East Veil B", shotDetails: { targetCommonName: "East Veil Nebula", targetCatalogId: "C 33" } }),
  ];
  const entries = groupPhotosByObject(photos);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].photos.length, 2);
});

test("groupPhotosByObject falls back to catalog ID, then title, when common name is missing", () => {
  const photos = [
    photo({ title: "Moon A", shotDetails: { targetCatalogId: "Moon" } }),
    photo({ title: "Aurora — Single Pillar", category: "wide-field" }),
  ];
  const entries = groupPhotosByObject(photos);
  const keys = entries.map((e) => e.key).sort();
  assert.deepEqual(keys, ["Aurora — Single Pillar", "Moon"]);
});

test("groupPhotosByObject omits the designation line when it would repeat the tile name", () => {
  const entries = groupPhotosByObject([photo({ title: "Moon A", shotDetails: { targetCatalogId: "Moon" } })]);
  assert.equal(entries[0].designation, undefined);
});

test("groupPhotosByObject keeps the designation when it's a real, distinct catalog ID", () => {
  const entries = groupPhotosByObject([
    photo({ title: "Iris", shotDetails: { targetCommonName: "Iris Nebula", targetCatalogId: "NGC 7023" } }),
  ]);
  assert.equal(entries[0].designation, "NGC 7023");
});

test("sortByLeadPriority is a no-op ordering (newest first) when no shot uses the ASI533MC Pro", () => {
  const older = photo({ title: "older", shotDetails: { captureDate: "2026-01-01" } });
  const newer = photo({ title: "newer", shotDetails: { captureDate: "2026-06-01" } });
  assert.deepEqual(sortByLeadPriority([older, newer]).map((p) => p.title), ["newer", "older"]);
});

test("sortByLeadPriority leads with an ASI533MC Pro shot even when it's older", () => {
  const newerButOtherCamera = photo({
    title: "newer-seestar",
    shotDetails: { captureDate: "2026-06-01", telescope: "Seestar S50" },
  });
  const olderAsi533 = photo({
    title: "older-asi533",
    shotDetails: { captureDate: "2026-01-01" },
    gearNotes: "Nikon replaced with a ZWO ASI533MC Pro on this session.",
  });
  assert.deepEqual(
    sortByLeadPriority([newerButOtherCamera, olderAsi533]).map((p) => p.title),
    ["older-asi533", "newer-seestar"],
  );
});

test("groupIntoSections orders by the fixed category order and alphabetises within each", () => {
  const entries = groupPhotosByObject([
    photo({ title: "Zeta target", category: "deep-sky", shotDetails: { targetCommonName: "Zebra Nebula" } }),
    photo({ title: "Alpha target", category: "deep-sky", shotDetails: { targetCommonName: "Andromeda Galaxy" } }),
    photo({ title: "Moon shot", category: "lunar", shotDetails: { targetCatalogId: "Moon" } }),
  ]);
  const sections = groupIntoSections(entries);
  assert.deepEqual(
    sections.map((s) => s.category),
    ["deep-sky", "lunar"],
  );
  assert.deepEqual(
    sections[0].entries.map((e) => e.key),
    ["Andromeda Galaxy", "Zebra Nebula"],
  );
});

test("groupIntoSections omits categories with no entries", () => {
  const entries = groupPhotosByObject([photo({ title: "Moon shot", category: "lunar", shotDetails: { targetCatalogId: "Moon" } })]);
  const sections = groupIntoSections(entries);
  assert.deepEqual(sections.map((s) => s.category), ["lunar"]);
});
