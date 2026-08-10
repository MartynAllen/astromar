"use client";

import Giscus from "@giscus/react";

const REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export default function GiscusComments() {
  if (!REPO || !REPO_ID) {
    return (
      <p className="mt-10 border-t border-void-700 pt-6 text-sm text-star-500">
        Comments aren&apos;t connected yet.
      </p>
    );
  }

  return (
    <div className="mt-10 border-t border-void-700 pt-6">
      <Giscus
        repo={REPO as `${string}/${string}`}
        repoId={REPO_ID}
        category={CATEGORY}
        categoryId={CATEGORY_ID}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="transparent_dark"
        loading="lazy"
      />
    </div>
  );
}
