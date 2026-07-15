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

---

## Failure modes to avoid

- **Trusting a single Lighthouse run.** A 31-point swing with no code change is normal. Median of 3, minimum.
- **Optimizing the page when the problem is the edge cache.** High *variance* is the tell.
- **Deferring a conversion tag and not re-testing the funnel.** The worst possible outcome: a fast page that doesn't record bookings.
- **Preloading below-fold images.** It steals bandwidth from the LCP element and makes things worse.
- **Trying to delete third-party JS.** You can't. Defer it via tag-manager config or accept it.
- **Optimizing a page instead of the template.** If a fix would help every page, it belongs in the engine — otherwise you'll do it N more times.
- **Running a Lighthouse SEO audit.** Never. Paid-ads-only.
