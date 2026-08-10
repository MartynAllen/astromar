import { defineField, defineType } from "sanity";
import { CalendarIcon } from "@sanity/icons/Calendar";

// Moon phase is computed live (lib/astro/moonPhase.ts) and the ~8 major annual
// meteor showers live in a reviewed static file (lib/astro/meteorShowers.ts) —
// neither belongs here. This document type is only for things that genuinely
// need human authorship: personal observing plans, local meetups, one-off events.
export default defineType({
  name: "calendarEvent",
  title: "Calendar Event",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "eventType",
      title: "Event type",
      type: "string",
      options: {
        list: [
          { title: "Personal observing plan", value: "personal-plan" },
          { title: "Celestial event", value: "celestial-event" },
          { title: "Local meetup", value: "local-meetup" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({ name: "endDate", title: "End date", type: "datetime" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({
      name: "relatedPhoto",
      title: "Related photo",
      type: "reference",
      to: [{ type: "astroPhoto" }],
    }),
    defineField({ name: "externalLink", title: "External link", type: "url" }),
  ],
  orderings: [{ title: "Date", name: "dateAsc", by: [{ field: "date", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "date", eventType: "eventType" },
  },
});
