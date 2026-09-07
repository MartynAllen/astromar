"use client";

import { useEffect, useMemo, useState } from "react";
import { computeSkySnapshot } from "@/lib/astro/skyMapPositions";
import { GENERAL_LOCATION } from "@/lib/astro/starPositions";
import SkyMapCanvas from "./SkyMapCanvas";

interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
}

// A full 3-day window either side of "now" — enough to scrub from last
// night through to the day after tomorrow without the slider needing a
// second control for which day.
const HOURS_MIN = -24;
const HOURS_MAX = 48;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in the input's own local time,
// not UTC — Date's own toISOString() would silently shift the displayed
// value by the browser's UTC offset.
function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(date: Date): string {
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SkyMap() {
  // This page is statically prerendered (see revalidate above the page
  // component) — a build-time `new Date()` baked into the initial render
  // would guarantee a hydration mismatch on every real visit, since the
  // server's "now" and the client's real "now" are potentially months
  // apart. Both anchor and time start `null` and are only ever set inside
  // an effect, which runs client-side after hydration — the very first
  // client render matches the server's (empty) output exactly, then swaps
  // to the real live sky an instant later.
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    // Deliberate exception to the usual "don't setState synchronously in
    // an effect" guidance: there's no external system to synchronise with
    // here, and no lazy-initializer alternative exists either — the whole
    // point is that the real client "now" is only knowable client-side,
    // after the server-rendered (dateless) markup has already hydrated.
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnchor(now);
    setTime(now);
  }, []);

  const [location, setLocation] = useState<GeoLocation>({
    ...GENERAL_LOCATION,
    label: "Devon, UK (default)",
  });
  const [query, setQuery] = useState("");
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "error">("idle");
  const [locError, setLocError] = useState("");

  const snapshot = useMemo(
    () => (time ? computeSkySnapshot(time, location) : null),
    [time, location],
  );

  const hoursOffset = anchor && time ? (time.getTime() - anchor.getTime()) / 3_600_000 : 0;

  function setHoursOffset(hours: number) {
    if (!anchor) return;
    setTime(new Date(anchor.getTime() + hours * 3_600_000));
  }

  function handleDatetimeInput(value: string) {
    if (!value) return;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) setTime(parsed);
  }

  function resetToNow() {
    setTime(new Date());
  }

  function computeAndSetLocation(loc: GeoLocation) {
    setLocation(loc);
    setLocStatus("idle");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLocStatus("loading");
    setLocError("");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const results: GeocodeResult[] = await res.json();
      if (!res.ok || results.length === 0) {
        setLocStatus("error");
        setLocError("Couldn't find that place — try a nearby town or city.");
        return;
      }
      const first = results[0];
      computeAndSetLocation({ lat: first.lat, lng: first.lng, label: first.label });
    } catch {
      setLocStatus("error");
      setLocError("Something went wrong reaching the location search.");
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("Your browser doesn't support geolocation.");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        computeAndSetLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        });
      },
      () => {
        setLocStatus("error");
        setLocError("Couldn't get your location — try searching instead.");
      },
    );
  }

  return (
    <div className="border border-void-700 bg-void-900 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-indigo-400">Sky map</p>
      <p className="mt-1 text-sm text-star-500">
        Real, computed star and planet positions for any place and moment — drag through time or
        jump to an exact one, and see what&apos;s actually up there.
      </p>

      <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Town, city, or postcode"
          className="w-full min-w-0 border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-indigo-400 sm:flex-1"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={locStatus === "loading"}
            className="flex-1 bg-nebula-indigo-400 px-4 py-2 font-mono text-xs uppercase tracking-widest text-void-950 disabled:opacity-60 sm:flex-none"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locStatus === "loading"}
            className="flex-1 border border-void-600 px-4 py-2 font-mono text-xs uppercase tracking-widest whitespace-nowrap text-star-300 hover:border-nebula-indigo-400 disabled:opacity-60 sm:flex-none"
          >
            Use my location
          </button>
        </div>
      </form>
      {locStatus === "error" && <p className="mt-2 text-sm text-nebula-rose-400">{locError}</p>}
      <p className="mt-3 text-sm text-star-500">
        Showing the sky over <span className="text-star-300">{location.label}</span>
      </p>

      {time && snapshot ? (
        <>
          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-[720px]">
              <SkyMapCanvas snapshot={snapshot} />
            </div>
          </div>

          {!snapshot.isDarkEnoughToSeeStars && (
            <p className="mt-3 text-center text-sm text-star-500">
              The Sun&apos;s too high to actually see stars at this time — the positions above
              are still real, just not visible to the eye right now.
            </p>
          )}

          <div className="mx-auto mt-6 max-w-[720px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-widest text-star-500">
                {formatTime(time)}
              </p>
              <button
                type="button"
                onClick={resetToNow}
                className="font-mono text-xs uppercase tracking-widest text-nebula-indigo-400 underline hover:text-nebula-indigo-300"
              >
                Now
              </button>
            </div>
            <input
              type="range"
              min={HOURS_MIN}
              max={HOURS_MAX}
              step={0.25}
              value={hoursOffset}
              onChange={(e) => setHoursOffset(Number(e.target.value))}
              className="mt-2 w-full accent-nebula-indigo-400"
              aria-label="Scrub through time"
            />
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-star-700">
              <span>-24h</span>
              <span>Now</span>
              <span>+48h</span>
            </div>

            <label className="mt-4 block">
              <span className="font-mono text-xs uppercase tracking-widest text-star-500">
                Or jump to an exact time
              </span>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(time)}
                onChange={(e) => handleDatetimeInput(e.target.value)}
                className="mt-1.5 w-full border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 focus:border-nebula-indigo-400"
              />
            </label>
          </div>
        </>
      ) : (
        // Matches the canvas's own footprint so nothing shifts once the
        // real sky swaps in an instant after mount (see the effect above).
        <div className="mx-auto mt-5 flex aspect-square w-full max-w-[720px] items-center justify-center border border-void-700 text-sm text-star-500">
          Loading the sky…
        </div>
      )}

      <p className="mt-4 text-xs text-star-500">
        Times shown in your browser&apos;s local timezone. Star and constellation positions are
        approximate (within roughly a degree); planet, Sun and Moon positions are computed
        exactly for the moment shown.
      </p>
    </div>
  );
}
