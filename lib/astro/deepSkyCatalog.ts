export type DeepSkyType =
  | "emission-nebula"
  | "reflection-nebula"
  | "planetary-nebula"
  | "supernova-remnant"
  | "galaxy"
  | "open-cluster"
  | "globular-cluster";

export interface DeepSkyObject {
  id: string;
  name: string;
  catalogId: string;
  /** J2000 right ascension, in degrees (0-360) — converted to sidereal hours at use time. */
  raDeg: number;
  /** J2000 declination, in degrees (-90 to 90). */
  decDeg: number;
  /** Approximate apparent magnitude — lower is brighter. */
  magnitude: number;
  type: DeepSkyType;
}

// Curated list of well-known deep-sky targets (mostly Messier, plus the NGC/IC
// objects already familiar from Astromar's own gallery). Coordinates are
// J2000, accurate to within a few arcminutes — plenty of precision for
// altitude/visibility ranking, which changes slowly across the sky.
export const DEEP_SKY_CATALOG: DeepSkyObject[] = [
  { id: "m1", name: "Crab Nebula", catalogId: "M1", raDeg: 83.625, decDeg: 22.017, magnitude: 8.4, type: "supernova-remnant" },
  { id: "m8", name: "Lagoon Nebula", catalogId: "M8", raDeg: 270.95, decDeg: -24.383, magnitude: 6.0, type: "emission-nebula" },
  { id: "m13", name: "Hercules Cluster", catalogId: "M13", raDeg: 250.425, decDeg: 36.467, magnitude: 5.8, type: "globular-cluster" },
  { id: "m16", name: "Eagle Nebula", catalogId: "M16", raDeg: 274.7, decDeg: -13.783, magnitude: 6.0, type: "emission-nebula" },
  { id: "m17", name: "Omega Nebula", catalogId: "M17", raDeg: 275.2, decDeg: -16.183, magnitude: 6.0, type: "emission-nebula" },
  { id: "m20", name: "Trifid Nebula", catalogId: "M20", raDeg: 270.65, decDeg: -23.033, magnitude: 6.3, type: "emission-nebula" },
  { id: "m27", name: "Dumbbell Nebula", catalogId: "M27", raDeg: 299.9, decDeg: 22.717, magnitude: 7.5, type: "planetary-nebula" },
  { id: "m31", name: "Andromeda Galaxy", catalogId: "M31", raDeg: 10.675, decDeg: 41.267, magnitude: 3.4, type: "galaxy" },
  { id: "m33", name: "Triangulum Galaxy", catalogId: "M33", raDeg: 23.475, decDeg: 30.65, magnitude: 5.7, type: "galaxy" },
  { id: "m42", name: "Orion Nebula", catalogId: "M42", raDeg: 83.825, decDeg: -5.383, magnitude: 4.0, type: "emission-nebula" },
  { id: "m45", name: "Pleiades", catalogId: "M45", raDeg: 56.75, decDeg: 24.117, magnitude: 1.6, type: "open-cluster" },
  { id: "m51", name: "Whirlpool Galaxy", catalogId: "M51", raDeg: 202.475, decDeg: 47.2, magnitude: 8.4, type: "galaxy" },
  { id: "m57", name: "Ring Nebula", catalogId: "M57", raDeg: 283.4, decDeg: 33.033, magnitude: 8.8, type: "planetary-nebula" },
  { id: "m63", name: "Sunflower Galaxy", catalogId: "M63", raDeg: 198.95, decDeg: 42.033, magnitude: 8.6, type: "galaxy" },
  { id: "m64", name: "Black Eye Galaxy", catalogId: "M64", raDeg: 194.175, decDeg: 21.683, magnitude: 8.5, type: "galaxy" },
  { id: "m66", name: "Leo Triplet (M66)", catalogId: "M66", raDeg: 170.05, decDeg: 12.983, magnitude: 8.9, type: "galaxy" },
  { id: "m78", name: "M78 Nebula", catalogId: "M78", raDeg: 86.7, decDeg: 0.05, magnitude: 8.3, type: "reflection-nebula" },
  { id: "m81", name: "Bode's Galaxy", catalogId: "M81", raDeg: 148.9, decDeg: 69.067, magnitude: 6.9, type: "galaxy" },
  { id: "m82", name: "Cigar Galaxy", catalogId: "M82", raDeg: 148.975, decDeg: 69.683, magnitude: 8.4, type: "galaxy" },
  { id: "m97", name: "Owl Nebula", catalogId: "M97", raDeg: 168.7, decDeg: 55.017, magnitude: 9.9, type: "planetary-nebula" },
  { id: "m101", name: "Pinwheel Galaxy", catalogId: "M101", raDeg: 210.8, decDeg: 54.35, magnitude: 7.9, type: "galaxy" },
  { id: "m104", name: "Sombrero Galaxy", catalogId: "M104", raDeg: 190.0, decDeg: -11.617, magnitude: 8.0, type: "galaxy" },
  { id: "m106", name: "M106 Galaxy", catalogId: "M106", raDeg: 184.75, decDeg: 47.3, magnitude: 8.4, type: "galaxy" },
  { id: "m3", name: "M3 Cluster", catalogId: "M3", raDeg: 205.55, decDeg: 28.383, magnitude: 6.2, type: "globular-cluster" },
  { id: "m5", name: "M5 Cluster", catalogId: "M5", raDeg: 229.65, decDeg: 2.083, magnitude: 5.6, type: "globular-cluster" },
  { id: "m15", name: "M15 Cluster", catalogId: "M15", raDeg: 322.5, decDeg: 12.167, magnitude: 6.2, type: "globular-cluster" },
  { id: "ngc7000", name: "North America Nebula", catalogId: "NGC 7000", raDeg: 314.7, decDeg: 44.333, magnitude: 4.0, type: "emission-nebula" },
  { id: "ic5070", name: "Pelican Nebula", catalogId: "IC 5070", raDeg: 312.7, decDeg: 44.35, magnitude: 8.0, type: "emission-nebula" },
  { id: "ngc281", name: "Pacman Nebula", catalogId: "NGC 281", raDeg: 13.225, decDeg: 56.617, magnitude: 7.4, type: "emission-nebula" },
  { id: "ic1805", name: "Heart Nebula", catalogId: "IC 1805", raDeg: 38.35, decDeg: 61.433, magnitude: 6.5, type: "emission-nebula" },
  { id: "ic1848", name: "Soul Nebula", catalogId: "IC 1848", raDeg: 42.875, decDeg: 60.417, magnitude: 6.5, type: "emission-nebula" },
  { id: "ngc6960", name: "Western Veil Nebula", catalogId: "NGC 6960", raDeg: 312.75, decDeg: 30.717, magnitude: 7.0, type: "supernova-remnant" },
  { id: "ngc6992", name: "Eastern Veil Nebula", catalogId: "NGC 6992", raDeg: 314.1, decDeg: 31.717, magnitude: 7.0, type: "supernova-remnant" },
  { id: "ngc7023", name: "Iris Nebula", catalogId: "NGC 7023", raDeg: 315.4, decDeg: 68.167, magnitude: 7.1, type: "reflection-nebula" },
  { id: "ngc7380", name: "Wizard Nebula", catalogId: "NGC 7380", raDeg: 341.75, decDeg: 58.1, magnitude: 7.2, type: "emission-nebula" },
  { id: "sh2-108", name: "Sadr Region", catalogId: "SH2-108", raDeg: 305.5, decDeg: 40.25, magnitude: 7.0, type: "emission-nebula" },
  { id: "sh2-171", name: "Teddy Bear Nebula", catalogId: "SH2-171", raDeg: 0.75, decDeg: 67.15, magnitude: 7.0, type: "emission-nebula" },
  { id: "ngc6946", name: "Fireworks Galaxy", catalogId: "NGC 6946", raDeg: 308.7, decDeg: 60.15, magnitude: 9.0, type: "galaxy" },
  { id: "ngc869", name: "Double Cluster", catalogId: "NGC 869/884", raDeg: 35.0, decDeg: 57.133, magnitude: 4.3, type: "open-cluster" },
  { id: "ngc1499", name: "California Nebula", catalogId: "NGC 1499", raDeg: 60.825, decDeg: 36.417, magnitude: 6.0, type: "emission-nebula" },
  { id: "ngc2244", name: "Rosette Nebula", catalogId: "NGC 2244", raDeg: 98.075, decDeg: 4.867, magnitude: 9.0, type: "emission-nebula" },
  { id: "ngc2264", name: "Christmas Tree Cluster", catalogId: "NGC 2264", raDeg: 100.25, decDeg: 9.883, magnitude: 3.9, type: "open-cluster" },
  { id: "ngc7635", name: "Bubble Nebula", catalogId: "NGC 7635", raDeg: 350.175, decDeg: 61.2, magnitude: 10.0, type: "emission-nebula" },
];
