import { defineField, defineType } from "sanity";

export default defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      description: "Falls back to the document title if left blank.",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (r) => r.max(160),
    }),
    defineField({
      name: "ogImage",
      title: "Social share image",
      type: "image",
      description: "Falls back to the document's main image if left blank.",
      // exif/location deliberately excluded — see astroPhoto.ts mainImage.
      options: { metadata: ["blurhash", "lqip", "palette"] },
    }),
  ],
  options: { collapsible: true, collapsed: true },
});
