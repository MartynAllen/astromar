import { defineField, defineType } from "sanity";
import { StarIcon } from "@sanity/icons/Star";

export default defineType({
  name: "reviewPost",
  title: "Review",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "productName",
      title: "Product name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "productType",
      title: "Product type",
      type: "string",
      description: 'Free text, e.g. "Telescope", "Filter", "Imaging software"',
    }),
    defineField({
      name: "productImage",
      title: "Product image",
      type: "image",
      // exif/location deliberately excluded — see astroPhoto.ts mainImage.
      options: { hotspot: true, metadata: ["blurhash", "lqip", "palette"] },
      fields: [
        defineField({
          name: "creditText",
          title: "Photo credit",
          type: "string",
          description:
            'Required for anything not your own photo — e.g. "Jacek Halicki / Wikimedia Commons, CC BY-SA 4.0". Shown under the image on the review page.',
        }),
        defineField({
          name: "creditUrl",
          title: "Credit link",
          type: "url",
          description: "Usually the license page (e.g. the CC BY-SA deed) or the source page.",
        }),
      ],
    }),
    defineField({
      name: "rating",
      title: "Rating (out of 5)",
      type: "number",
      validation: (r) => r.required().min(1).max(5),
    }),
    defineField({
      name: "affiliateLinks",
      title: "Affiliate links",
      type: "array",
      of: [{ type: "affiliateLink" }],
    }),
    defineField({
      name: "pros",
      title: "Pros",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "cons",
      title: "Cons",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "verdict", title: "Verdict", type: "text", rows: 3 }),
    defineField({
      name: "body",
      title: "Full review",
      type: "array",
      of: [{ type: "block" }, { type: "bodyImage" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "productName", rating: "rating", media: "productImage" },
    prepare({ title, subtitle, rating, media }) {
      return {
        title,
        subtitle: rating ? `${subtitle} · ${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : subtitle,
        media,
      };
    },
  },
});
