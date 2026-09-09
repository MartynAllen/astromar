// The fine-art paper line (unframedSku/framedSku on printProduct) is fixed
// to one matte finish — Prodigi has no finish attribute on it at all. A
// genuine gloss/lustre choice only exists on their separate C-type photo
// paper line (photoPaperSku), confirmed via a real Products API call to
// take a "finish" attribute of exactly these two values. "Matte" isn't a
// real Prodigi attribute value — picking it just means ordering the
// existing unframedSku instead of photoPaperSku, with no attributes sent
// at all (see checkout/webhook).
export type PrintFinish = "matte" | "gloss" | "lustre";

export interface PrintFinishOption {
  value: PrintFinish;
  label: string;
}

export const PRINT_FINISHES: PrintFinishOption[] = [
  { value: "matte", label: "Matte" },
  { value: "gloss", label: "Gloss" },
  { value: "lustre", label: "Lustre" },
];

export const DEFAULT_PRINT_FINISH: PrintFinish = "matte";

export function isValidPrintFinish(value: unknown): value is PrintFinish {
  return typeof value === "string" && PRINT_FINISHES.some((f) => f.value === value);
}

export function printFinishLabel(value: string): string {
  return PRINT_FINISHES.find((f) => f.value === value)?.label ?? value;
}
