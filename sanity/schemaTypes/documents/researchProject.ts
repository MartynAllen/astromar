import { defineField, defineType } from "sanity";
import { RocketIcon } from "@sanity/icons/Rocket";

export default defineType({
  name: "researchProject",
  title: "Research Project",
  type: "document",
  icon: RocketIcon,
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
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["Idea", "In progress", "Complete"],
        layout: "radio",
      },
      initialValue: "Idea",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "techniques",
      title: "Techniques",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description:
        'Free-form tags, e.g. "Colour tracking", "Computer vision", "Exoplanet detection"',
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 2,
      description:
        "Short blurb — used as the card subtitle and meta description fallback.",
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "repoUrl",
      title: "Code repository URL",
      type: "url",
    }),
    defineField({
      name: "body",
      title: "Write-up",
      type: "array",
      of: [
        { type: "block" },
        { type: "image" },
        { type: "code", options: { withFilename: true } },
      ],
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
      title: "Published, newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", status: "status", media: "coverImage" },
    prepare({ title, status, media }) {
      return { title, subtitle: status, media };
    },
  },
});
