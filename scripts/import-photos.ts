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
import { applyWatermark } from "./lib/watermark";

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

  // Clean original — this is what a print order actually uses, never
  // rendered on the public site. Uploaded first so a watermark failure
  // doesn't leave the document referencing a missing asset for either field.
  const printMasterAsset = await writeClient.assets.upload("image", buf, { filename });

  // Public-facing copy — everything the site actually displays.
  const watermarkedBuf = await applyWatermark(buf);
  const displayAsset = await writeClient.assets.upload("image", watermarkedBuf, {
    filename: filename.replace(IMAGE_EXT_RE, "-watermarked.jpg"),
  });

  const docId = `drafts.astro-photo-${slugify(filename)}`;
  await writeClient.createOrReplace({
    _id: docId,
    _type: "astroPhoto",
    title,
    slug: { _type: "slug", current: slug },
    mainImage: {
      _type: "image",
      asset: { _type: "reference", _ref: displayAsset._id },
    },
    printMasterImage: {
      _type: "image",
      asset: { _type: "reference", _ref: printMasterAsset._id },
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
      // Deliberately not stored: resolved.latitude/longitude are the real
      // home GPS coordinates baked into the EXIF/FITS header by the capture
      // device. Nothing in the app renders them (SkyBackdrop uses a fixed,
      // already-public approximate location instead) — but this dataset is
      // on Sanity's free "public" tier, so any field written here is
      // readable by anyone querying the API directly, with no token,
      // completely bypassing whatever the frontend chooses not to show.
      // Storing them at all was the actual leak; not storing them is the
      // fix, not restricting who reads the field.
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
