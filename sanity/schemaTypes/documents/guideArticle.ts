import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons/Book";

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
      options: {
        list: ["Buying Gear", "The Night Sky", "Technique"],
      },
      description:
        "Which section this appears under on /learn. Sections display in a fixed order there (see SECTION_ORDER in LearnFilter.tsx) — add a new one to that list too if you add one here.",
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
    defineField({
      name: "contentType",
      title: "Content type",
      type: "string",
      options: { list: ["How-To", "Explainer"] },
      initialValue: "How-To",
      validation: (r) => r.required(),
      description:
        'How-To: task-oriented, "how do I focus with a Bahtinov mask". Explainer: conceptual, "what\'s the difference between an emission and reflection nebula". Drives the filter pills on /learn.',
    }),
    defineField({ name: "summary", title: "Summary", type: "text", rows: 2 }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true, metadata: ["blurhash", "lqip", "palette"] },
      description:
        "Shown as a thumbnail on the /learn index. Reuse a real photo or diagram from the article's own body rather than uploading something new. Required going forward — a design review flagged that some articles having one and others not made the index read as unfinished rather than designed. Two existing articles (Your First Telescope; Turning Your Telescope Into an Astrophotography Rig) predate this rule and have none yet — add a real one here next time either is edited.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        { type: "bodyImage" },
        { type: "bodyImageRow" },
        { type: "skyDiagram" },
        { type: "code", options: { withFilename: true } },
        { type: "productTier" },
        { type: "specComparison" },
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
