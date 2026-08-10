/**
 * Ongoing photo ingestion CLI — not a one-off script. Run after every shoot:
 *
 *   npm run import                    # imports scripts/seed-assets/
 *   npm run import -- ./some/folder   # imports a different folder
 *
 * Parses each file's FITS header / Seestar EXIF / filename (in that priority
 * order, see lib/astro/resolveShotDetails.ts), uploads the image, and
 * creates/updates a *draft* astroPhoto document — nothing goes live until
 * reviewed and published in Studio. Re-running is safe: each document's ID
 * is derived deterministically from the source filename.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import exifr from "exifr";
import { writeClient } from "../sanity/client";
import { resolveShotDetails } from "../lib/astro/resolveShotDetails";
import { formatShotSummary } from "../lib/astro/shotDetails";

const IMAGE_EXT_RE = /\.(jpe?g|png)$/i;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeFilename(filename: string): string {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[_-]+/g, " ")
    .trim();
}

function formatDateForTitle(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function extractExif(buf: Buffer) {
  const out = await exifr
    .parse(buf, { makerNote: true })
    .catch(() => null as Record<string, unknown> | null);
  return {
    make: out?.Make as string | undefined,
    imageDescription: out?.ImageDescription as string | undefined,
    makerNote: out?.makerNote as string | undefined,
    dateTimeOriginal: out?.DateTimeOriginal as string | Date | undefined,
    gpsLatitude: out?.latitude as number | undefined,
    gpsLongitude: out?.longitude as number | undefined,
  };
}

async function importOne(dir: string, filename: string) {
  const filePath = path.join(dir, filename);
  const buf = await readFile(filePath);
  const exif = await extractExif(buf);
  const resolved = resolveShotDetails(filename, exif);

  const targetLabel = resolved.targetCommonName || resolved.targetCatalogId;
  const dateLabel = formatDateForTitle(resolved.captureDate);
  const title = targetLabel
    ? [targetLabel, dateLabel].filter(Boolean).join(" — ")
    : humanizeFilename(filename);

  const slugBase = targetLabel
    ? `${targetLabel} ${resolved.captureDate?.slice(0, 10) ?? ""}`
    : humanizeFilename(filename);
  const slug = slugify(slugBase) || slugify(filename);

  const asset = await writeClient.assets.upload("image", buf, { filename });

  const docId = `drafts.astro-photo-${slugify(filename)}`;
  await writeClient.createOrReplace({
    _id: docId,
    _type: "astroPhoto",
    title,
    slug: { _type: "slug", current: slug },
    mainImage: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    },
    ...(resolved.category ? { category: resolved.category } : {}),
    shotDetails: {
      _type: "shotDetails",
      targetCatalogId: resolved.targetCatalogId,
      targetCommonName: resolved.targetCommonName,
      subExposureSeconds: resolved.subExposureSeconds,
      subCount: resolved.subCount,
      filter: resolved.filter,
      isMosaic: resolved.isMosaic,
      captureDate: resolved.captureDate,
      ...(resolved.latitude !== undefined && resolved.longitude !== undefined
        ? {
            captureLocation: {
              _type: "geopoint",
              lat: resolved.latitude,
              lng: resolved.longitude,
            },
          }
        : {}),
    },
    sourceFilename: filename,
    publishedAt: new Date().toISOString(),
  });

  return { filename, resolved, title };
}

async function main() {
  const dir = process.argv[2] ?? path.join("scripts", "seed-assets");
  const entries = await readdir(dir);
  const files = entries.filter((f) => IMAGE_EXT_RE.test(f)).sort();

  if (files.length === 0) {
    console.log(`No image files found in ${dir}`);
    return;
  }

  console.log(`Importing ${files.length} photo(s) from ${dir}\n`);

  const needsReview: string[] = [];
  for (const filename of files) {
    try {
      const { resolved, title } = await importOne(dir, filename);
      const summary = formatShotSummary(resolved) ?? resolved.targetCatalogId ?? "";
      if (resolved.needsReview) {
        needsReview.push(filename);
        console.log(`⚠ ${filename} → needs manual review (no metadata source matched)`);
      } else {
        console.log(`✓ ${filename} → [${resolved.tier}] "${title}" ${summary}`);
      }
    } catch (err) {
      console.error(`✗ ${filename} → import failed:`, (err as Error).message);
    }
  }

  console.log(`\nDone. ${files.length - needsReview.length}/${files.length} auto-resolved.`);
  if (needsReview.length > 0) {
    console.log(`\nNeeds manual review in Studio (category/target unset):`);
    for (const f of needsReview) console.log(`  - ${f}`);
  }
  console.log(`\nAll photos were created as drafts — open /studio to review and publish.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
