# Cloudflare Page-Speed Playbook (portable)

> **What this is.** Everything we learned running a full page-speed optimization on a
> Cloudflare-hosted site, written so you can drop it into a **Claude Code session** and
> have it act on it. Client-agnostic; our worked example is a landing page on
> **Cloudflare Pages** that went from CLS 0.107 → **0**, payload **−44%**, and real-user
> Core Web Vitals **passing**.
>
> **How to use it with Claude Code.** Put this file in your repo (e.g. `docs/`), then say:
> *"Read docs/cloudflare-page-speed-playbook.md and run the per-page pass in §8 on [page]."*
>
> Sections are tagged: **[UNIVERSAL]** apply as-is · **[STACK-DEPENDENT]** depends on your
> architecture (§0) · **[ADAPT]** we did this for our site, adapt the specifics.

---

## 0. FIRST — check your architecture (it changes the advice) [STACK-DEPENDENT]

| Your setup | What it means | Key implication |
|---|---|---|
| **Cloudflare Pages / Workers Static Assets** (static files, no backend) | Cloudflare *is* the origin | Paid path-acceleration has **nothing to offer** — no slow origin hop exists. Free levers win. |
| **A dynamic origin behind a Cloudflare zone** (rebuilt WordPress/Node, headless CMS) | Cloudflare proxies to *your* server | Origin latency is real → **Tiered Cache (free) first, then Argo/Cache Reserve may genuinely help** |

**A Wix → Cloudflare migration can land on either.** Have your session confirm whether the
project is a Pages deploy (static output dir) or a Worker/zone in front of an origin.

> ⚠️ **One thing that does NOT carry over from our project:** ours is a **paid-ads-only
> funnel**, so we deliberately block search crawlers and never run an SEO audit. **A
> migrated business website is the opposite — it wants SEO.** Run the Lighthouse SEO
> check, keep crawlers allowed. Ignore any "no SEO" advice you see in our internal docs.

---

## 1. The toolkit — four tools, four different jobs [UNIVERSAL]

**Not four opinions to average. Each answers a question the others can't.**

| Tool | Question it answers | Config | Role |
|---|---|---|---|
| **PageSpeed Insights** | *"How will **Google** grade us?"* | **Fixed — you don't get to choose** | The **pass/fail gate** + only source of CrUX |
| **GTmetrix** | *"What do **real customers** feel?"* | Audience-matched (below) | **Realism check**; same Lighthouse engine as PSI, so directly comparable |
| **[Page Gym](https://pagegym.com)** | *"**Why**, and what if I changed X?"* | Audience-matched | **Diagnostic bench** |
| **Cloudflare Web Analytics** | *"What are **actual visitors** getting, right now?"* | just enable it | **Live field truth** — free RUM, no 28-day CrUX lag |

**Why PSI stays primary:** it's the scorekeeper's own scoreboard and the only place CrUX
field data appears. Optimizing against a third-party score Google never reads is
optimizing the wrong number.

**Why Page Gym earns a place:** Lighthouse/PSI does a **full-speed load then *simulates*
the slow network over the recorded data**; Page Gym **actually applies the throttling**.
That difference is real, and it means *some of the run-to-run variance you'll chase is a
Lighthouse modelling artifact, not your page.* Its waterfall + **per-file "unused bytes"**
is far better for finding causes, and it can test a hypothetical optimization without a
deploy. Lab-only (no CrUX), no accessibility/SEO audits, solo-developer project — great
diagnostic, **don't make it a dependency**.

**Enable Cloudflare Web Analytics on day one** for every client, so field data is already
accumulating before traffic arrives. Its **Debug View names the actual LCP element per
URL** — on our site that identified a specific background image as the P99 LCP element,
which directly justified compressing it. **Read P75** (the percentile Google grades);
ignore P99 until the sample is large.

**❌ Dropped: Pingdom.** Its ruleset is YSlow-era and it produced two false signals in a
single run: graded compression **F(0)** when Brotli was verifiably working (HTML
78,979 → 20,242 bytes on the wire), and reported a 734KB page including 167KB of Google
Maps that is `loading="lazy"` in the footer and **never loads for a real visitor**. Advice
like "put JavaScript at bottom" / "make fewer HTTP requests" is actively misleading under
HTTP/2.

### How to actually run the tests (hand this to whoever measures)

1. **PSI** — paste URL, **Mobile**, run **3×**. Change nothing; there's nothing to change.
2. **GTmetrix** — **Connection: 4G Slow**, **test server closest to the client**, current
   mobile device profile (device emulation is PRO; on free you set the viewport).
3. **Page Gym** — equivalent mobile + throttled profile, nearest region.
4. **⚠️ Turn OFF any ad-blocker toggle.** GTmetrix defaults to Adblock Plus, which strips
   the tag-manager JS a real visitor loads. It inflates the score and is **not** a real
   visitor's experience.
5. **Expand every collapsed accordion before capturing** — the per-file sizes and flagged
   URLs live inside them; a collapsed screenshot is nearly useless.
6. **Capture every GTmetrix tab** — Summary, Performance, Structure, CrUX, Waterfall.
7. **Send all screenshots to Claude Code.** Don't summarise or re-type; the raw capture
   carries the waterfall and per-file data the analysis depends on. Split tall images into
   2–3 vertical slices.

> 🪤 **Verify what's actually deployed BEFORE measuring.** We spent a round analysing
> phantom findings because a 1-day image `Cache-Control` was serving the *previous* hero to
> every tool — PSI complained "image is larger than it needs to be (640x480)" about a file
> we'd already fixed. **Cache-bust changed assets (`?v=N`) or check `cf-cache-status`/`Age`
> first**, or you're measuring the old build and don't know it.

---

## 2. Measurement discipline [UNIVERSAL]

**Variance is severe.** The same page scored **92 / 64 / 61** on three consecutive runs
with zero code change; later **73 / 61 / 59 / 70 / 61** *while getting objectively lighter
every step*. A single run is not evidence. **Run ≥3, report median + best.**

### (a) The score is computed ONLY from the metrics

FCP, LCP, TBT, Speed Index, CLS. Everything under **Diagnostics** — *"Reduce unused
JavaScript"*, *"Minify CSS/JS"*, *"Use efficient cache lifetimes"* — is labelled by PSI
itself **"these numbers don't directly affect the Performance score."** Clearing them
shrinks the error list and *feels* productive, but the number won't move. **Spend the
budget on the metrics.**

### (b) The variance signature tells you which problem you have

- **Consistently slow LCP** (8.0 / 8.2 / 7.8s) = **lab-throttle / byte-bound**. The lever is
  fewer/smaller bytes on the critical path.
- **Wide score spread** (60 → 80 → 65) = **TTFB / cold-edge variance** — a real field
  problem (§6).
- **TBT swinging 120 → 370ms on identical code** = contention on the tool's shared test
  machines. Not you.

### (c) ⚠️ CLS is intermittent — trust the FAST run

**A slow run can report CLS 0 while the page genuinely has CLS 0.107.** We hit exactly
this: the `0` came from the *slowest* run (LCP 7.6s) and the `0.107` from the *fastest*
(LCP 1.7s). On a heavily throttled load, late content settles before the measurement
window; on a fast load the swap lands after first paint and is correctly counted.
**Read CLS off your fastest run. "CLS 0" on a cold run is not evidence of a fix.**

### (d) Scores are not comparable across tools

Our identical build scored **97 (Page Gym, Fast 4G)**, **95% (GTmetrix, 4G Slow)** and
**61 (PSI, Slow 4G)**. That's network profile, not accuracy. **Never average them; never
quote whichever is prettiest.** But **where two independent engines agree, trust it** —
Page Gym (0.147) and PSI (0.15) independently caught the same CLS, which is what proved it
was real rather than an artifact.

---

## 3. Engine defaults — bake these in [UNIVERSAL]

**Critical path**
- **Inline the page's core CSS** into `<head>`. (Took one of our pages LCP 7.0s → 1.8s.)
- **Async-load non-critical CSS**: `rel="preload" as="style"` + `onload="this.rel='stylesheet'"` + `<noscript>` fallback.
- **No render-blocking JS** — `defer`/`async` everything not needed for first paint.
- **Self-host + PRELOAD the font that renders your LCP element**:
  `<link rel="preload" as="font" type="font/woff2" crossorigin href="...">`.
  ⚠️ **Self-hosting without the preload does almost nothing** — the browser doesn't discover
  the font until it parses the CSS. We shipped that gap once; the preload is the point.

**Images**
- **Hero (the LCP element):** right-sized webp, responsive `srcset`, `preload` +
  `fetchpriority="high"`, explicit `width`/`height`.
- **Below the fold:** `loading="lazy"` + `decoding="async"`. **Never preload a below-fold
  image** — it steals bandwidth from the hero.
- **Size to *rendered* size.** We shipped a logo at **1574×1543 rendering at 22×22**
  (75KB → 2.5KB once resized).
- **Background images behind a dark overlay can be compressed brutally** — ours sat under a
  78–86% gradient; 1600×1066 @ 54.7KB → 1200×800 @ q58 = **29.4KB**, visually identical.

> 🪤 **The responsive-image trap that bit us.** We shrank the mobile hero to **640w** —
> and made things *worse*. The test device needed 368 CSS px × 1.75 DPR = **644px**, so 640w
> was *just* too small and the browser **upgraded to the 1019w desktop file (64KB instead of
> 37KB)**. **Compute `CSS width × DPR` and make sure a variant sits comfortably above it.**

**Third-party (the biggest ongoing risk)**
- Defer every third-party until needed (booking embeds, chat widgets).
- **You can't delete tag-manager JS, only defer it.** Our "118KB unused JS" is almost all
  GTM + gtag config. The only lever is tag-manager configuration — don't waste a cycle.
- **Audit what the tag manager actually fires.** We found Microsoft Clarity (~26KB) loading
  via a tag nobody had flagged.

**Cloudflare zone toggles:** Brotli **ON** · Early Hints **ON** · Rocket Loader **OFF**
(it breaks already-optimized pages).

---

## 4. Killing CLS: metric-matched fallback fonts [UNIVERSAL]

**The #1 CLS source on a brand-font page is the fallback → web-font swap:** different
metrics, so text reflows when the real font lands and everything below it shifts.
Per-element `min-height` is whack-a-mole — it can't cover text that *re-wraps*, or elements
upstream that push a block down.

**The fix — a fallback font whose metrics are adjusted to match the real one:**

```css
@font-face {
  font-family: 'Brand-fallback';
  src: local('Arial');
  size-adjust: 111.06%;      /* computed, never guessed */
  ascent-override: 90.49%;
  descent-override: 22.51%;
  line-gap-override: 0%;
}
/* then: font-family: "Brand", "Brand-fallback", system-ui, sans-serif; */
```

Chosen deliberately over the alternatives:

| Option | CLS | Brand | Cost |
|---|---|---|---|
| **Metric-matched fallback** ✅ | ~0 | brand font still renders | 0 bytes, 0 preloads |
| `font-display: optional` | 0 | ❌ shows system font on cold first load | free |
| Self-host + preload every weight | ~0 | fine | ❌ preloads compete with the hero |

### How to compute the values (don't guess — we got this wrong twice)

⚠️ **Do NOT use `OS/2.xAvgCharWidth`.** It averages *all* glyphs including wide/symbol
glyphs and **overstated our text width by ~13%**, which forced extra line-wraps and made
CLS *worse* (0.107 → 0.15). Use a **frequency-weighted average of actual English letter
advances**:

```python
from fontTools.ttLib import TTFont
FREQ = {'a':8.2,'b':1.5,'c':2.8,'d':4.3,'e':12.7,'f':2.2,'g':2.0,'h':6.1,'i':7.0,
        'j':0.15,'k':0.77,'l':4.0,'m':2.4,'n':6.7,'o':7.5,'p':1.9,'q':0.095,'r':6.0,
        's':6.3,'t':9.1,'u':2.8,'v':0.98,'w':2.4,'x':0.15,'y':2.0,'z':0.074,' ':17.0}

def metrics(path):
    f = TTFont(path); upm = f['head'].unitsPerEm
    cmap = f.getBestCmap(); hmtx = f['hmtx']; h = f['hhea']
    n = d = 0.0
    for ch, w in FREQ.items():
        g = cmap.get(ord(ch))
        if g: n += w * (hmtx[g][0]/upm); d += w
    return n/d, upm, h.ascent, h.descent, h.lineGap

aw, *_            = metrics('C:/Windows/Fonts/arial.ttf')   # the fallback
w, upm, asc, desc, gap = metrics('your-font.woff2')
sa = w/aw
print(f'size-adjust: {sa*100:.2f}%')
print(f'ascent-override: {(asc/upm)/sa*100:.2f}%')
print(f'descent-override: {(abs(desc)/upm)/sa*100:.2f}%')
```

### Three traps we hit after that

1. **A stack you didn't notice.** Our biggest residual shift came from an element inheriting
   a **different base font stack** we'd never patched. **Audit what the page *actually*
   renders** via computed styles, not by reading CSS:
   ```js
   document.querySelectorAll('*').forEach(el => { const cs = getComputedStyle(el);
     /* tally cs.fontFamily.split(',')[0] + cs.fontWeight + cs.fontStyle */ });
   ```
2. **Bold weights need their own face.** At `font-weight: 700` the `local('Arial')` fallback
   resolves to **Arial *Bold***, a different width ratio — one `size-adjust` can't serve
   600 and 700. Use **weight-scoped `@font-face` rules sharing one family name**:
   ```css
   @font-face { font-family:'Brand-fallback'; src:local('Arial'); font-weight:400 600; size-adjust:105.5%; … }
   @font-face { font-family:'Brand-fallback'; src:local('Arial'); font-weight:700 900; size-adjust:99.71%; … }
   ```
3. **Per-string wrap boundaries.** Average-width matching still let one button wrap (fallback
   302.4px vs web font 289.9px in a 294px box). **Measure the actual string** and tune to
   match its *rendered width* — matching widths makes wrap behaviour identical at every
   viewport, which is what CLS measures.

### Verify it properly

Render the page twice — **fonts blocked** vs **fonts loaded** — and diff every above-fold
element's box. This is the single most useful technique in this document:

```python
# Playwright: route-abort **/*.woff2 + fonts.googleapis/gstatic for the "fallback" run,
# then compare el.bounding_box() y/height for each element across both runs.
```
Our worst above-fold delta went **75px → 0** this way, across 4 viewport widths.

---

## 5. Trimming the font payload — the *axis* is the cost, not the weight count [UNIVERSAL]

Google Fonts serves **one variable file per family**, so requesting 4 weights doesn't cost
4 downloads. What costs is **extra variable axes**. Our display font requested an
**optical-size axis** (`opsz,wght@0,12..96,…`):

| Request | Downloaded |
|---|---|
| With `opsz` axis | **75.1 KB** |
| Same weights, **no `opsz`** | **40.4 KB** ← −35KB for one URL edit |
| Body font: 3 weights (variable) | 29.3 KB |
| Only the weight actually used | **13.0 KB** |

**Our font payload went 141.8 → 90.8 KB (−36%) by editing the Google Fonts URL.** Audit
real usage first (computed styles, §4), then request only the weights/styles that render
and drop unneeded axes. Verify by **intercepting the actual network responses**, not by
estimating — and note a scroll may pull extra files (a lazy Google Maps iframe pulled in
42KB of Roboto that had nothing to do with us).

---

## 6. TTFB, cold edge, and "first load is slow" [STACK-DEPENDENT]

### 6a. Cache the HTML at the edge — usually the biggest remaining lever

**Cloudflare does NOT edge-cache HTML by default.** It judges cache *eligibility* by
**file extension**, so an extensionless URL like `/your-page/` goes to origin on **every
request** (`cf-cache-status: DYNAMIC`). TTFB gates both FCP and LCP.

⚠️ **A `Cache-Control` header in `_headers` does NOT fix this — we tested it and it stayed
`DYNAMIC`.** Eligibility is judged *before* Cache-Control is read. Keep the header (it
governs TTL once eligible) but it is **inert alone**.

**It needs a zone-level Cache Rule** — and it is **NOT** under Workers & Pages (that
section's "Build cache" is unrelated — it caches build artifacts). Go to the **domain/zone**
→ **Caching → Cache Rules → Create rule**:

- Expression: `Hostname` equals your host **AND** `URI Path` **wildcard** `/your-path*`
- **Cache eligibility** → *Eligible for cache*
- **Edge TTL** → *Use cache-control header if present…*
- **Browser TTL** → leave unset / respect origin

Pair with, in `_headers`:
```
/your-path/*
  Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=86400
```
Browsers always revalidate (visitors never see stale) while the **edge answers for 10
minutes without an origin trip**. Keep the edge TTL short on a live funnel so a bad deploy
can't stick; purge manually for anything urgent.

> 🪤 **The gotcha that will silently no-op your rule:** the `wildcard` operator needs an
> **explicit `*`**. `/your-path` matches that string *exactly* and will **not** match
> `/your-path/` (with trailing slash) — your actual page.

**Verify against a control.** Request the page repeatedly *and* a path the rule doesn't
cover. Ours: rule path **HIT ×8** (`Age: 28`), control path **DYNAMIC ×3**. Expect
`MISS`→`DYNAMIC` flapping for the first minute while it propagates — re-test.

### 6b. Don't buy the wrong lever

**Static Pages site: don't pay** for Argo Smart Routing (**$5/mo/domain + $0.10/GB**) or
Cache Reserve — they accelerate an *origin* you don't have. Use free **Tiered Cache**,
sane `Cache-Control`, and the cron warmer (Appendix A).

**Dynamic origin behind Cloudflare:** these *can* earn their keep — but in order:
(1) Tiered Cache (free), (2) Cache-Control + "Cache Everything" for cacheable routes,
(3) *then* evaluate Argo/Cache Reserve **on measured evidence**.

### 6c. Image cache TTL

Long TTLs satisfy the "efficient cache policy" audit, but if filenames aren't
content-hashed, **a swap keeps serving stale**. We use `max-age=2592000` (30 days) plus a
`?v=N` bust whenever an image changes — **do not rely on the TTL expiring** (that's exactly
how the tools ended up measuring our old hero for hours).

---

## 7. What NOT to waste time on [UNIVERSAL]

- **Diagnostics that don't move the score** (§2a) — minify, unused JS, third-party cache TTLs.
- **Hand-minifying** when Cloudflare **Brotli** already compresses on the wire and you have
  no build step. Ours: HTML 78,979 → 20,242 bytes (74%) with zero minification. Do it in a
  build pipeline or skip it.
- **Trying to delete tag-manager JS.** You can't; defer it or accept it.
- **Preloading below-fold images.**
- **Chasing the lab number when the problem is field/edge** — different problem, different tool.
- **Trusting a single run.**

---

## 8. The per-page pass + when to stop [UNIVERSAL]

1. **Verify what's deployed** (cache-bust / `cf-cache-status`) — *before* measuring.
2. **Baseline** — PSI mobile ×3, median + best.
3. **Confirm the §3 engine defaults hold.**
4. **Check third-party weight** — anything new since last audit?
5. **Fix in leverage order:** HTML edge-caching → hero image → render-blocking → font
   payload/CLS → third-party deferral. (Skip diagnostics per §7.)
6. **Re-measure ×3.** Confirm the gain exceeds the noise band.
7. **Regression-test the funnel.** ⚠️ Not optional — deferring/lazy-loading a script can
   silently break analytics or conversion firing, and those *are* the scripts you're most
   tempted to defer.

> **Definition of done:** the pass is done only when fixes are **measured on the LIVE page**.
> "Applied" ≠ "done."

### Knowing when to stop — the simulation floor

Set the bar at **green metrics** (Google's initial assessment happens at launch, when
there's no CrUX history to average against, and a poor first impression persists because
re-sampling is infrequent). **But don't chase a lab number past the point of meaning.**

We stopped when: everything we controlled was green or dramatically better, **CLS was
confirmed fixed by four independent sources**, payload was down 44%, and **the field data
said real visitors were fine** (CrUX *Passed*, RUM **LCP P75 608ms**, CLS/INP 100% good) —
while PSI's Slow-4G LCP stayed ~8s. That residual was the **simulation floor plus 285KB of
tag-manager JS the client had deliberately chosen to keep**. That's a business trade-off,
not a page defect. **When the remaining gap is explained by a known, accepted decision,
stop and say so.**

---

## Appendix A — free cron cache-warmer

A Cloudflare Worker on a Cron Trigger that re-fetches your LCP-critical URLs so the edge
stays warm. Free (100k req/day; a 5-min cron ≈ 8,640/mo). It warms the **real edge/field
path**; it does **not** change the PSI lab throttle.

```js
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
// Stable URLs only — no ?v= assets, they change and would warm a stale URL.
const TARGETS = [
  'https://YOUR-DOMAIN/',
  'https://YOUR-DOMAIN/images/hero.webp',
  'https://YOUR-DOMAIN/fonts/your-lcp-font.woff2',
];
async function warm(url) {
  try {
    const res = await fetch(url, { headers:{ 'User-Agent':UA }, cf:{ cacheEverything:true } });
    await res.arrayBuffer();
    return { url, status: res.status, cache: res.headers.get('cf-cache-status') };
  } catch (e) { return { url, error: String(e?.message || e) }; }
}
export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(Promise.all(TARGETS.map(warm))); },
  async fetch() {   // GET the worker URL to run on demand and see cf-cache-status
    return new Response(JSON.stringify(await Promise.all(TARGETS.map(warm)), null, 2),
      { headers:{ 'content-type':'application/json' } });
  },
};
```
```toml
# wrangler.toml
name = "cache-warmer"
main = "src/warmer.js"
compatibility_date = "2026-07-01"
[triggers]
crons = ["*/5 * * * *"]
[observability]
enabled = true
```
```bash
cd warmer && npx wrangler login && npx wrangler deploy
```
Smoke-test: open the printed `*.workers.dev` URL, refresh once → most assets flip to `HIT`.

---

## Appendix B — measured results (worked example)

| Fix | Before → After | Metric moved |
|---|---|---|
| Inline core CSS + defer all JS | render-blocking eliminated | LCP 7.0s → 1.8s |
| Preload self-hosted LCP font | — | LCP render-delay |
| **Metric-matched fallback fonts** | **CLS 0.107 → 0** | CLS |
| Drop the font's `opsz` axis + unused weights | 141.8 → 90.8 KB | payload |
| Right-size hero | 37 → 28.5 KB | LCP bytes |
| Compress overlaid CTA background | 54.7 → 29.4 KB | payload |
| Right-size logo | 75 → 2.5 KB | payload |
| **HTML edge-cache (zone Cache Rule)** | DYNAMIC → HIT | TTFB / FCP |
| **Totals** | **647 → 362 KB, 44 → 30 requests** | −44% |
| Argo / Cache Reserve on a static Pages site | — | **skipped (wrong lever)** |

**Final state:** Page Gym **97** (Fast 4G, no blocking) · GTmetrix **A / 95%** · CrUX
**Passed** · RUM **LCP P75 608ms, CLS & INP 100% good** · PSI 61 on Slow 4G (simulation
floor + accepted tag load).

*Two regressions we caused and caught by measuring: a 640w hero that triggered a 1019w
download, and `size-adjust` values derived from the wrong metric that made CLS worse.
**Measure after every change — reasoning about it is not enough.***
