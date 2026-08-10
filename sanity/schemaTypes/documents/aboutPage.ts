import { defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons";

export default defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "heroImage", title: "Hero image", type: "image" }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "gear",
      title: "Gear",
      type: "array",
      of: [{ type: "gearItem" }],
      description:
        "Any item with an affiliate link triggers the affiliate disclosure banner on this page.",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "About Page" };
    },
  },
});
