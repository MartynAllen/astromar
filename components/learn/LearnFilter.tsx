"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { urlFor } from "@/sanity/image";
import type { GuideArticleSummary, GuideContentType } from "@/lib/sanity.queries";

const CONTENT_TYPES: { label: string; value: GuideContentType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "How-To", value: "How-To" },
  { label: "Explainer", value: "Explainer" },
];

// Sections don't have a real ordering field of their own — this is the one
// place that decides how they're sequenced on the page, deliberately
// (buying decisions first, then understanding the sky itself, then
// hands-on operating technique) rather than leaving it to whatever order
// the query's plain alphabetical sort happens to produce. Add a new
// section here (and to guideArticle.ts's section field options) together;
// anything not listed still renders, alphabetised, after all of these,
// rather than silently vanishing.
const SECTION_ORDER = ["Buying Gear", "The Night Sky", "Technique"];

const SECTION_DESCRIPTIONS: Record<string, string> = {
  "Buying Gear": "What to actually buy, and in what order, as the hobby gets more serious.",
  "The Night Sky": "Understanding what you're actually looking at, and what your own sky lets you see.",
  Technique: "Hands-on skills for getting more out of the gear you've already got.",
};

function sortSections(sections: string[]): string[] {
  return [...sections].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a);
    const bi = SECTION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

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
  const sections = useMemo(
    () => sortSections(Array.from(new Set(filtered.map((a) => a.section)))),
    [filtered],
  );

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

      {/* Always mounted (not conditionally rendered) so aria-live actually
          fires on a text change rather than an element appearing — a
          filter that empties a whole section out of view otherwise gives
          no acknowledgment at all that anything happened, sighted or not. */}
      <p aria-live="polite" className="mt-3 text-sm text-star-500">
        {contentType &&
          `Showing ${filtered.length} ${filtered.length === 1 ? "article" : "articles"} tagged ${contentType}.`}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-star-500">No articles match this filter yet.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <div key={section}>
              <h2 className="font-mono text-xl uppercase tracking-wide text-nebula-amber-400">{section}</h2>
              {SECTION_DESCRIPTIONS[section] && (
                <p className="mt-1 text-sm text-star-500">{SECTION_DESCRIPTIONS[section]}</p>
              )}
              <ul className="mt-3 divide-y divide-void-700">
                {filtered
                  .filter((a) => a.section === section)
                  .map((article) => (
                    <li key={article._id} className="py-4">
                      {/* items-center, not items-start: a short thumbnail
                          next to a title+meta+summary block that wraps to
                          4-6 lines on mobile otherwise leaves the dead
                          space concentrated below the image, reading as a
                          failed image load rather than a design choice. */}
                      <Link href={`/learn/${article.slug.current}`} className="group flex items-center gap-4">
                        {article.coverImage?.asset && (
                          <span className="block h-20 w-20 flex-none overflow-hidden border border-void-700 sm:h-24 sm:w-24">
                            <Image
                              src={urlFor(article.coverImage).width(192).height(192).fit("crop").url()}
                              alt={`Cover image for ${article.title}`}
                              width={192}
                              height={192}
                              sizes="96px"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                            />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-mono text-lg uppercase tracking-wide text-star-100 group-hover:text-nebula-amber-400">
                            {article.title}
                          </h3>
                          {/* star-500 throughout, not amber — amber is the
                              section heading's colour above; sharing it
                              here blurred the two hierarchy tiers together
                              on a fast scan (a design-review finding). */}
                          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-star-500">
                            {[article.contentType, article.difficulty].filter(Boolean).join(" · ")}
                            {article.readingTime && ` · ${article.readingTime}`}
                          </p>
                          {article.summary && <p className="mt-1 text-sm text-star-500">{article.summary}</p>}
                        </div>
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
