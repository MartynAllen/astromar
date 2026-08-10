import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons";

export default defineType({
  name: "guideArticle",
  title: "Guide Article",
  type: "document",
  icon: BookIcon,
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
      name: "section",
      title: "Section",
      type: "string",
      description: 'e.g. "Getting Started", "Processing", "Target Planning"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Order within section",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["Beginner", "Intermediate", "Advanced"] },
    }),
    defineField({ name: "summary", title: "Summary", type: "text", rows: 2 }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }, { type: "image" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  orderings: [
    {
      title: "Section, then order",
      name: "sectionOrder",
      by: [
        { field: "section", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "section" },
  },
});
