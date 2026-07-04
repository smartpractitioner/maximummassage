# Plan — Wire up Cal.com bookings, monthly limits, Quality-Score optimization, then iterate prenatal and roll out remaining pages

> **Handoff doc.** Portable plan from a prior planning session. Drop into a fresh Claude Code session as the starting brief.
>
> **Start order:** read this whole doc first, then **execute Phase 0 before anything else**. Phase 0 is the foundation; every later phase is better with the retrospective captured. Phase 1.0 (Cal.com payload discovery) is the next-best parallel work because it needs the user's live test-booking action — Phase 0 fills the wait time.
>
> **Source material for Phase 0:**
> - Prior planning session jsonl (verified to exist at the time of handoff, 8.7MB): `C:\Users\pidvi\.claude\projects\c--Users-pidvi-OneDrive-Desktop-maximummassage\5ea9fd9e-3de2-4a70-a547-3baeb94c905d.jsonl` — read it with the `Read` tool, in chunks if needed, to pull verbatim user quotes that drove each decision.
> - `git log --oneline --all`, then `git log -p public/prenatal-massage-calgary/index.html` for per-file rationale.
> - Memory files in `C:\Users\pidvi\.claude\projects\c--Users-pidvi-OneDrive-Desktop-maximummassage\memory\` (auto-loaded), especially `feedback_skill_page_structure_reference.md`, `feedback_topbar_book_now_dormant_call_us.md`, `feedback_paid_ads_no_seo.md`, `project_therapist_roster.md`.
> - Current state of `public/<slug>/index.html`, `public/js/therapist-picker.js`, `public/js/picker-config.js`, `public/js/apps-script-lead-capture.gs`.

---

## Context

The five skill-specific landing pages (`/prenatal-massage-calgary/`, `/deep-tissue-massage-calgary/`, `/sports-massage-calgary/`, `/tmj-massage-calgary/`, `/lymphatic-drainage-massage-calgary/`) are live and have been running as a **demand-test funnel**: ad → page → quiz → grid → detail → lead form → `/confirmation/` "sorry, no availability, hold a spot" page. Demand has been validated and the new keyword data is in hand (see the auto-memory file `project_google_ads_keyword_strategy.md`). Time to swap the demand-test endpoint for a real Cal.com booking step and finish the funnel properly.

The 80% already built (page architecture, picker filtering, per-skill bios + tags + quizzes, weighted recommendations, UTM passthrough through to the lead form, lead capture to `leads_<skill>` sheet tabs) is solid and isn't being rebuilt. This plan adds the bookings layer on top, polishes the prenatal page as the canonical template, captures the polish reasoning into the `/add-skill-page` skill so the same procedure applies cleanly to the next pages, and rolls them out in priority order driven by the keyword/ROI workbook.

**Ultimate goal beyond Maximum Health:** the same engine + workflow gets packaged and dropped onto another client (different city, different clinic, different therapists, different skills, different brand) with as little rework as possible. That means engine code stays generic; per-client stuff (therapist data, brand assets, Cal.com handles, monthly caps, voice rules, ad-group keyword themes) lives in swappable configuration. Phase 7 below addresses this explicitly (was Phase 6 pre-2026-07-03 restructure).

**Quality Score framework now in scope.** Resource files in `I:\Shared drives\...\Landing Pages\Flow B - AI Instructions and Resources\resources\`:
- `ad-group-landing-page-quality-score-briefing.md` (the "one LP per ad group" strategy with weave-not-stuff keyword theming and hero-first effort allocation)
- `intro to quality score (transcript).txt` (the 4-factor QS breakdown with the 5 LP sub-factors)
- `ad rank and actuall cpc (transcript).txt` (the math: higher QS = better position + lower CPC)
- `quality score for landing pages (transcript).txt` (8005 bytes)

Validates the one-ad-group → one-skill-page architecture we already built. Key takeaway from the QS-for-LP transcript: LP factors are only ~10% of total QS weight, the technical sub-factors (load time, spider ability, transparency, navigability) are mostly non-issues for modern stacks, and the highest-leverage piece we control is **copy + keyword theming** — which lines up exactly with the user's emphasis on hero H1 carrying the central ad-group term.

---

## Phase 0 — Session retrospective: capture *what actually happened* that built these pages

**This is not "look at the page and reverse-engineer why."** This is a chronological reconstruction of the prior planning + build sessions that produced the prenatal page (and by extension, the other four), captured so the rationale survives across sessions.

**This is the first phase to run.** Sources are listed in the header block above; the prior-session jsonl is the primary one for verbatim user quotes — read it in chunks, the file is large.

**Method:** For each section/feature of the existing skill pages, find the rationale in the sources above and document:
- **What the user said / decided** (quoted where the exact phrasing sharpens the meaning)
- **What was proposed first** (the original draft)
- **What was pushed back on or accepted** (and the reason given)
- **The final state shipped** and which commit shipped it

Sections / features that need this treatment, in roughly the order they were decided:

1. **Skill-page concept itself** — "general / catch-all" vs. skill-specific pages tuned to ad intent; the architecture brief.
2. **Hayahay as the structural benchmark** — pointing at hayahaymassage.ca and what specifically to mirror (modality-first, intent-paired H1s, dedicated benefits + what-to-expect sections). What NOT to copy (cross-linking) and why (paid ads not SEO).
3. **Per-page architecture decisions** — separate pages for sports vs. deep tissue (different intent, different ad targeting, different visitor mindset); URL slug pattern; page-config + skill-resolver mechanism.
4. **First-person mobile-text-message bios** — user's exact ask: *"a little bit more engagement by writing them from the first person as though the therapist wrote them and it's a text message almost"*.
5. **Per-therapist skill-tuned profiles** — Brookelyn on prenatal looks different from Brookelyn on deep tissue; the `skills.<skillId>` data model.
6. **Quiz progression principle** — *"first question should be pretty straightforward and easy to answer with the harder questions more towards the end because it's building up completion bias"*.
7. **Weighted recommendation logic** — 1/2/3 weight values, tie-break biasing toward Q1, "can still pick anyone" UX.
8. **The 6-benefit cap and the modality-intro section** — what Hayahay's deep-tissue page taught us; the lymphatic benefit was softened because it read too clinical.
9. **"What a session looks like" 3-step section** — when added (per Hayahay), which pages get it and why (anxiety-reducing modalities).
10. **FAQ count and topics** — 10 items per page; questions picked anxiety-driven, real visitor concerns.
11. **Voice softening / cold-language fixes** — *"pregnancy and postpartum bodies sounds cold and isolating"* → general voice rule.
12. **Em dash removal** — global sweep across all user-facing copy.
13. **Topbar Book Now / Call us swap with DORMANT comment** — demand-test phase rationale; original Call-us markup preserved as HTML comment for fast flip-back.
14. **Tally → native quiz migration** — Tally kept on Flow B "general" but native everywhere else; recommendation-engine bug where Tally sent only `/brookelyn` regardless of quiz answers.
15. **Lead-form → /confirmation/ demand-test endpoint** — why "no availability, hold a spot" rather than real bookings.
16. **No cross-linking decision** — paid-ads-not-SEO framing.
17. **Apps Script tab routing** — `leads_<skill>` and `quiz_<skill>` snake_case, backward-compat with legacy `Leads` tab.
18. **The five pages built in this order and why** — prenatal first (template), then deep tissue, sports, TMJ, lymphatic; per-page tuning choices.

**Output:** Add a new top-level section in [.claude/skills/add-skill-page/SKILL.md](.claude/skills/add-skill-page/SKILL.md) titled **"Session history — how these pages got built"**, organized as a chronological narrative cross-referenced to relevant commits and quoting the user's actual feedback. Cross-link to the memory files above so the skill MD points at the durable knowledge instead of duplicating it.

**Why this matters now:** Phase 3 is a polish loop where the user gives adjustments and we update the prenatal page. Without the session history captured, each adjustment risks being "let me reverse-engineer why we did this" — which is exactly the failure mode this phase prevents. With the history captured, every adjustment becomes "user said X, we landed on Y, they're now asking for Z because of W, here's what Y → Z costs."

**No code changes in Phase 0.** Just the SKILL.md update. Pages stay as-is.

---

## Phase 1 — New booking-flow architecture (replaces the demand-test endpoint)

Seven sub-pieces, designed so they can land in one focused implementation pass. Sub-steps 1.0 (Cal.com payload discovery) and 1.7 (GTM spec) are pre-requisites that block parts of the main wiring.

### 1.0 Cal.com `bookingSuccessfulV2` payload discovery (pre-requisite)

Before wiring `booking_confirmed`, capture the actual event payload Cal.com fires so the handler is built against real field names, not guesses. Procedure:

1. Add a temporary diagnostic listener to one existing therapist standalone page (e.g. `/brookelyn/`) — a single `Cal.ns["60min"]("on", { action: "bookingSuccessfulV2", callback: (e) => console.log("CAL_BOOKING_PAYLOAD:", JSON.stringify(e.detail, null, 2)) })` block, scoped to a dev-only deploy.
2. User opens the page in Chrome DevTools with `?gclid=test&utm_source=test_capture` on the URL, books a real time slot through Cal.com with a test email.
3. Console logs the full event.detail payload — user pastes it into chat.
4. User cancels the test booking in Cal.com so Jane doesn't get a fake appointment.
5. Diagnostic listener removed; the real handler is built from the captured shape.

Fallback if the JS listener doesn't fire: Cal.com Settings → Developer → Webhooks → `BOOKING_CREATED` → destination = a webhook.site capture URL → test booking → paste captured payload.

### 1.1 Cal.com inline step inside the picker lightbox

After a visitor clicks **Book with <therapist>** on the detail panel, instead of opening the lead form they see a new lightbox step: a Cal.com inline embed for that therapist's `<handle>/60min` (or 90min for Charlotte) calendar. Visitor picks a time → fills name/email/phone in Cal.com's own form → submits → Cal.com fires `bookingSuccessfulV2` → top-level redirect to a new dedicated `/booking-confirmed/` page.

**Key implementation points:**
- New lightbox view `data-view="calendar"` between `detail` and `lead-form`/`confirmation`. The existing `lead-form` view can be retired for the active flow (kept in the code for the Tif fallback path described in 1.4).
- Cal.com embed loaded with prefill query params for all UTMs + the `skill` + the recommended therapist id, so Jane sees them in the appointment note. Pattern: `calLink: handle + '?' + new URLSearchParams({...collectUtms(), skill, recommended_therapist_id})` (UTMs already collected in `collectUtms()` in `public/js/therapist-picker.js`).
- `Cal.ns["60min"]("on", { action: "bookingSuccessfulV2", callback: ... })` listener captures the booking → POSTs a new `action: 'booking_confirmed'` payload to the backend with skill, therapist, UTMs, lead contact details, Cal.com booking id, scheduled time → then `window.location.href = '/booking-confirmed/?...'` with relevant context as query params for the new page to render (skill, therapist name, booking date/time, first name for personalization).
- **New page: `public/booking-confirmed/index.html`** — dedicated post-booking confirmation page (not a lightbox state). Replaces the demand-test `/confirmation/` "no availability, hold a spot" endpoint for the active booking flow. Uses the same shared design system. Reads context from query params + sessionStorage `mh_lead` to personalize.
  - **Content (per user spec):** three blocks, in order — (1) **Confirmation + appointment details** (big "You're booked" message personalized with first name, therapist name, date/time, clinic address, add-to-calendar button); (2) **Prep instructions** (what to wear, what to bring, parking, where to enter, arrive-5-min-early note — reduces no-shows + first-visit anxiety); (3) **What happens next** (email confirmation reminder, 24h text reminder, cancellation/reschedule link via Cal.com, phone line for direct contact).
  - **NO** soft cross-sell or referral block on this page (user explicitly excluded).
  - **No redundant tracking on this page.** GTM `booking_confirmed` already fires from the Cal.com listener upstream of the redirect — this page is purely user-facing UI. Don't double-fire conversion.
  - **Access:** redirect-only. If someone hits the URL with no query params + no `mh_lead` in sessionStorage, render a graceful generic fallback ("Thanks for booking — check your email for confirmation details. Contact us at (403) 283-0725 if you need anything.") without any personalized fields. No PII leakage on cold hits.
- Cal.com handles per therapist (from memory `project_therapist_roster.md` + Tif's rough-in decision):
  - Brookelyn → `bbrolly/60min`
  - Meagan → `meaganb/60min`
  - Charlotte → `ctooth/90min`
  - Lindsey → `lstauffer/60min`
  - Tif → placeholder `thenderson/60min` with `active: false` flag (see 1.4)

### 1.2 Monthly per-therapist booking limit + grayed-out cards

Per the user's spec, caps applied **globally across all skill pages** (not per-skill), reset on the 1st of each calendar month, never influence quiz recommendation logic:

| Therapist | Monthly cap |
|---|---|
| Meagan | 10 |
| Brookelyn | 15 |
| Charlotte | unlimited |
| Lindsey | unlimited |
| Tif | 15 (roughed in, inactive) |

**Mechanism:** A new `bookings_count` tab in the Google Sheet tracks `{ therapist_id, year_month, count }`. Apps Script increments on each `booking_confirmed` action; if `count >= cap`, the row is flagged. New Apps Script `GET` endpoint `?action=available_therapists` returns a JSON blob `{ therapistId: { available: bool, reason?: 'fully_booked' | 'inactive' } }`.

On lightbox open, picker fetches this from Apps Script once and:
- Grays out any therapist marked `available: false` on the grid (`picker-card--disabled` class, "Fully booked this month" or "Coming soon" label).
- Quiz **still scores** the full roster and recommends the highest-scoring therapist regardless of availability. If the recommended therapist is unavailable, the picker silently picks the next-highest-scoring available therapist for the "We recommend" badge — the original recommendation is logged to `quiz_<skill>` for analysis but not shown to the visitor.

This keeps the recommendation engine clean and means a hot recommendation that's full just gracefully degrades to second-best.

### 1.3 Pixel + GA conversion firing on booking_confirmed

Currently Google Ads conversion (`AW-17632628958`) and GA4 conversion events would fire on the lead-form submit step. With the booking flow, the meaningful conversion is the Cal.com `bookingSuccessfulV2` event. Update the GTM trigger so the conversion fires there instead, with a custom event `booking_confirmed` carrying the skill, therapist, UTMs, and Cal.com booking id.

### 1.4 Tif rough-in with `active` flag

Tif appears in `skills.<skillId>` blocks on prenatal/deep-tissue/TMJ/lymphatic pages (already there), and her grid card renders normally, but a top-level `active: false` flag on her therapist object makes the picker route her Book button to the existing `/confirmation/` "hold a spot for me" page instead of the new Cal.com inline step. Flipping `active: true` is a one-character change that turns on her real booking flow once her Cal.com is provisioned.

### 1.5 Apps Script + Sheet updates

New action `booking_confirmed` written to a new `bookings_<skill>` tab (mirrors the `leads_<skill>` / `quiz_<skill>` pattern). Plus the `bookings_count` tab from 1.2 and the new `GET ?action=available_therapists` handler. Keep all existing actions (`lead`, `notify`, `update_contact`, `quiz_submission`) unchanged — the lead form is still the fallback for inactive therapists.

Apps Script redeploy required at the end of Phase 1 (paste new `.gs` → Save → Deploy → Manage Deployments → Edit → New version).

### 1.6 Backend abstraction layer (sets up the eventual Apps Script → Cloudflare Workers migration)

Introduce a tiny client-side wrapper that becomes the **only** way the front-end talks to the backend:

```js
// public/js/mh-backend.js
window.mhBackend = {
  post(action, payload) { /* fetch ENDPOINT, POST, action+payload as body */ },
  get(action, params)   { /* fetch ENDPOINT?action=…&…params, GET */ }
};
// ENDPOINT comes from a single config var (window.MH_BACKEND_URL).
```

All existing call sites (`submitLeadForm`, `postQuizSubmission`, confirmation-page `notify` / `update_contact`, plus the new Phase 1 `booking_confirmed` and `available_therapists`) route through `mhBackend`. The Apps Script Web App URL is the value of `MH_BACKEND_URL` for now.

**Why this matters:** when we migrate Apps Script → Cloudflare Workers in Phase 7 (was Phase 6 pre-2026-07-03), we point `MH_BACKEND_URL` at the Worker, and the action contracts stay identical. Zero front-end rework on migration day. This is the same pattern the picker-config layer already uses for page → skill resolution — single-config-knob portability.

### 1.7 GTM spec for the user to implement (pre-requisite for conversion firing)

Claude doesn't have a Google account to be added as a GTM user, so the GTM edits happen via a spec written by Claude + user implementation in the GTM UI. Spec structure:

1. **Data Layer Variables** to create (one per field pulled from the Cal.com payload + UTM context): `dlv_skill`, `dlv_therapist_id`, `dlv_booking_id`, `dlv_scheduled_time`, `dlv_gclid`, plus any others the Phase 1.0 payload reveals.
2. **Custom Event Trigger**: event name `booking_confirmed`, fires on All Custom Events.
3. **Existing Google Ads Conversion Tag** (`AW-17632628958`): re-target to the new `booking_confirmed` trigger. If we have a conversion value (e.g. $49 for first session), wire it via the appropriate variable.
4. **New GA4 Event Tag**: event name `booking_confirmed`, parameters = the dlv variables, trigger = the new custom event.
5. **Preview mode** sanity check — make a test booking, verify both tags fire in GTM Preview pane.
6. **Submit + Publish**.

Claude provides the exact spec doc once 1.0 lands and we know the real payload shape. User implements in ~10 minutes. Spec also goes into the SKILL.md so the same pattern applies to future clients.

---

## Phase 2 — Copy + keyword theming audit on prenatal (no technical QS work)

Apply the **copy-side** of the QS framework to the prenatal page. From the QS-for-LP transcript: landing page factors are only ~10% of total QS weight, but copy/keyword theming is the highest-leverage piece inside that 10% and it's the only one we directly control through page edits.

**Technical QS items (load time, spider ability, transparency, navigability) are NOT in this phase.** Per the QS-for-LP transcript, those are mostly non-issues for modern well-built pages, and we already meet them (single-page LP is explicitly fine; site is spiderable; transparency baseline is met via footer; load time is acceptable). Technical items get spot-checked once per page during Phase 5 rollout — not as a dedicated phase. **No Lighthouse SEO check ever** (paid-ads-only, per `feedback_paid_ads_no_seo.md`).

**Voice priority (non-negotiable):** copy reads well for a real human reader **first**, then it's optimized through the QS lens via keyword use. If a sentence sounds like SEO copy, it gets reworded back to natural voice even if it costs a keyword hit. Visitors are anxious / curious people clicking from an ad, not bots.

**The strategic principle from the briefing:** weave the ad group's keywords as a **theme**, never stuff them. The reader should feel the relevance without seeing a keyword pile. For our case (modality intent): page leads with the modality's vocabulary across H1, subhead, first paragraph, benefit titles, "what a session looks like" copy, FAQ questions. Hayahay's `[Modality] for [Benefit]` H1 pattern is exactly this. Variations of the keyword (e.g. for prenatal: "pregnancy massage," "prenatal massage," "postpartum massage," "perinatal massage") naturally rotate through different sections.

**Hero H1 delivers close semantic match to the focal ad-group keyword (updated 2026-07-03).** The H1 and subhead must unmistakably deliver what the search query promised — but "match" here means **semantic match**, not verbatim string match. Google's Quality Score doesn't reward literal H1-equals-search-term matching; landing page experience is scored on semantic relevance + usability, not string matching. What lifts conversions is message match — a visitor recognizing "this is the right place" the way you'd recognize a friend across a room. You don't need identical outfits, you recognize the face. "RMT in Calgary" and "registered massage therapist Calgary" read as the same face.

The real target: **a headline that reads naturally AND obviously delivers what they searched for.** Close semantic match preferred over awkward verbatim insertion. Example: if the focal keyword is "prenatal massage calgary," an H1 like "Prenatal Massage in Calgary — Pregnancy Relief Where You Need It" is a stronger message-match win than a wooden verbatim insertion, because it reads naturally to a human AND unmistakably matches the intent.

Variations rotate through later sections; the hero anchors to the focal intent. **Prefer close match. Reserve verbatim only when it reads naturally on its own.**

**The hero-effort principle:** ~70%+ of visitors don't scroll below the fold. Hero gets premium attention. Restate the ad's promise, present the primary CTA, make the message-match feel like a continuation of the ad — not a fresh pitch.

**Phase 2 is an editorial pass, not an audit.** If your deliverable is a checklist of keyword matches per section, the process ran wrong. If your deliverable is a warmer page that also happens to hit the focal keyword in the H1 and weave the theme naturally through body copy, the process ran right. The lens through every step below is **the visitor's eyes** — anxious, curious, looking for warmth and relief. Not the keyword checker's eyes.

**Prerequisite reading before you touch a single word:**

- `.claude/skills/add-skill-page/SKILL.md` Step 4 (Draft page copy) — in full
- `feedback_skill_page_structure_reference.md` — Hayahay benchmark, voice reference
- The QS briefing + transcripts in the resources folder — the framework being applied
- This entire Phase 2 section, especially the Voice priority + Hero H1 rules above

**Editorial steps (not a checklist — a sequenced editorial process):**

**Note on scope:** Phase 2 is an editorial pass on **already-written pages**. The copy was produced beforehand by a copywriter following the 6-step process in [`.claude/skills/add-skill-page/SKILL.md`](.claude/skills/add-skill-page/SKILL.md) Step 4. Phase 2 does NOT rewrite from scratch; it polishes and QS-tunes what's already there.

**Step A — Ground yourself in voice.** Before touching the page, complete the prerequisite reading above. You're not here to run a keyword audit; you're here to make the page read better for a real person.

**Step B — Understand the ad group's vocabulary.** Read the prenatal ad-group keyword list from the Drive workbook (`@ Maximum Massage Keyword Buckets.xlsx`, Prenatal tab — 40 keywords as of last build; see memory `project_keyword_workbook_system.md`). Identify the focal keyword (highest volume) and the natural vocabulary well — variations, related terms, phrases the modality is discussed with. **This is a vocabulary source, not a checklist to match against.**

**Step C — The H1/subhead close-semantic-match check.** Does the H1 deliver close semantic match to the focal keyword? Does the subhead echo the same focal intent? Close match, not verbatim — see the H1 rule above for the full rationale. If the current H1 clearly delivers the focal intent, move on. If it's off-target or wooden, rewrite the hero.

**Step D — Read the page aloud, section by section.** For each section (modality intro, benefits, session steps, why-us, FAQ, final CTA):
- Does it feel warm, human, addressing anxiety?
- Does the modality vocabulary feel naturally present, or absent, or FORCED?
- If natural or absent → move on or add gently
- **If FORCED → rewrite back to natural voice. Even if it costs a keyword hit.**

**Step E — Coverage flag for top-5 (flag for review, don't force-fit).** Skim once and note which theme keywords appeared naturally. **For the top-5 highest-volume keywords specifically, if any are genuinely missing or only weakly represented, flag them for manual review** — surface the gap to the user with a note like "the top-5 keyword X isn't represented anywhere on the page; possible options: [section Y could take a natural rewording, section Z could be extended, or leave as-is]." The user decides whether to intervene. **Do not force a keyword into a sentence where it sounds unnatural. Do not invent sections to fit keywords.**

**Step F — The final human-reader test (mandatory end-of-phase gate).** Read the page top-to-bottom aloud one more time. Any sentence that grates or reads like SEO copy? Rewrite. Iterate until you can read the page without cringing. This gate must be passed before Phase 2 is declared complete.

**Red flags that mean you're doing this wrong:**
- You're checking whether keyword X appears verbatim in section Y (outside the H1/subhead) — even in the H1, close semantic match is the goal, not verbatim
- You're forcing keyword insertions that break sentence flow
- Your deliverable is a keyword-coverage table rather than an edited page
- You skipped Step A (prerequisite reading) or Step F (aloud test)

**Failure mode captured 2026-07-03:** worker session ran Phase 2 as a naive literal-match audit ("does keyword X appear verbatim in section Y?") across every section, inverting the priority. This process framing is the corrective. If the current worker on Phase 2 is exhibiting these red flags, restart Phase 2 from Step A.

**Scope note (2026-07-03):** This Phase 2 process is MH-project-specific — an editorial pass on already-written MH pages. It is NOT a factory template. When we get to Phase 7 (factory buildout with multi-agent staffing), the factory copywriter agent's process will be the 6-step COPYWRITING process (SKILL.md Step 4), not this editorial pass. Whether the factory needs a separate editor agent that resembles this Phase 2 process — vs. baking quality gates into the copywriter's own self-checks — is a factory design decision to be made in Phase 7 from first principles. This Phase 2 experience becomes a REFERENCE / ARTIFACT for that later design, not the design itself.

**Update `/add-skill-page` skill MD** to encode this copy-theming framework as a required step for every page (existing and future). Include: the four-factor QS breakdown with weights (~65/25/10), the "weave not stuff" principle, the hero-effort ratio (70%+ don't scroll), the keyword-coverage-map exercise, and the "human reader test" failsafe. Cross-reference the QS briefing + intro + LP transcripts in the resources folder.

---

## Phase 3 — Visual + social proof alignment, then user iteration (expanded 2026-07-03)

Phase 2 handled copy. Phase 3 aligns the **non-copy elements** that need to match audience/intent — specifically images and social proof — then opens the door to user-driven iteration on the whole page.

Four sequential steps:

### 3.1 — Image review + alignment (invoke image-sourcing SOP)

Worker reviews the page's imagery through the audience-match lens: does each image support what the copy says and match the visitor's context? A prenatal page showing hot-stones-on-back is a hard fail; a lymphatic page showing sports recovery is a hard fail. Same principle as Phase 2 Step E — flag mismatches for user review, don't force-replace.

Process:
1. Worker skims the page's images against modality intent + audience
2. Any flagged mismatches → invoke [`docs/sop-image-sourcing.md`](sop-image-sourcing.md) to surface 3-5 candidates
3. User picks + downloads + worker runs the ffmpeg webp conversion

### 3.2 — Social proof review + alignment

Two social-proof layers on every skill page, both need modality-alignment:

**Page testimonial section** — the page currently uses a shared testimonial "carried over from general" (see SKILL.md line 118 pending item). Per skill page, the testimonial should be:
- **Modality-appropriate** — a prenatal page testimonial should be from a pregnant/postpartum client; a lymphatic page from a post-op/edema client; etc.
- **Audience-matching** — if the primary audience is women (prenatal), showing a male reviewer creates cognitive friction even if the content is accurate
- **Sourced from client's designated review sources** — Google Business Profile, Yelp, other review sites the client uses (varies per client)

Process for pulling testimonials: see [`docs/sop-social-proof-sourcing.md`](sop-social-proof-sourcing.md).

**Therapist detail-panel reviews** — currently `public/js/therapist-picker.js` has one `review` field per therapist at the top level. This means Brookelyn's Google review shows the same regardless of which skill page. Same failure mode as the shared testimonial. Fix requires:
- **Implementation change:** add a `skills.<skillId>.review` override pattern in `public/js/therapist-picker.js` mirroring the existing pattern for `bio`, `tags`, `specialty`. Update the `getProfile(t, skill)` resolver to merge the review the same way.
- **Content sourcing per (therapist × skill):** worker sources modality-appropriate review per combo from the client's review sources, following the same SOP.

### 3.3 — User review + additional feedback iteration

You review the page (all elements — copy, images, social proof, layout, brand feel) and provide adjustments. Worker implements each. Loops until you're satisfied.

Full UX review (color/brand, whitespace, mobile rendering, hero fold, element-copy tension) intentionally lives here as user-driven judgment rather than worker-driven audit. Those elements are mostly client-specific look-and-feel calls that a worker running an audit would false-positive-nitpick. Better surfaced by your review than by worker patrols.

### 3.4 — Record rationale as "Lessons learned from prenatal"

Each Phase 3 adjustment (from 3.1, 3.2, or 3.3) gets recorded into `.claude/skills/add-skill-page/SKILL.md` under a new "Lessons learned from prenatal" section, framed as **portable principles**, not client-specific content. Examples:

- ✅ **Portable principle:** "When a benefit reads as too clinical for the audience, soften the framing — anxious visitors need warmth, not clinical accuracy."
- ✅ **Portable principle:** "Testimonial gender/context should match the primary audience of the skill page — men reviewing prenatal creates cognitive friction even if the content is accurate."
- ❌ **NOT portable (client-specific content):** "Prenatal hero should use teal on off-white." (Colors are client-config, not lessons.)

The 80% factory pattern is what gets captured as lessons. The 20% client-specific content lives in client-config (Phase 7).

---

## Phase 4 — End-to-end testing

Once prenatal is solid, run a full test pass before moving to other pages.

**Per-therapist flow validation (each of the 4 active therapists — Tif skipped):**
1. Open `/prenatal-massage-calgary/?utm_source=test&utm_campaign=e2e&gclid=test123` in incognito
2. Click Book Now in topbar → lightbox opens → quiz Q1
3. Answer the quiz with weights biased to this specific therapist → confirm grid loads with their card highlighted as "We recommend"
4. Tap into their detail panel → confirm bio + specialty pill + tags are the prenatal-tuned version
5. Click Book with <them> → confirm Cal.com inline embed loads with `bbrolly/60min` (or whoever) plus UTMs in the URL
6. Pick a time in Cal.com → confirm booking goes through
7. Confirm Jane received the appointment with the UTMs + skill + recommended-therapist note attached
8. Confirm GTM fired `booking_confirmed` (check the GTM debug pane)
9. Confirm Google Ads conversion (`AW-17632628958`) registered (Google Ads → Conversions → Recent activity)
10. Confirm GA4 received the `booking_confirmed` event (Realtime → DebugView)
11. Confirm a row was written to `bookings_prenatal` tab AND `bookings_count` incremented for that therapist for current year-month
12. Cancel the test appointment in Cal.com (don't pollute Jane)

**Monthly limit + gray-out validation:**
- Manually edit `bookings_count` to put Meagan at 10 for current month → reload any page she appears on → confirm her card grays out with "Fully booked this month" label
- Set Tif's `active` flag to `true` temporarily → confirm her Book button now opens Cal.com embed → set back to `false`
- Confirm quiz recommendation logic still picks Meagan when her weights win, but the badge falls back to second-best on the grid

**Cross-flow:**
- UTM passthrough end-to-end (ad URL → page → quiz → grid → detail → Cal.com prefill → booking record in `bookings_<skill>` → Jane note)
- Pixel firing only on `booking_confirmed`, not on quiz or detail or Book-click

**Post-launch conversion verification (once real ad traffic is live):** confirm a real gclid-attributed booking records in Google Ads → Conversions (not just GA4). Manual/test bookings won't count — needs a genuine ad click. Check within 24–48h of go-live; if still 0 after real converting clicks, debug the Ads tag / Conversion Linker.

Script as much of this as possible with Playwright and surface a checklist for the parts that need a human (Jane sync, GTM DebugView, Google Ads UI).

---

## Phase 5 — Roll out remaining Maximum Health pages in keyword-priority order

Confirmed rollout order:

1. **Prenatal** — template/canonical, done as Phases 0-4
2. **Lymphatic** — existing page rebuilt via dual-track (see below)
3. **Deep tissue** — existing page rebuilt via dual-track
4. **Therapeutic** — NEW core-anchor page that REPLACES the current general `/massage-therapy-calgary-flow-b/`. Splitter routing change required at the end of this page's rollout to point `/massage-therapy-calgary/` at the new therapeutic page.

**Sports + TMJ are both benched and deferred.** Sports benched 2026-06-16 per the keyword strategy; TMJ also benched per user's most recent confirmation. They keep their current live pages running on the demand-test endpoint until un-benched. When that happens, they get the same dual-track rebuild treatment as lymphatic/deep-tissue.

### Dual-track workflow (never overwrite an existing live page in place)

For lymphatic + deep tissue (and for the eventual sports/TMJ revisit): the existing page stays at its current URL untouched while the new version is built alongside. Workflow per page:

1. **Back up** the existing page — either git tag the current commit (e.g. `lymphatic-v1-pre-rebuild`) or copy the folder to `public/<slug>-v1/` so the original markup is preserved at a known path.
2. **Clone the prenatal template state** into a temporary build path (e.g. `public/<slug>-v2/`).
3. **Apply the SKILL.md checklist** — work through the per-section retrospective + the copy/keyword theming audit + the per-skill bio/quiz tuning + the booking-flow wiring.
4. **Run the Phase 4 E2E test suite** against the v2 build at its temporary path.
5. **User reviews v2 alongside v1** — direct visual + functional A/B comparison, side-by-side. Feedback round.
6. **Polish iterations** — each adjustment recorded in the SKILL.md as a polish-loop entry with the user's specific feedback and the reasoning behind the change. (Same retrospective discipline as Phase 0.)
7. **Swap** when user signs off — move v2 into the canonical URL, redirect v1 path if anything was indexed, or just delete v1.

For therapeutic (new page): no dual-track since there's nothing to back up. Clean build from the prenatal template. But the splitter swap from current general to therapeutic IS a sensitive cutover — back up the splitter config + the Flow B page before flipping `/massage-therapy-calgary/` routing.

### Per-page technical QS spot-check (replaces the cut Phase 2 tech work)

Each page rollout includes a quick acceptance pass on the four LP technical factors. Not optimization — just confirmation they're acceptable. Per the QS-for-LP transcript these are mostly non-issues for our stack:

- **Load time:** mobile LCP < 2.5s (target acceptable, not best-in-class). Hero image preload in place, no oversized assets, no render-blocking scripts. Spot-check via PageSpeed Insights mobile run, log the LCP number, only act if it's > 2.5s.
- **Spider ability:** robots.txt allows crawl (it doesn't on go.maximummassage.ca because paid-ads-only, per memory — so this factor is intentionally fine-as-is for us; the QS spider check is about whether Google can read the page, not whether we want them to index it).
- **Transparency:** clinic name + address + phone link + privacy + terms all visible in footer. Already in place.
- **Navigability:** the lightbox-funnel is acceptable as a single-page LP per the transcript.

If any of these come back as an actual problem (LCP > 2.5s, transparency missing, etc.), fix on that page before going live. Otherwise move on. **No Lighthouse SEO check, ever.**

### Image sourcing per page

Per-page image sourcing follows [`docs/sop-image-sourcing.md`](sop-image-sourcing.md). Same SOP that Phase 3.1 invokes for image alignment on already-built pages — factory-general process, per-client-repeatable.

---

## Phase 6 — BI + Reporting design stage

> **See `docs/phase-6-bi-reporting-design.md` for the full phase content.** This section is a placeholder in the main plan doc pointing at the standalone companion file. Elevated to Phase 6 on 2026-07-03 because knowing what the reporting layer needs to output shapes what "stations" the factory needs — design BI first, then design the factory around delivering it.

**Sequencing:** Phase 5 (rollout) → **Phase 6 (BI + Reporting)** → Phase 7 (Portability + multi-agent factory staffing) → Phase 8 (polish backlog).

**Do not start Phase 6 execution before consulting Victor.** Victor has additional documentation about laying out this reporting that must be gathered before the design conversation begins. See the companion file's "Execution workflow" section.

---

## Phase 7 — Portability: package this engine to drop onto other clients (+ multi-agent factory staffing)

> **Renumbered from Phase 6 on 2026-07-03** when BI + Reporting was promoted to sit ahead of factory buildout. Also expanded to include the multi-agent factory staffing design (7.6 below).

The plumbing built in Phases 1-5 is currently entangled with Maximum Health specifics. Phase 7 separates the **engine** (reusable across any service-business + ad-group account) from the **configuration** (per-client knobs). Goal: a new client (different city, different clinic, different therapists, different skills, different brand) becomes a configuration drop + asset swap, not a code rewrite. Also introduces the **multi-agent factory staffing model** so each specialist role in the factory has its own scoped skill, knowledge base, and quality bar.

### 7.1 Identify the swap surface

Three categories of content live in the project today; only one of them should change per client.

| Category | Where it lives now | Per-client swap? |
|---|---|---|
| **Engine code** — picker mechanism, page-config resolver, getProfile, weighted quiz, mhBackend abstraction, build-skill-page workflow, design-system primitives (offer card, sticky topbar, FAQ accordion) | `public/js/therapist-picker.js`, `public/js/picker-config.js` (engine half), `public/js/mh-backend.js`, `public/css/picker.css`, the structural HTML pattern in skill page templates | **No** — reused as-is |
| **Per-client configuration** — practitioner roster + bios + photos, modality list, Cal.com handles, monthly caps, brand colors + fonts + logo, voice/tone rules, ad-group keyword themes, geographic terms | Currently scattered across `picker.js` (therapist data), `flow-b-v3.css` (brand), Maximum Health source compilation docs, the SKILL.md voice rules | **Yes** — every value is client-specific |
| **Per-page content** — hero copy, benefits, FAQ, "what a session looks like," final CTA copy | Hard-coded in each `<slug>/index.html` | **Yes** — written per page per client following the SKILL.md procedure |

### 7.2 Extract per-client configuration into a single config surface

Refactor:
- A new top-level `client-config.js` (or `.json`) per client that holds: brand colors / fonts / logo path, business name + address + phone, default offer + guarantee terms, social proof reference (Lumino / Google count), GTM container id, Google Ads conversion id, GA4 property id, Cal.com event default duration, backend endpoint URL, list of practitioners with their per-skill profiles, per-skill quiz definitions, list of skill pages with URL slugs and keyword themes.
- Engine reads only from `client-config`. No engine file references "Brookelyn" or "Tracy" or "Calgary" by name.
- Theme tokens (colors, fonts, brand teal) move from `flow-b-v3.css` into CSS custom properties driven from `client-config.css`. Engine CSS uses the tokens; client CSS sets them.
- The SKILL.md becomes a **client-agnostic** template: the voice/tone rules are stated as "first-person, mobile-text-message tone, no em dashes" — the specific source of those rules (Maximum Health user feedback) gets cross-referenced in a Maximum Health-specific addendum.

### 7.3 Migrate Apps Script → Cloudflare Workers

The backend abstraction layer (Phase 1.6) makes this a low-risk change for the front-end — only the endpoint URL changes. The actual migration:
- Port the Apps Script `.gs` to a Cloudflare Worker (`workers/backend/src/index.js` or similar). Same action contracts (`lead`, `notify`, `update_contact`, `quiz_submission`, `booking_confirmed`, `available_therapists`).
- Backend state: move `bookings_count` from a Google Sheet tab to Cloudflare KV (faster reads on every page load). The lead/quiz/booking rows can still flow into Google Sheets via a Google service account (one-time auth setup per client), OR a Workers-managed D1 SQLite database with an export job.
- Cal.com webhooks land on a Worker endpoint instead of an Apps Script Web App — more reliable, no manual redeploy ritual.
- Wrangler-deploy from CI. Per-client deployments are one Worker per client with the client-config bound at deploy time.

### 7.4 New client onboarding playbook

Document the "drop this engine onto a new client" procedure in a new `/onboard-new-client` skill MD as a numbered checklist. Roughly:

1. Clone the repo template (engine + empty client-config skeleton).
2. Fill out `client-config.js` and `client-config.css` (brand tokens, business info, GTM/GA4 ids, backend URL placeholder).
3. Populate the practitioner roster + per-skill profiles (drafted with the new client's voice — invoke `/add-skill-page` for each modality they offer).
4. Set up the new client's Cloudflare Pages project + Worker, paste in their Google Ads / GA4 / Cal.com credentials.
5. Build their first skill page using `/add-skill-page` with the new keyword data from their account's workbook.
6. Iterate via the same Phase 0-3 retrospective + Phase 2 QS audit + Phase 3 polish loop.

The new client should be live with their first skill page in days, not weeks. That's the bar.

### 7.5 Test the portability claim

Once Phase 7.1-7.4 land, **prove the engine is generic** by booting a stub second client (could be a throwaway "test clinic" with one fake practitioner and one fake skill page) and running the onboarding playbook. Any engine code that breaks when the second client's config is loaded is a leak that needs fixing before we go live with a real second client. Measure success in time-to-first-page.

### 7.6 Multi-agent factory staffing (design + build the specialist agents that run the factory)

Portability + config extraction is only half of "the factory." The other half is **staffing the factory with specialists** — Claude Code agents each scoped to one station of the pipeline, each with their own skills, memory, and quality bar. A single generalist worker session applied to every phase over-generalizes rules and misfires on domain-specific ones (proven failure mode: Phase 2 over-literal keyword matching, 2026-07-03).

**Why this belongs in Phase 7, not later:** the multi-agent architecture IS how the factory scales from one team member running the whole thing to any team member handing the factory client inputs and reproducing the outcome. Without specialist staffing, portability is just cheap infrastructure that still requires a single expert to operate correctly.

**Stations to design (initial cut — expand at planning time):**

- **Copywriter agent** — reads SKILL.md Step 4 + `feedback_skill_page_structure_reference.md` + QS briefing + memory files on voice. Identity: "human-first voice; keyword theme, not stuffing." Refuses SEO-copy output. Has WebSearch + WebFetch for competitive research.
- **Keyword strategist agent** — reads `project_keyword_workbook_system.md`, ROI model, keyword workbook. Owns "which keywords matter and how they map to sections." Outputs a keyword-theme brief that the copywriter consumes. Never touches copy directly.
- **Page builder agent** — mechanical HTML assembly from copywriter drafts + designer's tokens. Narrow scope, deterministic.
- **QA agent** — runs the Playwright suite from Phase 8.5 + a "human reader test" pass against copywriter output ("does any sentence read like SEO copy?").
- **Deployment engineer agent** — Cloudflare + wrangler + per-client config wiring.
- **Reporting agent** — runs Phase 6 monthly report generation per client.
- **Foreman/orchestrator agent** — coordinates specialists for new-client onboarding runs; enforces sequencing (e.g., copywriter can't be invoked until keyword strategist has produced the brief).

**Handoffs are contract-defined** — each station's output is a structured brief the next station consumes. That way each specialist's reasoning happens in its own scoped context, and cross-station coordination doesn't leak assumptions from one role into another.

**Implementation surface:**
- New `.claude/skills/copywriter/SKILL.md`, `.claude/skills/keyword-strategist/SKILL.md`, etc. per station
- Curated resource sets per skill (which memory files, which SOPs, which tool access)
- Foreman skill file that orchestrates the sequence
- Per-station output contracts documented as JSON-ish shapes so handoffs are machine-checkable
- Update the `/onboard-new-client` playbook to invoke the foreman rather than a generalist worker

---

## Files this plan touches

### Phase 0 (skill MD update)
- `.claude/skills/add-skill-page/SKILL.md`

### Phase 1 (booking flow architecture)
- `public/js/therapist-picker.js` — new calendar lightbox view, Cal.com embed wiring, `bookingSuccessfulV2` listener, `active` flag handling, available-therapists fetch
- `public/js/picker-config.js` — per-therapist Cal.com handle map, `active` flag map, cap map
- `public/css/picker.css` — styles for the new calendar view, grayed-out card label
- `public/js/apps-script-lead-capture.gs` — new `booking_confirmed` action + `available_therapists` GET endpoint + `bookings_<skill>` and `bookings_count` tabs
- All five skill page index.html files (`public/<slug>/index.html`) — minor: confirm no redirect-on-Book to `/confirmation/`, picker handles the routing
- New page: `public/booking-confirmed/index.html` — dedicated post-booking confirmation page (replaces the demand-test `/confirmation/` endpoint for active bookings; Tif fallback still uses `/confirmation/`). Three blocks: confirmation + appointment details, prep instructions, what happens next. Redirect-only with graceful generic fallback. No redundant tracking.
- New file: `public/js/mh-backend.js` — backend abstraction layer

### Phase 2 (QS audit on prenatal)
- `public/prenatal-massage-calgary/index.html` — keyword coverage tightening + H1 focal-term placement
- `.claude/skills/add-skill-page/SKILL.md` — add QS copy/keyword checklist section

### Phase 3 (prenatal iteration)
- `public/prenatal-massage-calgary/index.html` — copy/design/function adjustments per user feedback
- `.claude/skills/add-skill-page/SKILL.md` — "Lessons learned from prenatal" section

### Phase 4 (testing) — no file changes, just verification

### Phase 5 (other pages)
- `public/lymphatic-drainage-massage-calgary/index.html`, `public/deep-tissue-massage-calgary/index.html` — Phase 1 booking retrofit + Phase 2 QS pass + Phase 3 polish loop per page, dual-track build
- New: `public/therapeutic-massage-calgary/index.html` (or similar) — replaces general `/massage-therapy-calgary-flow-b/`; splitter routing change at cutover

### Phase 7 (portability + Workers migration + multi-agent factory staffing)
- New file: `public/js/client-config.js` (or `.json`) — single per-client configuration surface (practitioners, skills, brand, business info, backend URL, ad-group keyword themes)
- New file: `public/css/client-config.css` — per-client design tokens (brand colors, fonts, logo path); replaces hardcoded values in `flow-b-v3.css`
- Refactor: `public/js/therapist-picker.js`, `public/js/picker-config.js`, `public/css/flow-b-v3.css` — remove Maximum Health hardcodes, read from `client-config` instead
- New directory: `workers/backend/` — Cloudflare Worker port of `apps-script-lead-capture.gs` with identical action contracts
- `.claude/skills/add-skill-page/SKILL.md` — split into client-agnostic engine docs + Maximum Health-specific addendum
- New file: `.claude/skills/onboard-new-client/SKILL.md` — the new client setup playbook

---

## Verification

### Phase 1 booking flow (per-therapist)
1. Local: `npx http-server public -p 8087` → open `/prenatal-massage-calgary/?utm_source=test&gclid=test` → complete the funnel through Cal.com booking. Confirm:
   - Cal.com embed loads with UTMs + skill + recommended_therapist_id in its query params
   - `bookingSuccessfulV2` fires and POSTs to Apps Script
   - Apps Script writes a row to `bookings_prenatal` tab and increments `bookings_count`
2. Live (after deploy): same flow on `https://go.maximummassage.ca/prenatal-massage-calgary/`. Make a real test booking, then cancel it in Cal.com. Confirm GTM `booking_confirmed` event fires (DebugView), Google Ads conversion registers, GA4 logs the event, Jane receives the note with UTMs.

### Phase 1 limit gray-out
1. Manually edit `bookings_count` sheet to put a therapist at their cap for current `YYYY-MM`.
2. Reload any skill page they appear on → confirm their card renders with `picker-card--disabled` + "Fully booked this month" label.
3. Run the quiz with weights that would normally recommend them → confirm the "We recommend" badge falls back to the next-best available therapist, and the `quiz_<skill>` row logs both the original recommendation and the fallback.

### Phase 2 QS (copy/keyword only, no technical checks here)
- **Hero H1 contains the highest-volume Active prenatal keyword verbatim** (from the workbook's Prenatal tab). Subhead echoes the same focal term.
- Spot-check ad-group keyword + variation presence across meta title, meta description, first paragraph, benefit titles, modality intro, "what a session looks like" copy, FAQ questions, final CTA. Build the coverage map described in the audit task.
- Human-reader test: read the page top-to-bottom aloud. If any sentence sounds like SEO copy, rewrite it back to natural voice. No keyword wins justify a sentence that grates on a real reader.
- **No Lighthouse SEO check, no PageSpeed run in this phase** — technical QS items get a spot-check in Phase 5 per page, not here.

### Phase 4 full E2E — script and checklist
- Produce a Node-based test script that walks the funnel via Playwright (install if not already a dev dep) and a manual checklist for the human steps (Jane sync, GTM DebugView, Google Ads conversion). Final test list confirmed before running.

### Phase 5 — repeat Phase 4 verification per page

---

## Open items before kicking off Phase 1

- **Cal.com `bookingSuccessfulV2` payload shape** — discovered via the Phase 1.0 diagnostic-listener procedure. No blocker; happens at the start of Phase 1 implementation.
- **GTM spec implementation** — Claude writes the spec (Phase 1.7) once 1.0 reveals the payload field names; user implements in the GTM UI in ~10 minutes per the walkthrough.
- **Quality-score-for-LP transcript** — read. All four resource files (ad rank, intro to QS, QS for LP, ad-group briefing) are consumed. No further reading blockers.

---

## Hard constraints (carry into every implementation step)

- **Paid-ads-only.** Crawlers are blocked at Cloudflare. No SEO work. No Lighthouse SEO. Reference: memory `feedback_paid_ads_no_seo.md`.
- **Never overwrite an existing live page in place.** Back up first (git tag or `-v1` folder), build alongside, compare, swap.
- **Monthly caps never influence quiz recommendation logic.** Quiz scores the full roster; gray-out + fallback happen at the badge layer, not the scoring layer.
- **DORMANT HTML comment pattern.** The Call-us markup is preserved as HTML comments in topbar — never delete; flip-back is a comment-toggle operation. Reference: memory `feedback_topbar_book_now_dormant_call_us.md`.
- **First-person bios only.** Mobile-text-message tone. No third-person.
- **No em dashes in user-facing copy.**
- **Voice priority over QS:** if a sentence reads like SEO copy, rewrite it back to natural voice even if it costs a keyword hit.
- **No redundant conversion tracking on `/booking-confirmed/`.** GTM fires the conversion upstream of the redirect; the confirmation page is UI only.
