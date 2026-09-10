// A rough "N min read" estimate for a Portable Text body, in the same
// spirit as the figure LinkedIn/Medium show at the top of an article.
// Deliberately simple: total the readable words and divide by a fixed
// reading speed. Precision isn't the point — a "~4 min read" only needs to
// set the right expectation.
const WORDS_PER_MINUTE = 200;

// Keys whose string values are plumbing, not prose — skipped when
// harvesting text from custom blocks (productTier, bodyImage, …) so a URL
// or a type name never lands in the word count.
const NON_PROSE_KEYS = new Set(["_type", "_key", "_ref", "url", "href", "label", "language", "filename"]);

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

// Recursively total the words in every prose-ish string under a node —
// used for custom blocks whose shape this module doesn't want to hard-code
// (productTier's tier/product copy, an image caption, and so on).
function harvestWords(node: unknown): number {
  if (typeof node === "string") return countWords(node);
  if (Array.isArray(node)) return node.reduce<number>((sum, child) => sum + harvestWords(child), 0);
  if (node && typeof node === "object") {
    let sum = 0;
    for (const [key, child] of Object.entries(node)) {
      if (NON_PROSE_KEYS.has(key)) continue;
      sum += harvestWords(child);
    }
    return sum;
  }
  return 0;
}

interface PortableTextBlockLike {
  _type?: unknown;
  children?: unknown;
}

export function estimateReadingMinutes(body: unknown): number {
  if (!Array.isArray(body)) return 1;

  let words = 0;
  for (const block of body as PortableTextBlockLike[]) {
    if (!block || typeof block !== "object") continue;
    if (block._type === "block") {
      // Standard block — count only its own span text, precisely.
      if (!Array.isArray(block.children)) continue;
      for (const child of block.children) {
        const text = (child as { text?: unknown })?.text;
        if (typeof text === "string") words += countWords(text);
      }
    } else {
      // Custom block (productTier, bodyImage, code, …) — harvest whatever
      // reads as copy. Code blocks get counted too; a long snippet does
      // add real time on the page.
      words += harvestWords(block);
    }
  }

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** "4 min read" — the label itself, so callers don't each re-spell it. */
export function readingTimeLabel(body: unknown): string {
  return `${estimateReadingMinutes(body)} min read`;
}
