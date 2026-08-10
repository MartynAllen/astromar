import { defineField, defineType } from "sanity";

export default defineType({
  name: "gearItem",
  title: "Gear item",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: ["telescope", "camera", "accessory", "software"],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "image", title: "Image", type: "image" }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 2 }),
    defineField({
      name: "affiliateLink",
      title: "Affiliate link",
      type: "affiliateLink",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "category", media: "image" },
  },
});
