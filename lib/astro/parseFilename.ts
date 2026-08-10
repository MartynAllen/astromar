import { splitTarget } from "./targetCatalog";

export type FilenameSource =
  | "filename-seestar"
  | "filename-lunar"
  | "filename-dated-name";

export interface FilenameParseResult {
  targetCatalogId: string;
  targetCommonName?: string;
  subCount?: number;
  subExposureSeconds?: number;
  filter?: "LP" | "IRCUT";
  isMosaic: boolean;
  captureDate?: string;
  category: "deep-sky" | "lunar";
  source: FilenameSource;
}

// Enhanced_Stacked_389_mosaic_NGC 7000_10.0s_LP_20260718-020002.jpg
// The target group is non-greedy and anchored on the "_<exposure>s_" suffix,
// so hyphenated/compound targets like "SH2-108 - Sadr Region" parse intact.
const SEESTAR_STACKED_RE =
  /^Enhanced_Stacked_(\d+)_(mosaic_)?(.+?)_(\d+(?:\.\d+)?)s_(LP|IRCUT)_(\d{8})-(\d{6})\.(jpe?g)$/i;

// 2026-06-20-221450-Lunar.jpg
const LUNAR_RE = /^(\d{4})-(\d{2})-(\d{2})-(\d{6})-Lunar\.(jpe?g)$/i;

// Butterfly Nebula - 20260712.jpg (ad-hoc Siril export naming)
const DATED_NAME_RE = /^(.+?) - (\d{8})\.(jpe?g)$/i;

function toIsoFromYmdHms(ymd: string, hms: string): string {
  // Seestar filenames carry no timezone; treated as UTC for a deterministic,
  // testable value rather than assuming the capture device's local offset.
  const year = ymd.slice(0, 4);
  const month = ymd.slice(4, 6);
  const day = ymd.slice(6, 8);
  const hour = hms.slice(0, 2);
  const minute = hms.slice(2, 4);
  const second = hms.slice(4, 6);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

export function parseSeestarStackedFilename(
  filename: string,
): FilenameParseResult | null {
  const m = filename.match(SEESTAR_STACKED_RE);
  if (!m) return null;
  const [, subCount, mosaic, target, expPerSub, filter, ymd, hms] = m;
  const { catalogId, commonName } = splitTarget(target);
  return {
    targetCatalogId: catalogId,
    targetCommonName: commonName,
    subCount: Number(subCount),
    subExposureSeconds: Number(expPerSub),
    filter: filter.toUpperCase() as "LP" | "IRCUT",
    isMosaic: Boolean(mosaic),
    captureDate: toIsoFromYmdHms(ymd, hms),
    category: "deep-sky",
    source: "filename-seestar",
  };
}

export function parseLunarFilename(
  filename: string,
): FilenameParseResult | null {
  const m = filename.match(LUNAR_RE);
  if (!m) return null;
  const [, yyyy, mm, dd, hms] = m;
  return {
    targetCatalogId: "Moon",
    targetCommonName: "The Moon",
    isMosaic: false,
    captureDate: toIsoFromYmdHms(`${yyyy}${mm}${dd}`, hms),
    category: "lunar",
    source: "filename-lunar",
  };
}

export function parseDatedNameFilename(
  filename: string,
): FilenameParseResult | null {
  const m = filename.match(DATED_NAME_RE);
  if (!m) return null;
  const [, rawTarget, ymd] = m;
  const { catalogId, commonName } = splitTarget(rawTarget);
  return {
    targetCatalogId: catalogId,
    targetCommonName: commonName,
    isMosaic: false,
    captureDate: toIsoFromYmdHms(ymd, "000000"),
    category: "deep-sky",
    source: "filename-dated-name",
  };
}

/** Tries each filename convention in turn; null if none match. */
export function parseFilename(filename: string): FilenameParseResult | null {
  return (
    parseSeestarStackedFilename(filename) ??
    parseLunarFilename(filename) ??
    parseDatedNameFilename(filename)
  );
}
