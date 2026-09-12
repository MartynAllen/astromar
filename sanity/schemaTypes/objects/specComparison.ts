import { defineField, defineType } from "sanity";

export default defineType({
  name: "specComparison",
  title: "Spec comparison",
  type: "object",
  description:
    "A spec table for comparing 2-4 pieces of gear head-to-head — drop into a guide article's body wherever a side-by-side spec breakdown belongs.",
  fields: [
    defineField({
      name: "devices",
      title: "Device names",
      type: "array",
      of: [{ type: "string" }],
      description: "2-4 devices, in the order their columns should appear.",
      validation: (r) => r.required().min(2).max(4),
    }),
    defineField({
      name: "rows",
      title: "Rows",
      description: "Each row's values must be listed in the same order as the device names above.",
      type: "array",
      of: [{ type: "specComparisonRow" }],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { devices: "devices", rows: "rows" },
    prepare({ devices, rows }) {
      const n = Array.isArray(rows) ? rows.length : 0;
      return { title: (devices ?? []).join(" vs "), subtitle: `${n} row${n === 1 ? "" : "s"}` };
    },
  },
});
