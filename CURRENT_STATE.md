# Current State: Draper Founders Society website

Updated: 2026-09-21

Companion docs: `project_log.md` (chronological history, decisions, research), `website_content.md` (content brief from the org; gitignored because it holds an unsent email draft).

## Where we are right now
Single-page static site, live at https://draperfounders.github.io/ (repo: github.com/draperfounders/draperfounders.github.io, public, in the `draperfounders` org owned by VXXWu). Plain HTML + CSS + ~90 lines of vanilla JS, no framework, no build step. GitHub Pages serves the `docs/` folder of `main`; merging to `main` redeploys in about a minute (occasionally ~3). Direct pushes to main are blocked by a user hook: use a feature branch and a PR.

## What's in place
- ✅ `docs/index.html`: hero, at-a-glance stats, program pillars, Tim Draper portfolio list, timeline, funding band, before-you-apply checklist.
- ✅ `docs/styles.css`: warm paper + ink palette, one navy accent (`#142e5f`, with tint `#9dbaf1` on dark sections), Instrument Serif + Inter. Responsive (checked at 1280px and 390px).
- ✅ `docs/main.js`: fade-up scroll reveals, count-up on $85K and prizes, timeline rail that fills on scroll with dots lighting up, portfolio marquee. Progressive enhancement: page is complete without JS. Respects `prefers-reduced-motion`.
- ✅ Sticky nav with Apply always visible. All Apply CTAs scroll to the `#apply` checklist.
- ✅ Deployment: GitHub Pages, $0.

## What's NOT in place
- ❌ **Real application link.** Apply CTAs scroll to the `#apply` checklist, which currently has no button (placeholder box removed 2026-09-21 at user request). Add the link at the `APPLICATION LINK` HTML comment in `docs/index.html`.
- 🟡 URL: moved off the personal subpath to `draperfounders.github.io` on 2026-09-21. A real domain is still optional: `draperfounders.com` was unregistered that day (about $10/yr); it needs a `docs/CNAME` file plus the DNS records listed in `project_log.md`. The old `vxxwu.github.io/draper-founders-society` URL now returns 404.
- ❌ Contact email, photos, logos, social preview image. None were in the brief.
- 🟡 Org naming: site says "The Draper Founders Society" per the brief; the org's email blurb says "Draper Club". Unresolved with the org.

## What's being worked on right now (and why)
Waiting on the application form URL, which only the program organizers have. Without it the site should not be circulated: applications are due Sept 26 and every Apply button currently ends at a checklist with nothing to click. Recent copy and spacing edits (PRs #2, #3) are live.

## Most recent decisions (sticky context)
- 2026-09-20: No framework. One page does not justify a build step. If it grows to multiple pages or a blog, move to Astro.
- 2026-09-20: GitHub Pages over Cloudflare/Vercel/Netlify: already authenticated, no new account, no surprise-bill risk.
- 2026-09-20: Motion via IntersectionObserver rather than CSS `animation-timeline`, because browser-support sources conflicted.
- 2026-09-20: Site lives in `docs/` so Pages serves only the site, not repo-root notes.
- 2026-09-20: Weekdays on dates were computed from the 2026 calendar, not given in the brief. "$85K" is derived from 50k + 25k + 10k.
