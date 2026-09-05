"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GuideArticleSummary, GuideContentType } from "@/lib/sanity.queries";

const CONTENT_TYPES: { label: string; value: GuideContentType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "How-To", value: "How-To" },
  { label: "Explainer", value: "Explainer" },
];

// Read client-side rather than as a server prop — keeps /learn itself
// static (see page.tsx); reading searchParams on the server would opt the
// whole route out of static generation just to seed this one default.
function useInitialContentType(): GuideContentType | undefined {
  const searchParams = useSearchParams();
  const raw = searchParams.get("type");
  return CONTENT_TYPES.find((c) => c.value === raw)?.value;
}

export default function LearnFilter({ articles }: { articles: GuideArticleSummary[] }) {
  const router = useRouter();
  const initialContentType = useInitialContentType();
  const [contentType, setContentType] = useState<GuideContentType | undefined>(initialContentType);

  const filtered = useMemo(
    () => articles.filter((a) => !contentType || a.contentType === contentType),
    [articles, contentType],
  );
  const sections = useMemo(() => Array.from(new Set(filtered.map((a) => a.section))), [filtered]);

  function selectContentType(value: GuideContentType | undefined) {
    setContentType(value);
    router.replace(value ? `/learn?type=${value}` : "/learn", { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by content type">
        {CONTENT_TYPES.map((c) => {
          const isActive = c.value === contentType;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => selectContentType(c.value)}
              aria-pressed={isActive}
              className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400"
                  : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-star-500">No articles match this filter yet.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <div key={section}>
              <h2 className="font-mono text-xl uppercase tracking-wide text-nebula-amber-400">{section}</h2>
              <ul className="mt-3 divide-y divide-void-700">
                {filtered
                  .filter((a) => a.section === section)
                  .map((article) => (
                    <li key={article._id} className="py-4">
                      <Link href={`/learn/${article.slug.current}`} className="group block">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-lg uppercase tracking-wide text-star-100 group-hover:text-nebula-amber-400">
                            {article.title}
                          </h3>
                          {article.difficulty && (
                            <span className="rounded-full border border-void-600 px-2 py-0.5 text-xs text-star-500">
                              {article.difficulty}
                            </span>
                          )}
                        </div>
                        {article.summary && <p className="mt-1 text-sm text-star-500">{article.summary}</p>}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
