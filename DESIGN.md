---
name: Astromar
description: An observatory-logbook read on a personal astrophotography blog — precise, sharp-cornered, and built entirely from the author's own real photos.
colors:
  void-950: "#05060a"
  void-900: "#0a0c14"
  void-700: "#1b1e2c"
  void-600: "#262a3b"
  star-100: "#f5f7fa"
  star-300: "#c7cbd9"
  star-500: "#8a90a6"
  star-700: "#565b6e"
  nebula-rose-400: "#e2543f"
  nebula-rose-500: "#cc3a26"
  nebula-rose-700: "#832316"
  nebula-teal-300: "#a8ecf5"
  nebula-teal-400: "#6fdcec"
  nebula-teal-500: "#35c4de"
  nebula-teal-700: "#1a7e93"
  nebula-amber-400: "#f0c26f"
  nebula-green-400: "#8fe0ab"
  nebula-indigo-400: "#8fb2f5"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, \"Times New Roman\", serif"
    fontSize: "clamp(1.5rem, 4vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, ui-monospace, \"SFMono-Regular\", monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.nebula-rose-400}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.nebula-rose-400}"
    textColor: "{colors.void-950}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.star-300}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 20px"
  button-secondary-hover:
    textColor: "{colors.star-100}"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.star-500}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.star-500}"
    typography: "{typography.label}"
  nav-link-hover:
    textColor: "{colors.nebula-teal-400}"
---

# Design System: Astromar

## Overview

**Creative North Star: "The Observatory Log"**

Astromar reads like a precision instrument's logbook, not a SaaS template with
space-themed copy. The system was built as a deliberate reaction against the default
visual grammar of AI-generated sites in 2025–26 — near-black background, rounded bordered
cards, a Grotesk/Inter pairing, hover-reveals-color as the only interaction — which is
tasteful but has no point of view. Astromar commits to a specific one instead: sharp
corners, hairline rules, an oversized single-weight serif for headlines, and a monospace
voice pushed far beyond its usual "code block" job into nav labels, buttons, badges, and
data readouts throughout.

The real photos carry the vibrancy. Early passes buried them under near-opaque overlays
and reduced the whole site to "dark template with a caption" — the exact failure this
system exists to avoid. Hero photos are now genuinely visible; a light flat wash plus one
top-fading gradient darkens only what sits directly behind text. Colour itself stays
restrained everywhere else: one deliberate accent per moment, not a wash of hue on every
surface.

**Confirmed rejections:** rounded-corner "SaaS card" styling for containers; drop
shadows/elevation as a depth cue; italic anywhere (see The Italic Rule — a font with no
bold weight fake-bolds badly, so italic looked like the remaining lever, but on a
delicate high-contrast serif it read as strained rather than confident; hierarchy is
size and colour only, full stop); gradient text on headlines.

**Key Characteristics:**
- Sharp corners everywhere except pills/badges and one circular icon button — never a
  soft, ambiguous middle ground.
- A single-weight display serif (Instrument Serif) that carries hierarchy through size
  alone, never through fake-bolding a weight it doesn't have.
- JetBrains Mono as a structural voice: nav, buttons, badges, index numbers, category
  labels, shot-detail readouts — not just code.
- A restrained core palette (rose + teal) with four single-shade section accents,
  applied sparingly rather than saturating every surface.
- Real astrophotography as the dominant visual material, not decoration around text.

## Colors

Near-black base with two photo-derived accents doing most of the work, plus four
single-shade accents that each mark exactly one section of the site.

### Primary
- **Nebula Rose** (`#e2543f`): the primary accent. Originally tuned as a lighter pink
  pulled from the Pelican/Veil frames; retuned to a deeper Hydrogen-alpha red after a
  design review — still traceable to the same real photos (Hα emission is the classic
  deep-red cast most of those targets actually process into), just a truer read of it
  than the original pink. The Tailwind/CSS token keeps the `nebula-rose-*` name for
  continuity — repointing 30+ files for a naming nicety wasn't worth it — so treat "rose"
  as the token's technical name, not a literal colour description anymore. Carries
  primary CTAs ("View the gallery"), the Reviews section, the emphasis phrase in the
  home hero (colour only now — see The Italic Rule), and the camera gear-category
  accent.

### Secondary
- **Nebula Teal** (`#6fdcec`): the brand/navigation accent, retuned bluer than the
  original East Veil-derived teal so the logo mark and the wordmark gradient read as the
  same colour. Carries the logo, focus rings, link hovers, the Gallery section, and the
  telescope gear-category accent.

### Tertiary (section accents — one shade each, used to mark exactly one part of the site)
- **Nebula Amber** (`#f0c26f`): the Guide section and the "Accessories" gear category.
- **Nebula Green** (`#8fe0ab`): the Research section only.
- **Nebula Indigo** (`#8fb2f5`): the Calendar section and the "Software" gear category.

### Neutral
- **Void 950** (`#05060a`): the page background. Near-black, not pure black — this is a
  fixed dark theme by design, astrophotography reads best against near-black regardless
  of system light/dark preference.
- **Void 900** (`#0a0c14`): raised surfaces — cards, panels, the header (at 85% opacity
  over content), the footer.
- **Void 700** (`#1b1e2c`): the default border and divider colour, used more than any
  other single token in the system — this is a hairline-rule system, and this is the
  hairline.
- **Void 600** (`#262a3b`): secondary borders — form inputs, outlined secondary buttons,
  unselected badge borders.
- **Star 100** (`#f5f7fa`): primary text.
- **Star 300** (`#c7cbd9`): secondary text and default link colour.
- **Star 500** (`#8a90a6`): muted body copy, the most common text colour after Star 100.
- **Star 700** (`#565b6e`): reserved for genuinely decorative marks only — bullet glyphs
  in sub-item lists, form-input placeholder text — never for text that is itself the
  entire message. At ~2.9:1 against Void 950 it fails WCAG AA for normal text, so
  anything a visitor actually needs to read (legal links, list-index numbers, empty-state
  messages, captions) uses Star 500 or lighter instead. Legal links and list-index
  numbers both started on Star 700 and were moved to Star 500 after a contrast review —
  kept here as the reasoning, not a leftover to re-litigate.

### Named Rules
**The One Accent Rule.** Never more than one accent colour is doing active work in a
single component at once. A card's border, label, and icon all share the same accent —
they don't each pick a different one.

**The Section Colour Rule.** Amber, green, and indigo each belong to exactly one section
(Guide, Research, Calendar). Introducing a new top-level section should either reuse an
existing colour from a related gear category or extend the scale deliberately, never
borrow another section's colour.

### Currently unused, still defined
`--color-void-800` (`#12141f`) and `--color-nebula-violet-400` (`#c99ef2`) remain in
`app/globals.css` but nothing in the current markup references them — violet was the
Discussion section's accent before that feature was removed entirely. Reuse them for a
genuinely new purpose or remove them; don't let a future addition treat "violet exists"
as license to reintroduce a fifth section accent without the Section Colour Rule's
reasoning behind it.

## Typography

**Display Font:** Instrument Serif (with Georgia, "Times New Roman", serif fallback)
**Body Font:** IBM Plex Sans (with ui-sans-serif, system-ui fallback)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, "SFMono-Regular" fallback)

**Character:** An engraved-instrument-plate serif for headlines, set against a plain
engineering-heritage sans for reading copy and a mono voice that runs through nearly
every piece of UI chrome. Instrument Serif ships in exactly one weight and no real bold
cut, so hierarchy is built from size and colour alone — never from a font-weight
utility, which the browser would fake-bold into something that doesn't match the
family's real letterforms, and not from italic either (see The Italic Rule).

### Hierarchy
- **Display / Hero** (400, `text-5xl` mobile → `text-7xl` desktop, `leading-[1.05]`): the
  home page's headline only.
- **Headline** (400, `text-4xl`): every other page's H1 (Gallery, Reviews, Guide,
  Calendar, Research, About, article/review/photo titles).
- **Title** (400, `text-3xl` / `text-2xl`): section headers within a page ("The gear",
  "Featured shots", PortableText H2s) and list-item titles on the home page's teaser
  list.
- **Subtitle** (400, `text-xl` / `text-lg`): card and list-item titles — review titles,
  guide article titles, research project titles, gear tile names, PhotoCard captions.
- **Body** (IBM Plex Sans 400, `text-sm`–`text-lg`, `leading-relaxed` in prose):
  descriptions, article body copy. Prose columns cap around 65ch via `max-w-2xl`.
- **Label** (JetBrains Mono 400, `text-xs` and up, `tracking-widest`, uppercase):
  navigation, buttons, badges, category labels, eyebrow lines, shot-detail readouts,
  list-index numbers. `text-xs` (12px) is the floor — the type ramp has no smaller
  step; a mechanical detector catches any stray `text-[11px]` or similar arbitrary
  size that drifts below it.

### Named Rules
**The Italic Rule.** Italic is used nowhere on the site. It was tried twice and reversed
twice: first on every heading (read as precious rather than confident), then narrowed to
just the "Astromar" wordmark and the home hero's emphasised phrase — which still read as
strain rather than intent once looked at critically, since Instrument Serif has no real
bold weight to pair it against, so italic was the only lever being pulled and it showed.
Hierarchy is built from size and colour alone, full stop. Don't reach for italic to mark
something as special; reach for size, the rose/teal accent, or a mono label instead.

**The Mono-Does-More Rule.** JetBrains Mono is not reserved for literal code. It's the
system's "instrument readout" voice: anywhere the UI is labelling, counting, or reporting
a value rather than writing prose, it's mono, uppercase, and letter-spaced — nav links,
button labels, badges, the home page's `01`/`02`/`03` list index, shot-detail rows like
`845 × 10s · 140.8 min · LP`.

## Layout

Content sits in one of four fixed-width containers depending on the page's density,
centred with `mx-auto` and `px-6` horizontal padding: `max-w-6xl` for wide, photo-grid
pages (Home, Gallery), `max-w-3xl` for medium list pages (Reviews, Guide, Research
index), `max-w-4xl` for Calendar specifically, and `max-w-2xl` for narrow reading pages
(About, Privacy, Disclosure, and every article/review/photo detail page). The header is
a fixed `h-20` sticky bar (`bg-void-950/85` with `backdrop-blur`) with a hairline bottom
border; the same `max-w-6xl` container governs it.

Calendar breaks from its list-page siblings' `max-w-3xl` on purpose: unlike Reviews or
Guide, it isn't a list of titles, it's a dashboard of widgets (the moon-phase/meteor-
shower pair, the visibility finder's wrapping per-hour result chips). At `max-w-3xl` the
finder's chip rows wrapped raggedly — a lone chip stranding itself on its own row with
a few hundred px of dead space beside it. `max-w-4xl` gives that flex-wrap content
enough room to settle before repeating the pattern elsewhere: a data-dense page earns
more width than a reading-page container, it doesn't inherit one by default.

List-style pages favour `divide-y divide-void-700` rows over card grids — the home page's
section-teaser list and every index page's article/review list read as a single ruled
list, not a wall of boxes. Grids are reserved for genuinely grid-shaped content: the
Gallery's masonry (`columns-1 sm:columns-2 lg:columns-3`).

The About page's gear tiles are deliberately not a grid — they're grouped into per-category
clusters (Camera, Telescope, Accessories, Software; only categories with items render),
each with its own mono category-colour header that now carries the label a per-tile badge
used to repeat. Tiles inside a cluster use `flex flex-wrap` rather than fixed columns, sized
to content within a `sm:min-w-[260px] sm:max-w-[288px]` band — not a straight
`sm:w-[calc(50%-...)]` split, which was tried first and left short-content tiles stretched
with dead internal padding, reading as broken rather than clustered; the fixed band is
narrow enough that two tiles genuinely sit side by side inside the page's `max-w-2xl`
column instead of wrapping to separate rows. Alternating tiles nudge down on `sm:`
(`sm:mt-7` on every other one) so a same-category pair sits near each other without lining
up in a rigid row — proximity marks the group, the stagger keeps it from reading as a
spreadsheet. Gap is tight within a cluster (`gap-4`) and generous between clusters
(`space-y-10`), the same proximity principle the divide-y lists use elsewhere. The catch-all
"Miscellaneous" tile still spans full width within its cluster, since it holds more content
than the others. Mobile drops both the width band and the stagger entirely (`sm:`-gated) —
full-width single-column stacking, no offset.

Responsive behaviour is mobile-first Tailwind breakpoints throughout (`sm:`, `lg:`), with
the header's full nav collapsing to a hamburger below `md:` — raised from the more typical
`sm:` specifically because a 6-item mono nav needs the extra room before it wraps.

## Elevation & Depth

Flat by design — no drop shadows anywhere in the current implementation.
`--shadow-glow-rose` and `--shadow-glow-teal` are still defined in `app/globals.css` but
are vestigial: leftovers from an earlier rounded-pill-button treatment, unreferenced by
any component today. Depth is conveyed through the hairline-rule system instead —
`border-void-700` dividing regions — and through the coordinate-grid texture on the body
background (`repeating-linear-gradient`, ~3% opacity, 88px spacing): near-invisible from
normal reading distance, present as texture on close look, evoking a star chart's
declination/RA lines rather than a literal decoration.

### Named Rules
**The Flat-By-Default Rule.** No component gains a shadow at any state, including hover.
Interactive feedback comes from border-colour and text-colour transitions
(`transition-colors`) or a background fill (buttons), never from elevation.

## Motion

Five authored moments, each one tied to something real about the product rather than
decoration: the once-per-session shutter-open intro (`ShutterIntro.tsx`); the gallery
lightbox's shared-element photo morph (`Lightbox.tsx`); the gallery grid's stacking
reveal, where photos resolve into focus as they scroll into view, echoing how a real
stacked exposure actually accumulates signal; the calendar's live sky chart, a genuine
Canvas-rendered polar plot of real computed altitude/azimuth positions
(`SkyChart.tsx`); and the lightbox's sky reconstruction, a Canvas starfield of the real
night sky at each photo's actual capture time (`SkyBackdrop.tsx`). Everything else moves
only as fast, functional feedback — `transition-colors` on hover/focus, the
`group-hover:scale-[1.03]` on `PhotoCard` — never as decoration for its own sake.

**The stacking reveal.** `PhotoCard`'s wrapper carries a `stack-reveal` class driven by
CSS `animation-timeline: view()` (`app/globals.css`): a photo starts at
`blur(8px) brightness(0.35) scale(0.98)` and resolves to full clarity as it crosses the
first 65% of its entry into the viewport — no JS, and entirely inside an `@supports`
block, so browsers without view-timeline support simply render photos at full clarity
from the start. `prefers-reduced-motion` disables the animation outright.

**The sky chart.** `VisibilityFinder`'s per-hour results already carried real altitude
and azimuth for each object (`lib/astro/visibility.ts`, via `astronomy-engine`) — the
chart just gives that data a second, visual reading: a polar plot with zenith at centre
and the horizon at the edge, N/E/S/W labelled. Hovering a target chip in the text list
below highlights its matching point on the chart (`activeId`); the two views share one
state in `VisibilityFinder`, not decoration layered over static data.

**The sky reconstruction.** Opening a photo renders a Canvas starfield of the ~50
brightest naked-eye stars (`lib/astro/starCatalog.ts`), positioned for that exact photo's
real `captureDate` using the same `astronomy-engine` `Horizon`/`Observer` calls the
visibility finder already relies on (`lib/astro/starPositions.ts`). It deliberately does
not use the photo's real embedded GPS — that stays private per the Privacy-First
principle — so positions are computed against a fixed, already-public approximate
location (Devon, UK), not the precise capture coordinates. Static single render, no
continuous animation: a real backdrop, not a moving effect.

**The lightbox morph.** Opening a photo computes the on-screen delta between the grid
thumbnail just clicked (still mounted behind the modal — parallel routes never unmount
the grid) and the modal's own image, then plays it as a single WAAPI transform
(`translate()` + `scale()`, 420ms, `cubic-bezier(0.16, 1, 0.3, 1)`, with a 2px mid-flight
blur to mask pixel-snap artifacts). Closing reverses the same calculation at 200ms —
exit faster than entrance — before calling `router.back()`, so the photo visibly returns
to its thumbnail rather than just vanishing. The backdrop and detail panel fade in
separately via plain CSS keyframes (`.lightbox-backdrop`, `.lightbox-content`), since
those don't need the runtime position lookup the photo itself does.

React's `<ViewTransition>` (the API Next 16's own docs feature for this exact shared-element
case) was deliberately not used — it isn't in the installed React yet (19.2.8 stable;
the component ships in canary only), and this site doesn't carry an experimental React
dependency for it. The Web Animations API gets the same result on the current stack.

`prefers-reduced-motion` drops the transform entirely on both directions — the modal
opens and closes with `router.back()` called directly, no measurement, no animation — while
the backdrop/content CSS keyframes collapse to a 0.01ms duration rather than `animation:
none`, so content still resolves to its correct end state instead of getting stuck
mid-keyframe.

### Named Rules
**The Earned Moment Rule.** A new interaction earns motion only if it acknowledges an
action, explains a state or spatial change, preserves continuity across a navigation, or
visualises something genuinely real about the product — never to make a static area
"feel alive." Every authored moment on the site traces to real content or real data (a
real photo's position, a real stacked-exposure process, a real sky) rather than a
generic effect borrowed for polish; that traceability is the actual bar, not a numeric
cap on how many moments exist. Before adding another one, ask what real thing it's
showing that isn't shown anywhere else yet.

## Shapes

Sharp corners everywhere except two deliberate exceptions: pills (`rounded-full`) for
tags, status badges, category-filter chips, and day-selector controls; and one circular
icon button (the gallery lightbox's close button). Every card, photo, panel, input, and
button container uses `border` with no radius. Photo hero sections carry a viewfinder
motif instead of a frame — three L-shaped corner brackets
(`border-l-2 border-t-2 border-star-100/60`, repeated per corner, one corner
deliberately left open wherever a photo-credit link sits) rather than a full border.

### Named Rules
**The Sharp Edge Rule.** If it's a container — card, panel, image frame, input, button —
it has zero border-radius. If it's a label or a control that shows an on/off or
selected/unselected state — tag, badge, filter chip — it's a full pill. There is no
partial-radius middle state anywhere in the system; introducing `rounded-md` or
`rounded-lg` on a new component breaks the rule, not extends it.

## Components

### Buttons
- **Shape:** zero radius (`{rounded.none}`), always bordered.
- **Primary** (`border border-nebula-rose-400`, `text-nebula-rose-400`, transparent
  background): the site's one "act now" affordance — "View the gallery",
  affiliate-link buttons. Padding `py-2.5 px-5`, label typography.
- **Secondary** (`border border-void-600`, `text-star-300`): lower-emphasis actions —
  "About the setup", "Use my location". Same shape and padding as primary.
- **Hover (both):** primary fills solid (`bg-nebula-rose-400`, `text-void-950` —
  near-black text on the bright accent, not white, for contrast); secondary just
  brightens its border and text to `star-100`. Filled "Search"-style action buttons
  (VisibilityFinder) use `bg-nebula-teal-400 text-void-950` at rest instead of an
  outline, reserved for the single most-committed action in a form.

### Badges / Chips
- **Style:** `rounded-full`, bordered, mono uppercase label, transparent or `/10`-opacity
  tinted background depending on state (StatusBadge's "In progress"/"Complete" tint
  their border+background in the matching accent; "Idea" stays neutral `void-600`/
  `star-500`).
- **State:** category-filter pills and day-selector pills use an active/inactive pair —
  active gets `border-nebula-teal-500 bg-nebula-teal-500/10 text-nebula-teal-400`,
  inactive stays `border-void-700 text-star-500`.

### Cards / Containers
- **Corner Style:** none (see Shapes).
- **Background:** `bg-void-900` on `bg-void-950` page background — one step up in the
  neutral scale is the entire "raised surface" vocabulary; there is no second elevation
  step.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** `border border-void-700` on most containers. Gear tiles add a 2px accent
  left border (`border-l-2 border-l-{section-color}`) to carry their category colour
  without a full-surface tint.
- **Internal Padding:** `p-4` for compact tiles (gear, moon phase, event card), `p-5` for
  content-bearing panels (VisibilityFinder, meteor shower list).

### Inputs / Fields
- **Style:** `border border-void-600`, `bg-void-950`, zero radius, `px-3 py-2`.
- **Focus:** border shifts to `nebula-teal-500`; no glow or shadow ring.
- **Placeholder:** `text-star-700`, the faintest neutral in the scale.

### Navigation
- **Desktop:** `divide-x divide-void-700` separated mono links, uppercase, `text-star-500`
  at rest, `text-nebula-teal-400` on hover — no background pill, no underline.
- **Mobile:** a plain hamburger icon (no button background) opens a full-width dropdown;
  links there use upright Instrument Serif at `text-xl`, not mono — a deliberate
  register shift from "control panel" (desktop) to "table of contents" (mobile menu).
- **Wordmark:** upright Instrument Serif, `text-3xl`, no letter-spacing override
  (`text-nebula-teal-400`/`text-star-100`; see The Italic Rule). Was `text-2xl` with
  `tracking-tight` — negative tracking on a delicate high-contrast serif at a small
  header size fought the letterforms rather than reading confident, so both the size
  bump and dropping the tight tracking came out of the same review. The logo icon
  (`Logo.tsx`) grew to `h-7 w-7` to stay proportionally paired with it.

### Photo Hero (signature component)
Every section index page (Gallery, Reviews, Guide, Calendar, Research) opens with a
full-bleed photo banner (`PageHero`, `h-64 sm:h-80`) instead of a plain text header: the
featured photo, a light flat wash (`bg-void-950/20`) plus one top-fading gradient
(`from-void-950 via-void-950/50 to-transparent`) darkening only the text zone at the
bottom, three viewfinder corner brackets, and a small mono photo-credit link
(`bg-void-950/50` chip, `backdrop-blur-sm`, top-right) crediting the actual shot and
linking to its gallery page. The home page's own hero is a taller, bespoke variant of the
same idea (`bg-void-950/28` wash, taller gradient reach) rather than reusing the
component directly, since it carries more stacked content (eyebrow, headline, body,
two CTAs).

## Do's and Don'ts

### Do:
- **Do** use `border-void-700` as the default divider/border colour; reach for
  `border-void-600` only on interactive controls (inputs, secondary buttons, badges)
  that need to read as slightly more prominent.
- **Do** keep JetBrains Mono uppercase and `tracking-widest` whenever it's labelling
  something (nav, buttons, badges, index numbers) — that treatment is what signals
  "instrument readout" rather than "this is a code snippet."
- **Do** use near-black text (`text-void-950`) on filled accent buttons, never white —
  it reads as an "instrument readout" and has measurably better contrast than white on
  these accent tones.
- **Do** let real photos carry vibrancy. If a section feels flat or too monochrome, the
  fix is usually "let more of the actual photo show through," not "add another accent
  colour."
- **Do** reuse `PageHero` for any new section index page rather than building a bespoke
  header — it's the system's signature component, and one-off headers fragment the
  identity fast.

### Don't:
- **Don't** add `rounded-md` or `rounded-lg` to any container. If something needs to feel
  softer, that's a Departure-mode conversation, not a one-off radius value (see The Sharp
  Edge Rule).
- **Don't** italicise anything. Tried twice, reversed twice — see The Italic Rule.
- **Don't** add a drop shadow anywhere, including on hover. Depth comes from borders and
  the neutral-scale step between `void-950` and `void-900`, never elevation.
- **Don't** darken a hero photo past the point it reads clearly as a photo. The site's
  entire differentiation depends on real astrophotography being visible, not implied.
- **Don't** introduce a fifth section accent colour casually — re-read the Section
  Colour Rule and the note on the orphaned violet token first.
