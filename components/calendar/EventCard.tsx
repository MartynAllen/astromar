import type { CalendarEvent } from "@/lib/sanity.queries";

const TYPE_LABEL: Record<CalendarEvent["eventType"], string> = {
  "personal-plan": "Observing plan",
  "celestial-event": "Celestial event",
  "local-meetup": "Meetup",
  other: "Event",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="rounded-lg border border-void-700 bg-void-900 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
          {TYPE_LABEL[event.eventType]}
        </p>
        <span className="font-mono text-xs text-star-500">{formatDate(event.date)}</span>
      </div>
      <p className="mt-1.5 font-display text-base font-medium text-star-100">{event.title}</p>
      {event.description && <p className="mt-1 text-sm text-star-500">{event.description}</p>}
      {event.externalLink && (
        <a
          href={event.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-nebula-teal-400 hover:underline"
        >
          More info →
        </a>
      )}
    </div>
  );
}
