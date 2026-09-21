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

## 2026-09-20: Motion added, deployed to GitHub Pages

A stop hook directed me to finish with reasonable assumptions rather than wait on answers, so these were my calls, not the user's. All are cheap to reverse.

**Assumptions made:**
- Motion set as proposed (no new visual direction).
- Public repo `VXXWu/draper-founders-society`, Pages from `main` `/docs`. Live: https://vxxwu.github.io/draper-founders-society/
- Application URL unknown, so every Apply CTA scrolls to the `#apply` checklist (this also enforces "read the details first"), and that section shows "link will be posted here shortly". The real link goes in one place, marked by the `APPLICATION LINK` comment in `docs/index.html`.
- `website_content.md` is gitignored: it contains an unsent email draft with a third party's name and class year. Everything in it that belongs on the site is on the site.

**Added:** `docs/main.js` (reveals, count-ups, timeline rail, marquee), sticky nav, hero entrance animation (CSS only), reduced-motion fallbacks. Page is complete with JS disabled because `main.js` adds the hiding classes itself.

**Verification on the live URL** (headless Chrome driven over CDP at 1280x800, scrolling top to bottom): 33/33 reveals fired, 6/6 timeline dots active, rail progress 1.00, counters ended at $85K / $50,000 / $25,000 / $10,000, marquee animating, no horizontal overflow. Reduced-motion render checked by screenshot: static wrapped portfolio list, rail still scroll-driven.

**Verification gotchas (cost me three attempts):**
- Headless `--screenshot` with `--virtual-time-budget` or `--timeout` captures animations mid-flight; it cannot show a settled state for a page with running animations.
- The Claude-in-Chrome automation tab reports `visibilityState: hidden`, so `requestAnimationFrame` and IntersectionObserver never fire there. A "nothing animated" result from that tab is a false negative.
- What works: headless Chrome with `--remote-debugging-port`, a Node script using the built-in WebSocket to call `Runtime.evaluate` (scroll + read state) and `Page.captureScreenshot`.

**Fixed along the way:** marquee edge mask was also fading the section label (moved mask to an inner wrapper); sticky bar at 90% opacity showed the paper-colored body behind it at scroll 0 (made it solid).

**Open items for the user:** application URL; confirm org name ("Draper Founders Society" on site vs "Draper Club" in the email blurb); optional custom domain, contact email, hero hook line in the Thiel/Z Fellows style.

## 2026-09-21: Placeholder removed, URL options

- Removed the "application link will be posted here shortly" box at the user's request, plus its CSS rule and JS selector. `#apply` now ends at the checklist until the real link is added at the `APPLICATION LINK` comment.
- That Pages deploy took about 3 minutes instead of the usual 25 seconds. Check `gh run list` before assuming a push failed.
- User wants a real URL, ideally not github.io. RDAP shows `draperfounders.com`, `.org` and `draperfounderssociety.com` unregistered (macOS `whois` is misleading here: it prints the TLD registry's own creation date). GitHub names `draperfounders`, `draperfounderssociety`, `draper-founders-society` were all free.
- GitHub Pages DNS for a custom domain: apex A records 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153, `www` CNAME to the `<owner>.github.io` host, plus a `docs/CNAME` file containing the domain.

## 2026-09-21: Org-based URL path, and a workflow correction

- Tested whether a GitHub organization can be created from the CLI. It cannot on github.com: `POST /admin/organizations` and `POST /user/orgs` both return 404, and the only GraphQL option is `createEnterpriseOrganization` (paid Enterprise accounts only). The user has to create the org in the web UI; the creation page was opened for them.
- Plan once the org exists: move this repo with the transfer API (`POST repos/VXXWu/draper-founders-society/transfer` with `new_owner` and `new_name=<org>.github.io`), then re-enable Pages from `main` `/docs`. A transfer involves no push and keeps history. Side effect: the old `vxxwu.github.io/draper-founders-society` URL stops working, so do it only on the user's go-ahead.
- **Workflow correction:** the user has a hook that blocks direct pushes to main ("Use feature branches"). It only triggered on 2026-09-21; the four earlier pushes in this log went straight to main because a bare `git push` does not match the hook's pattern. From this entry on, changes go through a feature branch and a merged PR.

## 2026-09-21: Moved to draperfounders.github.io

- User created the free `draperfounders` org (personal-account terms). Moved the repo with the transfer API: `POST repos/VXXWu/draper-founders-society/transfer` with `new_owner=draperfounders`, `new_name=draperfounders.github.io`. Completed in seconds; history, PR #1 and the Pages settings (`main` `/docs`) all carried over with no re-setup.
- Verified: https://draperfounders.github.io/ serves the page, `styles.css` and `main.js` with HTTP 200. The old `vxxwu.github.io/draper-founders-society/` URL returns 404 (GitHub Pages does not redirect after a transfer).
- Local `origin` still points at the old repo URL. GitHub redirects it, so fetch and push work. Repointing it is optional.
- I first wrote a polling migration script for this. It was overkill for three API calls, the user said so, and it was deleted unused.
