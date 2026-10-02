import { defineArrayMember, defineField, defineType } from "sanity";
import { PackageIcon } from "@sanity/icons/Package";
import { SHOP_CATEGORIES } from "../../../lib/shop/categories";

// Self-fulfilled 3D-printed products (not the Prodigi photo prints — those
// are printProduct). Public dataset: everything here, stock counts included,
// is readable by anyone, so nothing customer-specific ever belongs on it.

// /shop/basket and /shop/thanks are real routes; a product with either slug
// would be unreachable behind them.
const RESERVED_SLUGS = new Set(["basket", "thanks"]);

export default defineType({
  name: "shopProduct",
  title: "Shop Product",
  type: "document",
  icon: PackageIcon,
  description:
    "A 3D-printed item Martyn makes and ships himself. Each product has one or more variants (colour, set size…), each with its own price and, for stocked items, a stock count.",
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
      validation: (r) =>
        r.required().custom((slug) =>
          slug?.current && RESERVED_SLUGS.has(slug.current)
            ? `"${slug.current}" is reserved for a shop page (basket / thanks)`
            : true,
        ),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: { list: SHOP_CATEGORIES },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 2,
      description:
        "One or two plain sentences — what it is and what it's for. Used on the card and as the meta description.",
    }),
    defineField({
      name: "images",
      title: "Photos",
      type: "array",
      of: [defineArrayMember({ type: "reviewGalleryImage" })],
      description:
        "Your own photos of the actual printed item — the first is the card/cover image. Alt text is required.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "material",
      title: "Material",
      type: "string",
      description: 'e.g. "PETG, 0.2mm layers". State only what it is actually printed in.',
    }),
    defineField({
      name: "printer",
      title: "Printed on",
      type: "string",
      description: "Optional — the printer it's made on.",
    }),
    defineField({
      name: "dimensions",
      title: "Dimensions",
      type: "string",
      description: 'Measured, not guessed — e.g. "95mm diameter × 5mm".',
    }),
    defineField({
      name: "fulfilment",
      title: "How it's made",
      type: "string",
      options: {
        list: [
          { title: "Stocked — printed in advance, count tracked", value: "stocked" },
          { title: "Made to order — printed after each sale", value: "madeToOrder" },
        ],
        layout: "radio",
      },
      initialValue: "madeToOrder",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "leadTimeDays",
      title: "Lead time (days)",
      type: "number",
      description: "Made-to-order only — typical days to print and dispatch, shown on the product.",
      validation: (r) => r.integer().positive(),
      hidden: ({ document }) => document?.fulfilment !== "madeToOrder",
    }),
    defineField({
      name: "variants",
      title: "Variants",
      type: "array",
      description:
        'At least one. For a single-option item add one called "Standard" — the picker is hidden when there is only one.',
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          name: "shopVariant",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: 'e.g. "Black", "Set of 4", "2-inch"',
              validation: (r) => r.required(),
            }),
            defineField({
              name: "sku",
              title: "SKU",
              type: "string",
              description:
                'Short code that appears on the order email, e.g. "COAST-BLK-4". Keep it unique and under ~24 characters.',
              validation: (r) =>
                r.required().max(24).regex(/^[A-Za-z0-9-]+$/, { name: "letters, numbers and hyphens only" }),
            }),
            defineField({
              name: "pricePence",
              title: "Price (pence)",
              type: "number",
              description: "In pence, e.g. 1200 = £12.00. This is the price charged — postage is added separately.",
              validation: (r) => r.required().integer().positive(),
            }),
            defineField({
              name: "stock",
              title: "In stock",
              type: "number",
              description:
                "Stocked items only. Counts down automatically on each sale; set it by hand when you print more.",
              validation: (r) => r.integer().min(0),
            }),
          ],
          preview: {
            select: { title: "label", sku: "sku", price: "pricePence", stock: "stock" },
            prepare({ title, sku, price, stock }) {
              const gbp = typeof price === "number" ? `£${(price / 100).toFixed(2)}` : "?";
              const stockPart = typeof stock === "number" ? ` · ${stock} in stock` : "";
              return { title, subtitle: `${sku ?? "no SKU"} · ${gbp}${stockPart}` };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Turn off to hide this product without deleting it.",
    }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number" }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "category", media: "images.0.image", active: "active" },
    prepare({ title, subtitle, media, active }) {
      return { title, subtitle: active === false ? `${subtitle} (hidden)` : subtitle, media };
    },
  },
});
