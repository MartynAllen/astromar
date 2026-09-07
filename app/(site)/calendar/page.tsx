import type { Metadata } from "next";
import MoonPhaseWidget from "@/components/calendar/MoonPhaseWidget";
import MeteorShowerList from "@/components/calendar/MeteorShowerList";
import VisibilityFinder from "@/components/calendar/VisibilityFinder";
import SkyMap from "@/components/calendar/SkyMap";
import EventCard from "@/components/calendar/EventCard";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { getUpcomingCalendarEvents, getPhotoBySlug } from "@/lib/sanity.queries";
import { buildMetadata, eventJsonLd } from "@/lib/seo";

export const revalidate = 60;

// H1 deliberately doesn't match the "Calendar" nav label/breadcrumb/URL,
// unlike every other page on the site — this page outgrew "a calendar" the
// moment the interactive sky map became its headline feature, and the old
// title/hero copy still only described the moon phase/meteor/events tools
// underneath it. Nav label and URL stay "Calendar" on purpose: renaming
// those too is a bigger IA change nobody's asked for, and this is the one
// place on the site where the big on-page heading is allowed to say more
// than the short nav word that got you here.
const TITLE = "Sky Map & Calendar";
const DESCRIPTION =
  "An interactive sky map for any place and moment, plus moon phase, meteor showers and observing plans.";
const HERO_SLUG = "east-veil-nebula-2026-08-22";

export async function generateMetadata(): Promise<Metadata> {
  const heroPhoto = await getPhotoBySlug(HERO_SLUG);
  return buildMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/calendar",
    image: heroPhoto?.mainImage,
    cropBottom: true,
  });
}

export default async function CalendarPage() {
  const [events, heroPhoto] = await Promise.all([
    getUpcomingCalendarEvents(),
    getPhotoBySlug(HERO_SLUG),
  ]);

  return (
    <>
      {events.map((event) => (
        <JsonLd
          key={event._id}
          data={eventJsonLd({
            name: event.title,
            description: event.description,
            startDate: event.date,
            endDate: event.endDate,
          })}
        />
      ))}
      <PageHero
        photo={heroPhoto}
        className="h-80 sm:h-96"
      >
        <div className="mx-auto w-full max-w-4xl px-6">
          <Breadcrumbs items={[{ name: "Calendar", path: "/calendar" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">{TITLE}</h1>
          <p className="mt-2 text-star-500">{DESCRIPTION}</p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <SkyMap />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <MoonPhaseWidget />
          <MeteorShowerList />
        </div>

        <div className="mt-6">
          <VisibilityFinder />
        </div>

        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-widest text-star-500">
            Upcoming events
          </p>
          {events.length === 0 ? (
            <p className="mt-4 text-star-500">
              Nothing on the calendar right now.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
