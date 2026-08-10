import type { Metadata } from "next";
import MoonPhaseWidget from "@/components/calendar/MoonPhaseWidget";
import MeteorShowerList from "@/components/calendar/MeteorShowerList";
import EventCard from "@/components/calendar/EventCard";
import { getUpcomingCalendarEvents } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Astronomy Calendar",
  description: "Moon phase, upcoming meteor showers, and observing plans.",
};

export default async function CalendarPage() {
  const events = await getUpcomingCalendarEvents();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold text-star-100">Astronomy Calendar</h1>
      <p className="mt-2 text-star-500">
        What&apos;s worth looking up for, and what&apos;s coming up on this end.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <MoonPhaseWidget />
        <MeteorShowerList />
      </div>

      <div className="mt-10">
        <p className="font-mono text-xs uppercase tracking-widest text-star-500">
          Upcoming events
        </p>
        {events.length === 0 ? (
          <p className="mt-4 text-star-500">Nothing on the calendar right now.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
