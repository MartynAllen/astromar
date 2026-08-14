# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A mix, deliberately not narrowed to one: beginners considering or new to smart-telescope
astrophotography (matches the Beginner's Guide framing already on the site), experienced
astrophotographers reading for gear comparisons and technique nuance, and general
astronomy-curious visitors browsing for the photos and the story rather than to learn
technique. Content and design should work for all three at once rather than picking a
winner. The author, Martyn, is also the sole content publisher, via an embedded Sanity
Studio at `/studio`.

## Product Purpose

A personal astrophotography blog documenting real deep-sky imaging from a back garden in
Devon, UK. Sections: a photo gallery (real captures with parsed EXIF/FITS shot details),
gear reviews (Amazon-affiliate monetised), a beginner's guide, an astronomy calendar
(moon phase, meteor showers, a sky-visibility finder), and a research section documenting
Python/computer-vision experiments run against the photo archive. Success means genuinely
useful, trustworthy content that reflects the author's actual hands-on experience — not
generic space content.

## Positioning

Every photo, spec, and gear opinion on the site traces back to one real, verifiable
rig — a ZWO Seestar S50 and a newer manual Nikon D5300 + Askar 71F setup — with
EXIF/FITS-parsed metadata as proof, not stock imagery or secondhand advice. This is the
load-bearing claim the whole site is built on. Anything added later — new sections, new
gear, new claims — needs to stay traceable to something the author actually did.

## Operating Context

- Content is published through an embedded Sanity Studio at `/studio`; the author is the
  sole editor.
- New photos are ingested via a CLI (`npm run import`) that parses FITS headers / Seestar
  EXIF / filename conventions to prefill shot details as a draft. Nothing goes live until
  manually reviewed and published in Studio.
- Real home GPS coordinates are embedded in some source photos' EXIF data. This must
  never be exposed publicly — an earlier privacy leak was found and fixed; capture
  location is intentionally not rendered on the public site, only kept for the author's
  own reference (e.g. the calendar's rise/set maths).
- Two working rigs feed the gallery: the automated Seestar S50 (most of the archive) and
  a newer manual DSLR/Askar 71F setup (early days — one test session so far).
- A "Weekly Discussion" section with Giscus/GitHub Discussions comments was built, then
  removed entirely after going unused — it had zero posts in its lifetime. Kept here as a
  precedent: don't ship a recurring-content feature without a real commitment to sustain
  it. (`README.md` still describes the removed feature — a stale doc worth fixing.)

## Capabilities and Constraints

- British English required sitewide, not American English.
- Monetisation is Amazon Associates affiliate links only; a disclosure banner is required
  wherever affiliate links appear.
- No comments/discussion feature currently exists (see Operating Context).
- Content types: `astroPhoto`, `reviewPost`, `guideArticle`, `calendarEvent`,
  `researchProject`, plus singletons `siteSettings` and `aboutPage`.
- Deployed on Vercel at astromar.co.uk; GitHub Actions CI runs typecheck/lint/test/build
  on every push and PR to `main`.

## Brand Commitments

- Name: "Astromar" — *Astro* (astronomy) + *Mar* (an abbreviation of the author's first
  name, Martyn).
- Logo: a faceted crescent moon wrapped around a camera-aperture glyph, built as inline
  SVG (`components/Logo.tsx`).
- Colour palette pulled from the author's own photos (nebula-rose and nebula-teal as
  primary accents; amber/indigo/violet/green as secondary section accents) rather than
  arbitrary brand colours.
- Voice: understated, precise, technically honest — a field-log/observatory-logbook
  register, not marketing copy.

## Evidence on Hand

- Real photo archive in `scripts/seed-assets/` (gitignored — raw files carry embedded
  GPS, never committed).
- Real gear: ZWO Seestar S50, Nikon D5300, Askar 71F, ZWO ASIAIR Plus + guide scope,
  Skywatcher HEQ5 Pro mount, assorted power/cabling accessories.
- Two draft gear reviews (Seestar S50; Askar 71F, the latter explicitly framed as "early
  impressions, first light only").
- Two published guide articles (polar alignment with the ASIAIR app; Bahtinov-mask
  focusing), each with original hand-drawn diagrams.
- Three research entries at "Idea" stage (colour tracking, computer-vision object
  detection, exoplanet transit photometry) — no results yet, explicitly labelled as such.
- No author bio written yet — "Bio coming soon." placeholder on the About page,
  deliberately deferred to the author to write themselves.
- No `siteSettings` document created yet — site name/tagline/social links are all running
  on hardcoded fallbacks, not yet configured in Studio.

## Product Principles

1. Every claim traces to something the author actually did — no generic advice, no stock
   photography, no unverified specs.
2. Ship recurring-content features only with a real commitment to sustain them — Weekly
   Discussion is the cautionary precedent.
3. Privacy first for anything derived from real EXIF metadata; home location must never
   be exposed publicly.
4. Prefer honest, hedged framing over confident-sounding claims when evidence is thin
   (the Askar 71F review, the Research section's "Idea" status).
5. British English, understated voice — this is a personal log, not a marketing site.

## Accessibility & Inclusion

Colour-contrast ratios were deliberately computed (not eyeballed) against the near-black
background when the palette was built. Continue that rigor for any new colour additions.
