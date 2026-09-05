// Common names for catalog IDs that appear in filenames without one spelled out
// (e.g. "NGC 7000" alone, vs "SH2-108 - Sadr Region" which already carries its own).
const COMMON_NAMES: Record<string, string> = {
  "NGC 7000": "North America Nebula",
  "M 33": "Triangulum Galaxy",
  "M 81": "Bode's Galaxy",
  "M 31": "Andromeda Galaxy",
  "NGC 7023": "Iris Nebula",
  "IC 1805": "Heart Nebula",
  "NGC 7380": "Wizard Nebula",
  "NGC 6960": "Western Veil Nebula",
  "C 4": "Iris Nebula", // Caldwell 4 = NGC 7023, catalogued separately by Siril/PixInsight plate solvers
};

export function lookupCommonName(catalogId: string): string | undefined {
  return COMMON_NAMES[catalogId.trim()];
}

export interface SplitTargetResult {
  catalogId: string;
  commonName?: string;
}

/**
 * Splits "SH2-108 - Sadr Region" into catalog ID + common name. When the raw
 * string has no " - " separator (e.g. just "NGC 7000"), falls back to the
 * static lookup table above.
 */
export function splitTarget(raw: string): SplitTargetResult {
  const parts = raw.split(" - ");
  if (parts.length >= 2) {
    return {
      catalogId: parts[0].trim(),
      commonName: parts.slice(1).join(" - ").trim(),
    };
  }
  const catalogId = raw.trim();
  return { catalogId, commonName: lookupCommonName(catalogId) };
}
