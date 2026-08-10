// Stable astronomical facts (peak dates vary by at most a day or two year to
// year) — reviewed data, not editorial content, so it lives in code rather
// than the CMS. Update dates here if a year's forecast shifts materially.
export interface MeteorShower {
  name: string;
  radiant: string;
  peakMonth: number; // 1-12
  peakDay: number;
  activeStart: { month: number; day: number };
  activeEnd: { month: number; day: number };
  zhr: number; // typical zenithal hourly rate
}

export const METEOR_SHOWERS: MeteorShower[] = [
  { name: "Quadrantids", radiant: "Boötes", peakMonth: 1, peakDay: 3, activeStart: { month: 12, day: 26 }, activeEnd: { month: 1, day: 16 }, zhr: 120 },
  { name: "Lyrids", radiant: "Lyra", peakMonth: 4, peakDay: 22, activeStart: { month: 4, day: 14 }, activeEnd: { month: 4, day: 30 }, zhr: 18 },
  { name: "Eta Aquariids", radiant: "Aquarius", peakMonth: 5, peakDay: 5, activeStart: { month: 4, day: 19 }, activeEnd: { month: 5, day: 28 }, zhr: 50 },
  { name: "Southern Delta Aquariids", radiant: "Aquarius", peakMonth: 7, peakDay: 30, activeStart: { month: 7, day: 12 }, activeEnd: { month: 8, day: 23 }, zhr: 25 },
  { name: "Perseids", radiant: "Perseus", peakMonth: 8, peakDay: 12, activeStart: { month: 7, day: 17 }, activeEnd: { month: 8, day: 24 }, zhr: 100 },
  { name: "Orionids", radiant: "Orion", peakMonth: 10, peakDay: 21, activeStart: { month: 10, day: 2 }, activeEnd: { month: 11, day: 7 }, zhr: 20 },
  { name: "Leonids", radiant: "Leo", peakMonth: 11, peakDay: 17, activeStart: { month: 11, day: 6 }, activeEnd: { month: 11, day: 30 }, zhr: 15 },
  { name: "Geminids", radiant: "Gemini", peakMonth: 12, peakDay: 13, activeStart: { month: 12, day: 4 }, activeEnd: { month: 12, day: 20 }, zhr: 150 },
  { name: "Ursids", radiant: "Ursa Minor", peakMonth: 12, peakDay: 22, activeStart: { month: 12, day: 17 }, activeEnd: { month: 12, day: 26 }, zhr: 10 },
];

/** Next occurrence of this shower's peak date, at or after `from`. */
export function nextPeakDate(shower: MeteorShower, from: Date = new Date()): Date {
  const year = from.getUTCFullYear();
  const thisYear = new Date(Date.UTC(year, shower.peakMonth - 1, shower.peakDay));
  if (thisYear >= startOfDay(from)) return thisYear;
  return new Date(Date.UTC(year + 1, shower.peakMonth - 1, shower.peakDay));
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function getUpcomingMeteorShowers(from: Date = new Date(), limit = 4) {
  return [...METEOR_SHOWERS]
    .map((shower) => ({ shower, peak: nextPeakDate(shower, from) }))
    .sort((a, b) => a.peak.getTime() - b.peak.getTime())
    .slice(0, limit);
}
