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
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      // exif/location deliberately excluded — see astroPhoto.ts mainImage
      // for why: this dataset is on Sanity's free public tier, so anything
      // extracted here is readable by anyone querying the API directly.
      options: { hotspot: true, metadata: ["blurhash", "lqip", "palette"] },
    }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 2 }),
    defineField({
      name: "items",
      title: "Included items",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Optional — for a catch-all tile (e.g. \"Miscellaneous\") listing several small things at once.",
    }),
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
