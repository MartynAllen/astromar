import { Horizon, Observer } from "astronomy-engine";
import { BRIGHT_STAR_CATALOG, type CatalogStar } from "./starCatalog";

/**
 * A public, approximate stand-in for the real observing location — never
 * the precise GPS embedded in source photos, which stays private (see
 * PRODUCT.md). Devon, UK is already stated as public copy sitewide, so a
 * rounded county-level coordinate carries nothing the site doesn't
 * already say.
 */
export const GENERAL_LOCATION = { lat: 50.7, lng: -3.5 };

export interface PositionedStar {
  star: CatalogStar;
  altitude: number;
  azimuth: number;
}

/** Real star positions for a given moment, reusing the same astronomy
 * engine as the visibility finder — just projected for atmosphere here
 * rather than for planning a session. */
export function starsAboveHorizon(date: Date, minAltitude = -5): PositionedStar[] {
  const observer = new Observer(GENERAL_LOCATION.lat, GENERAL_LOCATION.lng, 0);
  return BRIGHT_STAR_CATALOG.map((star: CatalogStar) => {
    const horiz = Horizon(date, observer, star.raDeg / 15, star.decDeg, "normal");
    return { star, altitude: horiz.altitude, azimuth: horiz.azimuth };
  }).filter((p) => p.altitude >= minAltitude);
}
