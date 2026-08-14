import type { ResearchStatus } from "@/lib/sanity.queries";

const STYLES: Record<ResearchStatus, string> = {
  Idea: "border-void-600 text-star-500",
  "In progress":
    "border-nebula-amber-400/40 bg-nebula-amber-400/10 text-nebula-amber-400",
  Complete:
    "border-nebula-teal-500/40 bg-nebula-teal-500/10 text-nebula-teal-400",
};

export default function StatusBadge({ status }: { status: ResearchStatus }) {
  return (
    <span
      className={`flex-none rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
