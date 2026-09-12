import { defineField, defineType } from "sanity";

export default defineType({
  name: "specComparisonRow",
  title: "Row",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "values",
      title: "Values (one per device, same order as the parent table's device list)",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.required().min(2).max(4),
    }),
  ],
  preview: {
    select: { title: "label", values: "values" },
    prepare: ({ title, values }) => ({ title, subtitle: (values ?? []).join(" · ") }),
  },
});
