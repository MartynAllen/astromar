import { defineField, defineType } from "sanity";

export default defineType({
  name: "reviewGalleryImage",
  title: "Gallery photo",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      // exif/location deliberately excluded — see astroPhoto.ts mainImage.
      options: { hotspot: true, metadata: ["blurhash", "lqip", "palette"] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description: "Describes the image for screen readers and search engines.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({
      name: "creditText",
      title: "Photo credit",
      type: "string",
      description: "Only needed if this isn't your own photo — see productImages for the format.",
    }),
    defineField({ name: "creditUrl", title: "Credit link", type: "url" }),
  ],
  preview: {
    select: { title: "alt", subtitle: "caption", media: "image" },
  },
});
