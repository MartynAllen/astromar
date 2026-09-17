"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
import { groupIntoSections, groupPhotosByObject, type CatalogueEntry } from "@/lib/gallery/catalogue";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

// One category accent for the whole catalogue view (Gallery's own section
// colour, teal — see DESIGN.md's Section Colour Rule) rather than a
// per-category colour each, matching The One Accent Rule: this is one
// component, not five differently-branded ones.
const ACCENT = {
  border: "border-nebula-teal-500",
  ring: "focus-visible:outline-nebula-teal-400",
  text: "text-nebula-teal-400",
  badgeBorder: "border-nebula-teal-500/40",
  badgeBg: "bg-nebula-teal-500/10",
};

function Tile({
  entry,
  expanded,
  onToggle,
  returnTo,
}: {
  entry: CatalogueEntry;
  expanded: boolean;
  onToggle: () => void;
  returnTo?: string;
}) {
  const dims = entry.lead.mainImage.dimensions;
  const width = dims?.width ?? 1200;
  const height = dims?.height ?? 800;
  const multi = entry.photos.length > 1;

  const thumb = (
    <div className="relative aspect-square overflow-hidden border border-void-700 bg-void-900">
      <Image
        src={urlFor(entry.lead.mainImage).width(600).height(600).fit("crop").url()}
        alt={entry.lead.caption || entry.key}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 45vw"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {multi && (
        <span
          className={`absolute right-2 top-2 z-10 inline-flex items-center rounded-full border ${ACCENT.badgeBorder} ${ACCENT.badgeBg} px-2 py-0.5 font-mono text-xs text-nebula-teal-300 backdrop-blur-sm`}
        >
          {entry.photos.length}
        </span>
      )}
    </div>
  );

  const caption = (
    <div className="mt-2">
      <p className="font-mono text-sm uppercase tracking-wide text-star-100">{entry.key}</p>
      {entry.designation && (
        <p className="font-mono text-xs text-star-500">{entry.designation}</p>
      )}
    </div>
  );

  // Single-photo entries go straight to the detail page — no reason to make
  // the common case (most objects have exactly one shot today) cost an
  // extra click. Multi-photo entries expand in place instead of navigating,
  // since there's no single canonical photo to land on.
  if (!multi) {
    const href = returnTo
      ? `/gallery/${entry.lead.slug.current}?from=${encodeURIComponent(returnTo)}`
      : `/gallery/${entry.lead.slug.current}`;
    return (
      <Link href={href} prefetch={false} className={`group block outline-offset-4 ${ACCENT.ring}`}>
        {thumb}
        {caption}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`group block w-full text-left outline-offset-4 ${ACCENT.ring}`}
    >
      {thumb}
      {caption}
    </button>
  );
}

function ExpandedRow({ entry, returnTo }: { entry: CatalogueEntry; returnTo?: string }) {
  return (
    <div
      className={`col-span-full border-l-2 ${ACCENT.border} bg-void-900/50 p-4`}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-star-500">
        Every shot of {entry.key}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {entry.photos.map((photo) => (
          <PhotoTile key={photo._id} photo={photo} returnTo={returnTo} />
        ))}
      </div>
    </div>
  );
}

function PhotoTile({ photo, returnTo }: { photo: AstroPhotoSummary; returnTo?: string }) {
  const dims = photo.mainImage.dimensions;
  const href = returnTo
    ? `/gallery/${photo.slug.current}?from=${encodeURIComponent(returnTo)}`
    : `/gallery/${photo.slug.current}`;
  return (
    <Link href={href} prefetch={false} className="group block">
      <div className="relative aspect-square overflow-hidden border border-void-700 bg-void-950">
        <Image
          src={urlFor(photo.mainImage).width(400).height(400).fit("crop").url()}
          alt={photo.caption || photo.title}
          width={dims?.width ?? 800}
          height={dims?.height ?? 800}
          sizes="(min-width: 1024px) 15vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-1.5 truncate font-mono text-xs text-star-500">{photo.title}</p>
    </Link>
  );
}

export default function CatalogueGrid({
  photos,
  returnTo,
}: {
  photos: AstroPhotoSummary[];
  returnTo?: string;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <p className="py-16 text-center text-star-500">
        No photos in this category yet — check back soon.
      </p>
    );
  }

  const sections = groupIntoSections(groupPhotosByObject(photos));

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <div key={section.category}>
          <div className="mb-4 border-b border-void-700 pb-3">
            <h2 className="font-mono text-2xl uppercase tracking-wide text-star-100">
              {section.label}
            </h2>
            <p className="mt-1 text-sm text-star-500">
              {section.entries.length} {section.entries.length === 1 ? "object" : "objects"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {section.entries.map((entry) => (
              <div key={entry.key} className="contents">
                <Tile
                  entry={entry}
                  expanded={expandedKey === entry.key}
                  onToggle={() => setExpandedKey((k) => (k === entry.key ? null : entry.key))}
                  returnTo={returnTo}
                />
                {expandedKey === entry.key && <ExpandedRow entry={entry} returnTo={returnTo} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
