import { defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons/User";

export default defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      // exif/location deliberately excluded — see astroPhoto.ts mainImage.
      options: { hotspot: true, metadata: ["blurhash", "lqip", "palette"] },
      description:
        "Falls back to a plain, uncredited photo if heroPhotoRef below isn't set. If this image is actually one of the gallery photos, set heroPhotoRef instead — that shows the real (watermarked) gallery asset plus a link back to it, rather than a second, undated, unwatermarked copy.",
    }),
    defineField({
      name: "heroPhotoRef",
      title: "Hero photo (from gallery)",
      type: "reference",
      to: [{ type: "astroPhoto" }],
      description:
        "Set this when the hero image above is actually one of the gallery photos (e.g. it's the same shot, just uploaded separately) — the page will show that photo's real watermarked image plus a small link to its gallery page (and a print-availability note, if it's sold as a print), instead of the plain heroImage. Leave empty to just use heroImage as-is.",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }, { type: "bodyImage" }, { type: "bodyImageRow" }],
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
