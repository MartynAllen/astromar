import { defineField, defineType } from "sanity";

export default defineType({
  name: "productTier",
  title: "Product tier",
  type: "object",
  description:
    "A price-tier block for buying guides — a heading, a short note on what's realistic at this level, then Amazon picks. Drop into a guide article's body wherever a tier belongs.",
  fields: [
    defineField({
      name: "tierTitle",
      title: "Tier title",
      type: "string",
      description: 'e.g. "Under £300 — grab-and-go"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tierNote",
      title: "What's realistic at this level",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "products",
      title: "Products (via Amazon)",
      type: "array",
      of: [{ type: "recommendedAccessory" }],
      description:
        "Each product's own affiliate link has an optional price-comparison note field — the same one already used on the About page's gear tiles — worth using for a specific \"also worth checking X for a used one\" tip on that listing. A generic secondhand-marketplace note is shown automatically under every tier regardless.",
    }),
  ],
  preview: {
    select: { title: "tierTitle", products: "products" },
    prepare({ title, products }) {
      const n = Array.isArray(products) ? products.length : 0;
      return { title, subtitle: `${n} product${n === 1 ? "" : "s"}` };
    },
  },
});
