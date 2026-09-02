import type { ProcessingTool } from "@/lib/sanity.queries";

// Same bordered-panel + label/value row language as ShotDetailsPanel,
// deliberately kept as its own panel rather than folded into that one —
// capture conditions (target, exposure, filter) and post-processing
// software are genuinely different concerns, and every other distinct
// concern on this site already gets its own panel.
export default function ProcessingPanel({ tools }: { tools?: ProcessingTool[] }) {
  if (!tools || tools.length === 0) return null;

  return (
    <div className="border border-void-700 bg-void-900 p-4">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        Processing
      </p>
      {tools.map((t, i) => (
        <div
          key={`${t.tool}-${i}`}
          className="flex items-baseline justify-between gap-4 border-b border-void-700 py-2 text-sm last:border-b-0"
        >
          <span className="text-star-500">{t.role || "Tool"}</span>
          <span className="break-words text-right font-mono text-star-100">{t.tool}</span>
        </div>
      ))}
    </div>
  );
}
