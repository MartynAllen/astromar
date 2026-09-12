import { defineField, defineType } from "sanity";

export default defineType({
  name: "specComparison",
  title: "Spec comparison",
  type: "object",
  description:
    "A two-column spec table for comparing two pieces of gear head-to-head — drop into a guide article's body wherever a side-by-side spec breakdown belongs.",
  fields: [
    defineField({ name: "deviceA", title: "Device A name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "deviceB", title: "Device B name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      of: [{ type: "specComparisonRow" }],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { a: "deviceA", b: "deviceB", rows: "rows" },
    prepare({ a, b, rows }) {
      const n = Array.isArray(rows) ? rows.length : 0;
      return { title: `${a} vs ${b}`, subtitle: `${n} row${n === 1 ? "" : "s"}` };
    },
  },
});
