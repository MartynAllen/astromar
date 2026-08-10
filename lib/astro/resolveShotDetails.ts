import { looksLikeFitsHeader, parseFitsHeader } from "./parseFitsHeader";
import { parseFilename } from "./parseFilename";
import { splitTarget } from "./targetCatalog";

export type ShotDetailsTier =
  | "fits-header"
  | "seestar-makernote"
  | "seestar-exif"
  | "filename-seestar"
  | "filename-lunar"
  | "filename-dated-name"
  | "unresolved";

export interface RawExifInput {
  make?: string;
  imageDescription?: string;
  makerNote?: string;
  dateTimeOriginal?: string | Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

export interface ResolvedShotDetails {
  targetCatalogId?: string;
  targetCommonName?: string;
  subExposureSeconds?: number;
  subCount?: number;
  filter?: "LP" | "IRCUT" | "None/Other";
  isMosaic: boolean;
  captureDate?: string;
  category?: "deep-sky" | "lunar" | "planetary" | "wide-field" | "gear";
  latitude?: number;
  longitude?: number;
  tier: ShotDetailsTier;
  needsReview: boolean;
}

function normalizeFilter(raw: string | undefined): "LP" | "IRCUT" | "None/Other" {
  const v = raw?.trim().toUpperCase();
  if (v === "LP" || v === "IRCUT") return v;
  return "None/Other";
}

// exifr "revives" standard-conforming EXIF dates (e.g. from a Nikon DSLR)
// into a Date object, but leaves Seestar's non-standard dotted-format
// timestamps ("YYYY.MM.DD HH:mm:ss") as a plain string since they don't
// parse as a recognized date — this normalizes either shape to ISO.
function normalizeSeestarDate(raw: string | Date): string | undefined {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? undefined : raw.toISOString();
  }
  const m = raw.match(
    /^(\d{4})[.:](\d{2})[.:](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
  );
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
}

interface SeestarMakerNote {
  obj_name?: string;
  lon_lat?: [number, number];
}

function tryParseMakerNote(raw: string): SeestarMakerNote | undefined {
  try {
    const parsed = JSON.parse(raw);
    return parsed?.result;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the best-available shot details for one source image, trying the
 * richest metadata source first: a Siril FITS header hidden in EXIF, then
 * Seestar's own MakerNote/EXIF, then the filename conventions, finally
 * falling back to "needs manual review" rather than guessing.
 */
export function resolveShotDetails(
  filename: string,
  exif: RawExifInput = {},
): ResolvedShotDetails {
  if (exif.imageDescription && looksLikeFitsHeader(exif.imageDescription)) {
    const fits = parseFitsHeader(exif.imageDescription);
    if (fits) {
      return {
        targetCatalogId: fits.targetCatalogId,
        targetCommonName: fits.targetCommonName,
        subExposureSeconds: fits.subExposureSeconds,
        subCount: fits.subCount,
        filter: normalizeFilter(fits.filter),
        isMosaic: false,
        captureDate: fits.captureDate,
        category: "deep-sky",
        latitude: fits.latitude,
        longitude: fits.longitude,
        tier: "fits-header",
        needsReview: false,
      };
    }
  }

  if (exif.make === "ZWO" && exif.makerNote) {
    const parsed = tryParseMakerNote(exif.makerNote);
    if (parsed?.obj_name) {
      const { catalogId, commonName } = splitTarget(parsed.obj_name);
      return {
        targetCatalogId: catalogId,
        targetCommonName: commonName,
        isMosaic: false,
        captureDate: exif.dateTimeOriginal
          ? normalizeSeestarDate(exif.dateTimeOriginal)
          : undefined,
        category: catalogId.toLowerCase() === "moon" ? "lunar" : "deep-sky",
        // MakerNote lon_lat is GeoJSON order [lng, lat] — map explicitly, don't spread.
        longitude: parsed.lon_lat?.[0],
        latitude: parsed.lon_lat?.[1],
        tier: "seestar-makernote",
        needsReview: false,
      };
    }
  }

  if (exif.make === "ZWO" && exif.imageDescription) {
    const { catalogId, commonName } = splitTarget(exif.imageDescription);
    return {
      targetCatalogId: catalogId,
      targetCommonName: commonName,
      isMosaic: false,
      captureDate: exif.dateTimeOriginal
        ? normalizeSeestarDate(exif.dateTimeOriginal)
        : undefined,
      category: catalogId.toLowerCase() === "moon" ? "lunar" : "deep-sky",
      latitude: exif.gpsLatitude,
      longitude: exif.gpsLongitude,
      tier: "seestar-exif",
      needsReview: false,
    };
  }

  const parsed = parseFilename(filename);
  if (parsed) {
    return {
      targetCatalogId: parsed.targetCatalogId,
      targetCommonName: parsed.targetCommonName,
      subCount: parsed.subCount,
      subExposureSeconds: parsed.subExposureSeconds,
      filter: parsed.filter,
      isMosaic: parsed.isMosaic,
      captureDate: parsed.captureDate,
      category: parsed.category,
      latitude: exif.gpsLatitude,
      longitude: exif.gpsLongitude,
      tier: parsed.source,
      needsReview: false,
    };
  }

  return {
    isMosaic: false,
    captureDate: exif.dateTimeOriginal
      ? normalizeSeestarDate(exif.dateTimeOriginal)
      : undefined,
    latitude: exif.gpsLatitude,
    longitude: exif.gpsLongitude,
    tier: "unresolved",
    needsReview: true,
  };
}
