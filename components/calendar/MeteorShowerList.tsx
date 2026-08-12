import { getUpcomingMeteorShowers } from "@/lib/astro/meteorShowers";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export default function MeteorShowerList() {
  const upcoming = getUpcomingMeteorShowers();

  return (
    <div className="border border-void-700 bg-void-900 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
        Upcoming meteor showers
      </p>
      <ul className="mt-3 divide-y divide-void-700">
        {upcoming.map(({ shower, peak }) => (
          <li key={shower.name} className="flex items-baseline justify-between gap-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-star-100">{shower.name}</p>
              <p className="text-xs text-star-500">Radiant: {shower.radiant} · up to {shower.zhr}/hr</p>
            </div>
            <span className="font-mono text-sm text-star-300">{formatDate(peak)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
