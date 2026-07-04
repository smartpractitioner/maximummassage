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

**How to gather sources per client (hybrid approach, factory-standard):**
1. **Ask at onboarding** — client fills in a `review_sources` client-config input listing every URL where their reviews live. Fastest and most accurate for the client's own preferences.
2. **Discover/verify programmatically** — factory searches for the client's business name on common review platforms to catch anything the client forgot to mention. Optional but useful.

### Maximum Health sources (as of 2026-07-03)

- **Main Google Business Profile for the clinic:** https://share.google/WWwCOfpx8zqBAqPpe (primary source; most clinic-level reviews live here — many for owner Tracy)
- **Charlotte Tooth on Sunlife Lumino:** https://providersearch.sunlife.ca/en/health-care-provider-profile/massage-therapist/centre-for-chiropractic-care/charlotte-tooth-1034232-183769/
- **Brookelyn Brolly on Sunlife Lumino:** https://providersearch.sunlife.ca/en/health-care-provider-profile/massage-therapist/maximum-health-wellness-centre/brookelyn-brolly-584171-290637/
- **Lindsey Stauffer on Sunlife Lumino:** https://providersearch.sunlife.ca/en/health-care-provider-profile/massage-therapist/maximum-health-wellness-centre/lindsey-stauffer-921326-290637/
- **Meagan Bahnman:** no additional sources beyond the clinic's Google Business Profile as of 2026-07-03. Any reviews mentioning her by name in the GBP are her only current source.
- **Tif Henderson:** no additional sources yet; **she's currently gathering reviews manually from her other clinic** for submission to Maximum Health. Once available, add her review URLs / paste-ins to this SOP. (Tif is also currently `active: false` in the picker, so her per-skill review work can wait until she's active.)

**Caveat on Sunlife Lumino profiles:** these are primarily insurance-provider directory listings; whether they carry meaningful public patient reviews vs. just credentialing/coverage info needs verification at Phase 3.2 execution time. If they don't, Google Business Profile is the effective single source and the thin-reviews scenario below applies.

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
- **Implementation prerequisite:** `public/js/therapist-picker.js` needs the `skills.<skillId>.review` override pattern implemented (mirrors the existing per-skill `bio`, `tags`, `specialty` overrides). Update the `getProfile(t, skill)` resolver to merge the review the same way.
- Once the override pattern is in place, add the modality-specific review to the therapist's `skills.<currentSkill>.review` block in the picker config.

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
- **Verify Sunlife Lumino actually carries public reviews** (vs. just insurance-directory credentialing info). If not, Google Business Profile is the effective single source and the thin-reviews fallback is the primary pattern.
- **De-duplication tracking file location** — where does the `review_id → placement` lookup live? Options: a new file `public/config/review-lookup.json` (per-client), OR `docs/agent-contracts/social-proof-lookup.md` (as a running artifact). Worker to decide during Phase 3.2 execution based on which pattern the codebase gravitates toward.
