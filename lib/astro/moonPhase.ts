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
