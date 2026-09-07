import { Body, Equator, Horizon, Illumination, Observer } from "astronomy-engine";
import { BRIGHT_STAR_CATALOG, type CatalogStar } from "./starCatalog";
import { CONSTELLATION_STARS, CONSTELLATIONS } from "./constellations";
import { getMoonPhase } from "./moonPhase";

export interface PositionedStar {
  name: string;
  altitude: number;
  azimuth: number;
  magnitude: number;
}

export interface ConstellationLineSegment {
  constellation: string;
  from: PositionedStar;
  to: PositionedStar;
}

export type PlanetName = "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export interface PositionedPlanet {
  name: PlanetName;
  altitude: number;
  azimuth: number;
  magnitude: number;
}

export interface PositionedMoon {
  altitude: number;
  azimuth: number;
  illuminatedFraction: number;
  phaseName: string;
}

export interface PositionedSun {
  altitude: number;
  azimuth: number;
}

export interface SkySnapshot {
  stars: PositionedStar[];
  constellationLines: ConstellationLineSegment[];
  planets: PositionedPlanet[];
  moon: PositionedMoon;
  sun: PositionedSun;
  /** True once the Sun is low enough for stars to actually be visible —
   * drives the "it's too bright to see anything right now" messaging. */
  isDarkEnoughToSeeStars: boolean;
}

const PLANET_BODIES: { name: PlanetName; body: Body }[] = [
  { name: "Mercury", body: Body.Mercury },
  { name: "Venus", body: Body.Venus },
  { name: "Mars", body: Body.Mars },
  { name: "Jupiter", body: Body.Jupiter },
  { name: "Saturn", body: Body.Saturn },
];

// Merge the general bright-star backdrop with the named constellation
// stars, de-duplicated by name (a handful — Sirius, Betelgeuse, Vega,
// Polaris, etc. — legitimately appear in both). Constellation entries win
// on conflict since that catalog was curated specifically for this map.
function mergedStarCatalog(): CatalogStar[] {
  const byName = new Map<string, CatalogStar>();
  for (const star of BRIGHT_STAR_CATALOG) byName.set(star.name, star);
  for (const star of CONSTELLATION_STARS) byName.set(star.name, star);
  return [...byName.values()];
}

const STAR_CATALOG = mergedStarCatalog();
const POLARIS = CONSTELLATION_STARS.find((s) => s.name === "Polaris")!;

/**
 * Real azimuth of Polaris right now, from this location — the sky map's
 * default facing direction. Not a hardcoded "just use north": Polaris
 * isn't exactly at the celestial pole, so its true azimuth wobbles a
 * degree or two through the day, and from the southern hemisphere it's
 * below the horizon entirely (this still returns a real azimuth even
 * then — "roughly north" remains a sensible default heading everywhere
 * north of the equator, which is this site's whole frame of reference).
 */
export function computePolarisAzimuth(date: Date, location: { lat: number; lng: number }): number {
  const observer = new Observer(location.lat, location.lng, 0);
  return Horizon(date, observer, POLARIS.raDeg / 15, POLARIS.decDeg, "normal").azimuth;
}

/** Twilight threshold below which stars start being visible at all — civil
 * dusk (-6°) rather than full astronomical dark (-18°), since the map is
 * about exploration, not a strict imaging-darkness cutoff like the
 * visibility finder uses. */
const VISIBLE_SUN_ALTITUDE = -6;

/**
 * Everything the sky map needs to draw one frame: every catalogued star,
 * every constellation line (both endpoints resolved to real alt/az),
 * the naked-eye planets, the Moon (with its real phase), and the Sun —
 * all for one instant, at one location. Real astronomy-engine positions
 * throughout, the same library the rest of the Calendar page already
 * relies on; nothing here is simulated or approximated beyond the star
 * catalog's own stated ~1° precision.
 */
export function computeSkySnapshot(
  date: Date,
  location: { lat: number; lng: number },
  minAltitude = -2,
): SkySnapshot {
  const observer = new Observer(location.lat, location.lng, 0);

  const positioned = new Map<string, PositionedStar>();
  for (const star of STAR_CATALOG) {
    const horiz = Horizon(date, observer, star.raDeg / 15, star.decDeg, "normal");
    positioned.set(star.name, {
      name: star.name,
      altitude: horiz.altitude,
      azimuth: horiz.azimuth,
      magnitude: star.magnitude,
    });
  }
  const stars = [...positioned.values()].filter((s) => s.altitude >= minAltitude);

  const constellationLines: ConstellationLineSegment[] = [];
  for (const constellation of CONSTELLATIONS) {
    for (const [fromName, toName] of constellation.lines) {
      const from = positioned.get(fromName);
      const to = positioned.get(toName);
      if (!from || !to) continue; // shouldn't happen — every name is defined above
      if (from.altitude < minAltitude || to.altitude < minAltitude) continue;
      constellationLines.push({ constellation: constellation.name, from, to });
    }
  }

  const planets: PositionedPlanet[] = PLANET_BODIES.map(({ name, body }) => {
    const eq = Equator(body, date, observer, true, true);
    const horiz = Horizon(date, observer, eq.ra, eq.dec, "normal");
    return {
      name,
      altitude: horiz.altitude,
      azimuth: horiz.azimuth,
      magnitude: Illumination(body, date).mag,
    };
  }).filter((p) => p.altitude >= minAltitude);

  const moonEq = Equator(Body.Moon, date, observer, true, true);
  const moonHoriz = Horizon(date, observer, moonEq.ra, moonEq.dec, "normal");
  const { fraction, phaseName } = getMoonPhase(date);
  const moon: PositionedMoon = {
    altitude: moonHoriz.altitude,
    azimuth: moonHoriz.azimuth,
    illuminatedFraction: fraction,
    phaseName,
  };

  const sunEq = Equator(Body.Sun, date, observer, true, true);
  const sunHoriz = Horizon(date, observer, sunEq.ra, sunEq.dec, "normal");
  const sun: PositionedSun = { altitude: sunHoriz.altitude, azimuth: sunHoriz.azimuth };

  return {
    stars,
    constellationLines,
    planets,
    moon,
    sun,
    isDarkEnoughToSeeStars: sun.altitude <= VISIBLE_SUN_ALTITUDE,
  };
}
