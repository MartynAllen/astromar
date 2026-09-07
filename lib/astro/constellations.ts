import type { CatalogStar } from "./starCatalog";

/**
 * Named stars for the ~20 constellations most recognisable from a UK
 * latitude (Devon, ~50.7°N) across the year — the sky map's stick figures,
 * not the general background starfield (see starCatalog.ts for that).
 * J2000 coordinates, approximate to within roughly a degree — plenty for a
 * genuinely recognisable shape (this matches the same precision standard
 * already set for BRIGHT_STAR_CATALOG), not survey-grade astrometry.
 *
 * Deliberately overlaps BRIGHT_STAR_CATALOG for stars both lists need
 * (Betelgeuse, Vega, Polaris, etc.) — the sky map merges and deduplicates
 * both by name at render time (see lib/astro/skyMapPositions.ts), so this
 * file can stand alone rather than importing and re-deriving from the
 * other catalog.
 */
export const CONSTELLATION_STARS: CatalogStar[] = [
  // Ursa Major (the Plough / Big Dipper)
  { name: "Dubhe", raDeg: 165.93, decDeg: 61.75, magnitude: 1.79 },
  { name: "Merak", raDeg: 165.46, decDeg: 56.38, magnitude: 2.37 },
  { name: "Phecda", raDeg: 178.46, decDeg: 53.69, magnitude: 2.44 },
  { name: "Megrez", raDeg: 183.86, decDeg: 57.03, magnitude: 3.31 },
  { name: "Alioth", raDeg: 193.51, decDeg: 55.96, magnitude: 1.76 },
  { name: "Mizar", raDeg: 200.98, decDeg: 54.93, magnitude: 2.23 },
  { name: "Alkaid", raDeg: 206.89, decDeg: 49.31, magnitude: 1.86 },

  // Ursa Minor (the Little Dipper)
  { name: "Polaris", raDeg: 37.95, decDeg: 89.26, magnitude: 1.98 },
  { name: "Yildun", raDeg: 263.05, decDeg: 86.59, magnitude: 4.36 },
  { name: "Epsilon Ursae Minoris", raDeg: 251.5, decDeg: 82.04, magnitude: 4.19 },
  { name: "Zeta Ursae Minoris", raDeg: 236.02, decDeg: 77.79, magnitude: 4.32 },
  { name: "Kochab", raDeg: 222.68, decDeg: 74.16, magnitude: 2.08 },
  { name: "Pherkad", raDeg: 230.18, decDeg: 71.83, magnitude: 3.05 },

  // Cassiopeia (the W)
  { name: "Caph", raDeg: 2.29, decDeg: 59.15, magnitude: 2.27 },
  { name: "Schedar", raDeg: 10.13, decDeg: 56.54, magnitude: 2.24 },
  { name: "Gamma Cassiopeiae", raDeg: 14.18, decDeg: 60.72, magnitude: 2.47 },
  { name: "Ruchbah", raDeg: 21.45, decDeg: 60.24, magnitude: 2.68 },
  { name: "Segin", raDeg: 28.6, decDeg: 63.67, magnitude: 3.35 },

  // Cepheus (the house)
  { name: "Alderamin", raDeg: 319.64, decDeg: 62.59, magnitude: 2.44 },
  { name: "Alfirk", raDeg: 322.16, decDeg: 70.56, magnitude: 3.23 },
  { name: "Errai", raDeg: 354.84, decDeg: 77.63, magnitude: 3.21 },
  { name: "Zeta Cephei", raDeg: 337.26, decDeg: 58.2, magnitude: 3.35 },
  { name: "Iota Cephei", raDeg: 336.05, decDeg: 66.2, magnitude: 3.5 },

  // Draco (simplified — the head and a short run of the tail)
  { name: "Eltanin", raDeg: 269.15, decDeg: 51.49, magnitude: 2.23 },
  { name: "Rastaban", raDeg: 262.61, decDeg: 52.3, magnitude: 2.79 },
  { name: "Grumium", raDeg: 268.76, decDeg: 56.87, magnitude: 3.75 },
  { name: "Nu Draconis", raDeg: 268.4, decDeg: 55.18, magnitude: 4.88 },
  { name: "Thuban", raDeg: 211.1, decDeg: 64.38, magnitude: 3.65 },

  // Orion
  { name: "Betelgeuse", raDeg: 88.75, decDeg: 7.4, magnitude: 0.5 },
  { name: "Bellatrix", raDeg: 81.25, decDeg: 6.35, magnitude: 1.64 },
  { name: "Mintaka", raDeg: 83.0, decDeg: -0.3, magnitude: 2.23 },
  { name: "Alnilam", raDeg: 84.0, decDeg: -1.2, magnitude: 1.69 },
  { name: "Alnitak", raDeg: 85.25, decDeg: -1.95, magnitude: 1.74 },
  { name: "Saiph", raDeg: 86.94, decDeg: -9.67, magnitude: 2.06 },
  { name: "Rigel", raDeg: 78.5, decDeg: -8.2, magnitude: 0.12 },

  // Taurus
  { name: "Aldebaran", raDeg: 69.0, decDeg: 16.5, magnitude: 0.85 },
  { name: "Elnath", raDeg: 81.5, decDeg: 28.6, magnitude: 1.65 },
  { name: "Alcyone", raDeg: 56.87, decDeg: 24.11, magnitude: 2.87 },
  { name: "Zeta Tauri", raDeg: 84.41, decDeg: 21.14, magnitude: 3.0 },
  { name: "Lambda Tauri", raDeg: 60.17, decDeg: 12.49, magnitude: 3.47 },
  { name: "Epsilon Tauri", raDeg: 67.15, decDeg: 19.18, magnitude: 3.53 },

  // Gemini
  { name: "Castor", raDeg: 113.75, decDeg: 31.88, magnitude: 1.58 },
  { name: "Pollux", raDeg: 116.25, decDeg: 28.03, magnitude: 1.14 },
  { name: "Alhena", raDeg: 99.5, decDeg: 16.4, magnitude: 1.93 },
  { name: "Wasat", raDeg: 110.03, decDeg: 21.98, magnitude: 3.53 },
  { name: "Mebsuta", raDeg: 100.98, decDeg: 25.13, magnitude: 3.06 },
  { name: "Tejat", raDeg: 95.74, decDeg: 22.51, magnitude: 2.87 },

  // Canis Major
  { name: "Sirius", raDeg: 101.29, decDeg: -16.72, magnitude: -1.46 },
  { name: "Mirzam", raDeg: 95.67, decDeg: -17.96, magnitude: 1.98 },
  { name: "Wezen", raDeg: 107.1, decDeg: -26.39, magnitude: 1.83 },
  { name: "Adhara", raDeg: 104.66, decDeg: -28.97, magnitude: 1.5 },
  { name: "Aludra", raDeg: 111.02, decDeg: -29.3, magnitude: 2.45 },

  // Auriga (the pentagon)
  { name: "Capella", raDeg: 79.17, decDeg: 45.998, magnitude: 0.08 },
  { name: "Menkalinan", raDeg: 89.88, decDeg: 44.95, magnitude: 1.9 },
  { name: "Theta Aurigae", raDeg: 89.93, decDeg: 37.21, magnitude: 2.62 },
  { name: "Almaaz", raDeg: 75.49, decDeg: 43.82, magnitude: 2.92 },
  { name: "Hassaleh", raDeg: 74.24, decDeg: 33.17, magnitude: 2.69 },

  // Cygnus (the Northern Cross)
  { name: "Deneb", raDeg: 310.36, decDeg: 45.28, magnitude: 1.25 },
  { name: "Sadr", raDeg: 305.56, decDeg: 40.26, magnitude: 2.23 },
  { name: "Gienah Cygni", raDeg: 311.55, decDeg: 33.97, magnitude: 2.48 },
  { name: "Delta Cygni", raDeg: 296.24, decDeg: 45.13, magnitude: 2.87 },
  { name: "Albireo", raDeg: 292.68, decDeg: 27.96, magnitude: 3.18 },

  // Lyra
  { name: "Vega", raDeg: 279.23, decDeg: 38.78, magnitude: 0.03 },
  { name: "Sheliak", raDeg: 282.52, decDeg: 33.36, magnitude: 3.52 },
  { name: "Sulafat", raDeg: 284.74, decDeg: 32.69, magnitude: 3.24 },
  { name: "Zeta Lyrae", raDeg: 281.19, decDeg: 37.6, magnitude: 4.34 },

  // Aquila
  { name: "Altair", raDeg: 297.7, decDeg: 8.87, magnitude: 0.77 },
  { name: "Tarazed", raDeg: 296.57, decDeg: 10.61, magnitude: 2.72 },
  { name: "Alshain", raDeg: 298.83, decDeg: 6.41, magnitude: 3.71 },

  // Leo
  { name: "Regulus", raDeg: 152.09, decDeg: 11.97, magnitude: 1.4 },
  { name: "Denebola", raDeg: 177.27, decDeg: 14.57, magnitude: 2.14 },
  { name: "Algieba", raDeg: 154.99, decDeg: 19.84, magnitude: 2.08 },
  { name: "Zosma", raDeg: 168.53, decDeg: 20.52, magnitude: 2.56 },
  { name: "Chertan", raDeg: 168.56, decDeg: 15.43, magnitude: 3.34 },
  { name: "Adhafera", raDeg: 154.17, decDeg: 23.42, magnitude: 3.44 },

  // Boötes (the kite)
  { name: "Arcturus", raDeg: 213.92, decDeg: 19.18, magnitude: -0.05 },
  { name: "Izar", raDeg: 221.25, decDeg: 27.07, magnitude: 2.37 },
  { name: "Seginus", raDeg: 218.02, decDeg: 38.31, magnitude: 3.03 },
  { name: "Nekkar", raDeg: 220.11, decDeg: 40.39, magnitude: 3.49 },
  { name: "Muphrid", raDeg: 208.67, decDeg: 18.4, magnitude: 2.68 },

  // Scorpius (low in the south from the UK, best in summer)
  { name: "Antares", raDeg: 247.35, decDeg: -26.43, magnitude: 0.96 },
  { name: "Shaula", raDeg: 263.4, decDeg: -37.1, magnitude: 1.63 },
  { name: "Sargas", raDeg: 264.33, decDeg: -42.99, magnitude: 1.86 },
  { name: "Dschubba", raDeg: 240.08, decDeg: -22.62, magnitude: 2.29 },
  { name: "Pi Scorpii", raDeg: 239.71, decDeg: -26.11, magnitude: 2.89 },

  // Sagittarius (the teapot — very low from the UK, still worth showing)
  { name: "Kaus Australis", raDeg: 276.04, decDeg: -34.38, magnitude: 1.85 },
  { name: "Nunki", raDeg: 283.82, decDeg: -26.3, magnitude: 2.05 },
  { name: "Kaus Media", raDeg: 274.41, decDeg: -29.83, magnitude: 2.72 },
  { name: "Kaus Borealis", raDeg: 271.45, decDeg: -25.42, magnitude: 2.82 },
  { name: "Ascella", raDeg: 285.65, decDeg: -29.88, magnitude: 2.6 },
  { name: "Phi Sagittarii", raDeg: 278.65, decDeg: -26.99, magnitude: 3.17 },

  // Pegasus (the Great Square)
  { name: "Markab", raDeg: 346.19, decDeg: 15.21, magnitude: 2.49 },
  { name: "Scheat", raDeg: 345.94, decDeg: 28.08, magnitude: 2.42 },
  { name: "Algenib", raDeg: 3.31, decDeg: 15.18, magnitude: 2.83 },

  // Andromeda (continues Pegasus's square into a chain)
  { name: "Alpheratz", raDeg: 2.1, decDeg: 29.09, magnitude: 2.06 },
  { name: "Mirach", raDeg: 17.43, decDeg: 35.62, magnitude: 2.05 },
  { name: "Almach", raDeg: 30.97, decDeg: 42.33, magnitude: 2.1 },

  // Perseus
  { name: "Mirfak", raDeg: 51.08, decDeg: 49.86, magnitude: 1.79 },
  { name: "Algol", raDeg: 47.04, decDeg: 40.96, magnitude: 2.12 },
  { name: "Delta Persei", raDeg: 62.13, decDeg: 47.79, magnitude: 3.01 },
  { name: "Epsilon Persei", raDeg: 59.35, decDeg: 40.01, magnitude: 2.89 },
];

export interface ConstellationDefinition {
  name: string;
  /** Pairs of star names (from CONSTELLATION_STARS) to draw a line between. */
  lines: [string, string][];
}

export const CONSTELLATIONS: ConstellationDefinition[] = [
  {
    name: "Ursa Major",
    lines: [
      ["Dubhe", "Merak"],
      ["Merak", "Phecda"],
      ["Phecda", "Megrez"],
      ["Megrez", "Dubhe"],
      ["Megrez", "Alioth"],
      ["Alioth", "Mizar"],
      ["Mizar", "Alkaid"],
    ],
  },
  {
    name: "Ursa Minor",
    lines: [
      ["Polaris", "Yildun"],
      ["Yildun", "Epsilon Ursae Minoris"],
      ["Epsilon Ursae Minoris", "Zeta Ursae Minoris"],
      ["Zeta Ursae Minoris", "Kochab"],
      ["Kochab", "Pherkad"],
      ["Pherkad", "Zeta Ursae Minoris"],
    ],
  },
  {
    name: "Cassiopeia",
    lines: [
      ["Caph", "Schedar"],
      ["Schedar", "Gamma Cassiopeiae"],
      ["Gamma Cassiopeiae", "Ruchbah"],
      ["Ruchbah", "Segin"],
    ],
  },
  {
    name: "Cepheus",
    lines: [
      ["Alderamin", "Alfirk"],
      ["Alfirk", "Errai"],
      ["Errai", "Iota Cephei"],
      ["Iota Cephei", "Zeta Cephei"],
      ["Zeta Cephei", "Alderamin"],
    ],
  },
  {
    name: "Draco",
    lines: [
      ["Eltanin", "Rastaban"],
      ["Rastaban", "Nu Draconis"],
      ["Nu Draconis", "Grumium"],
      ["Grumium", "Eltanin"],
      ["Rastaban", "Thuban"],
    ],
  },
  {
    name: "Orion",
    lines: [
      ["Betelgeuse", "Bellatrix"],
      ["Bellatrix", "Mintaka"],
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Alnitak", "Saiph"],
      ["Saiph", "Rigel"],
      ["Rigel", "Mintaka"],
      ["Betelgeuse", "Alnitak"],
    ],
  },
  {
    name: "Taurus",
    lines: [
      ["Lambda Tauri", "Aldebaran"],
      ["Aldebaran", "Epsilon Tauri"],
      ["Epsilon Tauri", "Elnath"],
      ["Aldebaran", "Zeta Tauri"],
      ["Aldebaran", "Alcyone"],
    ],
  },
  {
    name: "Gemini",
    lines: [
      ["Castor", "Pollux"],
      ["Castor", "Mebsuta"],
      ["Mebsuta", "Tejat"],
      ["Tejat", "Alhena"],
      ["Pollux", "Wasat"],
      ["Wasat", "Alhena"],
    ],
  },
  {
    name: "Canis Major",
    lines: [
      ["Mirzam", "Sirius"],
      ["Sirius", "Wezen"],
      ["Wezen", "Adhara"],
      ["Wezen", "Aludra"],
    ],
  },
  {
    name: "Auriga",
    lines: [
      ["Capella", "Almaaz"],
      ["Almaaz", "Hassaleh"],
      ["Hassaleh", "Theta Aurigae"],
      ["Theta Aurigae", "Menkalinan"],
      ["Menkalinan", "Capella"],
    ],
  },
  {
    name: "Cygnus",
    lines: [
      ["Deneb", "Sadr"],
      ["Sadr", "Albireo"],
      ["Delta Cygni", "Sadr"],
      ["Sadr", "Gienah Cygni"],
    ],
  },
  {
    name: "Lyra",
    lines: [
      ["Vega", "Zeta Lyrae"],
      ["Zeta Lyrae", "Sheliak"],
      ["Sheliak", "Sulafat"],
      ["Sulafat", "Zeta Lyrae"],
    ],
  },
  {
    name: "Aquila",
    lines: [
      ["Tarazed", "Altair"],
      ["Altair", "Alshain"],
    ],
  },
  {
    name: "Leo",
    lines: [
      ["Regulus", "Algieba"],
      ["Algieba", "Adhafera"],
      ["Algieba", "Zosma"],
      ["Zosma", "Chertan"],
      ["Chertan", "Regulus"],
      ["Zosma", "Denebola"],
    ],
  },
  {
    name: "Boötes",
    lines: [
      ["Arcturus", "Muphrid"],
      ["Arcturus", "Izar"],
      ["Izar", "Seginus"],
      ["Seginus", "Nekkar"],
      ["Nekkar", "Arcturus"],
    ],
  },
  {
    name: "Scorpius",
    lines: [
      ["Pi Scorpii", "Dschubba"],
      ["Dschubba", "Antares"],
      ["Antares", "Sargas"],
      ["Sargas", "Shaula"],
    ],
  },
  {
    name: "Sagittarius",
    lines: [
      ["Kaus Borealis", "Kaus Media"],
      ["Kaus Media", "Kaus Australis"],
      ["Kaus Australis", "Ascella"],
      ["Ascella", "Phi Sagittarii"],
      ["Phi Sagittarii", "Nunki"],
      ["Nunki", "Kaus Borealis"],
    ],
  },
  {
    name: "Pegasus",
    lines: [
      ["Markab", "Scheat"],
      ["Scheat", "Alpheratz"],
      ["Alpheratz", "Algenib"],
      ["Algenib", "Markab"],
    ],
  },
  {
    name: "Andromeda",
    lines: [
      ["Alpheratz", "Mirach"],
      ["Mirach", "Almach"],
    ],
  },
  {
    name: "Perseus",
    lines: [
      ["Mirfak", "Algol"],
      ["Mirfak", "Delta Persei"],
      ["Mirfak", "Epsilon Persei"],
    ],
  },
];
