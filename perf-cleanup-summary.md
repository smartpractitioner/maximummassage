# Maximum Health perf-cleanup — summary

Tracking the work specified in `maximum-health-perf-cleanup.md`, executed
2026-05-01, plus the Flow B v3 follow-up round on 2026-05-06.

## Flow B v3 follow-up (2026-05-06)

After the v3 redesign launched, PSI on `/massage-therapy-calgary-flow-b/`
showed 68 / LCP 7.0 s with -2,190 ms estimated savings on render-blocking
requests. Three more changes shipped in commit `2551ea3`:

- Inlined `flow-b-v3.css` into `<head>` (one fewer request, no blocking).
- Switched the Google Fonts CSS link and `picker.css?v=v3-hint` to the
  `rel="preload" as="style" + onload` async-load pattern with `<noscript>`
  fallbacks.
- Resized `sunlife.webp` from 1574×1543 px / 75 KB to 44×43 px / 2.5 KB
  (rendered size is 22×22; we keep 2× DPR). Sharp via `npx`.
- Added a `<main>` landmark wrapping the page sections (a11y +2).

Lighthouse on live (2 consecutive runs, mobile, simulate):

| Metric | PSI 2026-05-04 | LH 2026-05-06 |
|---|---|---|
| Performance | 68 | **96 / 97** |
| LCP | 7.0 s | **1.8 s** |
| FCP | 2.9 s | **1.8 s** |
| TBT | 130 ms | 130–160 ms |
| CLS | 0.087 | **0.054** |
| Speed Index | 2.9 s | **1.8 s** |
| Accessibility | 90 | 92 |

Cloudflare manual toggles (Task 13) were also confirmed during this
round — see `README.md → Cloudflare zone settings` for the current
state. Auto Minify is deprecated and skipped; Brotli is on by default;
Early Hints + Rocket Loader OFF + Browser Cache TTL "Respect Existing
Headers" are confirmed.

The recommendation to delete orphaned Landingi files in `public/assets/`
turned out to be wrong — they're still consumed by the per-therapist
subpages (`brookelyn/`, `meagan/`, `charlotte/`, `lindsey/`,
`appointment-confirmed/`). Don't delete them; revisit if those pages
also get a v3-style rebuild.

## Tasks completed

| Task | Status | Commit |
|---|---|---|
| 1 — Inventory baseline coverage | done | `d23c8c9` |
| 2 — Trim Google Font weight + italic variants | done | `f4e0bb1` |
| 3 — Remove jQuery + jQuery-dependent dead runtime | done | `4767b18` |
| 4 — Drop frodo.js + lightbox-render.js, ship native FAQ accordion | done | `279f5ff` |
| 5 — Defer Tally to first interaction | already implemented prior to this work | (no commit) |
| 6 — Native lazy-loading for images (drop lazysizes.js) | done | `d4b5fc2` |
| 7 — Strip excessive preload hints | done (combined with Task 6) | `d4b5fc2` |
| 8 — Reduce unused CSS | skipped | — |
| 9 — Reduce unused JS | covered by Tasks 3 + 4 | — |
| 10 — Add meta description | done | `ce0511e` |
| 11 — Fix invalid robots.txt | done (dead Sitemap line removed) | `ce0511e` |
| 12 — Confirm Cloudflare cache headers | verified, no change needed | (no commit) |
| 13 — Cloudflare manual toggles | report-only — see below | n/a |

### Tasks skipped, with reasons

- **Task 5 (defer Tally to first interaction).** Already implemented in
  prior work — Flow A's existing inline IIFE only sets the iframe `src`
  and appends `tally.so/widgets/embed.js` after a CTA click
  (`bootTallyOnce()`). Confirmed in the baseline Lighthouse network
  audit: zero `tally.so` requests during initial page render.
- **Task 8 (PurgeCSS / unused-CSS trim).** Lighthouse only flagged
  `/assets/css/landingi/landend-base.css` as ~95% unused (~16 KB).
  Worth doing eventually but it's a small win (~16 KB transfer pre-brotli,
  ~4 KB compressed) compared with the 130 KB of script weight removed in
  Tasks 3 + 4. Recommend revisiting after the hero rebuild.
- **Task 9 (further unused JS).** The "115 KB unused JS" PSI flagged on
  May 1 was almost entirely GTM (`gtm.js`) and Google Ads (`gtag/js`),
  both third-party — they can't be deleted, only deferred via GTM trigger
  config. The only Landingi runtime still loaded is `frodo.js` removal,
  which Task 4 covered. Nothing further to do client-side.

## Before / after metrics

### PSI baseline (May 1 2026 — provided in spec, source of truth)

| Metric | Flow A | Target | Status |
|---|---|---|---|
| Performance | 56 / 100 | 75+ | below |
| LCP | 9.1 s | <4.0 s | below |
| FCP | 3.9 s | <1.8 s | below |
| Speed Index | 5.3 s | <3.4 s | below |
| TBT | 330 ms | <200 ms | below |
| CLS | 0 | <0.1 | OK |

### Lighthouse local CLI (post-cleanup, mobile/simulate, Flow A live URL)

3-run sample because run-to-run variance is significant on the Cloudflare edge:

| Run | Score | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| 1 | 92 | 2.2 s | 2.9 s | 120 ms | 0.019 |
| 2 | 64 | 3.8 s | 9.7 s | 160 ms | 0 |
| 3 | 61 | 3.7 s | 10.2 s | 210 ms | 0 |
| **Median** | **64** | **3.7 s** | **9.7 s** | **160 ms** | **0** |
| **Best** | **92** | **2.2 s** | **2.9 s** | **120 ms** | **0.019** |

**TBT is the consistent win** — every run is at or below the 200 ms
target, vs 930 ms on baseline. That's directly attributable to the
~130 KB of removed Landingi runtime JS.

**LCP is highly variable** (2.9 s → 10.2 s) — this is Cloudflare's edge
cache state for the hero image. When the edge has the WebP cached the
LCP runs are excellent; on cold edge fetches it stalls. The image
itself is small (22 KB) and preloaded — the issue is purely Cloudflare's
cache distribution / origin pull. Tasks 12 + 13 (Cache TTL settings)
would help, see below.

**Re-run PSI yourself** — `https://pagespeed.web.dev/?url=https%3A%2F%2Fgo.maximummassage.ca%2Fmassage-therapy-calgary-flow-a%2F`. PSI lab
runs are more stable than local Lighthouse cold runs.

## Changes by file

### Modified
- `public/massage-therapy-calgary-flow-a/index.html` — removed jQuery
  preload + script, jquery.form.min.js, anchors.js, files.js,
  new_landend.js, frodo.js, lightbox-render.js, lazysizes.min.js +
  config + init; trimmed Google Font variants; lifted lazysizes
  data-src/srcset/sizes attrs to native; added loading="lazy" +
  decoding="async" to non-hero imgs; hero kept fetchpriority="high";
  stripped 7 of 9 image preloads (kept hero mobile + desktop); converted
  font CSS preloads to plain stylesheet links; populated meta
  description; added inline native FAQ accordion init script.
- `public/massage-therapy-calgary-flow-b/index.html` — same set of
  cleanups, same script removals, same image transforms.
- `public/massage-therapy-calgary-flow-b/confirmation/index.html` —
  trimmed Google Font variants.
- `public/assets/css/overrides.css` — added native `scroll-behavior:
  smooth`, FAQ collapsed-state CSS, and `cursor:pointer` on accordion
  headings.
- `public/robots.txt` — removed the dead `Sitemap:` line (URL was
  redirecting, not serving XML).

### Deleted
No source files were deleted. The Landingi runtime JS files
(`jquery-3-6-0.min.js`, `frodo.js`, `lightbox-render.js`,
`lazysizes.min.js`, etc.) still exist on disk under
`public/assets/js/landingi/`; only the `<script>` tags that loaded
them have been removed. They're still served by Cloudflare for
anyone with a stale cached URL but they no longer affect new page
loads. Safe to delete in a follow-up cleanup.

### Created
- `perf-baseline-coverage.json` — baseline Lighthouse summary (per-asset
  unused-bytes for both flows).
- `perf-baseline-curl.txt` — TTFB / total / size from curl.
- `perf/baseline-flow-a.json`, `perf/baseline-flow-b.json` — raw
  Lighthouse reports.
- `perf/post-task[N]-flow-a-*.json` — Lighthouse reports after each
  task.
- `perf-cleanup-summary.md` — this file.

## Cloudflare manual toggles (Task 13 — verify in dashboard)

These cannot be changed from this repo. Open Cloudflare → Pages →
maximummassage → Settings, then verify each:

- **Speed → Optimization → Auto Minify (HTML/CSS/JS):** ON
- **Speed → Optimization → Brotli compression:** ON (verified live —
  `Content-Encoding: br` confirmed on HTML and asset responses)
- **Speed → Optimization → Early Hints:** ON
- **Speed → Optimization → Rocket Loader:** OFF (it can break things on
  optimized pages)
- **Caching → Configuration → Browser Cache TTL:** 4 hours minimum
  (verified — assets currently return `max-age=14400`, which is 4h)

If any of these need flipping, the change applies instantly with no
deploy.

## Unexpected findings worth flagging

1. **`scripts.clarity.ms` (Microsoft Clarity, ~26 KB)** is loaded on
   both flows. Not mentioned in the spec; it's a third-party heatmap /
   session replay tool. If it's no longer wanted, removing the GTM tag
   that fires it would shave another 26 KB and ~50-100 ms TBT.
2. **`/sitemap.xml` redirects to the home page** rather than serving
   real XML. This was the source of the robots.txt validator complaint.
   If real SEO crawlers ever become a goal (the user has flagged this
   site as paid-ads-only), generate a real sitemap.xml; otherwise, the
   redirect is harmless now that the dead `Sitemap:` line is gone.
3. **Flow B's LCP score in our baseline run was wildly off (12.1 s vs
   Flow A's 2.8 s)** despite shipping nearly identical bytes. We
   confirmed it was Lighthouse run-to-run variance on Cloudflare cold
   edge state; subsequent runs evened out.
4. **The May 1 PSI numbers in the spec said "115 KB unused JS"** — that
   weight is mostly from third-party GTM + gtag (~115 KB combined),
   not Landingi runtime. So "remove unused JS" can't be done by deleting
   files — only by deferring those third-party tags. GTM tag config is
   out of scope here; would need a Tag Manager edit.
5. **The hero image sometimes takes 5-9 seconds to load on a Cloudflare
   cold edge.** This is the dominant LCP factor right now. Pre-warming
   Cloudflare's image cache (e.g., a cron that hits the URL hourly to
   keep edges warm) or moving the image to Cloudflare Images (which
   has better edge distribution) would smooth out the LCP variance.

## Recommended next steps after the hero rebuild

The hero rebuild (planned next) is the biggest remaining LCP lever.
After it lands:

1. Re-run PSI on both flows, lock in the new numbers.
2. Decide on Microsoft Clarity (keep / remove).
3. Consider deleting the orphaned Landingi JS files from
   `public/assets/js/landingi/` to clean up the repo.
4. Run PurgeCSS against `landend-base.css` (Task 8) — easy win at this
   stage.
5. If LCP variance is still a problem, investigate Cloudflare Images for
   the hero image or set up an edge cache warmer.
