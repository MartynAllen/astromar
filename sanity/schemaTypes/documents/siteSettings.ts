import { defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "siteName",
      title: "Site name",
      type: "string",
      initialValue: "Astromar",
      validation: (r) => r.required(),
    }),
    defineField({ name: "tagline", title: "Tagline", type: "string" }),
    defineField({ name: "logo", title: "Logo", type: "image" }),
    defineField({
      name: "homeObservingLocation",
      title: "Home observing location",
      type: "geopoint",
      description:
        "Default capture location for new photos, and the reference point for the calendar's moon rise/set times.",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [
        {
          type: "object",
          name: "socialLink",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
            }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "defaultSeo",
      title: "Default SEO",
      type: "seo",
      description: "Fallback for any page that doesn't set its own SEO fields.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
