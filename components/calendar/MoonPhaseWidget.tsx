import { getMoonPhase } from "@/lib/astro/moonPhase";

function moonPath(radius: number, phase: number): string {
  const theta = phase * 2 * Math.PI;
  const rx = Math.abs(radius * Math.cos(theta));
  const sweepOuter = phase < 0.5 ? 1 : 0;
  const sweepInner = phase < 0.5 ? 0 : 1;
  return `M0,${-radius} A${radius},${radius} 0 0,${sweepOuter} 0,${radius} A${rx},${radius} 0 0,${sweepInner} 0,${-radius} Z`;
}

export default function MoonPhaseWidget() {
  const { fraction, phase, phaseName } = getMoonPhase();
  const r = 26;

  return (
    <div className="flex items-center gap-5 border border-void-700 bg-void-900 p-5">
      <svg width={r * 2 + 4} height={r * 2 + 4} viewBox={`${-r - 2} ${-r - 2} ${r * 2 + 4} ${r * 2 + 4}`}>
        <circle cx={0} cy={0} r={r} fill="var(--color-void-700)" />
        <path d={moonPath(r, phase)} fill="var(--color-star-100)" />
      </svg>
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
          Tonight&apos;s moon
        </p>
        <p className="mt-1 font-display text-xl text-star-100">{phaseName}</p>
        <p className="text-sm text-star-500">{Math.round(fraction * 100)}% illuminated</p>
      </div>
    </div>
  );
}
