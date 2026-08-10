import { defineField, defineType } from "sanity";
import { CommentIcon } from "@sanity/icons/Comment";

export default defineType({
  name: "discussionPost",
  title: "Weekly Discussion",
  type: "document",
  icon: CommentIcon,
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
      // The slug doubles as the Giscus thread key (mapping="pathname"), so it's
      // deliberately not auto-generated from a title that might later change.
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "weekOf",
      title: "Week of",
      type: "date",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "topic",
      title: "Topic prompt",
      type: "text",
      rows: 2,
      description: "The short question or prompt that kicks off the discussion.",
    }),
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
    { title: "Week, newest", name: "weekOfDesc", by: [{ field: "weekOf", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "weekOf" },
  },
});
