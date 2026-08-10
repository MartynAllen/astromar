# Astromar

Personal astrophotography blog — image gallery, gear reviews, weekly discussion, a
beginner's guide, and an astronomy calendar. Built with Next.js (App Router) and
Sanity, deployed on Vercel.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — frontend + hosting on Vercel
- **Sanity** — headless CMS, embedded at `/studio`, with an image CDN/pipeline
- **Tailwind CSS 4** — CSS-first theme in `app/globals.css` (`@theme`)
- **Giscus** — free GitHub Discussions–backed comments, Weekly Discussion posts only

## First-time setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in the Sanity values
   (project ID/dataset/token from [sanity.io/manage](https://sanity.io/manage) → your
   project → API). Add CORS origins there too: `http://localhost:3000` and your
   production domain, both with "allow credentials".
3. `npm run dev` and open `http://localhost:3000`. Sanity Studio is at `/studio`.

Giscus and the production `NEXT_PUBLIC_SITE_URL` aren't required for local dev — see
"Comments" and "Deploying" below for when those matter.

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

**Everything else** (reviews, weekly discussion, guide articles, calendar events, the
About page, site settings) — just use Studio at `/studio` directly. No filename
convention to worry about there.

## Project structure

- `app/(site)/` — public pages (gallery, reviews, discussions, guide, calendar, about)
- `app/studio/` — embedded Sanity Studio
- `sanity/schemaTypes/` — content model
- `lib/astro/` — the metadata parser + moon phase/meteor shower calculations
- `lib/sanity.queries.ts` — all GROQ queries and their TypeScript return types
- `lib/seo.ts` — metadata + JSON-LD builders
- `scripts/import-photos.ts` — the photo ingestion CLI described above

## Comments

Giscus needs a **public** GitHub repo with Discussions enabled:

1. Enable Discussions on the repo, add a category (e.g. "Comments") using the
   **Announcement** format.
2. Install the [giscus GitHub App](https://github.com/apps/giscus) on that repo.
3. Get your repo/category IDs from [giscus.app](https://giscus.app) and set the four
   `NEXT_PUBLIC_GISCUS_*` variables in `.env.local` (and in Vercel's env vars for prod).

Until those are set, the Weekly Discussion pages show a plain "comments aren't
connected yet" message instead of erroring.

## Testing

```bash
npm test        # parser fixture tests (lib/**/*.test.ts), incl. against real sample EXIF
npx tsc --noEmit
npx eslint .
```

## Deploying

1. Buy the domain, connect the GitHub repo to Vercel, set all the env vars from
   `.env.local.example` (plus Giscus's) in the Vercel project settings, and add the
   domain there too.
2. Set `NEXT_PUBLIC_SITE_URL` to the real production URL — it drives canonical URLs,
   the sitemap, and Open Graph images.
3. After the first deploy, submit `/sitemap.xml` to Google Search Console.
