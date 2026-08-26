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
  if (filter) parts.push(filter);
  return parts.length ? parts.join(" · ") : undefined;
}
