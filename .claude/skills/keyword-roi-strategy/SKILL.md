---
name: keyword-roi-strategy
description: Decide which Google Ads keywords / ad groups to fund and how to split a fixed budget, judged by ROI (bookings & lifetime value) rather than search volume or cheap clicks. Encodes the lens (fill chairs not clicks, relevance as a cost lever, the two axes of ROI-efficiency vs spend-capacity), the ROI-cascade budget allocation, relevance traps to exclude, the keyword workbook + its ROI model, and the deliverables (toggle Active + Notes, cascade split, team strategy doc, media-buyer Slack note). Invoke when the user says anything like "which keywords/ad groups should we fund", "where should the ad budget go", "is this ad group worth it", "rank these by ROI", "should we run a [modality] ad group", "concentrate the budget", or shares keyword-volume/CPC data and asks what to prioritize.
---

# Keyword & budget choices judged by ROI

## When to use

The user is deciding **where Google Ads dollars should go** on a constrained budget — which keywords to turn on, which ad groups to fund, build, bench, or kill, and how to split the monthly spend. The defining trait: the answer must be driven by **return on investment (bookings × lifetime value, net of cost)**, not by search volume, raw click count, or low CPC. Use it whenever the user shares keyword data and asks "what's the lowest-hanging fruit / best ROI / what deserves the budget", or pressure-tests a specific ad group ("why not X?", "should we concentrate?").

This is the client's reusable thinking framework. The concrete workbook lives in the Google Drive Keywords folder — see `project_keyword_workbook_system` and `project_google_ads_keyword_strategy` memories for the current state and decisions.

## The lens (apply these before any numbers)

1. **The goal is filling providers' chairs with high-quality, repeat clients — not buying the most clicks.** A single provider needs only ~10–15 incremental bookings/mo to fill schedule gaps. So *low search volume is not disqualifying* if a term's volume exceeds the open slots it needs to fill.
2. **ROI per dollar = (booking conversion × client lifetime value) ÷ CPC.** Cheap clicks that don't book — or book once and never rebook — are worthless. **Cheap CPC is NOT ROI.** (This is how accounts end up stuffed with low-value "near me" traffic.)
3. **Weigh TWO independent axes, never just one:**
   - **ROI efficiency** — *should* we fund it? (intent × conversion × LTV ÷ CPC)
   - **Spend capacity / volume ceiling** — *how many dollars can it absorb* before demand runs out? This is set by search volume and is **independent of the total budget**. A group can have great ROI but only soak $50/mo; great ROI + tiny ceiling = own it cheaply, don't expect it to scale.
4. **Relevance is a COST lever, not just a conversion lever.** A tightly-themed ad group → matched ad → dedicated landing page (ideally fronted by a named specialist) earns a high Quality Score, which **lowers CPC and raises ad rank**. So a few precise pages beat 15–20 thin long-tail pages, and building a dedicated page is a *cost* decision as much as a conversion one.
5. **Capacity is an ROI filter.** Driving demand a provider can't serve = wasted spend + bad client experience. But few providers ≠ a penalty when the goal is filling *that* provider's chair — it's routing clarity. Park anything with a single provider AND spa-leaning low-rebook intent (e.g. Thai); fund single-provider niches with high rebook value.

## Inputs to gather

- **Search volume + competition + top-of-page CPC range** per keyword (Google Keyword Planner export).
- **Geo segmentation** if available (what % of each bucket's searches are in-market vs other cities) — confirms relevance.
- **Provider/service coverage**: who actually delivers each modality, and their signature specialty. (For Maximum Massage: `public/js/therapist-picker.js` + roster memories.)
- **Which providers have schedule gaps right now** — spend should chase empty chairs. Ask the user; this picks the priorities.
- **The pricing funnel**: intro price, return/rebook rate, repeat price. (Maximum Massage model: $49 first session → ~50% return at $124 — always CONFIRM with the user before trusting revenue numbers.)

## Method

### 1. Score each keyword/bucket on ROI, not volume
Weight **UP**: geographic terms (`<service> <city>`, `<city> <quadrant>`, e.g. "massage calgary nw") and `near me` terms (high local + commercial intent), provider-seeking terms ("rmt near me", "<modality> therapist"), and clinically specific high-intent terms. Weight **DOWN**: bare volume and cheap CPC on their own; generic/ambiguous head terms.

### 2. Strip the relevance traps (do this first — it changes the ranking)
- **Foreign terminology** that inflates volume but is out-of-market. *Canonical example: "lmt near me" was the single biggest term in the dataset (~49,500/mo) but "LMT" is US terminology — Canadians search "RMT". Excluding it was the single most important call.* Always sanity-check the biggest term.
- **Product / device** terms ("massager", "chair", "foot massager", "oil", "gun") — shoppers, not bookers.
- **Informational / DIY** ("what is", "benefits of", "how to", "diy").
- **Price-shoppers** ("cheap", "free", "groupon", "...prices") — low value, low retention.
- **Brand-safety / adult / parlour** (critical for massage): "asian massage", "parlour", "nuru", "tantric", "b2b", "happy ending", "body rub", etc.

### 3. Estimate each bucket's spend ceiling
`clicks_ceiling ≈ active_search_volume × impression_share × CTR` (rough capture ≈ 4–6% of searches); `spend_ceiling ≈ clicks_ceiling × eff_CPC`. This reveals which groups *can't* absorb budget (e.g. a 600-search bucket caps at ~$35–80/mo regardless of how much you give it).

### 4. Allocate via the ROI cascade
Rank groups by ROI efficiency. **Fund each to its volume ceiling, in ROI order, until the budget is gone.** Because the sharpest-ROI niches usually have *small* ceilings, you can fully own them cheaply first, then pour the remainder into the one or two groups that *scale* (broad-coverage anchor + cheapest high-volume niche). Example shape for $1,200/mo:
- Max the cheap high-ROI niches (e.g. Prenatal $250, Deep Tissue $170).
- Let the scalable groups soak the rest (Lymphatic ~$450, Therapeutic/Core ~$330).
- Everything low-ROI and/or low-capacity → $0 (parked).

**Map the cascade to campaign-level budgets** (Google sets budgets per *campaign*, not per ad group). Put the broad anchor in its own campaign and the niches together in a shared-budget specialty campaign (Maximize Conversions). The split is NOT 50/50 — because the sharpest-ROI groups are the niches, the cascade pushes the majority to the specialty campaign (≈70% specialty / ≈30% anchor for the example above); the anchor only soaks the remainder. Inside the specialty campaign, do not hard-split per ad group — the per-group $ are *expected* distribution, not caps; let the algorithm reallocate. Isolating each niche in its own campaign fragments the budget below the level where bidding can learn. Offer an anchor-heavy alternative (~40/60) only if the client values whole-team coverage over pure ROI.

### 5. Don't confuse the dilution lever
**Keyword count is NOT how budget gets diluted** — Google spends the full budget on whatever query matches, whether a group has 5 or 15 keywords. Cutting to "5 keywords" saves nothing and just loses coverage of high-intent variants. The real dilution lever is **ad GROUPS**: each needs enough volume/budget to fill a chair and let bidding learn. So keep ~10–17 tight, relevant keywords per funded group; **concentrate by running FEWER groups, not fewer keywords.**

### 6. Structural settings that protect ROI
- **Bid strategy — ramp, don't start smart:** a brand-new campaign has no conversion history, so Smart Bidding (Target CPA / Maximize Conversions) is starved. **Launch on Maximize Clicks** (with a max-CPC cap from the top-of-page bid ranges) to build traffic + conversion data fast, then **switch to Target CPA / Maximize Conversions once the campaign has ~30 conversions in a rolling 30-day window.** Conversion tracking (call_click + form fills) must be live from day one or there is no data to graduate on.
- **Match types:** phrase + exact only on a small budget (no broad — it wanders into expensive generic).
- **Negatives:** maintain a categorized list (adult/parlour, products, deal-seekers, DIY/info, employment, pets, far cities). Keep in-catchment suburbs OUT of the geo-negatives. Prune search-term reports weekly.
- **Geo:** bid up around the clinic's neighbourhoods + include the `<city> <quadrant>` keyword; don't try to keyword every neighbourhood.
- **Separate campaign budgets** so a generic/anchor group can't cannibalize the niches; cross-negate niche terms out of the anchor and vice versa.

## The workbook & its ROI model

The decision surface is `@ Maximum Massage Keyword Buckets.xlsx` (Drive Keywords folder): one tab per ad group + a hand-maintained **Negative Keywords** tab; columns `Status · Keyword · Avg Monthly Searches · Competition · Bid Low · Bid High · Avg CPC (formula) · Notes`. The **Summary tab is a live ROI model**: levers (CTR, booking rate, no-show, 2nd-session return) + a pricing funnel, auto-computing Clicks → Budget → Bookings → Revenue → Net Profit → **ROI %** per group from whichever keywords are **Active**. Its "Est. Budget/mo" column is *uncapped potential*; the real cap lives in the ROI-cascade block beneath the model.

**Edit rules (critical):** by hand, only toggle **Status** (Active/Inactive) and edit **Notes** — keyword data is rebuilt via Claude Code only; the Negative Keywords tab is fully hand-maintained. **Always re-read the column headers before writing** — the layout shifts (a concurrent session once inserted an "Avg CPC" column, pushing Notes from G to H, and a stale write clobbered an edit). It's a **binary .xlsx on a shared Drive = last-writer-wins**: coordinate one-writer-at-a-time, take a timestamped local backup in `C:\tmp\kw_backups\` before each write, and verify after. See `project_keyword_workbook_system`.

## Deliverables to produce

1. **Toggle the funded groups' best ROI terms to Active (10–20 each) with a per-term Notes rationale** (relevance/intent/CPC reason — never just "high volume"). Park the rest Inactive with a one-line note saying why (BENCH = ready to rotate in; PARKED = low ROI/capacity).
2. **The ROI-cascade budget split** ($/mo per group, with the cascade logic), recorded next to the model and/or in the strategy doc.
3. **A team strategy doc** (`@`-prefixed `.docx` in the Keywords folder so it surfaces at the top): the lens, cascade, funded vs parked + why, swaps, traps, the model's assumptions (flag pricing to confirm), guardrails, file-hygiene/concurrency note, and open items. Build with `python-docx`.
4. **A condensed Slack note for the media buyer** when asked: ~5 sentences, at most one bulleted list (the funded groups + their $).

## Operating cadence (set expectations)
Give it **4–6 weeks** before judging (Google's learning phase); shave ~10–15% for no-shows/cancellations. **Pause a group when its provider fills** (esp. cheap high-volume niches that out-run capacity), and rotate a benched group into whatever chair opens next. Re-pick priorities whenever utilization shifts.

## Anti-patterns
- Ranking by search volume or by cheapest CPC. (Both ignore conversion × LTV.)
- Funding a group that can't absorb the budget (low volume ceiling) or whose providers can't serve the demand.
- Anchoring on the biggest term without checking it's in-market (the "lmt" trap).
- Cutting keyword counts to "concentrate" — concentrate by cutting ad groups instead.
- Writing to the workbook without re-checking column positions, without a backup, or while another session is editing.
