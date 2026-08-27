---
target: /prints landing page (app/(site)/prints/page.tsx)
total_score: 25
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 2
timestamp: 2026-08-27T18-11-37Z
slug: app-site-prints-page-tsx
---
Method: dual-agent (A: a22b5e411b6eda996 · B: ad7c05ef36e09c889)

# Critique: /prints (the new print-shop landing page)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Fine on the happy path, but a failed catalog fetch gives zero indication anything's wrong |
| 2 | Match Between System and Real World | 4 | On-voice throughout — "shipped straight to you," "made to order" |
| 3 | User Control and Freedom | 3 | No traps; Breadcrumbs renders only JSON-LD, no visible trail |
| 4 | Consistency and Standards | 2 | PhotoCard's badge and title both contradict DESIGN.md's own documented rules |
| 5 | Error Prevention | 2 | Print-catalog fetch failure silently strips every buy signal, no visible guard |
| 6 | Recognition Rather Than Recall | 4 | Price is always on-screen, never hidden behind hover/interaction |
| 7 | Flexibility and Efficiency | n/a | Pure browse-to-clickthrough surface; no repeat/expert workflow exists to accelerate |
| 8 | Aesthetic and Minimalist Design | 3 | Clean overall, dented by the off-system badge/title and the duplicate-looking Aurora cards |
| 9 | Error Recovery | 2 | No messaging at all for the catalog-fetch failure case |
| 10 | Help and Documentation | 2 | One "Shipping & returns" link; nothing addresses colour-accuracy/sizing hesitation |
| Total | | 25/36 | Acceptable (69%) |

## Design Specificity Verdict

Design review: Mostly authored for Astromar, not generic. The hero copy and the deliberately-always-visible "from £X" badge both read as considered choices, and reusing PageHero's viewfinder-bracket motif keeps this from reading as a bolted-on storefront template. But the page never surfaces the one thing PRODUCT.md calls the site's "load-bearing claim" — real EXIF/FITS-verified capture data. Every card shows only a title and a date, which a generic print-on-demand shop would show identically. At the component level, PhotoCard has quietly drifted off the site's own documented type system.

Deterministic scan: detect.mjs ran clean on page.tsx, PhotoGrid.tsx, PageHero.tsx, and Breadcrumbs.tsx. One finding, matching what the design review caught independently:
components/gallery/PhotoCard.tsx:38 — design-system-font-size — "text-[11px]" is off the DESIGN.md type ramp (documented floor is 12px).

Visual overlays: No live browser overlay is available this run — script injection was blocked by the site's own CSP (script-src 'self' 'unsafe-inline'), the same policy that also blocks Vercel's analytics script. That's the CSP correctly doing its job, not a critique-tooling failure. Two plain screenshots (desktop + mobile) were captured instead as evidence.

## Overall Impression

The page's bones are right — always-visible pricing, on-voice copy, a curated (not filtered-utility) grid — but its most-repeated element, PhotoCard, is quietly running its own type system instead of the site's, and one real data issue (two visually-identical "Aurora" cards) sits right in the middle of the grid a buyer is meant to trust enough to pay for. The single biggest opportunity: bring PhotoCard back onto DESIGN.md before anything else, since it's the one component doing the actual selling on every page it appears.

## What's Working

- Always-visible pricing signal — every card shows "Prints from £X" while browsing normally, no filter toggle required.
- Voice discipline — copy stays in the observatory-logbook register rather than slipping into marketing tone.
- Structural continuity — reusing PageHero keeps this page visibly part of the same system as Gallery/Reviews/Guide.

## Priority Issues

[P1] PhotoCard breaks three of DESIGN.md's own explicit rules. Badge at text-[11px] (below the documented 12px floor, the exact line the mechanical detector independently flagged); badge is a sharp rectangle when the Sharp Edge Rule requires rounded-full; title renders in plain text-lg text-star-100 instead of the JetBrains Mono uppercase treatment DESIGN.md names by name for "PhotoCard/PhotoDetail titles."
Why it matters: this component repeats on every page that sells anything.
Fix: badge → text-xs rounded-full; title → font-mono uppercase tracking-wide.
Suggested command: /impeccable polish

[P1] Two visually-identical "Aurora" cards sit stacked in the grid. Same title, same date, apparently the same shot.
Why it matters: reads as a bug at the exact moment a visitor is deciding what to buy.
Fix: differentiate the titles (captions already do — "single pillar" vs "twin pillars" — titles don't).
Suggested command: /impeccable clarify

[P2] Zero technical-proof signal on the shop grid. PRODUCT.md frames EXIF/FITS-verified realness as the load-bearing differentiator; cards show only title + date.
Why it matters: the one page asking for money hides the thing that makes these prints worth more than a generic alternative.
Fix: surface one compact shot-detail readout per card in the mono instrument-readout voice.
Suggested command: /impeccable layout

[P2] Silent failure when the print-catalog fetch fails. getPrintProducts().catch(() => []) swallows the error; every price signal vanishes with no messaging.
Why it matters: the page degrades into a plain gallery with no sign it was ever a shop.
Fix: render an explicit "Pricing temporarily unavailable" state.
Suggested command: /impeccable harden

[P3] Hero photo picked mechanically (photos[0], newest), not curated. Currently a dim, brown-toned frame — flatter than material further down the grid.
Fix: bias hero selection toward featured photos within the printable set.
Suggested command: /impeccable polish

## Persona Red Flags

Jordan (first-timer): Hits "giclée" with zero inline definition. Clicking a card lands on an editorial gallery detail page with no cue the shop context carries through.

Riley (stress tester): Immediately flags the two identical Aurora cards as a data bug. The catalog-fetch failure path silently hides every price signal with no error state.

Casey (mobile): Must scroll a full screen and a half past hero + value-prop block before a single purchasable photo appears. Badge text sits at 11px, the smallest text on the page, on the smallest screen.

## Minor Observations

- PhotoGrid.tsx's own empty state is unreachable here since page.tsx gates on photos.length > 0 first with different wording — dead logic plus inconsistent phrasing.
- Breadcrumbs renders only JSON-LD sitewide, not a visible trail — pre-existing pattern, not unique to this page.
- The caption date's italic styling sits close to The Italic Rule's line — arguably covered by the "conventional blockquote" exception since it's metadata not a heading.

## Questions to Consider

- Every other card-title tier on the site is mono/uppercase — why does PhotoCard, the component actually doing the selling, quietly opt out?
- If the print-catalog feed goes down for five minutes, does anyone notice the shop page stopped being a shop page?
- The brand's whole pitch is "not stock imagery, verifiably real" — why does the one page asking for money hide the proof?
