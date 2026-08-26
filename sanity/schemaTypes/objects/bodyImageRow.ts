import { defineField, defineType } from "sanity";

export default defineType({
  name: "bodyImageRow",
  title: "Image row",
  type: "object",
  description: "Two or more images shown side by side — for direct comparison, e.g. before/after or a sequence of shots.",
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "object",
          name: "item",
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
              description: "Optional small caption shown under this image.",
            }),
          ],
          preview: {
            select: { title: "alt", subtitle: "caption", media: "image" },
          },
        },
      ],
      validation: (r) => r.required().min(2).max(4),
    }),
  ],
  preview: {
    select: { images: "images" },
    prepare({ images }) {
      const list = (images as { image?: unknown }[] | undefined) ?? [];
      return {
        title: `Image row (${list.length})`,
        media: list[0]?.image as never,
      };
    },
  },
});
