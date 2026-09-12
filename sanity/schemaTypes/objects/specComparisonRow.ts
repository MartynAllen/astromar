import { defineField, defineType } from "sanity";

export default defineType({
  name: "specComparisonRow",
  title: "Row",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "valueA", title: "Value (device A)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "valueB", title: "Value (device B)", type: "string", validation: (r) => r.required() }),
  ],
  preview: {
    select: { title: "label", a: "valueA", b: "valueB" },
    prepare: ({ title, a, b }) => ({ title, subtitle: `${a} vs ${b}` }),
  },
});
