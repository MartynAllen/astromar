---
target: review the /learn page restructure as a senior UI/UX developer
total_score: 20
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 2
timestamp: 2026-09-15T16-10-18Z
slug: components-learn-learnfilter-tsx
---
# Design Critique: /learn Index Page (Astromar)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Filtering can silently remove an entire section with no acknowledgment |
| 2 | Match Between System and Real World | 3 | Plain-language labels map cleanly to reader expectations |
| 3 | User Control and Freedom | 3 | "All" is an easy reset; router.replace means back-button can't step through filter history |
| 4 | Consistency and Standards | 3 | Site tokens respected throughout, but thumbnail presence is inconsistent within one section |
| 5 | Error Prevention | 3 | No destructive actions exist; nothing to prevent |
| 6 | Recognition Rather Than Recall | 4 | Filter state always visible, reflected in the URL |
| 7 | Flexibility and Efficiency | n/a | Not applicable to a Read-mode content index |
| 8 | Aesthetic and Minimalist Design | 2 | Section header, card meta line, and filter pills share near-identical uppercase-mono-amber treatment |
| 9 | Error Recovery | n/a | No error-producing interactions on this page |
| 10 | Help and Documentation | n/a | Self-evident browse-and-click page |
| Total | | 20/28 | Good (71%) |

## Design Specificity Verdict
LLM (A): Mostly on-brand at the token level, but the optional per-article thumbnail — present on some rows, absent on others within the same section — is a generic blog-index pattern and reads as unfinished rather than authored.
Deterministic (B): detect.mjs ran clean, 0 findings. The detector isn't built to catch inconsistent-presence or shared-hierarchy-color judgment calls; a clean scan and a real design-specificity problem coexist here.
Visual overlays: unavailable — B's injection was blocked by the site's own CSP (script-src 'self', connect-src 'self'), a correctly-behaving security header, not a tooling failure.

## Overall Impression
Genuine IA improvement (deliberate section order, honest descriptions, earlier metadata) sitting on a visual treatment that reads more "blog template + thumbnails" than "Astromar." Biggest opportunity: decide the thumbnail question one way or the other.

## What's Working
- Section descriptions carry real editorial voice, matching the site's field-log register.
- Deliberate, documented section ordering (buying -> understanding -> technique) is a real IA upgrade over alphabetical.
- Contrast and focus states are solid: amber meta line measured at ~12.2:1 (B), correct sharp-cornered focus outlines throughout (A).

## Priority Issues

[P1] Inconsistent thumbnail presence reads as unfinished — confirmed independently by both assessments.
Why it matters: an optional, data-dependent visual feature undermines the "precision instrument" identity DESIGN.md commits to.
Fix: require a cover image at publish time, or drop thumbnails from the index entirely.
Suggested command: /impeccable layout or /impeccable harden

[P2] Every image on the page — hero and all 7 thumbnails — has alt="".
Why it matters: the site's stated differentiator is "real photos, not stock" — a screen-reader user gets zero signal photography exists here at all.
Fix: give thumbnails real alt text derived from the article title/summary.
Suggested command: /impeccable harden

[P2] A content-type filter can make an entire section vanish with no acknowledgment.
Why it matters: a visitor landing on a filtered link, or a screen-reader user, may conclude content doesn't exist when it's one click away.
Fix: inline note or "Showing N articles" line, paired with an aria-live region.
Suggested command: /impeccable clarify

[P1] Fixed-size thumbnail creates visible dead space against variable-height text on mobile.
Why it matters: on mobile, a visible asymmetric gap next to a photo reads as a broken/failed-to-load image.
Fix: vertically center the text block, or let the thumbnail track content height.
Suggested command: /impeccable adapt

[P3] Section headers and card meta lines are nearly visually identical (amber, uppercase, mono, differing mainly by size).
Why it matters: two different hierarchy tiers share one color signal, blurring a fast scan.
Fix: reserve amber for section headers only; move the card meta line to star-500.
Suggested command: /impeccable typeset

## Persona Red Flags
Jordan (first-timer): filtering can hide "Buying Gear" entirely with no explanation; the deliberate reading order is only inferable.
Sam (accessibility-dependent): every image has alt=""; no aria-live on filter change compounds the section-disappearance issue. Heading hierarchy is correctly nested, a genuine win.
Casey (mobile): the dead-space-below-thumbnail issue is most visible on a quick thumb-scroll, reading as a load failure. Touch targets themselves are fine.

## Minor Observations
- The "1 Issue" badge and an apparent duplicate-header artifact are confirmed false positives (Next.js dev overlay; screenshot compositing artifact) — not real defects.
- router.replace (not push) means the back button can't step through filter states — confirm this is deliberate.
- The empty-state copy is currently unreachable with real data — fine to leave as an untested safety net.

## Questions to Consider
1. If a cover image can't be guaranteed for every article, commit to "no thumbnails, ever" instead of a partial feature?
2. Would a Learn-specific instrument-readout motif (echoing the homepage's 01/02/03 index) tie these cards to Astromar's voice better than a generic content-type/difficulty/read-time line?
3. Should the schema require a cover image before a guide article can publish, so this can't recur?
