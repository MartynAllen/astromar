import { defineField, defineType } from "sanity";

export default defineType({
  name: "affiliateLink",
  title: "Affiliate link",
  type: "object",
  fields: [
    defineField({
      name: "retailer",
      title: "Retailer",
      type: "string",
      initialValue: "Amazon",
    }),
    defineField({
      name: "label",
      title: "Button label",
      type: "string",
      initialValue: "Buy on Amazon",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (r) => r.required().uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "url" },
  },
});
