import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateReadingMinutes, readingTimeLabel } from "./readingTime";

function block(text: string) {
  return { _type: "block", children: [{ _type: "span", text }] };
}

test("estimateReadingMinutes counts words across block spans at ~200wpm", () => {
  const body = [block(Array.from({ length: 600 }, () => "word").join(" "))];
  assert.equal(estimateReadingMinutes(body), 3);
});

test("estimateReadingMinutes never returns less than 1 minute", () => {
  assert.equal(estimateReadingMinutes([block("just a few words")]), 1);
  assert.equal(estimateReadingMinutes([]), 1);
  assert.equal(estimateReadingMinutes(undefined), 1);
});

test("estimateReadingMinutes harvests copy from custom blocks like productTier", () => {
  const body = [
    block(Array.from({ length: 200 }, () => "word").join(" ")),
    {
      _type: "productTier",
      tierTitle: Array.from({ length: 100 }, () => "tier").join(" "),
      tierNote: Array.from({ length: 100 }, () => "note").join(" "),
      products: [
        { _type: "recommendedAccessory", name: "Scope", description: Array.from({ length: 200 }, () => "desc").join(" ") },
      ],
    },
  ];
  // 200 prose + 100 + 100 + 200 = 600 words -> 3 min
  assert.equal(estimateReadingMinutes(body), 3);
});

test("estimateReadingMinutes skips plumbing keys like url and _type", () => {
  const body = [
    { _type: "bodyImage", image: { _ref: "image-abc" }, alt: "nebula", url: "https://example.com/a-very-long-path-that-is-not-prose" },
  ];
  // only "nebula" counts — one word, floored to the 1-minute minimum
  assert.equal(estimateReadingMinutes(body), 1);
});

test("readingTimeLabel spells out the estimate", () => {
  assert.equal(readingTimeLabel([block("word ".repeat(200))]), "1 min read");
});
