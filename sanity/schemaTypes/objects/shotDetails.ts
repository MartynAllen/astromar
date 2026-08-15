import { defineField, defineType } from "sanity";

export default defineType({
  name: "shotDetails",
  title: "Shot details",
  type: "object",
  fieldsets: [
    { name: "target", title: "Target", options: { columns: 2 } },
    { name: "exposure", title: "Exposure", options: { columns: 2 } },
  ],
  fields: [
    defineField({
      name: "targetCatalogId",
      title: "Catalog ID",
      type: "string",
      description: 'e.g. "NGC 7000"',
      fieldset: "target",
    }),
    defineField({
      name: "targetCommonName",
      title: "Common name",
      type: "string",
      description: 'e.g. "North America Nebula"',
      fieldset: "target",
    }),
    defineField({
      name: "subExposureSeconds",
      title: "Exposure per sub (s)",
      type: "number",
      fieldset: "exposure",
    }),
    defineField({
      name: "subCount",
      title: "Sub count",
      type: "number",
      fieldset: "exposure",
    }),
    defineField({
      name: "filter",
      title: "Filter",
      type: "string",
      options: { list: ["LP", "IRCUT", "None/Other"] },
      fieldset: "exposure",
    }),
    defineField({
      name: "isMosaic",
      title: "Mosaic",
      type: "boolean",
      initialValue: false,
      fieldset: "exposure",
    }),
    defineField({
      name: "captureDate",
      title: "Capture date",
      type: "datetime",
    }),
    defineField({
      name: "telescope",
      title: "Telescope",
      type: "string",
      initialValue: "ZWO Seestar S50",
    }),
    // No captureLocation field on purpose: this dataset is on Sanity's free
    // "public" tier, so any field stored here is readable by anyone who
    // queries the API directly — no token, no auth, completely bypassing
    // whatever the frontend chooses not to render. A real home GPS
    // coordinate must never be written here, full stop; not stored is the
    // only safe state, "stored but unrendered" already leaked once.
    defineField({
      name: "raDec",
      title: "RA / Dec",
      type: "object",
      description: "Only populated when a FITS header supplied coordinates.",
      fields: [
        defineField({ name: "ra", title: "RA (deg)", type: "number" }),
        defineField({ name: "dec", title: "Dec (deg)", type: "number" }),
      ],
    }),
  ],
});
