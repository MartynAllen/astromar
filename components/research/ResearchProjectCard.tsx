import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { ResearchProjectSummary, ResearchStatus } from "@/lib/sanity.queries";

// Extends StatusBadge's own colour mapping (gray → amber → teal) to the
// whole card, not just the badge text — so an Idea and a Complete entry
// read as different at a glance while scrolling, not just on close
// inspection. Research's own section colour (green — see the homepage
// teaser list) is deliberately not used here: that already marks the
// section elsewhere, and reusing it for every card regardless of status
// was exactly the "no differentiation" problem being fixed.
const STATUS_ACCENT: Record<
  ResearchStatus,
  { border: string; titleHover: string; tag: string }
> = {
  Idea: {
    border: "border-l-void-600",
    titleHover: "",
    tag: "border-void-600 text-star-500",
  },
  "In progress": {
    border: "border-l-nebula-amber-400",
    titleHover: "group-hover:text-nebula-amber-400",
    tag: "border-nebula-amber-400/30 text-nebula-amber-400",
  },
  Complete: {
    border: "border-l-nebula-teal-400",
    titleHover: "group-hover:text-nebula-teal-400",
    tag: "border-nebula-teal-400/30 text-nebula-teal-400",
  },
};

export default function ResearchProjectCard({ project }: { project: ResearchProjectSummary }) {
  const accent = STATUS_ACCENT[project.status];

  return (
    <li>
      <Link
        href={`/research/${project.slug.current}`}
        className={`group block border border-void-700 border-l-2 ${accent.border} bg-void-900 p-5 transition-colors hover:border-void-600`}
      >
        <div className="flex items-center gap-3">
          <h3 className={`font-mono text-xl uppercase tracking-wide text-star-100 ${accent.titleHover}`}>
            {project.title}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        {project.summary && (
          <p className="mt-1.5 text-sm text-star-500">{project.summary}</p>
        )}
        {project.techniques && project.techniques.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.techniques.map((tag) => (
              <span
                key={tag}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${accent.tag}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </li>
  );
}
