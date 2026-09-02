import { defineField, defineType } from "sanity";
import { ImageIcon } from "@sanity/icons/Image";
import ShotDetailsAutofill from "../components/ShotDetailsAutofill";

interface SlugSourceDoc {
  title?: string;
  shotDetails?: { targetCatalogId?: string; captureDate?: string };
}

export default defineType({
  name: "astroPhoto",
  title: "Astro Photo",
  type: "document",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      validation: (r) => r.required(),
      options: {
        // Title alone collides for repeat targets (e.g. two NGC 7000 shoots) —
        // default to target + capture date instead.
        source: (doc) => {
          const d = doc as SlugSourceDoc;
          const target = d.shotDetails?.targetCatalogId || d.title || "photo";
          const date = d.shotDetails?.captureDate?.slice(0, 10) ?? "";
          return `${target} ${date}`.trim();
        },
        maxLength: 96,
      },
    }),
    defineField({
      name: "mainImage",
      title: "Image (watermarked, public)",
      type: "image",
      description:
        "What visitors actually see everywhere on the site — the import script bakes the watermark into this copy automatically. The clean original lives separately in Print master below, for print orders only.",
      validation: (r) => r.required(),
      options: {
        hotspot: true,
        // "exif"/"location" deliberately excluded: Sanity's own asset
        // pipeline would extract and store them from the uploaded file's
        // EXIF (GPS coordinates included) on the public asset document,
        // independent of and in addition to shotDetails — the exact same
        // "public dataset" exposure already fixed once for shotDetails and
        // siteSettings. Nothing in the app reads either key.
        metadata: ["blurhash", "lqip", "palette"],
      },
    }),
    defineField({
      name: "printMasterImage",
      title: "Print master (unwatermarked)",
      type: "image",
      description:
        "The clean, unwatermarked original — used only for Prodigi print orders, never rendered anywhere on the public site. mainImage above carries the watermark and is what visitors actually see. Populated automatically by the import script; only touch this manually if you know what you're doing.",
      options: { metadata: ["blurhash"] },
    }),
    defineField({
      name: "printRotation",
      title: "Print rotation",
      type: "number",
      options: { list: [90, 180, 270] },
      description:
        "Rotates the print/Quick-View crop only — the gallery image itself is untouched. Print sizes here are all portrait-ish (ratio 0.71-0.8), so a diagonally-oriented target (e.g. Andromeda's long axis running corner-to-corner in a landscape frame) can lose its outer edges to a plain centre-crop; rotating so the target's long axis runs closer to vertical fixes that. Leave empty for targets that don't need it.",
    }),
    defineField({
      name: "maxPrintLongEdgeIn",
      title: "Max print size (longest edge, inches)",
      type: "number",
      validation: (r) => r.positive(),
      description:
        "Caps which catalog sizes this photo can be sold at, for a source that can't support the full range at real print resolution (e.g. a lower-resolution single-frame capture, not a long-stacked deep-sky shot). Set to the longest edge of the largest size that still holds up — e.g. 10 to cap at 8x10. Leave empty to offer every size in the catalog, as normal.",
    }),
    defineField({
      name: "printCrop",
      title: "Print crop",
      type: "object",
      description:
        "Trims a strip off one or more edges (fraction of that edge, 0-1) before the print/Quick-View crop runs — for excluding something in the raw frame a plain centre-crop wouldn't reliably avoid (a roofline caught in shot, a foreground object). Affects print orders and the Quick View preview only — the gallery image itself is untouched. Leave every field empty for photos that don't need it.",
      fields: [
        defineField({ name: "top", title: "Top", type: "number", validation: (r) => r.min(0).max(1) }),
        defineField({ name: "bottom", title: "Bottom", type: "number", validation: (r) => r.min(0).max(1) }),
        defineField({ name: "left", title: "Left", type: "number", validation: (r) => r.min(0).max(1) }),
        defineField({ name: "right", title: "Right", type: "number", validation: (r) => r.min(0).max(1) }),
      ],
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "file",
      options: { accept: "video/*" },
      description:
        "Optional — a short clip to play on this photo's detail page (mainImage above is used as its poster frame). Stored directly in Sanity, same as any other asset, not a separate hosting service.",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Deep sky", value: "deep-sky" },
          { title: "Lunar", value: "lunar" },
          { title: "Planetary", value: "planetary" },
          { title: "Wide field", value: "wide-field" },
          { title: "Gear", value: "gear" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Short 1-2 sentence blurb — used as the card subtitle and meta description fallback.",
    }),
    defineField({
      name: "story",
      title: "Story",
      type: "array",
      of: [{ type: "block" }],
      description: "Optional long-form narrative for the photo's detail page.",
    }),
    defineField({ name: "gearNotes", title: "Gear notes", type: "string" }),
    defineField({
      name: "shotDetails",
      title: "Shot details",
      type: "shotDetails",
      components: { input: ShotDetailsAutofill },
    }),
    defineField({
      name: "processingTools",
      title: "Processing tools",
      type: "array",
      of: [{ type: "processingTool" }],
      description: "What this shot was actually processed with, e.g. stacked in Siril, finished in Lightroom.",
    }),
    defineField({
      name: "featured",
      title: "Featured on home page",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "availableAsPrint",
      title: "Available as a print",
      type: "boolean",
      initialValue: false,
      description: "Turns on the print/buy panel on this photo's detail page.",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "sourceFilename",
      title: "Source filename",
      type: "string",
      readOnly: true,
      hidden: true,
      description: "Idempotency key for the import script — do not edit.",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  orderings: [
    {
      title: "Capture date, newest",
      name: "captureDateDesc",
      by: [{ field: "shotDetails.captureDate", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      target: "shotDetails.targetCommonName",
      subs: "shotDetails.subCount",
      exp: "shotDetails.subExposureSeconds",
      filter: "shotDetails.filter",
      media: "mainImage",
    },
    prepare({ title, target, subs, exp, filter, media }) {
      const summary =
        subs && exp
          ? `${target ?? ""} · ${((subs * exp) / 60).toFixed(1)} min · ${filter ?? ""}`
          : target;
      return { title, subtitle: summary, media };
    },
  },
});
