"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhotoGrid from "./PhotoGrid";
import CatalogueGrid from "./CatalogueGrid";
import type { AstroPhotoSummary, PhotoCategory } from "@/lib/sanity.queries";

const CATEGORIES: { label: string; value: PhotoCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Deep Sky", value: "deep-sky" },
  { label: "Lunar", value: "lunar" },
  { label: "Planetary", value: "planetary" },
  { label: "Wide Field", value: "wide-field" },
  { label: "Gear", value: "gear" },
];

type ViewMode = "grid" | "catalogue";
const VIEWS: { label: string; value: ViewMode }[] = [
  { label: "Grid", value: "grid" },
  { label: "Catalogue", value: "catalogue" },
];

// Read client-side rather than as a server prop — the whole point is to
// keep /gallery itself static (see page.tsx); reading searchParams on the
// server would opt the entire route out of static generation just to seed
// this one default.
function useInitialCategory(): PhotoCategory | undefined {
  const searchParams = useSearchParams();
  const raw = searchParams.get("category");
  return CATEGORIES.find((c) => c.value === raw)?.value;
}

function useInitialPrintsOnly(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("prints") === "true";
}

// Defaults to catalogue on a fresh visit rather than remembering the last
// choice — a plain, unparameterised /gallery link (shared, bookmarked, or
// linked from elsewhere on the site) should always land on the same view.
// Sharing a `?view=grid` link still round-trips correctly.
function useInitialView(): ViewMode {
  const searchParams = useSearchParams();
  return searchParams.get("view") === "grid" ? "grid" : "catalogue";
}

function matches(photo: AstroPhotoSummary, query: string) {
  const haystack = [
    photo.title,
    photo.caption,
    photo.shotDetails?.targetCommonName,
    photo.shotDetails?.targetCatalogId,
    photo.shotDetails?.telescope,
    photo.shotDetails?.filter,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function GallerySearch({
  photos,
  fromPriceGBP,
}: {
  photos: AstroPhotoSummary[];
  fromPriceGBP?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = useInitialCategory();
  const initialPrintsOnly = useInitialPrintsOnly();
  const initialView = useInitialView();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PhotoCategory | undefined>(initialCategory);
  const [printsOnly, setPrintsOnly] = useState(initialPrintsOnly);
  const [view, setView] = useState<ViewMode>(initialView);

  // Kept in sync with the address bar by updateUrl() below (category/prints
  // only — the free-text query box is deliberately not persisted there), so
  // reading it straight back gives each card exactly the filtered URL a
  // "back" from the detail page should return to. undefined when there's no
  // filter active — plain /gallery is already the detail page's own
  // fallback, no need to say so explicitly in every card's URL.
  const qs = searchParams.toString();
  const returnTo = qs ? `/gallery?${qs}` : undefined;

  const filtered = useMemo(() => {
    return photos.filter((photo) => {
      if (category && photo.category !== category) return false;
      if (printsOnly && !photo.availableAsPrint) return false;
      if (query.trim() && !matches(photo, query.trim())) return false;
      return true;
    });
  }, [photos, category, printsOnly, query]);

  function updateUrl(
    nextCategory: PhotoCategory | undefined,
    nextPrintsOnly: boolean,
    nextView: ViewMode,
  ) {
    const params = new URLSearchParams();
    if (nextCategory) params.set("category", nextCategory);
    if (nextPrintsOnly) params.set("prints", "true");
    if (nextView === "grid") params.set("view", nextView);
    const qs = params.toString();
    router.replace(qs ? `/gallery?${qs}` : "/gallery", { scroll: false });
  }

  function selectCategory(value: PhotoCategory | undefined) {
    setCategory(value);
    updateUrl(value, printsOnly, view);
  }

  function togglePrintsOnly() {
    const next = !printsOnly;
    setPrintsOnly(next);
    updateUrl(category, next, view);
  }

  function selectView(value: ViewMode) {
    setView(value);
    updateUrl(category, printsOnly, value);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="group" aria-label="Gallery view">
          {VIEWS.map((v) => {
            const isActive = v.value === view;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => selectView(v.value)}
                aria-pressed={isActive}
                className={`min-h-11 rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                  isActive
                    ? "border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400"
                    : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <span className="text-sm text-star-500">
          {view === "catalogue"
            ? "Grouped by object — one entry per target, however many times it's been shot."
            : "Every photo, newest first."}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search the gallery</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — target, telescope, filter…"
            className="w-full border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => {
            const isActive = c.value === category;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => selectCategory(c.value)}
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
          <button
            type="button"
            onClick={togglePrintsOnly}
            aria-pressed={printsOnly}
            className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              printsOnly
                ? "border-nebula-rose-500 bg-nebula-rose-500/10 text-nebula-rose-400"
                : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
            }`}
          >
            Prints Only
          </button>
        </div>
      </div>

      {query.trim() && (
        <p className="mt-4 text-sm text-star-500">
          {filtered.length} {filtered.length === 1 ? "photo" : "photos"} matching &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="mt-6">
        {view === "catalogue" ? (
          <CatalogueGrid photos={filtered} returnTo={returnTo} />
        ) : (
          <PhotoGrid photos={filtered} fromPriceGBP={fromPriceGBP} returnTo={returnTo} />
        )}
      </div>
    </div>
  );
}
