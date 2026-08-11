import { Body, Equator, Horizon, Observer } from "astronomy-engine";
import { DEEP_SKY_CATALOG, type DeepSkyObject } from "./deepSkyCatalog";

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface ObjectVisibility {
  object: DeepSkyObject;
  altitude: number;
  azimuth: number;
  compass: string;
}

export interface HourlyVisibility {
  time: Date;
  sunAltitude: number;
  isDark: boolean;
  best: ObjectVisibility[];
}

export interface NightVisibility {
  date: Date;
  hours: HourlyVisibility[];
}

const COMPASS_POINTS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function azimuthToCompass(azimuth: number): string {
  const index = Math.round(azimuth / 22.5) % 16;
  return COMPASS_POINTS[index];
}

/** Sun's altitude in degrees — below -18° is full astronomical darkness. */
function sunAltitude(date: Date, observer: Observer): number {
  const eq = Equator(Body.Sun, date, observer, true, true);
  return Horizon(date, observer, eq.ra, eq.dec, "normal").altitude;
}

const ASTRONOMICAL_DARK_THRESHOLD = -18;
const MIN_USEFUL_ALTITUDE = 25;

/**
 * Best-placed catalog objects at a single instant. Ranked by altitude
 * (higher = less atmosphere in the way), filtered to a minimum altitude so
 * horizon murk doesn't clutter the list.
 */
export function getVisibilityAt(
  date: Date,
  location: GeoLocation,
  limit = 5,
): HourlyVisibility {
  const observer = new Observer(location.lat, location.lng, 0);
  const sunAlt = sunAltitude(date, observer);
  const isDark = sunAlt < ASTRONOMICAL_DARK_THRESHOLD;

  const visible: ObjectVisibility[] = DEEP_SKY_CATALOG.map((object) => {
    const horiz = Horizon(date, observer, object.raDeg / 15, object.decDeg, "normal");
    return {
      object,
      altitude: horiz.altitude,
      azimuth: horiz.azimuth,
      compass: azimuthToCompass(horiz.azimuth),
    };
  })
    .filter((v) => v.altitude >= MIN_USEFUL_ALTITUDE)
    .sort((a, b) => b.altitude - a.altitude)
    .slice(0, limit);

  return { time: date, sunAltitude: sunAlt, isDark, best: isDark ? visible : [] };
}

/**
 * Hour-by-hour visibility for one night, from 6pm through 8am the next day
 * (in the browser's local timezone), restricted to hours that are actually
 * astronomically dark.
 */
export function getNightVisibility(nightStart: Date, location: GeoLocation): NightVisibility {
  const base = new Date(nightStart);
  base.setHours(18, 0, 0, 0);

  const hours: HourlyVisibility[] = [];
  for (let h = 0; h <= 14; h++) {
    const time = new Date(base.getTime() + h * 60 * 60 * 1000);
    const visibility = getVisibilityAt(time, location);
    if (visibility.isDark) hours.push(visibility);
  }
  return { date: nightStart, hours };
}

/** The next 7 nights' visibility windows, starting today. */
export function getWeekVisibility(location: GeoLocation, from: Date = new Date()): NightVisibility[] {
  const nights: NightVisibility[] = [];
  for (let d = 0; d < 7; d++) {
    const night = new Date(from);
    night.setDate(night.getDate() + d);
    nights.push(getNightVisibility(night, location));
  }
  return nights;
}
