# SOP — Page speed: measure, optimize, and keep it fast by construction (factory-general)

> **Purpose.** Landing-page load time is a conversion lever and a Quality Score factor. This SOP encodes what we've already learned so every page, for every client, is **fast by construction** rather than optimized after the fact. Per-client-repeatable.
>
> **The core principle: perf wins belong in the ENGINE, not in a per-page cleanup.** Optimizing page-by-page means rediscovering the same fixes N times. Anything in "Engine defaults" below is baked into the template so a newly built page starts fast on day one. The per-page pass is then a short **spot-check**, not a rescue.
>
> **Hard constraint: performance audit only. NO Lighthouse SEO check, ever.** These are paid-ad funnels; crawlers are blocked at Cloudflare. See memory `feedback_paid_ads_no_seo.md`.
>
> **Prior art (MH):** [`perf-cleanup-summary.md`](../perf-cleanup-summary.md) at the repo root — the May 2026 optimization campaign on Flow A + Flow B v3. Read it before optimizing anything; most of what follows is distilled from it.

---

## When to invoke

- **Phase 3.4** — full review + optimization pass on the client's **canonical template page** (for MH: prenatal). Runs after content is final (3.3), before the lessons-capture step (3.5), and before Phase 4 E2E.
- **Phase 5 per-page rollout** — a short **spot-check** on each cloned page. They inherit the template's optimizations, so the only realistic regression source is the page's own new assets (usually the hero image).
- **Any time a new third-party script is added** (a new tag, a new embed). Third-party weight is the thing most likely to silently undo prior work.

---

## THE STANDARD TEST MATRIX (run this on every client page)

**Three tools, three different jobs. Not "three opinions to average" — each answers a question the others can't.**

| Tool | Question it answers | Config | Rule |
|---|---|---|---|
| **PageSpeed Insights** | *"How will Google grade us?"* | **Fixed — Slow 4G, Moto G, PSI's defaults. You do NOT get to choose.** | The **pass/fail gate.** Green here or the step isn't done. |
| **GTmetrix** | *"What do real customers actually feel?"* | **Audience-matched:** nearest test server, real connection (4G ~9/5 Mbps), true device viewport | The **realism check** + it has a CrUX tab. Same Lighthouse engine as PSI, so it's directly comparable. |
| **Page Gym** | *"WHY is it slow, and what if I changed X?"* | Match the audience profile | The **diagnostic bench.** Real throttling, per-file *unused bytes*, and hypothesis-testing without a deploy. |

**Dropped: Pingdom.** Its ruleset is YSlow-era and it produced two false signals on MH in one run: graded compression **F(0)** when Brotli was verifiably working (HTML 78,979 → 20,242 bytes on the wire), and reported a 734KB page including 167KB of Google Maps that is `loading="lazy"` in the footer and never loads for a real visitor. Obsolete advice ("put JavaScript at bottom", "make fewer HTTP requests") is actively misleading under HTTP/2.

### How to actually run the tests (for whoever is doing the measuring)

You do **not** need to interpret the results — capture them properly and hand them off.

1. **PSI** (<https://pagespeed.web.dev>) — paste the URL, choose **Mobile**, run. **Do not change any settings — there are none to change, and that's the point.** Run it **3×** (scores swing).
2. **GTmetrix** — set **Connection: 4G Slow**, **Test server: closest to the client** (Seattle for Calgary), and a **current mobile device profile** (e.g. Samsung Galaxy S25 — keep it current; device profiles are a PRO feature, on free you set the viewport instead).
3. **Page Gym** — set the equivalent mobile + throttled profile and the nearest region.
4. **⚠️ Turn OFF any ad-blocker option** in the tool (GTmetrix has an "Adblock Plus" toggle). Our visitors arrive from paid ads with GTM/gtag/Clarity loading — blocking them produces a flattering score that **does not reflect a real visitor.**
5. **Screenshot the full report** (the whole scrolling page, including the Insights/Structure sections) and **send the screenshots to Claude Code.** Do not summarise or re-type them — the raw screenshot carries the waterfall, per-file sizes, and flagged items that the analysis depends on. If a screenshot is too large to attach, split it into 2–3 vertical slices.

> **Always verify what's actually deployed before trusting a result.** On 2026-07-18 a 1-day image `Cache-Control` served the *previous* hero to every tool, so PSI reported "image larger than it needs to be (640x480)" for a file we'd already fixed. If you change an asset, **cache-bust it (`?v=N`) or confirm `cf-cache-status`/`Age` before measuring** — otherwise you are measuring the old build and don't know it.

**The discipline that keeps this honest:**
1. **Never tune PSI's config.** The whole point is that Google chose it. Tuning it to get green is self-deception.
2. **Fix the GTmetrix / Page Gym config ONCE per client, write it down here, and never change it ad hoc** — otherwise every re-test is a new experiment and trends are meaningless.
3. **Never average scores across tools, and never quote whichever is prettiest.** MH prenatal scored **90 (Page Gym, Fast 4G)**, **98% (GTmetrix, 4G)** and **59–73 (PSI, Slow 4G)** *on the same build*. That spread is network profile, not accuracy.
4. **Where two independent engines agree, trust it.** Page Gym (0.147) and PSI (0.15) independently caught the same CLS — that's what proved it was real, not an artifact. Both later confirmed the fix (GTmetrix 0.02).
5. **One tool disagreeing = investigate before acting.** Both Pingdom "findings" evaporated on inspection.

**MH worked example — the locked config:** GTmetrix: Seattle (nearest free server to Calgary), 4G 9/5 Mbps 125ms, 384×832. Page Gym: Midrange mobile, us-west. PSI: defaults, mobile.

*(Test-server location mostly moves TTFB, not the diagnosis — we're on Cloudflare's global edge. Match it for realism; don't over-index on it.)*

## Tooling decision: PSI is the scorecard, Page Gym is the workbench (2026-07-18)

**Decision: use BOTH, for different jobs. Do not replace PSI as the primary.**

| | PageSpeed Insights | [Page Gym](https://pagegym.com) |
|---|---|---|
| Whose opinion | **Google's own** | Independent third party |
| Field data (CrUX / real users) | ✅ **only source** | ❌ lab-only *(author confirmed: "on the fence" about adding CrUX)* |
| Throttling | **Simulated** — full-speed load, then models a slow connection over the collected data | **Real** — throttling actually applied; metrics are what the browser observed |
| Accessibility / Best-Practices / SEO audits | ✅ | ❌ none |
| Diagnosis | checklist-ish | real waterfall, per-host transfer, request chaining, **per-file "unused" bytes**, hypothesis testing without code changes |

**Why PSI stays primary:** it is the *scorekeeper's own scoreboard*, and the only place CrUX field data appears. Since our launch concern is precisely how Google assesses the page from day one (§"Target: get the PSI metrics into the GREEN"), optimizing against a third-party score Google never reads would be optimizing the wrong number.

**Why Page Gym earns a permanent place:** the real-vs-simulated throttling difference is genuine (the tool's author explained it publicly and an initially-skeptical commenter conceded the point). It means **some of the run-to-run variance we chased is a Lighthouse *modeling artifact*, not our page.** Its waterfall + "unused bytes per file" is materially better for *finding causes*, and it can A/B a hypothetical optimization without a deploy — which fits our iterate-and-remeasure loop. On MH it immediately surfaced a 145.91 kB font payload that PSI had never made legible.

**Read scores across tools carefully — they are not comparable.** MH prenatal scored **90 on Page Gym (Fast 4G)** and **59–73 on PSI (Slow 4G)** *on the same build*. That gap is mostly the network profile, not accuracy. Use PSI's pessimistic number as the bar; use Page Gym's realistic profile to understand real-user feel. **Where they agree, trust it** — both independently measured CLS ≈ 0.147/0.15, which is what retired our doubt that the CLS was a measurement artifact.

**Two risks to carry:**
1. **Bot/CDN blocking.** Page Gym's probes can be blocked by aggressive bot rules — relevant for us since our zone blocks crawlers, and more so for future clients. Allowlist per <https://pagegym.com/bots> if a test fails to fetch.
2. **Single-developer project**, no accessibility/SEO audits. Fine as a diagnostic; **don't make it a factory dependency**, and for any client who cares about organic search, Lighthouse's SEO/accessibility audits are still required.

## Measurement discipline (get this right or every conclusion is noise)

**Lighthouse run-to-run variance is severe. A single run is not evidence.** On MH, the *same page* scored **92, then 64, then 61** on three consecutive runs — a 31-point spread with zero code change between them. The cause was Cloudflare edge cache state, not the page.

Rules:
1. **Use PageSpeed Insights (PSI)** as the primary instrument. PSI lab runs are materially more stable than local Lighthouse cold runs.
2. **Run at least 3 times.** Report **median and best**, never a single number.
3. **Mobile, simulated throttling.** That's the traffic that matters for a paid-ad funnel.
4. **Record the metrics that move**: LCP, CLS, INP/TBT, Speed Index, total transfer size.
5. **A "gain" that's inside the noise band is not a gain.** Re-measure before claiming a win.

---

## Engine defaults — bake these into the template (the 80%)

These are settled. A new page should ship with all of them already true.

**Critical path**
- **Inline the page's core CSS into `<head>`.** One fewer request, nothing blocking. (This alone was a large part of Flow B v3 going from LCP 7.0s → 1.8s.)
- **Async-load non-critical CSS** (fonts, secondary stylesheets) with the `rel="preload" as="style" + onload` pattern, plus a `<noscript>` fallback.
- **No render-blocking JS.** Defer or async everything that isn't required for first paint.
- **Fonts:** trim to only the weights/variants actually used (italic variants are a common silent cost); `font-display: swap`.

**Images**
- **Hero:** correctly-sized webp, `preload`, `fetchpriority="high"`, explicit width/height (prevents CLS). The hero is the LCP element — it gets the attention.
- **Everything below the fold:** `loading="lazy"` + `decoding="async"`. **Never preload a below-fold image** — it competes with the hero for bandwidth. (MH had 9 image preloads; 7 were stripped.)
- **Size images to their rendered size.** MH shipped a logo at **1574×1543px that rendered at 22×22** — 75KB → 2.5KB once resized. Check the rendered dimensions, not just the file size.
- **Always webp.** See [`sop-image-sourcing.md`](sop-image-sourcing.md) — webp conversion is a mandatory factory step, and source originals must never reach the CDN.

**Third-party (the biggest ongoing risk)**
- **Defer every third-party until it's needed.** On MH, the booking calendar embed must **not load until the lightbox opens**. Same discipline for any quiz/form embed.
- **Third-party JS cannot be deleted, only deferred.** MH's "115KB unused JS" was almost entirely GTM + gtag. There is no code fix — the only lever is **GTM trigger configuration**. Don't waste a cycle trying to delete it.
- **Audit what GTM is actually firing.** MH was silently loading **Microsoft Clarity (~26KB)** via a GTM tag nobody had flagged. Every unreviewed tag is invisible weight.

**Cloudflare zone settings** (dashboard toggles, no deploy needed — verify per client)
- **Brotli compression:** ON
- **Early Hints:** ON
- **Rocket Loader:** **OFF** — it breaks already-optimized pages
- **Browser Cache TTL:** respect existing headers
- *(Auto Minify is deprecated — skip it.)*

---

## The known unsolved problem: Cloudflare cold-edge LCP

**This is the dominant LCP factor on MH and it is NOT a page problem.** The hero image is small (22KB) and preloaded, yet LCP swings between **2.9s and 10.2s** depending purely on whether Cloudflare's edge has the image cached. On a cold edge fetch the hero can stall for **5–9 seconds**.

No amount of image optimization fixes this — the asset is already tiny. The two candidate fixes, **neither yet implemented, both to be evaluated on measured evidence at the client's Phase 3.4 pass**:
1. **Cloudflare Images** for the hero — better edge distribution than a static asset pull.
2. **An edge cache warmer** — a Cron Trigger that periodically requests the page/hero to keep edges warm. (Cloudflare Cron Triggers are free and already in the factory's Cloudflare stack.)

**Measure first, then decide.** Neither fix is a default. Baseline the page, quantify the variance, and adopt a fix only if the variance is actually costing you. If LCP is stable, do nothing — both options add moving parts.

**Diagnose before you optimize:** if a page measures slow *and highly variable*, suspect cold-edge cache, not the page. Chasing it with more image compression is wasted effort.

### Lab vs. field, and what actually moves the PSI score (MH prenatal, 2026-07-17)

Three things learned the hard way on the prenatal 3.4 pass — all factory-general:

1. **The PSI score is computed ONLY from the metrics (FCP, LCP, TBT, Speed Index, CLS).** Everything under **Diagnostics** — "Reduce unused JavaScript", "Minify CSS/JS", "Use efficient cache lifetimes" — is labelled by PSI itself *"these numbers don't directly affect the Performance score."* Clearing them *feels* like progress and the error count drops, but the number won't move. **Don't spend the optimization budget on diagnostics; spend it on the metrics.** (On MH, GTM+gtag = 285KB of "unused JS" that is pure GTM config — undeletable, and irrelevant to the score anyway.)

2. **The variance signature tells you lab-throttle vs. cold-edge — read it before you act.**
   - **Consistent** slow LCP across runs (e.g. 8.0 / 8.2 / 7.8) = the **Slow-4G lab throttle** grinding through the page's bytes. Real users on real networks are far faster; this is a pessimistic lab number. The only lever is *fewer/smaller bytes on the critical path* (hero size is #1).
   - **Wide spread** across runs (MH prenatal scored **60 / 80 / 65** minutes apart) = **TTFB / cold-edge variance** on the first-byte. That's the "first load has to warm the cache" effect — a real, addressable field-data problem.
   - Both were present on MH: LCP magnitude was throttle-bound; the score spread was TTFB-bound.

3. **Do NOT pay Cloudflare Argo Smart Routing or Cache Reserve for a static Pages site.** Verified (2026-07-17): Argo ($5/mo/domain + $0.10/GB) optimizes the path to *your origin*; a Pages site's "origin" is Cloudflare's own storage — there is no slow origin hop to accelerate. Cache Reserve prevents *eviction*, which only matters if eviction is your bottleneck (it wasn't — see the variance test). **The $5 isn't the risk; buying the wrong lever is.** Exhaust the free structural fixes first.

### Target: get the PSI metrics into the GREEN, not just "better" (Victor, 2026-07-18)

**Why this is a real target and not vanity.** Google's ad Quality Score / page-experience
signalling leans on the same page-speed model PSI exposes, and the *initial* assessment is
made at launch — when there's no CrUX history to average against. If a page launches
measuring poorly, that first impression can persist, because re-crawling/re-sampling is
resource-gated and infrequent. **So the bar for a launch page is green metrics, not
"improved" metrics** — and it's cheaper to hit that before launch than to fix a bad
starting reputation afterwards.

Practical consequence: **do not close a 3.4 pass on "it got faster."** Close it on the
metrics being green (or the residual being a *diagnosed, accepted* environmental limit,
documented as such).

### ⚠️ CLS is intermittent — trust the FAST run, not the slow one (MH, 2026-07-18)

**A slow/cold PSI run can report CLS 0 while the page genuinely has CLS 0.107.** We hit
exactly this: three runs read `CLS 0.107 / — / 0`, and the **0 came from the *slowest*
run** (LCP 7.6s) while the 0.107 came from the *fastest* (LCP 1.7s). On a heavily
throttled load, late-arriving fonts/content settle before the shift-measurement window;
on a fast load the swap lands *after* first paint and is correctly counted.

**Rule: read CLS off your fastest run. A "CLS 0" on a cold run is not evidence of a fix.**
We nearly closed 3.4 on that false signal.

### Font-swap CLS: use metric-matched fallbacks (`size-adjust`) — engine default

The most common CLS source on a brand-font page is the **fallback → web-font swap**: the
fallback has different metrics, so text reflows when the real font lands and everything
below it shifts. Per-element `min-height` is whack-a-mole (it can't cover text that
*re-wraps*, or the elements upstream that push a block down).

**The systemic fix**, and now the engine default:

```css
@font-face {
  font-family: 'Brand-fallback';
  src: local('Arial');
  size-adjust: 125.28%;      /* computed, not guessed */
  ascent-override: 80.22%;
  descent-override: 19.96%;
  line-gap-override: 0%;
}
/* then: font-family: "Brand", "Brand-fallback", system-ui, sans-serif; */
```

Compute the overrides from the **real font metrics** (we used `fontTools`: read
`unitsPerEm`, `hhea.ascent/descent/lineGap`, `OS/2.xAvgCharWidth` for both the brand font
and Arial; `size-adjust` = ratio of em-normalized average char widths; the ascent/descent
overrides are the brand font's values divided by that ratio). **Don't guess these values.**

Why this over the alternatives:
| Option | CLS | Brand | Cost |
|---|---|---|---|
| **Metric-matched fallback** ✅ | ~0 | brand font still renders | 0 bytes, 0 preloads |
| `font-display: optional` | 0 | ❌ shows system font on cold first load | free |
| Self-host + preload every weight | ~0 | fine | ❌ preloads compete with the hero (LCP) |

`local('Arial')` is safe on Linux/PSI infra too — fontconfig aliases Arial to the
metric-compatible Liberation Sans. **Verify the fix by re-rendering pre/post and diffing
the images** (ours were pixel-identical, proving no regression once fonts load).

### The free field-data lever: a cron cache-warmer (built for MH, `cache-warmer/`)

The cold-edge/TTFB variance is a **real-user (CrUX / page-experience) problem**, and it matters most **at launch**: CrUX is empty until ads drive traffic, so Google's first field impression is whatever the first visitors get, and re-sampling is infrequent — a cold launch can stick. The fix is a **Cloudflare Worker with a Cron Trigger** that re-fetches the page's LCP-critical URLs every few minutes to keep them warm in the edge/tiered cache (*"a resource warmed at the upper tier propagates to lower tiers on first regional request"*). Free (Workers free tier), stays in-network, factory-general (config-driven target list). It warms the **real edge/field path**; it does **not** touch the PSI lab throttle — set that expectation explicitly. See [`cache-warmer/`](../cache-warmer/) for the worked MH example. This is now an **engine default candidate** — a client's page should ship with warming configured, not add it after a cold launch.

## Third-party tags: audit, but respect the client's decisions

Every unreviewed tag is invisible weight, so **enumerate what the tag manager is actually firing** at each audit. But an audited tag is not automatically a tag to remove — the client may value the data more than the milliseconds.

**Record the keep/remove decision per client so it isn't re-litigated at every page.** MH's decisions:
- **Microsoft Clarity (~26KB, 50-100ms TBT) — KEEP** (Victor, 2026-07-14). The heatmap / session-replay data is worth the cost. Do not remove it in a perf pass.

---

## Per-page pass (the checklist)

1. **Baseline** — PSI mobile, ≥3 runs. Record median + best for LCP, CLS, INP/TBT, Speed Index, transfer size.
2. **Confirm the engine defaults hold on this page** (they should, if it was cloned from the template). The usual regression is a new hero image that's oversized, un-preloaded, or missing width/height.
3. **Check third-party weight** — has anything new been added since the last audit? A new embed or GTM tag is the most likely cause of a regression.
4. **Fix what's actually broken**, in leverage order: hero image → render-blocking resources → third-party deferral → fonts → CSS trim.
5. **Re-measure** (≥3 runs). Confirm the gain exceeds the noise band.
6. **Regression-test the funnel.** ⚠️ **This is not optional.** Deferring or lazy-loading a script can silently break conversion firing — and the conversion tags *are* the third-party scripts you're most tempted to defer. Walk quiz → grid → detail → booking embed → booking, and confirm the conversion still fires. **No LCP gain justifies a broken conversion.** This is why the optimization pass runs *before* E2E, not after.

> **⚠️ Definition of done (gate) — added 2026-07-16.** The pass is **NOT complete when the fixes are *applied*** — only when they're **measured on the LIVE page** and the target is confirmed. "Applied per the SOP" ≠ "done." Run PSI (pagespeed.web.dev) or **DevTools → Lighthouse** from a real browser session (bypasses the Cloudflare crawler block that can stop PSI's fetcher), confirm the **"eliminate render-blocking resources" audit is clean**, and record LCP/CLS/TBT. If you can't measure it, the step stays 🔄 and you say so — do not mark it ✅. *(Why this exists: a pass once shipped the correct render-blocking fixes but was marked done without a measured confirm.)*

---

## Failure modes to avoid

- **Trusting a single Lighthouse run.** A 31-point swing with no code change is normal. Median of 3, minimum.
- **Optimizing the page when the problem is the edge cache.** High *variance* is the tell.
- **Deferring a conversion tag and not re-testing the funnel.** The worst possible outcome: a fast page that doesn't record bookings.
- **Preloading below-fold images.** It steals bandwidth from the LCP element and makes things worse.
- **Trying to delete third-party JS.** You can't. Defer it via tag-manager config or accept it.
- **Optimizing a page instead of the template.** If a fix would help every page, it belongs in the engine — otherwise you'll do it N more times.
- **Running a Lighthouse SEO audit.** Never. Paid-ads-only.
