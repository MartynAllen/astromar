"use client";

import { useState } from "react";
import { getWeekVisibility, type GeoLocation, type NightVisibility } from "@/lib/astro/visibility";

interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

const TYPE_LABEL: Record<string, string> = {
  "emission-nebula": "Emission nebula",
  "reflection-nebula": "Reflection nebula",
  "planetary-nebula": "Planetary nebula",
  "supernova-remnant": "Supernova remnant",
  galaxy: "Galaxy",
  "open-cluster": "Open cluster",
  "globular-cluster": "Globular cluster",
};

function dayLabel(date: Date, index: number): string {
  if (index === 0) return "Tonight";
  if (index === 1) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

export default function VisibilityFinder() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [nights, setNights] = useState<NightVisibility[] | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function computeAndSet(loc: GeoLocation) {
    setLocation(loc);
    setNights(getWeekVisibility(loc));
    setActiveDay(0);
    setStatus("idle");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const results: GeocodeResult[] = await res.json();
      if (!res.ok || results.length === 0) {
        setStatus("error");
        setErrorMessage("Couldn't find that place — try a nearby town or city.");
        return;
      }
      const first = results[0];
      computeAndSet({ lat: first.lat, lng: first.lng, label: first.label });
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong reaching the location search.");
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Your browser doesn't support geolocation.");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        computeAndSet({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        });
      },
      () => {
        setStatus("error");
        setErrorMessage("Couldn't get your location — try searching instead.");
      },
    );
  }

  return (
    <div className="rounded-lg border border-void-700 bg-void-900 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        Optimal targets
      </p>
      <p className="mt-1 text-sm text-star-500">
        Search a location to see which deep-sky objects are best placed, hour by hour,
        over the next 7 nights.
      </p>

      <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Town, city, or postcode"
          className="w-full min-w-0 rounded-md border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500 sm:flex-1"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex-1 rounded-md bg-nebula-teal-400 px-4 py-2 font-display text-sm font-medium text-void-950 disabled:opacity-60 sm:flex-none"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={status === "loading"}
            className="flex-1 rounded-md border border-void-600 px-4 py-2 text-sm whitespace-nowrap text-star-300 hover:border-nebula-teal-500 disabled:opacity-60 sm:flex-none"
          >
            Use my location
          </button>
        </div>
      </form>

      {status === "error" && <p className="mt-3 text-sm text-nebula-rose-400">{errorMessage}</p>}

      {location && nights && (
        <div className="mt-6">
          <p className="text-sm text-star-500">
            Showing results for <span className="text-star-300">{location.label}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {nights.map((night, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeDay === i
                    ? "border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400"
                    : "border-void-700 text-star-500 hover:border-void-600 hover:text-star-300"
                }`}
              >
                {dayLabel(night.date, i)}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {nights[activeDay].hours.length === 0 ? (
              <p className="text-sm text-star-500">
                No astronomically dark hours this night at this location (likely summer
                twilight at high latitude).
              </p>
            ) : (
              nights[activeDay].hours.map((hour, i) => (
                <div key={i} className="rounded-md border border-void-700 bg-void-950 p-3">
                  <p className="font-mono text-xs text-star-500">
                    {hour.time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hour.best.length === 0 ? (
                      <span className="text-sm text-star-700">Nothing well-placed</span>
                    ) : (
                      hour.best.map((v) => (
                        <div
                          key={v.object.id}
                          className="rounded border border-void-600 px-2.5 py-1.5"
                          title={`${TYPE_LABEL[v.object.type]} · mag ${v.object.magnitude}`}
                        >
                          <p className="text-sm text-star-100">{v.object.name}</p>
                          <p className="font-mono text-[11px] text-nebula-teal-400">
                            {v.altitude.toFixed(0)}° {v.compass}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-xs text-star-700">
            Times shown in your browser&apos;s local timezone. Altitude filtered to 25°+
            above the horizon.
          </p>
        </div>
      )}
    </div>
  );
}
