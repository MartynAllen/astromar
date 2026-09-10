import { defineField, defineType } from "sanity";

// A hand-drawn, self-contained star-finding diagram rendered inline in a
// guide body — no image asset, no licensing, redrawn from real star
// positions at read time (see components/guide/SkyDiagram.tsx). Add a new
// `kind` there and here together.
export default defineType({
  name: "skyDiagram",
  title: "Sky diagram",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Which diagram",
      type: "string",
      options: {
        list: [
          { title: "Finding Polaris from the Plough (north)", value: "finding-polaris" },
          { title: "Finding due south from the Southern Cross", value: "finding-south" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Optional small caption shown under the diagram.",
    }),
  ],
  preview: {
    select: { kind: "kind", caption: "caption" },
    prepare: ({ kind, caption }) => ({ title: `Sky diagram — ${kind ?? "?"}`, subtitle: caption }),
  },
});
