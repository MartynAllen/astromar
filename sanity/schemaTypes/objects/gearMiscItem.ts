import { defineField, defineType } from "sanity";

// One line inside a catch-all "Miscellaneous" gear tile — each with its own
// optional affiliate link, so a reader can go and buy that exact cable/lead
// without it needing a full gearItem tile of its own.
export default defineType({
  name: "gearMiscItem",
  title: "Misc item",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "affiliateLink",
      title: "Affiliate link",
      type: "affiliateLink",
      description: "Optional — leave empty if there's no single product to point at (e.g. spec still to be decided).",
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "affiliateLink.label" },
  },
});
