import { defineField, defineType } from "sanity";

export default defineType({
  name: "processingTool",
  title: "Processing tool",
  type: "object",
  description: "One piece of software used to go from raw subs to the finished image.",
  fields: [
    defineField({
      name: "tool",
      title: "Tool",
      type: "string",
      description: 'e.g. "Siril", "Adobe Lightroom", "PixInsight"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      description: 'What it was used for, e.g. "Stacking", "Finishing", "Star reduction"',
    }),
  ],
  preview: {
    select: { title: "tool", subtitle: "role" },
  },
});
