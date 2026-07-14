# SOP — Social proof sourcing for skill pages (factory-general)

> **Purpose.** When a skill page needs modality-appropriate social proof (page testimonial + per-therapist detail-panel review), source, evaluate, and place it so the review matches the page's audience + modality. Per-client-repeatable.
>
> **Two social proof layers** on every skill page, both requiring this SOP:
> 1. **Page testimonial section** — the testimonial card shown in the "why work with us" or dedicated testimonials section
> 2. **Therapist detail-panel review** — the Google review shown in each therapist's detail card in the picker
>
> **Both must match audience + modality of the current skill page.** A male reviewer on a prenatal page creates cognitive friction even if the review content is accurate. A sports-recovery review on a lymphatic-drainage page is a modality mismatch.

---

## When to invoke this SOP

- **Phase 3.2 (visual + social proof alignment):** every skill page's testimonials + therapist detail-panel reviews need this audit
- **Phase 5 rollout:** each new skill page build sources appropriate social proof from scratch
- **Ad-hoc replacement:** any time a review is flagged as mismatched during user review (Phase 3.3)

---

## Prerequisites

- **Modality context:** what skill page is this social proof for?
- **Audience context:** who's the primary visitor to this page? Reviews must match this profile
- **Client's designated review sources:** where does THIS client's real reviews live? (see Sources below)
- **Skill roster:** which therapists appear on the current skill page (from `public/js/therapist-picker.js` `skills.<skillId>` blocks) — each of those therapists needs a per-skill review override

---

## Client review sources (varies per client — pull from client-config)

Each client has different review destinations. The factory config for each client should record their review sources so this SOP can pull automatically. Common sources:

- **Google Business Profile** (formerly Google My Business) — most common, most reviews live here
- **Sunlife Lumino / provider directories** — Canadian healthcare/wellness practitioners (per-therapist listings)
- **Yelp** — some clients have Yelp presence, some don't
- **Client's own website** — sometimes clients maintain a "reviews" or "testimonials" page
- **Facebook page** — client's business Facebook page may have reviews

**How to gather sources per client (hybrid, factory-standard — refined 2026-07-14):**

1. **Ask the client at intake — make it a standard intake question.** "Where do you believe your reviews live?" The client hands over every page/platform they know of. They are the fastest, most accurate starting point, and they'll name things you'd never find.
2. **Then WE check + filter the platforms on our radar** — never rely on the client's list alone; they routinely forget or don't know where they've been reviewed. Cross-check the known platforms for that geography (below).
3. **Ask the individual THERAPISTS to gather their own.** Clinic-level reviews are usually about the owner or the longest-tenured practitioners. The specific therapists on a skill page often have **zero** reviews at clinic level, and may hold reviews from a **previous clinic** or from clients who never posted publicly. Make this an explicit per-therapist ask — it is frequently the only way to get therapist-level social proof. *(Confirmed on MH: 0 reviews for Brookelyn, Lindsey, or Tif across 40 clinic reviews.)*
4. **Seed future reviews — coach the client to route people to the platforms.** Clients often know people who'd happily write a review right now, but who'd send it as a text or an email. **Always guide those to a real review platform instead.** Why it's worth the extra friction:
   - It's **captured permanently** and works for the client forever, not once.
   - It lifts the client's own **profile conversion** (people who find them on Google/Lumino see a fuller, better-rated profile).
   - Platform reviews usually carry the **reviewer's photo and name**, which converts markedly better than an unattributed quote when we place it on a skill page.

### Platform landscape varies by geography (Google is the constant)

- **Canada:** Google Business Profile + **Sun Life Lumino** (provider directories for health practitioners).
- **USA:** Google Business Profile + the platforms that dominate in that region — e.g. **Healthgrades** is often more prevalent in parts of the US than a Lumino-equivalent. Yelp carries more weight in the US than in Canada.
- **Both:** **Google is always the common thread** and is always the primary source. Start there, then add the regional platforms.

Maintain the per-geography platform list in client-config so the check is repeatable rather than improvised per client.

### Maximum Health sources (as of 2026-07-03)

- **Main Google Business Profile for the clinic:** https://share.google/WWwCOfpx8zqBAqPpe (primary source; most clinic-level reviews live here — many for owner Tracy)
- **Charlotte Tooth on Sunlife Lumino:** https://providersearch.sunlife.ca/en/health-care-provider-profile/massage-therapist/centre-for-chiropractic-care/charlotte-tooth-1034232-183769/
- **Brookelyn Brolly on Sunlife Lumino:** https://providersearch.sunlife.ca/en/health-care-provider-profile/massage-therapist/maximum-health-wellness-centre/brookelyn-brolly-584171-290637/
- **Lindsey Stauffer on Sunlife Lumino:** https://providersearch.sunlife.ca/en/health-care-provider-profile/massage-therapist/maximum-health-wellness-centre/lindsey-stauffer-921326-290637/
- **Meagan Bahnman:** no additional sources beyond the clinic's Google Business Profile as of 2026-07-03. Any reviews mentioning her by name in the GBP are her only current source.
- **Tif Henderson:** no additional sources yet; **she's currently gathering reviews manually from her other clinic** for submission to Maximum Health. Once available, add her review URLs / paste-ins to this SOP. (Tif is also currently `active: false` in the picker, so her per-skill review work can wait until she's active.)

**Sun Life Lumino — VERIFIED EMPTY for MH (2026-07-14).** Lumino *can* carry patient reviews, but **Charlotte, Brookelyn, Meagan and Lindsey each have NONE.** Charlotte's single review came directly from her / Google, not Lumino. So for Maximum Health the **Google Business Profile is the effective single source**, and the thin-reviews scenario below is the operative pattern. Re-check Lumino per therapist on future clients; don't assume it's populated.

**Factory config expectation (Phase 7):** each client's `client-config` should include a `review_sources` array — key-value pairs of `{platform: url}` for the clinic + `{therapist_id: [urls]}` for per-therapist profiles.

---

## Thin-reviews fallback: generic reviews (factory-standard pattern)

**When modality-specific reviews aren't available in sufficient quantity** — e.g. Maximum Health has very few reviews and most are for the owner Tracy, not modality-specific — use **generic reviews** to fill the social proof surface. A page needs believable social proof; a thin/empty testimonial section is worse than a well-chosen generic one.

### Rules for using generic reviews on a skill page

1. **Target: 3-5 reviews per skill page.** Below this, the page feels under-supported. Above this, diminishing returns.
2. **Generic reviews should NOT call out any specific modality or skill by name.** A review that says "amazing massage, felt better afterwards" works on any skill page. A review that says "this deep-tissue session cracked my back into place" only works on deep tissue.
3. **Demographic match still applies.** Even for generic reviews, the reviewer's demographic must match the primary audience of the skill page. **A male reviewer on a prenatal page does not work**, even if the review is completely generic. Cognitive friction override.
4. **Voice quality still applies.** Same principles as modality-specific reviews — specific over generic-sounding, warm over clinical, human over marketing-speak.
5. **Prefer 4+ star reviews.** Star ratings on generic reviews still communicate quality.

### Mixed approach (best case)

If SOME modality-specific reviews exist + generic reviews fill the gap → mix them. Modality-specific reviews at the top of the section (strongest social proof), generic reviews below as supporting evidence. Reader gets the specificity + the volume.

### ⚠️ HARD LIMIT on the fallback — never attribute a review to a therapist it isn't about

**The generic-review fallback applies to the PAGE TESTIMONIAL section only. It does NOT apply to per-therapist detail-panel review cards.**

The detail-panel card renders **inside a named therapist's panel, with 5 stars and a Google badge**. A visitor reasonably reads that as *"this therapist was reviewed 5 stars."* Placing a generic clinic review there — one that never mentions that therapist — **implies a personal endorsement that does not exist.** On a health page, where someone is choosing who will physically treat them (and, on prenatal, treat them while pregnant), that is a misrepresentation. **Do not do it, and do not let a thin review pool pressure you into it.**

When a therapist has no real review of their own, choose one of:
- **(a) Show no review card** — the existing `buildReviewCard()` stub guard already does this silently. Honest; leaves a social-proof hole.
- **(b) Re-label the card as a CLINIC review** (e.g. an explicit "Review of <Clinic>" label instead of the therapist's implied attribution). Honest *and* fills the surface. Preferred interim.
- **(c) Get a real review** — ask that therapist to gather their own (see intake step 3). This is the only real fix.

**Rule of thumb:** social proof only works because the reader believes it. Anything that would embarrass the client if a reader worked out what we'd done is not social proof — it's a liability.

---

## Cross-placement de-duplication (factory-standard pattern)

**When reviews are pooled** (few available reviews being reused across multiple placements), track WHICH review went WHERE to prevent within-page collisions.

### Why this matters

If Charlotte's detail-panel review and Brookelyn's detail-panel review on the same skill page use IDENTICAL review text (because they were both drawn from the same generic pool), the reader immediately notices: "wait, those are the same words." That kills the social proof effect harder than having no review at all.

### Recommended tracking

Maintain a simple lookup table (JSON or CSV in a factory-general location):

```
review_id | source | text_snippet | used_at_placement                            | audience_demo
r-001     | GBP    | "Best massage in Calgary..." | prenatal-page-testimonial      | female
r-002     | GBP    | "Fixed my back pain..."      | deep-tissue-brookelyn-detail   | male
r-003     | LUMINO | "Tracy is amazing..."        | therapeutic-page-testimonial   | any
```

Then Step 4 of the process checks the lookup before placing a review — if the target review is already used ON THE SAME PAGE, pick a different one.

**Cross-page duplication is fine.** A review from Tracy can appear as the page testimonial on prenatal AND as Charlotte's detail-panel review on lymphatic — those are two different placements the visitor won't see side by side.

**Within-page duplication is the failure mode.** Same review appearing twice on ONE skill page = detection risk.

---

## Process (five steps)

### Step 0 — Reality check: reviews are a HUMAN-supplied input (learned 2026-07-14)

**Claude cannot pull reviews from the platforms that actually hold them.** Verified on Maximum Health:
- **Google Business Profile** — Google blocks automated fetching of the profile/Maps reviews. A share link just bounces to a search error.
- **Yelp** — 403 (bot-blocked).
- **Sun Life Lumino provider profiles** — 403 (bot-blocked). *Still unverified whether they carry public patient reviews at all vs. insurance-directory credentialing only.*
- **Medimap / Fresha / WellnessLiving** — listings exist but carry **zero** reviews.
- **Review aggregators (e.g. Birdeye) are the one usable back door** — they mirror Google reviews and are fetchable, but typically expose **only the first handful** (5 of 50 for MH).

**So, same shape as image sourcing: the human supplies the raw material, Claude does the selection work on it.** The human (who is logged into the client's GBP dashboard) supplies the review set — reviewer name, star rating, full text. Claude then filters by audience/demographic/modality, de-dupes across placements, and drafts the placements for approval.

**Capture method — screenshots are the default (simplest, chosen 2026-07-14).** The human scrolls the client's reviews and screenshots them; Claude reads the images directly and transcribes. No export tooling, no API, no copy-paste drudgery. Other formats (paste, CSV export) work too, but screenshots are the lowest-friction path and should be the standard ask at onboarding.

> **Tall screenshots are fine — send them as-is.** A full-page review capture can be enormous (MH's was 815 x 18,540px). Viewed whole it gets downscaled ~12x and becomes illegible, but that is **Claude's problem to solve, not the human's**: slice the image into overlapping strips (~1500px tall, ~200px overlap so no review is cut in half at a boundary) and transcribe each strip, de-duplicating across the overlaps. Delegate the transcription to a subagent to keep the main context clear. The human should never be asked to take dozens of small screenshots.

> **Where screenshots go — never in `public/`.** Review screenshots contain **real customers' names**. They are raw client material, not site assets: drop them in the **gitignored `client-assets/reviews/`** folder (never committed, never deployed). Only the *selected review text* ever reaches the picker/page. Same rule as image source originals: raw material stays out of the repo and off the CDN.

**Sun Life Lumino DOES sometimes carry patient reviews** (confirmed by Victor, 2026-07-14) — so it's worth checking per therapist, but it's inconsistent and bot-blocked to Claude, so the human must capture those too. Treat it as a bonus source on top of the Google Business Profile, not a reliable one.

**Factory implication:** `review_sources` in client-config is not enough on its own — onboarding must also capture the **actual reviews** (screenshots by default), because the platforms won't give them to an automated agent. Budget for a human capture step on every client.

### Step 1 — Worker pulls candidate reviews from client sources

Worker searches the client's designated review sources for reviews that match:
- **The modality being reviewed** — search for keywords in review text: "prenatal," "pregnancy," "lymphatic," "deep tissue," "sports," etc.
- **The therapist named** (for therapist detail-panel reviews) — search reviews mentioning the specific therapist by name
- **The audience type** — implicit in the review (a review from a pregnant woman naturally reads as one)

**Sources to check:**
1. Google Business Profile (via URL if the client provides it)
2. Any other client-designated review sources

For Maximum Health, the client's Google Business Profile URL should be in memory or a client-config note (need to confirm — flag if not).

### Step 2 — Worker surfaces 3-5 candidate reviews per placement

For each placement (page testimonial + per-therapist detail-panel review), surface 3-5 candidates:

```
Placement: Prenatal page testimonial section
Candidate 1: "[review text]"
  Reviewer: [name, or first name + last initial]
  Source: Google Business Profile
  Fit: Pregnant client, mentions prenatal-specific benefit (edema relief) — modality + audience match
  Star rating: 5/5

Candidate 2: ...
```

### Step 3 — User picks + confirms

User selects one per placement. Same logic as image sourcing — the user drives the taste + fit call.

If no candidate feels right → user gives feedback ("more specific to modality" / "sounds too generic" / "want one that mentions the therapist by name") and worker returns to Step 1 with refined criteria.

### Step 4 — Worker places the review into the appropriate location

**For the page testimonial section:**
- Edit the skill page's HTML directly — the testimonial card is inline HTML
- Include: review text, reviewer name (first name + last initial usually), star rating, source (if the design shows it)

**For therapist detail-panel reviews:**
- **Implementation prerequisite: ALREADY DONE (verified 2026-07-14).** `getProfile(t, skill)` in `public/js/therapist-picker.js` already merges `review: ovr.review || base.review`, exactly like `bio` / `tags` / `specialty`. **No code change is needed** — just add a `review` block inside the therapist's `skills.<skillId>` map and it overrides the base one. (The SOP previously listed this as a hard blocker; it isn't.)
- **Stub guard (existing, keep it):** `buildReviewCard()` skips the whole review card when the text is missing or starts with `[STUB` — so a placeholder never renders to a visitor. The failure mode isn't an ugly stub on the page; it's a therapist showing **no social proof at all**. Treat a stub as a silent hole to fill, not a harmless default.

### Step 5 — Worker verifies the placed review renders correctly

- Load the page, walk through the picker to the therapist detail panel
- Confirm the correct per-skill review shows (not the top-level default)
- Check formatting, character truncation, alignment

---

## Content principles for evaluating candidates

- **Audience match trumps content quality.** A 4-star review from someone matching the audience beats a 5-star review from someone who doesn't. Cognitive friction from a mismatched reviewer overrides the star rating boost.
- **Modality specificity is a plus.** Reviews that mention the specific modality by name signal to the reader "this person got what I want."
- **Avoid overly clinical language** in testimonials — same voice principle as page copy. Warm, human, specific.
- **First-name + last-initial (or first-name only) is standard.** Full last names aren't necessary and may be uncomfortable for the client (or the reviewer).
- **5-star reviews are the default,** but genuine 4-star with a specific insight can outperform a generic 5-star. Judgment call.

---

## Failure modes to avoid

- **Male reviewer on a prenatal page** (the specific failure mode this SOP prevents)
- **Generic "great massage!" reviews** with no modality-specific content — no signal to the reader
- **Reviews mentioning a therapist not on the current page** — cognitive dissonance
- **Reusing the same testimonial across all skill pages** — a "carried over from general" testimonial fails the modality-match test on every specific-skill page
- **Skipping the implementation prerequisite for therapist detail-panel per-skill reviews** — until the `skills.<skillId>.review` override pattern is implemented in `public/js/therapist-picker.js`, per-skill reviews on the picker's detail cards CAN'T ship. The implementation is a small code change but is a hard prerequisite.

---

## Resolved open items (as of 2026-07-03)

- ✅ **Maximum Health review sources** — provided by Victor: Google Business Profile (clinic-wide) + Sunlife Lumino per-therapist for Charlotte, Brookelyn, Lindsey. Meagan and Tif still pending.
- ✅ **Thin reviews scenario** — MH's reviews are thin and mostly for the owner. Answer: use generic reviews as fallback (see "Thin-reviews fallback" section above). Modality specificity is preferred but not required.
- ✅ **De-duplication tracking** — needed for within-page collisions (same review appearing twice on one skill page). See "Cross-placement de-duplication" section.

## Remaining open items

- **Meagan Bahnman + Tif Henderson review source URLs** — need Victor to provide, OR worker searches for them during Phase 3.2 execution and reports back what was found.
- ~~Verify Sunlife Lumino actually carries public reviews~~ — ✅ **RESOLVED 2026-07-14 (Victor): Lumino DOES sometimes carry patient reviews**, but inconsistently, and it is bot-blocked to Claude (403). Treat it as a bonus per-therapist source the human captures, not a reliable one. Google Business Profile remains the primary source, and the thin-reviews fallback remains the primary pattern for MH.
- **De-duplication tracking file location** — where does the `review_id → placement` lookup live? Options: a new file `public/config/review-lookup.json` (per-client), OR `docs/agent-contracts/social-proof-lookup.md` (as a running artifact). Worker to decide during Phase 3.2 execution based on which pattern the codebase gravitates toward.
