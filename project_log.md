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

## 2026-09-21: Copy and spacing edits (PRs #2, #3)

All at the user's request, each shipped through a feature branch and a squash-merged PR.
- Removed the hero fine print ("Please read the full details on this page before submitting.") and its CSS.
- "Bespoke resources" pillar renamed "Hands-on training" (user found "bespoke" cheesy).
- Last "Before you apply" checklist item: the user's own wording, "You want to learn how to pitch something real."
- Block padding reduced about 25%: `.section` and `.band` from `clamp(72px, 10vw, 128px)` to `clamp(56px, 8vw, 96px)`; hero from 120/80px max to 96/64px max.
- Self-merging PRs: the user's hook feedback asked for pending work to be completed rather than left open, so requested changes are merged after the branch + PR step.

**Still blocked, and only the org can unblock it:** the application form URL. It exists only with the program organizers, it is not in `website_content.md`, and a guessed or placeholder link on a live Apply button would be worse than none. It goes at the `APPLICATION LINK` comment in `docs/index.html`.

## 2026-09-21: Accent changed from red to navy (PR #4)

- User supplied a swatch; sampled value is `#142e5f`. Contrast is 11.8:1 on paper but only 1.4:1 on the ink sections, so a straight swap would have hidden the hero's italic phrase, the first-place prize and the Apply buttons in dark areas.
- `:root --accent` is the exact navy. `.dark` overrides it with `#9dbaf1`, a tint at the same hue (219 degrees, 9.6:1 on ink), and sets `--on-accent` to ink so button text stays readable on the pale button.
- Hover and the timeline dot halo now derive from `--accent` with `color-mix`, so there are no hard-coded accent colors left.
- The attendance warning lost its red emphasis, so its weight went from 500 to 600.
- Alternative not taken (more than was asked): make the dark sections navy instead of black.

## 2026-09-21: Accent corrected to #2596be (PR #5)

- The user gave the exact hex, `#2596be`; the earlier swatch image had sampled as navy `#142e5f`. Lesson: ask for or confirm the hex rather than sampling a screenshot, which can be color-shifted.
- Contrast: 5.5:1 on ink, so the dark-section tint override from PR #4 was removed. Only 3.0:1 on paper, which is fine for graphics (rail, dots, checkmarks, separators) but not for small text, so `--accent-text: #1a6884` (same hue, 5.6:1 on paper) is used for the tag labels and the attendance warning. `.dark` maps `--accent-text` back to `--accent`.
- Button labels use ink (5.5:1) rather than white (3.4:1).

## 2026-09-21: Accent reverted to navy (PR #6)

- After seeing `#2596be` live, the user asked to go back to the navy. `docs/styles.css` restored to its PR #4 state: `--accent: #142e5f` on paper, tint `#9dbaf1` and ink button labels on dark sections. The `--accent-text` variable from PR #5 is gone with it.

## 2026-09-21: Footer line removed, spacing cut a further 20% (PR #7)

- Removed the "Stanford, California · Fall 2026" footer item at the user's request. The footer now holds only the org name, so its flex row (which existed to space two items apart) was removed.
- Block padding cut about 20% again: `.section` and `.band` to `clamp(44px, 6.4vw, 76px)`, hero to `clamp(38px, 6.4vw, 76px)` top and `clamp(32px, 4.8vw, 52px)` bottom. Cumulative: 128px to 76px max at desktop since the first version. Internal margins (heading to content) were left alone.

## 2026-09-21: Rebrand to The Draper Race, road timeline, new fonts, application link (PR #8)

Requests relayed from the organizers plus the user's own.
- **Name:** "The Draper Founders Society" to "The Draper Race" in title, meta, wordmark, intro and footer.
- **Headline:** "The only time starting a company will cost you almost nothing is right now." Intro paragraph replaced with the organizers' text verbatim (accelerator wording; no longer names Tim Draper in the intro). Meta descriptions changed from "training program" to "accelerator" to match.
- **Date:** kickoff Oct 6 to Oct 7 everywhere (3 places). Oct 7 2026 is a Wednesday, so "Tuesday" became "Wednesday".
- **Application link:** https://forms.gle/SGNK3WYaj53eyeUG7 (checked: resolves to a live Google Form). Added as the button in `#apply`.
- **Fonts:** user found Instrument Serif + Inter "too claude-y". Now Barlow Condensed (700 uppercase headings, italic wordmark) + Barlow body. Barlow derives from California road signage, which suits the theme. Cream background and navy kept, since only fonts were asked for.
- **Timeline:** straight rail and dots replaced by a JS-built SVG road. Checkpoints alternate left and right of a 168px column between dates and details (76px column at the left edge on mobile), joined by vertical-tangent cubic curves. A duplicate path with `stroke-dashoffset` paints the driven stretch navy; a small car sits at the scroll mark (60% of viewport), positioned by bisecting path length on y and rotated to the tangent; each checkpoint has a checkered flag that goes from 30% to full opacity with a pop; a checkered strip marks the finish at pitch day. Heading changed to "From the starting line to pitch day."
- Fixed during build: flags overlapped date and detail text (widened date column to 260px and padded both sides of the road); the road's first curve made a hook at the top (now enters straight into the first checkpoint).
- Test note: a scripted jump straight to the timeline leaves the sections above unrevealed and the $85K counter at $0K. That is expected IntersectionObserver behavior, not a bug; the top-to-bottom scroll test covers the normal path.

## 2026-09-21: URL moved to draperrace.github.io

- Renaming an org is web-UI only. Tested: `PATCH /orgs/draperfounders` with `login=draperrace` returns 200 but ignores the field, and GraphQL has no rename mutation.
- Chrome was signed in as the org owner and GitHub did not ask for a password, so after the user explicitly approved the name `draperrace`, the rename was done through browser automation (Settings, Danger zone, Rename organization). It completed in about 5 seconds and kept the same org ID.
- Repo renamed with `gh api -X PATCH repos/draperrace/draperfounders.github.io -f name=draperrace.github.io`. Pages settings carried over; requested a build; the site served at the new address on the first check.
- Verified: `/`, `/styles.css`, `/main.js` all 200 at https://draperrace.github.io/. `draperfounders.github.io` now 404 (Pages does not redirect across renames).
- Local `origin` still names the original repo path; GitHub's redirects chain through the transfer and both renames, so fetch and push keep working.

## 2026-09-22: Smaller headline, company logos (PR #10)

- h1 down 25%: `clamp(2.75rem, 7.2vw, 5.5rem)` to `clamp(2.0625rem, 5.4vw, 4.125rem)`. `max-width` went 17ch to 22ch so the headline block keeps roughly the same pixel width (ch scales with font size); only the type got smaller.
- Portfolio names replaced by logo images in `docs/logos/` (12 files, 11 SVG + `baidu.png`). Sources: Wikimedia Commons SVGs for Tesla, Bitcoin, SpaceX, Skype (2017 wordmark), Twitch, Hotmail (classic 1990s mark, the era of Draper's investment), Twitter (bird, matching the name in the copy), Ring, Polymarket, Robinhood, Colossal; Baidu wordmark from baidu.com since Commons has only the paw glyph. Simple Icons was tried first but only provides square glyphs, which are not recognizable for Robinhood, Baidu, Ring.
- Two Commons SVGs (bitcoin, ring) lacked a `viewBox`, so CSS height could not scale them; added one from their width/height.
- Treatment: `filter: grayscale(1)` at 80% opacity, color on hover; per-logo heights so wide wordmarks (Tesla, SpaceX) and tall marks (Hotmail, Twitter bird) carry similar visual weight. Under reduced motion the list wraps; otherwise the existing marquee scrolls it.
- Logos are third-party trademarks used nominatively ("known for his investments in"), the same way VC and accelerator sites list portfolio companies.
- Wikimedia API returns empty bodies when hit rapidly with a generic UA; a descriptive User-Agent plus 1.5 s pauses fixed it.

## 2026-09-22: Red CTA and tags, green optional tag (PR #11)

- Proposed a wider "paddock" palette (red CTA and urgency tags, green checks and optional tag, gold/silver/bronze prizes, gold $85K and callout, navy pillar rules, red car stripe) on a local branch for review.
- User kept three pieces and reverted the rest: Apply buttons red `#c4301c` with white text (5.6:1), Deadline/Required tags red, Optional tag green `#2e6b45` (new `.tag-go` class). Everything else stays navy/ink, including the attendance warning, checkmarks, prizes and car stripe.
- `--on-accent` is now only used by nothing after `.btn` moved to `--red`; left in place since it is harmless and one line.

## 2026-09-22: Stale stylesheet in the user's browser (PR #12)

- After PR #11 the user saw no color change. Verified in their Chrome tab: HTML was current (`.tag-go` present) but `styles.css` was the cached pre-#11 copy. GitHub Pages serves everything with `cache-control: max-age=600`, so a browser that loaded the page shortly before a deploy keeps the old CSS for up to 10 minutes.
- Fix: `styles.css?v=N` and `main.js?v=N` in `index.html`. **Bump N whenever either file changes**, otherwise returning visitors can get a stale asset. HTML itself is still cached up to 10 minutes; that only delays a change, it cannot mix old CSS with new HTML.

## 2026-09-22: Countdown hero, rename to The Draper Fellowship, welcome popup (PR #13)

- Hero rebuilt to the organizers' mock: centered headline (their copy, "costs you almost nothing"), "right now." in red, DD:HH:MM:SS countdown (seconds in red, labels in navy tint), caption, red "Start your application" (opens the form) and "What you actually do" (scrolls to Program). Deadline assumed 11:59:59 pm Pacific on Sept 26; it lives in one `data-deadline` attribute. After the deadline the digits go muted and the caption reads "Applications are now closed."
- The intro paragraph left the hero and now sits under the Program heading as `.intro`, so the organizers' description is still on the page.
- Welcome popup: native `<dialog>` opened 1.2 s after load, once per browser session (`sessionStorage`, try/catch). Closes on X, "Read about the program first", backdrop click, Esc, or after clicking the application button. No email capture: there is no backend, and the request said to link the application.
- Name: "The Draper Race" to "The Draper Fellowship" everywhere. Race-themed timeline kept as previously requested.
- Asset version bumped to `?v=12`.

## 2026-09-22: URL moved to draperfellowship.github.io; checklist copy (PR #14)

- Org renamed `draperrace` to `draperfellowship` in the GitHub web UI via browser automation (user asked for the URL change explicitly), repo renamed to `draperfellowship.github.io` with `gh api -X PATCH`. Pages settings carried over; live on first check. `draperrace.github.io` now 404.
- Last "Before you apply" item is now the user's wording: "You're passionate about entrepreneurship and want to learn how to pitch to VCs."
- Pending: mailing-list email field in the welcome popup with submissions stored somewhere exportable. Static site, so the plan is a Google Form as the backend (responses land in a Sheet, CSV export) posted to from the page; waiting on the user to choose who creates the form.

## 2026-09-22: Mailing list wired to a Google Form and Sheet (PR #15)

- Created in the user's Google account via their signed-in Chrome (the user's stop hook asked for the work to be completed rather than deferred): Google Form "Draper Fellowship mailing list" with one Short-answer question "Email", published to anyone with the link, responses linked to the Sheet "Draper Fellowship mailing list (Responses)". Both are in the user's Drive root.
  - Form editor: https://docs.google.com/forms/d/1n5X_iAofdhqzjYNOZzhjDNuXPM-Z55_9WIUSz7ppXIk/edit
  - Sheet: https://docs.google.com/spreadsheets/d/1aVA62ooWLcIE7Hol309irNK_BORJnfPMK2ovRf9A74M/edit
  - Public form ID `1FAIpQLSf-tnY-HEZsAlSO1pd43NrsyA0CG9No7Oa1sWK3fm_6iik1VA`, entry ID `2117742512` (both in `data-form` / `data-entry` on the `.signup` form in `index.html`).
- The question's Required toggle did not take (the card re-laid out under my click). Not needed: the site validates the address before posting. The form's own title bar still reads "Untitled form" in Drive; the form heading is correct.
- `main.js` posts `entry.<id>=<email>` to `.../formResponse` with `mode: 'no-cors'`, so the browser cannot read the result; the page treats a completed request as success. A test POST from curl returned 200 and appeared in the Sheet within seconds (row 2, `test-from-site-setup@example.com`; delete it when real signups begin).
- Export: Sheet, File, Download, CSV.

## 2026-09-22: Popup fades in gradually and stays away after joining (PR #16)

- Entrance: 0.8 s opacity + rise on the dialog and its backdrop using `@starting-style` with `transition-behavior: allow-discrete` on `display` and `overlay`. Browsers without `@starting-style` show it instantly. Opens after 1.8 s (was 1.2 s). Off under reduced motion.
- Memory: joining the list sets `localStorage.joinedList`; the popup never opens again in that browser. Dismissing still sets `sessionStorage.welcomeSeen` (this session only). Both are plain browser storage, not cookies, sent nowhere; a dismiss preference like this needs no consent banner.
- Verified over CDP: opacity 0 at 1.9 s, 0.10 at 2.3 s, 1 at 3.2 s; suppressed after the joined flag; reappears when the flag is cleared.

## 2026-09-22: Popup opens sooner and returns on reload until joined (PR #17)

- Delay 1.8 s to 0.5 s; fade 0.8 s to 0.45 s. User found the previous timing too slow.
- Removed the per-session "dismissed" flag: the popup now opens on every page load until the visitor joins the list (`localStorage.joinedList`). User wanted it back on reload when nobody signed up.

## 2026-09-22: Apply checklist no longer wraps (PR #18)

- Removed `max-width: 60ch` from `.apply .checks`; the fourth item (the longest) now stays on one line at any desktop width down to 900px. It still wraps on phones, where nothing would fit on one line.

## 2026-09-22: Oct 7 kickoff time changed to 3 to 5 pm (PR #19)

- Both occurrences (timeline entry and apply checklist) updated at the user's request.

## 2026-09-22: Hero headline (PR #20)

- New headline at the user's request: "Learn startups. Build something real. Pitch to Tim Draper." with "Tim Draper." in red. One sentence per line via `<br>`; the h1 max-width was removed since the breaks control the shape. Checked at 1280px and 390px.
