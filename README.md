# Astromar

Personal astrophotography blog — image gallery, gear reviews, a beginner's guide, an
astronomy calendar, a research section documenting photo-archive experiments, and
prints of the gallery photos for sale. Built with Next.js (App Router) and Sanity,
deployed on Vercel.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — frontend + hosting on Vercel
- **Sanity** — headless CMS, embedded at `/studio`, with an image CDN/pipeline
- **Tailwind CSS 4** — CSS-first theme in `app/globals.css` (`@theme`)
- **Stripe + Prodigi** — hosted Checkout for buying prints, fulfilled print-on-demand

## First-time setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in the Sanity values
   (project ID/dataset/token from [sanity.io/manage](https://sanity.io/manage) → your
   project → API). Add CORS origins there too: `http://localhost:3000` and your
   production domain, both with "allow credentials".
3. `npm run dev` and open `http://localhost:3000`. Sanity Studio is at `/studio`.

Stripe/Prodigi and the production `NEXT_PUBLIC_SITE_URL` aren't required for local dev
unless you're working on the print-buying flow — see "Selling prints" and "Deploying"
below for when those matter.

## Publishing content (the day-to-day workflow)

**New photos:** drop the files into `scripts/seed-assets/` (or any folder) and run:

```bash
npm run import                  # imports scripts/seed-assets/
npm run import -- ./some/folder # or a different folder
```

This reads each file's FITS header / Seestar EXIF / filename (in that priority order —
see `lib/astro/resolveShotDetails.ts`) and creates a **draft** photo in Studio with the
target, exposure, filter, and mosaic flag pre-filled. Nothing goes live until you open
`/studio`, review the draft, and hit Publish. Files that don't match any known Seestar
naming convention still get created as drafts, just with the shot-details fields left
empty for you to fill in by hand — the script's console output flags exactly which
files those were.

Dragged an image straight into Studio instead of using the script? The "Autofill from
filename" button above the Shot Details panel runs the same filename parser (the
FITS/MakerNote tiers need the CLI's file access, so that part is CLI-only).

**Everything else** (reviews, guide articles, calendar events, research entries, the
About page, site settings, print product sizes) — just use Studio at `/studio`
directly. No filename convention to worry about there.

## Project structure

- `app/(site)/` — public pages (gallery, reviews, guide, calendar, research, about,
  prints)
- `app/api/` — checkout (Stripe Checkout session) and the Stripe webhook (places the
  fulfilment order with Prodigi once payment succeeds)
- `app/studio/` — embedded Sanity Studio
- `sanity/schemaTypes/` — content model
- `lib/astro/` — the metadata parser + moon phase/meteor shower calculations
- `lib/sanity.queries.ts` — all GROQ queries and their TypeScript return types
- `lib/seo.ts` — metadata + JSON-LD builders
- `scripts/import-photos.ts` — the photo ingestion CLI described above

## Selling prints

A photo becomes purchasable by turning on `availableAsPrint` on it in Studio, then
adding at least one active `printProduct` (a size, priced in pence, with its matching
Prodigi SKUs — see the field descriptions in Studio). Buying goes through Stripe's
hosted Checkout, server-side only (no `NEXT_PUBLIC_*` key needed, no Stripe.js on the
page):

1. Get a Stripe secret key from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   — test mode for dev/preview, live for production.
2. For local development, run `stripe listen --forward-to localhost:3000/api/stripe-webhook`
   to get a test-mode webhook secret; for production, register the real endpoint in the
   Stripe dashboard and use the secret it issues.
3. Get a Prodigi API key from [dashboard.prodigi.com](https://dashboard.prodigi.com) →
   Settings → API access — sandbox key for dev/preview, live key for production.

All of these go in `.env.local` (see the comments there for exact variable names).
`ALERT_WEBHOOK_URL` is optional — a Discord/Slack incoming webhook that gets one alert
if a Prodigi order fails after a customer's already been charged.

## Testing

```bash
npm test        # parser fixture tests (lib/**/*.test.ts), incl. against real sample EXIF
npx tsc --noEmit
npx eslint .
```

## Deploying

1. Buy the domain, connect the GitHub repo to Vercel, set all the env vars from
   `.env.local.example` in the Vercel project settings, and add the domain there too.
2. Set `NEXT_PUBLIC_SITE_URL` to the real production URL — it drives canonical URLs,
   the sitemap, and Open Graph images.
3. After the first deploy, submit `/sitemap.xml` to Google Search Console.

## License

All rights reserved — see [LICENSE](LICENSE).
