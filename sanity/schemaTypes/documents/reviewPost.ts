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
      name: "productImages",
      title: "Product photos",
      type: "array",
      of: [{ type: "reviewGalleryImage" }],
      description:
        "One or more photos of the product itself. The first photo is used as the review's thumbnail and social-share image. Each one is expandable on the review page.",
    }),
    defineField({
      name: "galleryImages",
      title: "Photo gallery",
      type: "array",
      of: [{ type: "reviewGalleryImage" }],
      description:
        "Optional — extra photos to complement the review (setup shots, detail shots, etc.). Leave empty and this section won't appear on the page at all.",
    }),
    defineField({
      name: "recommendedAccessories",
      title: "Recommended accessories",
      type: "array",
      of: [{ type: "recommendedAccessory" }],
      description:
        "Optional — store-bought accessories worth pairing with this product, each with its own affiliate link. Leave empty and this section won't appear.",
    }),
    defineField({
      name: "printableAccessories",
      title: "3D-printable accessories",
      type: "array",
      of: [{ type: "printableAccessory" }],
      description:
        "Optional — links to 3D-printable add-ons for this product. Leave empty and this section won't appear.",
    }),
    defineField({
      name: "rating",
      title: "Rating (out of 5)",
      type: "number",
      description: "Half-point increments allowed, e.g. 4.5.",
      options: {
        list: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
      },
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
    select: {
      title: "title",
      subtitle: "productName",
      rating: "rating",
      media: "productImages.0.image",
    },
    prepare({ title, subtitle, rating, media }) {
      const stars = rating
        ? `${"★".repeat(Math.floor(rating))}${rating % 1 !== 0 ? "⯨" : ""}${"☆".repeat(Math.floor(5 - rating))}`
        : undefined;
      return {
        title,
        subtitle: stars ? `${subtitle} · ${stars} (${rating})` : subtitle,
        media,
      };
    },
  },
});
