import { splitTarget } from "./targetCatalog";

export interface FitsParseResult {
  targetCatalogId: string;
  targetCommonName?: string;
  subExposureSeconds?: number;
  subCount?: number;
  filter?: string;
  captureDate?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Some Siril-processed exports dump the entire FITS header into the JPEG's
 * EXIF ImageDescription field. Detect that case before attempting to parse.
 */
export function looksLikeFitsHeader(text: string | undefined): boolean {
  if (!text) return false;
  return text.includes("SIMPLE") && text.includes("FITS standard");
}

function extractString(header: string, key: string): string | undefined {
  const re = new RegExp(`${key}\\s*=\\s*'([^']*)'`);
  const m = header.match(re);
  return m ? m[1].trim() : undefined;
}

function extractNumber(header: string, key: string): number | undefined {
  const re = new RegExp(`${key}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)`);
  const m = header.match(re);
  return m ? Number(m[1]) : undefined;
}

/**
 * Pulls only the specific keywords our schema cares about (OBJECT, EXPTIME,
 * STACKCNT, FILTER, DATE-OBS, SITELAT/LONG) via an allowlist of targeted
 * regexes, rather than parsing every card in the header — some fields in
 * real Siril exports (e.g. EQUINOX) can carry garbage values.
 */
export function parseFitsHeader(header: string): FitsParseResult | null {
  if (!looksLikeFitsHeader(header)) return null;
  const object = extractString(header, "OBJECT");
  if (!object) return null;
  const { catalogId, commonName } = splitTarget(object);
  return {
    targetCatalogId: catalogId,
    targetCommonName: commonName,
    subExposureSeconds: extractNumber(header, "EXPTIME"),
    subCount: extractNumber(header, "STACKCNT"),
    filter: extractString(header, "FILTER"),
    captureDate: extractString(header, "DATE-OBS"),
    latitude: extractNumber(header, "SITELAT"),
    longitude: extractNumber(header, "SITELONG"),
  };
}
