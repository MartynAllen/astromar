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
