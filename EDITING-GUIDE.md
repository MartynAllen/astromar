# Editing Astromar Yourself

A plain-language reference for the two different ways to change the site —
so you can keep working over the weekend without needing me for the routine
stuff. Written on 15 Aug 2026.

## The one thing to understand first

Almost everything you listed — new photos, editing reviews, adding reviews,
fixing text on a page — **doesn't need code, git, or VSCode at all.** It's
CMS content, edited through a web page called **Sanity Studio**, the same
way you'd edit a page in a normal website admin panel. No terminal, no
"pushing," nothing to deploy — you click Publish and it's live within about
a minute.

Only *how the site looks or behaves* — colours, layout, new features, that
kind of thing — needs actual code changes, which is the git/VSCode workflow
in Part 2.

| I want to... | Use this |
|---|---|
| Add a new astrophotography photo | Studio |
| Add a new review, or edit an existing one | Studio |
| Fix a typo or rewrite text on any page (About, a Guide article, etc.) | Studio |
| Change the site tagline, social links | Studio |
| Change colours, fonts, spacing, layout | Code (Part 2) |
| Add a brand new page or feature | Code (Part 2) — bigger jobs like this are usually better saved for me |

---

## Part 1 — Editing content (Sanity Studio)

**Where:** [astromar.co.uk/studio](https://astromar.co.uk/studio) — works
from any browser, on any device, no setup needed. Log in with whichever
account you used originally (Google, GitHub, or email).

Down the left side you'll see:

- **Site Settings** and **About Page** — the two one-off pages
- **Astro Photos** — all your photos, filterable by category
- **Review**, **Guide Article**, **Research Project**, **Calendar Event** —
  everything else, grouped by type

### Adding a new photo

1. Click **Astro Photos → All photos → +** (or the `+` button at the top)
2. Upload the image
3. Fill in **Title**, **Category**, and the **Shot details** block
   (target, exposure, filter, etc.) — there's an **"Autofill from
   filename"** button on Shot details that reads your camera's original
   filename and fills most of this in for you, if it follows one of the
   naming patterns the site already recognises
4. Tick **Featured on home page** if you want it in the "Featured shots"
   section on the homepage — home page and gallery both sort by capture
   date automatically, so you don't need to manually reorder anything
5. **Click Publish** (top right) — this is the step people forget. Saving
   isn't enough; a draft never shows up on the live site

### Adding or editing a review

1. **Review → +** for a new one, or click an existing review to edit it
2. Fill in product name, type, rating, pros/cons, verdict, and the main
   review body (this is rich text — you can bold, add links, add images
   inline)
3. **Affiliate links**: add one row per retailer (label + URL) — this is
   what actually earns anything, so double-check the URL
4. Publish

### Editing text on an existing page

Same idea for everything else:

- **About page bio or gear list** → About Page in Studio
- **A Guide article's text** (like the Bahtinov mask article) → Guide
  Article → open it → edit the body → Publish
- **Research write-ups** → Research Project

The one exception: the plain-language explainer box and the mask-generator
tool itself, on the Bahtinov guide page, are *not* editable in Studio —
they're code (see Part 2's note at the bottom).

### A couple of things worth knowing

- Changes go live in roughly 60 seconds. If you don't see it yet, wait a
  moment and hard-refresh.
- If something looks wrong after publishing, you can reopen the document
  and just fix it again — there's no "undo," but nothing is destructive
  either, you're just editing the same document.
- **Don't add a real location/coordinates anywhere**, including in a
  free-text field. This site went through a real privacy fix earlier this
  session specifically because Sanity's free tier makes every published
  field publicly readable by anyone who queries the API directly — not
  just what the site chooses to display. If you're ever unsure whether
  something's safe to put in, leave it out and ask me.

---

## Part 2 — Code changes (git + VSCode)

Use this only when you're changing *how the site works or looks*, not its
content.

### Where the project lives

```
/Users/martynallen/Documents/Blog Site
```

Open that folder in VSCode (`File → Open Folder…`), then open the built-in
terminal (`` Terminal → New Terminal ``, or `` Ctrl+` ``). Every command
below runs from there, in that folder.

### Making a change

Edit whatever file needs editing, save it, and check it looks right — the
easiest way is to run the site locally:

```bash
npm run dev
```

then open `http://localhost:3000` in a browser. Stop it any time with
`Ctrl+C` in the terminal.

### Shipping it to the live site

Three commands, always in this order:

```bash
git add -A
git commit -m "short description of what you changed"
git push origin main
```

What each one actually does:

- **`git add -A`** — stages every changed file, i.e. marks it "ready to be
  saved"
- **`git commit -m "..."`** — saves a checkpoint with a message describing
  what changed (be specific — "fix header spacing" not "update")
- **`git push origin main`** — sends that checkpoint to GitHub, which
  automatically tells Vercel to build and deploy it

### Checking it went live

Vercel takes about 30–60 seconds to build and deploy after a push. Visit
[astromar.co.uk](https://astromar.co.uk) after a minute, or check
[vercel.com](https://vercel.com) → the astromar project → Deployments, to
watch the build happen and confirm it says **Ready**.

### Before you push, if you're not sure

These catch most mistakes before they go live:

```bash
npm run typecheck   # catches type errors
npm run lint         # catches style/correctness issues
npm test              # runs the test suite
```

If any of these fail, the change likely isn't safe to push yet. For a
simple text or copy tweak in a component, you can usually skip straight to
pushing — these matter most when you've changed actual logic.

### What to leave alone until I'm back

- Anything in `lib/bahtinov/` or `lib/astro/` — these have real tests
  behind them (the Bahtinov mask geometry, the FITS/EXIF parser) and are
  easy to subtly break without noticing
- `next.config.ts`, security headers, anything Sanity-schema-related
  (`sanity/schemaTypes/`) — low-traffic but high-consequence if wrong
- Don't run `git push --force`, `git reset --hard`, or delete files you
  don't recognise — if git ever complains about a conflict or refuses a
  push, stop and leave it for me rather than forcing it through

### If you want to undo an uncommitted change

```bash
git status                  # see what you've changed
git checkout -- <filename>  # discard changes to one file, back to last commit
```

This only works *before* you commit. Once something's pushed, it's easier
to just fix it forward (edit again, commit, push) than to try to undo it.

---

## Quick troubleshooting

- **"I published in Studio but the site still shows the old version"** —
  wait ~60 seconds, then hard-refresh (Cmd+Shift+R). If it's still stale
  after a couple of minutes, something's actually wrong — leave it for me.
- **"`npm run dev` won't start"** — check you're in the right folder
  (`pwd` should print `/Users/martynallen/Documents/Blog Site`), and that
  nothing else is already using port 3000.
- **"I broke something and don't know what"** — don't push. Just leave the
  local changes as they are (or `git checkout -- .` to discard everything
  uncommitted) and tell me when I'm back what you were trying to do.
