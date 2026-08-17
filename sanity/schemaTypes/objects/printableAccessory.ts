import { defineField, defineType } from "sanity";

export default defineType({
  name: "printableAccessory",
  title: "3D-printable accessory",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "Print file URL",
      type: "url",
      description: "Link to the model on MakerWorld, Thingiverse, Printables, etc.",
      validation: (r) => r.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "designerCredit",
      title: "Designer credit",
      type: "string",
      description: 'e.g. "Design by Jam_2016 on MakerWorld, CC BY" — check the model\'s license before adding any image here; NonCommercial-licensed designs shouldn\'t be reused as images on a page with affiliate links.',
    }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 2 }),
    defineField({
      name: "relatedGuideHref",
      title: "Related guide link",
      type: "string",
      description: 'Optional internal link, e.g. "/guide/bahtinov-mask-focusing", shown as "See our guide".',
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "designerCredit" },
  },
});
