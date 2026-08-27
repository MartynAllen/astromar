import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons/Tag";

export default defineType({
  name: "printProduct",
  title: "Print Product",
  type: "document",
  icon: TagIcon,
  description:
    "A sellable print size (base unframed print, with an optional framing add-on), not tied to any one photo — any photo marked \"Available as a print\" can be ordered in any active size here.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'The size, e.g. "12×16"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "unframedSku",
      title: "Unframed Prodigi SKU",
      type: "string",
      description: 'e.g. "GLOBAL-FAP-12X16" — must match a real Prodigi product exactly.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "unframedPriceGBP",
      title: "Unframed price (pence)",
      type: "number",
      description: "In pence, e.g. 3400 = £34.00. Should include print cost, margin, and UK shipping.",
      validation: (r) => r.required().integer().positive(),
    }),
    defineField({
      name: "framedSku",
      title: "Framed Prodigi SKU",
      type: "string",
      description:
        'Optional — e.g. "GLOBAL-CFPM-12X16". Leave empty if this size can\'t be ordered framed; set it and the framing add-on price below to offer it as an add-on in the buy panel.',
    }),
    defineField({
      name: "framingAddonPriceGBP",
      title: "Framing add-on price (pence)",
      type: "number",
      description:
        "In pence, added on top of the unframed price when the customer opts into framing — the delta between the framed and unframed Prodigi cost, plus margin. Only used if framedSku is set.",
      validation: (r) => r.integer().positive(),
      hidden: ({ document }) => !document?.framedSku,
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Turn off to hide this size from the buy panel without deleting it.",
    }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number" }),
  ],
  preview: {
    select: {
      title: "title",
      unframedPrice: "unframedPriceGBP",
      framedSku: "framedSku",
      addonPrice: "framingAddonPriceGBP",
    },
    prepare({ title, unframedPrice, framedSku, addonPrice }) {
      const unframed = unframedPrice ? `£${(unframedPrice / 100).toFixed(2)}` : "?";
      const framed =
        framedSku && addonPrice
          ? ` (+£${(addonPrice / 100).toFixed(2)} framed)`
          : "";
      return { title, subtitle: `${unframed}${framed}` };
    },
  },
});
