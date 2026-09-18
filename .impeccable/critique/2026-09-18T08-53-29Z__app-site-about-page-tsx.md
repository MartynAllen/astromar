---
target: app/(site)/about/page.tsx
total_score: 22
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 2
timestamp: 2026-09-18T08-53-29Z
slug: app-site-about-page-tsx
---
Method: dual-agent (A: design-review sub-agent, source-only · B: detector + live-browser sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3/4 | No skeleton/loading state for hero or thumbnails |
| 2 | Match System / Real World | 4/4 | Genuine first-person voice, real gear, no filler |
| 3 | User Control and Freedom | 3/4 | No back-to-top; every external link opens a new tab with no visual cue |
| 4 | Consistency and Standards | 2/4 | Shared AffiliateButton component is hardcoded rose regardless of context |
| 5 | Error Prevention | n/a | No forms or destructive actions on this page |
| 6 | Recognition Rather Than Recall | 3/4 | Category icons + colour-coded borders aid recognition |
| 7 | Flexibility and Efficiency | 2/4 | Only two anchors exist; no way to jump to a specific gear category |
| 8 | Aesthetic and Minimalist Design | 2/4 | Five non-text elements precede first bio sentence; three equal-weight asks at close |
| 9 | Error Recovery | n/a | No user-triggered error states on this content-only page |
| 10 | Help and Documentation | 3/4 | Affiliate disclosure appropriately scoped and linked |

Total (8 applicable): 22/32 (69%) — Acceptable, bordering Good

## Design Specificity Verdict

Mostly bespoke. The gear system's "minimised" state and the hero-crop logic's real reasoning
(watermark vs. two-subject framing) are genuine craft. Weakest corner: the closing "Support
the site" block (donate + prints + Instagram, no priority ordering) is a pattern any creator
blog could paste in unchanged.

Deterministic scan: clean — detect.mjs returned [] across the page and all six imported
components. Every issue below is heuristic-level, not a design-token violation.

Live browser evidence: hero, bio and gear tiles render correctly at desktop and mobile widths
(after one reload — a known Sanity-CDN dev-cache propagation quirk, not a real bug). DOM audit
found one H1, two H2s, no H3 anywhere — independent confirmation of the heading-structure issue
below. Console flagged the hero image as the page's LCP element with no `priority` hint. Overlay
injection was correctly blocked by the site's own CSP.

## Overall Impression

Good bones — real voice, real gear history, a genuinely warm hero photo. The problems are small,
fixable gaps between what the page looks like it's doing and what the markup does: a caption
that silently disappears in the current hero configuration, buttons that don't say what they
buy, sub-headings that aren't headings, and a shared component that doesn't know what section
it's in.

## What's Working

1. The "minimised" gear pattern — superseded equipment renders compact/dim rather than deleted.
2. Hero-crop reasoning — visibly reasons about two different real constraints, not one rule for all.
3. The support copy's voice — reads as an actual hobbyist, not boilerplate.

## Priority Issues

[P1] The hero photo has no visible caption in its current (live) configuration — app/(site)/about/page.tsx:115
Why it matters: the caption <p> only renders for the heroPhoto (gallery-linked) branch. The site
is currently pinned to the plain heroImage path (Roadford Trail Races photo), which renders no
caption at all — only an invisible alt string. Confirmed live by browser evidence.
Fix: render a short caption for the plain-heroImage branch too.
Suggested command: /impeccable clarify

[P1] Repeated "Buy →" links have no distinguishing accessible name — app/(site)/about/page.tsx:242
Why it matters: every affiliate link in a gear item's sub-list renders as literal "Buy →" with no
aria-label. A screen-reader user hears "Buy, Buy, Buy, Buy" with no way to tell which product.
Fix: add aria-label={`Buy ${sub.label}`}.
Suggested command: /impeccable harden

[P2] Gear category labels are paragraphs, not headings — app/(site)/about/page.tsx:182
Why it matters: "Telescope"/"Camera"/"Accessories"/"Software" are styled as sub-headers but
marked up as <p>. Confirmed by live DOM audit: only two H2s exist on the page; a screen-reader/
keyboard user navigating by heading never discovers the four category groups.
Fix: promote to <h3>, same visual treatment.
Suggested command: /impeccable harden

[P2] AffiliateButton ignores the gear category colour it's rendered inside — components/reviews/AffiliateButton.tsx:16
Why it matters: hardcodes rose unconditionally. Reused inside every gear tile, so a Telescope
tile (teal border/label) shows its own Buy button in rose, while adjacent inline misc-item links
correctly use the category colour. Correction to the design-review sub-agent's original framing:
amber/indigo dual-duty as both section and gear-category colours is intentional and documented
in DESIGN.md, not a real inconsistency — the actual issue is narrower, just this one component.
Fix: pass an optional colour override into AffiliateButton for this page's tiles; leave its rose
default untouched for Reviews, where rose is the correct primary-CTA colour.
Suggested command: /impeccable colorize

[P3] The closing section stacks three equal-weight asks right after the page's warmest line — app/(site)/about/page.tsx:306-345
Why it matters: "...the very late nights that make these images happen. Never expected, always
genuinely appreciated" is the warmest line on the page, immediately followed by two bordered
buttons plus a plain-text Instagram link with no priority ordering. Per the peak-end rule, the
page trails off into a decision list instead of ending on its best moment.
Fix: establish one primary CTA, demote the rest, let the copy's sign-off be the actual ending.
Suggested command: /impeccable distill

## Persona Red Flags

Jordan (first-timer): first content-bearing element after H1 is a "Jump to: gear · support" nav
surfacing monetisation before identity, then an uncaptioned photo of a man and a dog.

Sam (accessibility-dependent): navigating by heading skips all four gear categories entirely
(P2); every misc-item link reads as identical "Buy →" with no way to tell products apart (P1).

Casey (distracted mobile): same front-loading problem, worse on a small screen; every external
link opens a new tab with no warning.

## Minor Observations

- Breadcrumbs on this page render only invisible JSON-LD — consistent site-wide, not About-specific.
- No per-category anchors exist (#the-gear only) — can't deep-link to #software or #camera.
- The gear intro copy assumes rig photos exist in the freeform bio content — a soft, unenforced dependency.
- The hero <Image> has no `priority` prop despite being flagged live as the page's LCP element.

## Questions to Consider

1. If the gear intro's "both rigs above" line depends on specific bio images with no schema
   enforcement, is that coupling worth making explicit, or accepting as a known soft spot?
2. The page's warmest line is followed by a 3-way ask — is that ordering building trust, or
   maximising monetisation touchpoints at the cost of the page's best moment?
