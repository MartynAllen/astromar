"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import RatingStars from "@/components/reviews/RatingStars";
import { urlFor } from "@/sanity/image";
import type { ReviewSummary } from "@/lib/sanity.queries";

function matches(review: ReviewSummary, query: string) {
  const haystack = [review.title, review.productName, review.productType, review.verdict]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function ReviewSearch({ reviews }: { reviews: ReviewSummary[] }) {
  const [query, setQuery] = useState("");

  function coverImage(review: ReviewSummary) {
    return review.productImages?.[0]?.image;
  }

  const filtered = useMemo(
    () => (query.trim() ? reviews.filter((r) => matches(r, query.trim())) : reviews),
    [reviews, query],
  );

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search reviews</span>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-700"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reviews — product, type…"
          className="w-full border border-void-600 bg-void-950 py-2 pl-9 pr-9 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-star-500 transition-colors hover:text-star-100"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </label>

      {query.trim() && filtered.length > 0 && (
        <p className="mt-3 text-sm text-star-500">
          {filtered.length} {filtered.length === 1 ? "review" : "reviews"} matching &ldquo;{query}&rdquo;
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-star-500">
          No reviews match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {filtered.map((review) => (
            <li key={review._id}>
              <Link
                href={`/reviews/${review.slug.current}`}
                className="group flex gap-4 border border-void-700 border-l-2 border-l-nebula-rose-400 bg-void-900 p-5 transition-colors hover:border-void-600"
              >
                {coverImage(review)?.asset ? (
                  <Image
                    src={urlFor(coverImage(review)!).width(160).height(160).url()}
                    alt={review.productName}
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-none border border-void-700 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-none flex-col items-center justify-center border border-void-700 bg-void-950">
                    <RatingStars rating={review.rating} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-mono text-xl uppercase tracking-wide text-star-100 group-hover:text-nebula-rose-400">
                    {review.title}
                  </h2>
                  <p className="text-sm text-star-500">{review.productType}</p>
                  {coverImage(review)?.asset && (
                    <div className="mt-1">
                      <RatingStars rating={review.rating} />
                    </div>
                  )}
                  {review.verdict && (
                    <p className="mt-3 border-l-2 border-nebula-rose-500 pl-3 text-sm text-star-100">
                      {review.verdict}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
