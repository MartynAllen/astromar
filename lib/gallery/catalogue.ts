import type { AstroPhotoSummary, PhotoCategory } from "@/lib/sanity.queries";

export interface CatalogueEntry {
  /** Grouping key and display name — targetCommonName, falling back to
   * targetCatalogId, falling back to the photo's own title for shots with
   * neither (wide-field scenes: aurora, star trails, satellite passes). */
  key: string;
  designation?: string;
  category: PhotoCategory;
  photos: AstroPhotoSummary[];
  /** photos[0] after camera-priority sorting — see sortByLeadPriority. */
  lead: AstroPhotoSummary;
}

// No dedicated "camera" field exists on astroPhoto (see gearNotes' own
// comment in sanity.queries.ts) — this is a free-text substring match
// against gearNotes/telescope, deliberately loose so it starts working the
// moment a real ASI533MC Pro shot is tagged, without a schema change.
function shotWithAsi533mcPro(photo: AstroPhotoSummary): boolean {
  const haystack = `${photo.gearNotes ?? ""} ${photo.shotDetails?.telescope ?? ""}`.toLowerCase();
  return haystack.includes("asi533mc");
}

function captureTime(photo: AstroPhotoSummary): number {
  const iso = photo.shotDetails?.captureDate;
  return iso ? new Date(iso).getTime() : 0;
}

// ASI533MC Pro shots lead first (once any exist — see this function's own
// test for the current no-op case), newest capture first as the tiebreaker.
export function sortByLeadPriority(photos: AstroPhotoSummary[]): AstroPhotoSummary[] {
  return [...photos].sort((a, b) => {
    const priorityDelta = Number(shotWithAsi533mcPro(b)) - Number(shotWithAsi533mcPro(a));
    if (priorityDelta !== 0) return priorityDelta;
    return captureTime(b) - captureTime(a);
  });
}

function groupKey(photo: AstroPhotoSummary): string {
  return photo.shotDetails?.targetCommonName || photo.shotDetails?.targetCatalogId || photo.title;
}

export function groupPhotosByObject(photos: AstroPhotoSummary[]): CatalogueEntry[] {
  const groups = new Map<string, AstroPhotoSummary[]>();
  for (const photo of photos) {
    const key = groupKey(photo);
    const existing = groups.get(key);
    if (existing) existing.push(photo);
    else groups.set(key, [photo]);
  }

  return Array.from(groups.entries()).map(([key, groupPhotos]) => {
    const sorted = sortByLeadPriority(groupPhotos);
    const lead = sorted[0];
    const catalogId = groupPhotos.find((p) => p.shotDetails?.targetCatalogId)?.shotDetails
      ?.targetCatalogId;
    // Skip the designation line when it would just repeat the tile's own
    // name (e.g. Moon: catalogId "Moon", no separate common name) — a
    // catalogue entry doesn't need its own name printed twice.
    const designation =
      catalogId && catalogId.toLowerCase() !== key.toLowerCase() ? catalogId : undefined;
    return { key, designation, category: lead.category, photos: sorted, lead };
  });
}

export interface CatalogueSection {
  category: PhotoCategory;
  label: string;
  entries: CatalogueEntry[];
}

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  "deep-sky": "Deep Sky",
  lunar: "Lunar",
  planetary: "Planetary",
  "wide-field": "Wide Field",
  gear: "Gear",
};

// Mirrors the About page's per-category gear clusters (see DESIGN.md) —
// only categories that actually have an entry render, in this fixed order,
// each cluster's entries alphabetised for the "reference index" read the
// catalogue view is going for rather than a popularity or recency sort.
const SECTION_ORDER: PhotoCategory[] = ["deep-sky", "lunar", "planetary", "wide-field", "gear"];

export function groupIntoSections(entries: CatalogueEntry[]): CatalogueSection[] {
  return SECTION_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    entries: entries
      .filter((e) => e.category === category)
      .sort((a, b) => a.key.localeCompare(b.key)),
  })).filter((section) => section.entries.length > 0);
}
