import { defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";

// Singleton — see sanity/structure.ts. Shipping and dispatch numbers live
// here (not in code) so they can change without a deploy. Public dataset:
// none of this is sensitive.
export default defineType({
  name: "shopSettings",
  title: "Shop Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "flatShippingPence",
      title: "Flat UK postage (pence)",
      type: "number",
      description: "In pence, e.g. 350 = £3.50. Charged on every order below the free-postage threshold.",
      validation: (r) => r.required().integer().min(0),
      initialValue: 350,
    }),
    defineField({
      name: "freeShippingThresholdPence",
      title: "Free postage over (pence)",
      type: "number",
      description:
        "Basket subtotal (before postage) at or above which postage is free, e.g. 2500 = £25.00. Leave empty to never offer free postage.",
      validation: (r) => r.integer().positive(),
    }),
    defineField({
      name: "dispatchMinDays",
      title: "Stocked items: dispatch from (working days)",
      type: "number",
      validation: (r) => r.required().integer().min(0),
      initialValue: 1,
    }),
    defineField({
      name: "dispatchMaxDays",
      title: "Stocked items: dispatch by (working days)",
      type: "number",
      validation: (r) => r.required().integer().min(0),
      initialValue: 3,
    }),
    defineField({
      name: "maxQtyPerLine",
      title: "Max quantity per item",
      type: "number",
      description: "Caps how many of one variant can go in a single basket.",
      validation: (r) => r.required().integer().positive(),
      initialValue: 10,
    }),
  ],
  preview: { prepare: () => ({ title: "Shop Settings" }) },
});
