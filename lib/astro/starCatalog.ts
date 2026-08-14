/**
 * The ~50 brightest naked-eye stars, J2000 coordinates. Approximate to
 * within roughly a degree — plenty for a real, recognisable backdrop
 * (correct relative structure: Orion's belt, the Dippers, the Southern
 * Cross, the Summer Triangle) without needing survey-grade precision.
 */
export interface CatalogStar {
  name: string;
  /** J2000 right ascension, in degrees (0-360). */
  raDeg: number;
  /** J2000 declination, in degrees (-90 to 90). */
  decDeg: number;
  /** Apparent magnitude — lower is brighter. */
  magnitude: number;
}

export const BRIGHT_STAR_CATALOG: CatalogStar[] = [
  { name: "Sirius", raDeg: 101.25, decDeg: -16.72, magnitude: -1.46 },
  { name: "Canopus", raDeg: 96.0, decDeg: -52.7, magnitude: -0.74 },
  { name: "Alpha Centauri", raDeg: 220.0, decDeg: -60.83, magnitude: -0.27 },
  { name: "Arcturus", raDeg: 214.0, decDeg: 19.17, magnitude: -0.05 },
  { name: "Vega", raDeg: 279.25, decDeg: 38.78, magnitude: 0.03 },
  { name: "Capella", raDeg: 79.25, decDeg: 46.0, magnitude: 0.08 },
  { name: "Rigel", raDeg: 78.5, decDeg: -8.2, magnitude: 0.12 },
  { name: "Procyon", raDeg: 114.75, decDeg: 5.22, magnitude: 0.34 },
  { name: "Achernar", raDeg: 24.5, decDeg: -57.23, magnitude: 0.46 },
  { name: "Betelgeuse", raDeg: 88.75, decDeg: 7.4, magnitude: 0.5 },
  { name: "Hadar", raDeg: 211.0, decDeg: -60.37, magnitude: 0.61 },
  { name: "Altair", raDeg: 297.75, decDeg: 8.87, magnitude: 0.77 },
  { name: "Aldebaran", raDeg: 69.0, decDeg: 16.5, magnitude: 0.85 },
  { name: "Antares", raDeg: 247.25, decDeg: -26.43, magnitude: 0.96 },
  { name: "Spica", raDeg: 201.25, decDeg: -11.17, magnitude: 0.98 },
  { name: "Pollux", raDeg: 116.25, decDeg: 28.03, magnitude: 1.14 },
  { name: "Fomalhaut", raDeg: 344.5, decDeg: -29.62, magnitude: 1.16 },
  { name: "Deneb", raDeg: 310.25, decDeg: 45.28, magnitude: 1.25 },
  { name: "Mimosa", raDeg: 192.0, decDeg: -59.68, magnitude: 1.25 },
  { name: "Regulus", raDeg: 152.0, decDeg: 11.97, magnitude: 1.4 },
  { name: "Adhara", raDeg: 104.75, decDeg: -28.97, magnitude: 1.5 },
  { name: "Castor", raDeg: 113.75, decDeg: 31.88, magnitude: 1.58 },
  { name: "Shaula", raDeg: 263.5, decDeg: -37.1, magnitude: 1.63 },
  { name: "Bellatrix", raDeg: 81.25, decDeg: 6.35, magnitude: 1.64 },
  { name: "Elnath", raDeg: 81.5, decDeg: 28.6, magnitude: 1.65 },
  { name: "Miaplacidus", raDeg: 138.25, decDeg: -69.72, magnitude: 1.69 },
  { name: "Alnilam", raDeg: 84.0, decDeg: -1.2, magnitude: 1.69 },
  { name: "Alnitak", raDeg: 85.25, decDeg: -1.95, magnitude: 1.74 },
  { name: "Alioth", raDeg: 193.5, decDeg: 55.97, magnitude: 1.76 },
  { name: "Dubhe", raDeg: 166.0, decDeg: 61.75, magnitude: 1.79 },
  { name: "Mirfak", raDeg: 51.0, decDeg: 49.87, magnitude: 1.79 },
  { name: "Wezen", raDeg: 107.0, decDeg: -26.38, magnitude: 1.83 },
  { name: "Sargas", raDeg: 264.25, decDeg: -43.0, magnitude: 1.86 },
  { name: "Kaus Australis", raDeg: 276.0, decDeg: -34.38, magnitude: 1.85 },
  { name: "Avior", raDeg: 125.75, decDeg: -59.5, magnitude: 1.86 },
  { name: "Alkaid", raDeg: 207.0, decDeg: 49.32, magnitude: 1.86 },
  { name: "Menkalinan", raDeg: 89.75, decDeg: 44.95, magnitude: 1.9 },
  { name: "Atria", raDeg: 252.25, decDeg: -69.03, magnitude: 1.91 },
  { name: "Alhena", raDeg: 99.5, decDeg: 16.4, magnitude: 1.93 },
  { name: "Peacock", raDeg: 306.5, decDeg: -56.73, magnitude: 1.94 },
  { name: "Polaris", raDeg: 38.0, decDeg: 89.27, magnitude: 1.98 },
  { name: "Mirzam", raDeg: 95.75, decDeg: -17.95, magnitude: 1.98 },
  { name: "Alphard", raDeg: 142.0, decDeg: -8.67, magnitude: 1.99 },
  { name: "Hamal", raDeg: 31.75, decDeg: 23.47, magnitude: 2.0 },
  { name: "Diphda", raDeg: 11.0, decDeg: -17.99, magnitude: 2.04 },
  { name: "Nunki", raDeg: 283.75, decDeg: -26.3, magnitude: 2.05 },
  { name: "Menkent", raDeg: 211.75, decDeg: -36.37, magnitude: 2.06 },
  { name: "Mirach", raDeg: 17.5, decDeg: 35.62, magnitude: 2.07 },
  { name: "Alpheratz", raDeg: 2.0, decDeg: 29.08, magnitude: 2.07 },
  { name: "Rasalhague", raDeg: 263.75, decDeg: 12.55, magnitude: 2.08 },
  { name: "Kochab", raDeg: 222.75, decDeg: 74.15, magnitude: 2.08 },
  { name: "Denebola", raDeg: 177.25, decDeg: 14.57, magnitude: 2.14 },
  { name: "Algol", raDeg: 47.0, decDeg: 40.95, magnitude: 2.12 },
  { name: "Sadr", raDeg: 305.5, decDeg: 40.25, magnitude: 2.23 },
  { name: "Alderamin", raDeg: 319.75, decDeg: 62.58, magnitude: 2.45 },
];
