---
target: Home page
total_score: 25
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 3
timestamp: 2026-08-14T15-29-58Z
slug: app-site-page-tsx
---
# Astromar — Home Page Critique

**Method:** dual-agent (A: isolated design-review sub-agent · B: isolated detector/browser-evidence sub-agent)
**Target:** Home page (`app/(site)/page.tsx`) — no target was named, resolved to the site's entry point as the default.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3/4 | Hover/focus states real; no loading state if featured-photo fetch is slow |
| 2 | Match Between System & Real World | 4/4 | "Field log," honest hedged copy matches the voice |
| 3 | User Control and Freedom | 3/4 | Standard nav, no dead ends |
| 4 | Consistency and Standards | 2/4 | Heading order breaks (h1→h3→h2); home hero drops the site's own PageHero pattern |
| 5 | Error Prevention | 3/4 | No forms/destructive actions on this page |
| 6 | Recognition Rather Than Recall | 4/4 | Persistent nav; teaser list restates the whole sitemap in 4 seconds |
| 7 | Flexibility and Efficiency | n/a | Read-only browsing surface |
| 8 | Aesthetic and Minimalist Design | 3/4 | Strong restraint, undercut by duplicate hero/thumbnail photo |
| 9 | Error Recovery | 3/4 | No error states present to fail |
| 10 | Help and Documentation | n/a | Not applicable to a personal blog homepage |
| **Total** | | **25/32** | **Good (78%)** |

## Design Specificity Verdict

**LLM assessment:** Genuinely specific system, not a reskin. The mono "instrument readout" voice, the palette pulled from the author's own nebula frames, and the flat/sharp-corner treatment are load-bearing, not decorative. The hero's composition itself (full-bleed photo, eyebrow, serif headline, two stacked outlined CTAs) is well-executed but structurally interchangeable; specificity lives in what's layered on top.

**Deterministic scan:** CLI scan over the Home page + shared components: exit 2, 3 advisory findings, all the same rule (`text-[11px]` off DESIGN.md's type ramp) in PageHero.tsx:44, VisibilityFinder.tsx:170, StatusBadge.tsx:14 — none of which render on the Home page itself (scan was scoped broader than the target for thoroughness).

Injected browser overlay: 17 anti-patterns by its own count (raw console lines totaled closer to 23 — discrepancy reported as observed, not resolved). Several are likely false positives against the site's *committed* system: `ai-color-palette` (flagging the deliberate, contrast-verified teal brand accent), `overused-font` (Instrument Serif at 25%, expected given the type-hierarchy rules), `call-caps-body` (almost certainly the documented mono-uppercase label pattern), `image-hover-transform` ×4 (the deliberate restrained 3% scale, not an aggressive hover-lift). `hero-eyebrow-chip` is a genuine tension worth naming: the skill's own craft-floor bans kickers/eyebrows unconditionally, but DESIGN.md explicitly documents eyebrow lines as correct Mono-Does-More usage — siding with the documented system per "the brief wins," but flagging that the generic detector will keep catching it.

Two findings hold up as real: **the heading-hierarchy break was found independently by both assessments** (manual accessibility-tree read and mechanical scan, with zero coordination) — the strongest-confidence finding in this report. B also independently verified a **WCAG contrast failure A's manual review didn't flag**: `text-star-700` index numbers/arrows compute to 2.97:1 against a 4.5:1 requirement, checked two ways.

## Overall Impression

The system holds up under scrutiny — the palette, type voice, and IA are specific and earned, and two independent reviewers converged on the same structural defect unprompted. The gap between "good" and "excellent" is almost entirely two small, cheap-to-fix mistakes rather than anything wrong with the direction.

## What's Working

1. **The section-teaser list does real IA work** — four sections, honest one-line descriptions, hover accents tied to each section's actual colour token. A first-time visitor learns the sitemap in ~4 seconds.
2. **The hero photo is unmistakably real**, not a mood-board stand-in — at `bg-void-950/28` you can see individual stars and the nebula's colour through the wash, a deliberate bet against DESIGN.md's own named failure mode.
3. **Keyboard focus states are real and verified live** — both hero CTAs get a clear ring distinct from hover, easy to skip on a personal project and wasn't.

## Priority Issues

**[P0] The hero photo and the first "Featured shots" tile are the same photograph.** `heroPhoto = featured[0]` feeds the hero, and the full `featured` array (including index 0) feeds the grid below — the same shot appears twice within one scroll gesture, undercutting the "body of work" job of Featured Shots.
Fix: `featured.slice(1)` for the grid, or fetch one extra photo. Suggested command: direct fix / `/impeccable clarify`.

**[P1] Heading hierarchy skips and reverses: h1 → h3 → h2.** Confirmed independently by both assessments. Fails WCAG 2.4.6/1.3.1, breaks screen-reader heading navigation.
Fix: promote teaser titles to h2, demote "Featured shots" to match. Suggested command: `/impeccable harden`.

**[P1] Text fails WCAG AA contrast: 2.97:1 vs 4.5:1 required.** `text-star-700` on index numbers and hover-arrows, verified two independent ways.
Fix: step up to `text-star-500` for anything conveying information. Suggested command: `/impeccable audit`.

**[P1] Home hero silently drops the site's own signature hero pattern.** DESIGN.md calls PageHero's three corners + credit chip "the system's signature component"; the home hero has two corners and no credit link — the first photo every visitor sees is the only one on the site without provenance, cutting against PRODUCT.md's core positioning claim.
Fix: add the same credit-link treatment. Suggested command: `/impeccable layout`.

**[P2] Mobile hero runs ~1150px before any content appears** — 3-4 swipes of pure hero on a 390px screen before the sitemap teaser list appears.
Fix: tighten the trailing gap under the CTAs on mobile. Suggested command: `/impeccable adapt`.

**[P3] Mobile menu hamburger has no visual weight or affordance** — bare icon, no button background.
Fix: hover/active state on the icon hit-area. Suggested command: `/impeccable polish`.

## Persona Red Flags

**Jordan (First-Timer):** Well served overall; "Field log" is unexplained house-style jargon on first read but resolves via context within seconds.

**Riley (Stress Tester):** Immediately notices the duplicate hero/thumbnail photo. Would also probe the `md:`-breakpoint nav collapse for a cramped intermediate width — not verified live, flagged as unconfirmed.

**Casey (Distracted Mobile):** The oversized mobile hero is the main obstacle. Photos are a plain lazy column stack (good), CTAs are large and thumb-reachable (good).

## Minor Observations

- Footer's conditional 2/3-col grid is a sensible defensive pattern given `siteSettings` isn't configured yet.
- The 3 off-ramp `text-[11px]` instances are outside the Home page itself but worth a sweep next time those files are touched.
- One very tall portrait crop can dominate the mobile masonry grid depending on which photos are featured.
- The Vercel Analytics 404 and `?_rsc=` `net::ERR_ABORTED` entries are expected local-dev/Next-router noise, not defects.

## Questions to Consider

1. If the hero photo is the strongest single image on the site, what would Featured Shots look like framed explicitly as "everything except what you just saw"?
2. Would reusing PageHero and layering the extra hero-only content around it (rather than instead of it) keep the credit-link guarantee without a special case to maintain?
