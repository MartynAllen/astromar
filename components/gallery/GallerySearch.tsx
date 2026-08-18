"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhotoGrid from "./PhotoGrid";
import type { AstroPhotoSummary, PhotoCategory } from "@/lib/sanity.queries";

const CATEGORIES: { label: string; value: PhotoCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Deep Sky", value: "deep-sky" },
  { label: "Lunar", value: "lunar" },
  { label: "Planetary", value: "planetary" },
  { label: "Wide Field", value: "wide-field" },
  { label: "Gear", value: "gear" },
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

export default function GallerySearch({ photos }: { photos: AstroPhotoSummary[] }) {
  const router = useRouter();
  const initialCategory = useInitialCategory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PhotoCategory | undefined>(initialCategory);

  const filtered = useMemo(() => {
    return photos.filter((photo) => {
      if (category && photo.category !== category) return false;
      if (query.trim() && !matches(photo, query.trim())) return false;
      return true;
    });
  }, [photos, category, query]);

  function selectCategory(value: PhotoCategory | undefined) {
    setCategory(value);
    router.replace(value ? `/gallery?category=${value}` : "/gallery", { scroll: false });
  }

  return (
    <div>
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
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isActive = c.value === category;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => selectCategory(c.value)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
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
      </div>

      {query.trim() && (
        <p className="mt-4 text-sm text-star-500">
          {filtered.length} {filtered.length === 1 ? "photo" : "photos"} matching &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="mt-6">
        <PhotoGrid photos={filtered} />
      </div>
    </div>
  );
}
