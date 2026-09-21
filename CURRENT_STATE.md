# Current State: The Draper Race website (formerly Draper Founders Society)

Updated: 2026-09-21

Companion docs: `project_log.md` (chronological history, decisions, research), `website_content.md` (original content brief; gitignored because it holds an unsent email draft; now out of date on name, headline and the Oct 7 date).

## Where we are right now
Single-page static site for The Draper Race, a fall-quarter startup accelerator for Stanford students. Live at https://draperfounders.github.io/ (repo: github.com/draperfounders/draperfounders.github.io, public, org owned by VXXWu). Plain HTML + CSS + about 170 lines of vanilla JS, no framework, no build step. GitHub Pages serves `docs/` from `main`; a merge redeploys in 1 to 3 minutes. The application link is live, so the site is ready to circulate once the URL question below is settled.

## What's in place
- ✅ `docs/index.html`: hero, at-a-glance stats, program pillars, Tim Draper portfolio marquee, race-themed timeline, funding band, before-you-apply checklist with the Apply button (Google Form: https://forms.gle/SGNK3WYaj53eyeUG7).
- ✅ `docs/styles.css`: cream paper + ink, navy accent `#142e5f` (tint `#9dbaf1` on dark sections). Fonts: Barlow Condensed (display, bold uppercase headings) + Barlow (body).
- ✅ `docs/main.js`: timeline road (SVG built at runtime: winding road through one checkpoint per date, driven stretch painted navy, car that follows scroll, checkered flags that light up, finish line at pitch day), fade-up reveals, count-ups, marquee. Page is complete without JS; autonomous motion is off under `prefers-reduced-motion`.
- ✅ Verified at 1280x900 and 390x800 by a scripted scroll (CDP): flags 0/6 to 6/6, road fully painted at bottom, no horizontal overflow.

## What's NOT in place
- 🟡 **URL still says "draperfounders".** Renaming needs no new org: the user renames the org in GitHub's web UI (Settings, Danger zone), then the repo gets renamed to `<neworg>.github.io` via `gh api -X PATCH`. `draperrace`, `thedraperrace` and `draper-race` were all free on 2026-09-21. The old URL stops working after the rename.
- ❌ Custom domain, contact email, photos, social preview image.

## What's being worked on right now (and why)
Waiting on the user to rename the GitHub org so the URL matches the new brand before the link is sent to applicants (applications due Sept 26).

## Most recent decisions (sticky context)
- 2026-09-21: Rebrand to "The Draper Race" at the organizers' request; new headline and intro copy are theirs verbatim. Kickoff moved Oct 6 to Oct 7, so the weekday label became Wednesday.
- 2026-09-21: Timeline road sits between the date column and the detail column on desktop, and down the left edge on mobile. Alternating items left and right of a central road was rejected: with uneven item heights it adds a lot of vertical whitespace, which the user had just asked to reduce twice.
- 2026-09-21: Road geometry is computed from the real checkpoint positions (`offsetTop`, not `getBoundingClientRect`, so reveal transforms do not skew it) and rebuilt by a ResizeObserver.
- 2026-09-21: Nav and hero Apply buttons still scroll to the `#apply` checklist; only the button there opens the form.
- 2026-09-21: Accent is navy `#142e5f`; a brighter `#2596be` was tried and reverted by the user.
- 2026-09-20: No framework; GitHub Pages for $0 hosting. Direct pushes to main are blocked by a user hook: feature branch, PR, merge.
