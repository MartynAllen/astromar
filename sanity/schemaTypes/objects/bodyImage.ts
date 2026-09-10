import { defineField, defineType } from "sanity";

export default defineType({
  name: "bodyImage",
  title: "Image",
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
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Optional small caption shown under the image.",
    }),
    defineField({
      name: "size",
      title: "Size",
      type: "string",
      options: {
        list: [
          { title: "Regular (full column width)", value: "regular" },
          { title: "Small (centred, narrower)", value: "small" },
        ],
        layout: "radio",
      },
      initialValue: "regular",
      description: "Use Small for a supporting illustration that shouldn't dominate the section.",
    }),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
});
