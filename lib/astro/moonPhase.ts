import { getMoonIllumination } from "suncalc";

export interface MoonPhaseInfo {
  fraction: number; // illuminated fraction, 0-1
  phase: number; // 0 = new, 0.5 = full, 1 = next new (suncalc convention)
  phaseName: string;
}

const PHASE_NAMES: Array<{ upTo: number; name: string }> = [
  { upTo: 0.02, name: "New Moon" },
  { upTo: 0.24, name: "Waxing Crescent" },
  { upTo: 0.26, name: "First Quarter" },
  { upTo: 0.49, name: "Waxing Gibbous" },
  { upTo: 0.51, name: "Full Moon" },
  { upTo: 0.74, name: "Waning Gibbous" },
  { upTo: 0.76, name: "Last Quarter" },
  { upTo: 0.98, name: "Waning Crescent" },
  { upTo: 1.01, name: "New Moon" },
];

function phaseNameFromValue(phase: number): string {
  return PHASE_NAMES.find((p) => phase <= p.upTo)?.name ?? "New Moon";
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const { fraction, phase } = getMoonIllumination(date);
  return { fraction, phase, phaseName: phaseNameFromValue(phase) };
}

// Average synodic month (new moon to new moon) — the real rate varies by up
// to several hours across a cycle (an elliptical orbit isn't quite uniform),
// so a "days to next full/new moon" readout built from this is a genuine
// estimate, accurate to well under a day either way, not a claim of
// second-precision. Good enough for what this is: a rough "coming up soon"
// line, not an ephemeris.
const SYNODIC_MONTH_DAYS = 29.530588;

export interface NextPhaseInfo {
  target: "full" | "new";
  days: number;
}

/** Pure math half of getNextPhase, split out so it's testable with exact
 * phase values rather than needing a real Date suncalc will accept. */
export function nextPhaseFromValue(phase: number): NextPhaseInfo {
  const daysToFull = ((0.5 - phase + 1) % 1) * SYNODIC_MONTH_DAYS;
  const daysToNew = ((1 - phase + 1) % 1) * SYNODIC_MONTH_DAYS;
  return daysToFull <= daysToNew
    ? { target: "full", days: daysToFull }
    : { target: "new", days: daysToNew };
}

/** Whichever of the next full or new moon comes first, and how many days
 * off it is (suncalc's `phase` is monotonic 0->1 across one cycle, so this
 * is closed-form — no day-by-day scanning needed). */
export function getNextPhase(date: Date = new Date()): NextPhaseInfo {
  const { phase } = getMoonIllumination(date);
  return nextPhaseFromValue(phase);
}
