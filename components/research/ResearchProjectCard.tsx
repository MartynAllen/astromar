import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { ResearchProjectSummary } from "@/lib/sanity.queries";

export default function ResearchProjectCard({ project }: { project: ResearchProjectSummary }) {
  return (
    <li>
      <Link
        href={`/research/${project.slug.current}`}
        className="group block border border-void-700 border-l-2 border-l-nebula-green-400 bg-void-900 p-5 transition-colors hover:border-void-600"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-xl uppercase tracking-wide text-star-100 group-hover:text-nebula-green-400">
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
                className="rounded-full border border-nebula-green-400/30 px-2.5 py-0.5 font-mono text-xs text-nebula-green-400"
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
