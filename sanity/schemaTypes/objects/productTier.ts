import { defineField, defineType } from "sanity";

export default defineType({
  name: "productTier",
  title: "Product tier",
  type: "object",
  description:
    "A price-tier block for buying guides — a heading, a short note on what's realistic at this level, then New and Used product columns. Drop into a guide article's body wherever a tier belongs.",
  fields: [
    defineField({
      name: "tierTitle",
      title: "Tier title",
      type: "string",
      description: 'e.g. "Under £300 — grab-and-go"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tierNote",
      title: "What's realistic at this level",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "newOptions",
      title: "New (via Amazon)",
      type: "array",
      of: [{ type: "recommendedAccessory" }],
    }),
    defineField({
      name: "usedOptions",
      title: "Used (via eBay)",
      type: "array",
      of: [{ type: "recommendedAccessory" }],
      description:
        "Leave empty until the eBay Partner Network link is set up — the page shows an honest \"coming soon\" note instead of a blank column, never a placeholder or dead link.",
    }),
  ],
  preview: {
    select: { title: "tierTitle", newCount: "newOptions", usedCount: "usedOptions" },
    prepare({ title, newCount, usedCount }) {
      const n = Array.isArray(newCount) ? newCount.length : 0;
      const u = Array.isArray(usedCount) ? usedCount.length : 0;
      return { title, subtitle: `${n} new · ${u} used` };
    },
  },
});
