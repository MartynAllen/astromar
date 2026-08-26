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
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      // exif/location deliberately excluded — see astroPhoto.ts mainImage.
      options: { metadata: ["blurhash", "lqip", "palette"] },
    }),
    // No home-location field on purpose: this dataset is on Sanity's free
    // public tier, so anything stored here is readable by anyone querying
    // the API directly, no auth required. Nothing in the app actually needs
    // a real home coordinate — the sky reconstruction uses a fixed, already
    // rounded public point (lib/astro/starPositions.ts), and the visibility
    // finder takes a location per search, never stored. See shotDetails.ts
    // for the same fix applied to per-photo capture coordinates.
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
    defineField({
      name: "shopUrl",
      title: "Print shop URL",
      type: "url",
      description:
        'Etsy print shop link (fulfilled via Prodigi). Leave empty and every "Shop Prints" link/button sitewide stays hidden — nothing shows until this is set.',
      validation: (r) => r.uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
