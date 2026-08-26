import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons/Tag";

export default defineType({
  name: "printProduct",
  title: "Print Product",
  type: "document",
  icon: TagIcon,
  description:
    "A sellable print size/style (a Prodigi SKU + price), not tied to any one photo — any photo marked \"Available as a print\" can be ordered in any active product here.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'e.g. "12×16 Classic Framed Print"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sku",
      title: "Prodigi SKU",
      type: "string",
      description: 'e.g. "GLOBAL-CFPM-12x16" — must match a real Prodigi product exactly.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "priceGBP",
      title: "Price (pence)",
      type: "number",
      description: "In pence, e.g. 4500 = £45.00. Should include print cost, margin, and UK shipping.",
      validation: (r) => r.required().integer().positive(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Turn off to hide this product from the buy panel without deleting it.",
    }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number" }),
  ],
  preview: {
    select: { title: "title", sku: "sku", price: "priceGBP" },
    prepare({ title, sku, price }) {
      return {
        title,
        subtitle: price ? `${sku} · £${(price / 100).toFixed(2)}` : sku,
      };
    },
  },
});
