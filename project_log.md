# Project Log: Draper Founders Society website

Companion docs: `CURRENT_STATE.md` (snapshot), `website_content.md` (content spec from the org).

## 2026-09-20: Research, build, local verification

**Goal:** clean, simple, good-looking site for The Draper Founders Society, $0 hosting, deployed.

**Framework decision: plain HTML + CSS, no framework, no build step.**
- The site is one page, mostly a timeline. Astro is the 2026 consensus for content sites (zero JS by default, much lighter than Next.js), but for a single page it only adds a build step and dependencies.
- Migration path if the site grows (multiple pages, blog, alumni directory): move `docs/index.html` into an Astro page. Low cost.

**Hosting decision: GitHub Pages.**
- $0, no surprise-bill risk (Vercel/Netlify free tiers can bill on traffic spikes), `gh` already authenticated as VXXWu, no new account.
- Limits (1 GB site, ~100 GB/month soft bandwidth) are far above need.
- Cloudflare Pages (unlimited bandwidth) is the alternative if traffic ever matters.
- Free-plan GitHub Pages requires a public repo.

**Build:**
- `docs/index.html` + `docs/styles.css`. Site lives in `docs/` so Pages serves only the site, not the notes at repo root.
- Fonts: Instrument Serif (display) + Inter (body) via Google Fonts. No JavaScript.
- Sections: hero, at-a-glance stats, program, portfolio list, timeline, funding, before-you-apply checklist.
- Application URL is the placeholder string `APPLICATION_LINK` (4 occurrences in `index.html`). Replace all before going live.

**Content choices worth knowing:**
- Org name on site is "The Draper Founders Society" per spec. The email blurb says "Draper Club"; that name is not used on the site.
- Weekdays were added to dates after checking the 2026 calendar: Sept 26 Sat, Oct 6 Tue, Oct 14 Wed, Nov 19 Thu.
- "$85K" stat is derived (50k + 25k + 10k).
- "Decisions released the following week" rendered as "Week of Sept 28".
- No contact email in the spec, so the footer has none.

**Verification:** rendered in headless Chrome at 1280px and in a 390px iframe. No horizontal overflow; grids collapse correctly on mobile. Note: headless Chrome enforces a ~500px minimum window width, so `--window-size=390` gives a falsely clipped screenshot. Use an iframe wrapper for mobile checks.

**Status:** static draft built and verified locally. Deployment pending the real application link.

## 2026-09-20: Reference research + motion feasibility (user asked before proceeding)

User wants dynamic elements (scroll-triggered reveals etc.), not just a static page, and asked whether plain HTML/CSS can do it.

**Finding: yes, with ~20-40 lines of vanilla JS (IntersectionObserver). Still no framework or build step.** Pure-CSS scroll-driven animations (`animation-timeline: view()`) exist, but sources conflict on support (one says ~84% global, another says universal), so IntersectionObserver is the safe default.

**Reference sites checked (fetched HTML for stack markers, screenshotted at 1280px):**

| Site | Stack detected | Takeaway |
|---|---|---|
| thielfellowship.org | no framework markers, 49 KB | Closest structural match: dark hero, giant "Two years. $250,000." statement, label-left content rows |
| southparkcommons.com | Astro | Warm paper bg + serif + one signature motion (drawn squiggle line). Closest to our draft's look |
| zfellows.com | Webflow (45 interaction hooks) | "1 WEEK. $10,000." hook line, single blue accent, photo grid |
| f.inc (Founders Inc) | Framer | Serif display, date banner above headline, tilted polaroids |
| hf0.com | Webflow + GSAP ScrollTrigger | Extreme minimal: 3D orb, one line, Apply, "Demo Day: Dec 1" |
| speedrun.a16z.com | Next.js | Big-number cards ("$1M") |
| neo.com | no markers, 25 KB | Video hero, press cards |
| contrary.com | Next.js | Grid lines, saturated blue band |

Pattern: the no-code tools (Webflow, Framer) emit HTML/CSS + animation JS. None of the looks requires React. Only a WebGL object (HF0 orb) or pinned scroll-scrubbed sequences would justify a library (three.js, GSAP via CDN script tag), and neither requires a build step.

**Proposed motion set (awaiting user go-ahead):** staggered fade-up reveals, count-up on stats and prizes, timeline rail that fills with scroll and lights up dots, hero headline entrance, slow marquee for portfolio names. All disabled under `prefers-reduced-motion`.

Screenshots were saved in the session scratchpad only (not in repo).
