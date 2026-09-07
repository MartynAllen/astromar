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
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      options: {
        list: [
          { title: "Camera", value: "camera" },
          { title: "Telescope", value: "telescope" },
          { title: "Guide scope", value: "guidescope" },
          { title: "Mount", value: "mount" },
          { title: "Controller", value: "controller" },
          { title: "Battery / power", value: "battery" },
          { title: "Software", value: "software" },
          { title: "Generic accessory", value: "accessory" },
        ],
      },
      description:
        "Optional — shown only when there's no photo above. Falls back to a generic icon for the category if left unset. Pick whichever actually matches the item (e.g. a mount isn't the same shape as a wireless controller) rather than leaving every accessory on the same generic cog.",
    }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 2 }),
    defineField({
      name: "items",
      title: "Included items",
      type: "array",
      of: [{ type: "gearMiscItem" }],
      description:
        "Optional — for a catch-all tile (e.g. \"Miscellaneous\") listing several small things at once, each with its own optional buy link.",
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
