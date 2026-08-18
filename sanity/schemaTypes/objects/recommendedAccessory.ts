import { defineField, defineType } from "sanity";

export default defineType({
  name: "recommendedAccessory",
  title: "Recommended accessory",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "compatibilityNote",
      title: "Compatibility note",
      type: "text",
      rows: 2,
      description:
        'Optional — flag if this also fits other cameras (e.g. "Also fits other EN-EL14 Nikon DSLRs") or is fully universal, so the reader knows to double-check their own model before buying.',
    }),
    defineField({
      name: "affiliateLink",
      title: "Affiliate link",
      type: "affiliateLink",
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "description" },
  },
});
