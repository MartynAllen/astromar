import type { Metadata } from "next";
import MoonPhaseWidget from "@/components/calendar/MoonPhaseWidget";
import MeteorShowerList from "@/components/calendar/MeteorShowerList";
import VisibilityFinder from "@/components/calendar/VisibilityFinder";
import EventCard from "@/components/calendar/EventCard";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { getUpcomingCalendarEvents, getHeroPhoto } from "@/lib/sanity.queries";
import { eventJsonLd } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Astronomy Calendar",
  description: "Moon phase, upcoming meteor showers, and observing plans.",
};

export default async function CalendarPage() {
  const [events, heroPhoto] = await Promise.all([
    getUpcomingCalendarEvents(),
    getHeroPhoto(5),
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
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Calendar", path: "/calendar" }]} />
          <h1 className="font-display text-4xl text-star-100">Astronomy Calendar</h1>
          <p className="mt-2 text-star-500">
            Optimal targets for tonight, and what&apos;s coming up on this end.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
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
