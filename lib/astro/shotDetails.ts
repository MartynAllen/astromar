export function computeTotalIntegrationSeconds(
  subCount?: number,
  subExposureSeconds?: number,
): number | undefined {
  if (!subCount || !subExposureSeconds) return undefined;
  return subCount * subExposureSeconds;
}

export function formatIntegrationTime(totalSeconds?: number): string | undefined {
  if (!totalSeconds) return undefined;
  const minutes = totalSeconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(1)} hr`;
}

/** e.g. "23 August 2026" — the site's one date format for capture dates. */
export function formatCaptureDate(captureDate?: string): string | undefined {
  if (!captureDate) return undefined;
  return new Date(captureDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * "None/Other" is the raw Sanity option value for "no filter was used" (see
 * sanity/schemaTypes/objects/shotDetails.ts) — a literal CMS enum string,
 * not reader-facing copy. Shown verbatim it reads like a rendering error
 * rather than a deliberate choice, so both display sites (the shot-details
 * panel and this summary line) route through this instead of the raw
 * field. Returns undefined for "no filter" rather than a "No filter" label —
 * an absent row/segment says the same thing with less noise, matching how
 * every other optional shot-detail field here already omits itself when
 * there's nothing to show.
 */
export function filterLabel(filter?: string): string | undefined {
  if (!filter || filter === "None/Other") return undefined;
  return filter;
}

export interface ShotSummaryInput {
  subCount?: number;
  subExposureSeconds?: number;
  filter?: string;
}

/** e.g. "845 × 10s · 140.8 min · LP" — instrument-readout style summary. */
export function formatShotSummary(details: ShotSummaryInput): string | undefined {
  const { subCount, subExposureSeconds, filter } = details;
  const total = computeTotalIntegrationSeconds(subCount, subExposureSeconds);
  const parts: string[] = [];
  if (subCount && subExposureSeconds) {
    parts.push(`${subCount} × ${subExposureSeconds}s`);
  }
  const formattedTotal = formatIntegrationTime(total);
  if (formattedTotal) parts.push(formattedTotal);
  const label = filterLabel(filter);
  if (label) parts.push(label);
  return parts.length ? parts.join(" · ") : undefined;
}
