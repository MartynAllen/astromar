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
    defineField({
      name: "priceComparisonNote",
      title: "Price comparison note",
      type: "text",
      rows: 2,
      description:
        'Optional transparency note shown under the button, e.g. "Also worth checking Facebook Marketplace or MPB to compare prices."',
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "url" },
  },
});
