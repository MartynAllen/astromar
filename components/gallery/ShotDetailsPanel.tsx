import {
  computeTotalIntegrationSeconds,
  formatIntegrationTime,
} from "@/lib/astro/shotDetails";
import type { ShotDetails } from "@/lib/sanity.queries";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-void-700 py-2 text-sm last:border-b-0">
      <span className="text-star-500">{label}</span>
      <span className="font-mono text-star-100">{value}</span>
    </div>
  );
}

export default function ShotDetailsPanel({ details }: { details?: ShotDetails }) {
  if (!details) return null;

  const totalSeconds = computeTotalIntegrationSeconds(
    details.subCount,
    details.subExposureSeconds,
  );
  const totalFormatted = formatIntegrationTime(totalSeconds);
  const captureDate = details.captureDate
    ? new Date(details.captureDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : undefined;

  return (
    <div className="rounded-lg border border-void-700 bg-void-900 p-4">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        Shot details
      </p>
      <Row label="Target" value={details.targetCatalogId} />
      <Row label="Captured" value={captureDate} />
      <Row
        label="Exposure"
        value={
          details.subCount && details.subExposureSeconds
            ? `${details.subCount} × ${details.subExposureSeconds}s`
            : undefined
        }
      />
      <Row label="Total integration" value={totalFormatted} />
      <Row label="Filter" value={details.filter} />
      <Row label="Mosaic" value={details.isMosaic ? "Yes" : undefined} />
      <Row label="Telescope" value={details.telescope} />
      {/* captureLocation is intentionally not rendered — it's your approximate
          home address, embedded by the Seestar app itself. Kept in Sanity for
          your own reference (e.g. the calendar's rise/set math), not shown publicly. */}
    </div>
  );
}
