// The Classic Framed Print line (GLOBAL-CFPM-*) supports 8 real frame
// colours — confirmed via Prodigi's own Products API (variants[].attributes
// .color) rather than assumed, and priced identically regardless of colour
// (confirmed via a real quote). `value` is the exact string Prodigi's API
// expects in an order's `attributes.color` — do not reformat it.
export interface FrameColorOption {
  value: string;
  label: string;
  /** Approximate swatch for the Quick View mock only — not a colour-accurate
   * sample of the real frame finish. */
  swatch: string;
}

export const FRAME_COLORS: FrameColorOption[] = [
  { value: "black", label: "Black", swatch: "#0a0a0a" },
  { value: "white", label: "White", swatch: "#f2f2ee" },
  { value: "natural", label: "Natural", swatch: "#c9a876" },
  { value: "brown", label: "Brown", swatch: "#5b3a29" },
  { value: "dark grey", label: "Dark Grey", swatch: "#3a3a3a" },
  { value: "light grey", label: "Light Grey", swatch: "#b0b0b0" },
  { value: "silver", label: "Silver", swatch: "#c4c4cc" },
  { value: "gold", label: "Gold", swatch: "#b8964e" },
];

export const DEFAULT_FRAME_COLOR = "black";

export function isValidFrameColor(value: unknown): value is string {
  return typeof value === "string" && FRAME_COLORS.some((c) => c.value === value);
}

export function frameColorLabel(value: string): string {
  return FRAME_COLORS.find((c) => c.value === value)?.label ?? value;
}

// Real Prodigi Classic Frame spec (support.prodigi.com/hc/en-us/articles/
// 13137070879772), not a guess: every framed print gets a conservation-grade
// mount/mat between the glazing and the print, and its width is tiered by
// size — frames 10x10" or below get a 1" mount, 11x14" or below get 1.5",
// 12x16" or above get 2". Used so the Quick View's framed mockup shows a
// real mat window instead of the print running edge-to-edge under the glass.
export function matWidthIn(longEdgeIn: number): number {
  if (longEdgeIn <= 10) return 1;
  if (longEdgeIn <= 14) return 1.5;
  return 2;
}
