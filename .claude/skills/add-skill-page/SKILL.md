---
name: add-skill-page
description: Build a new skill-specific paid-ad landing page for go.maximummassage.ca. Encodes the full workflow — Hayahay-benchmarked structure, per-therapist skills.<skillId> overrides, 4-question native quiz with weighted recommendations, page HTML using the shared Flow B v3 design system, Apps Script tab routing, and the dormant Call-us topbar pattern. Invoke when the user says anything like "let's build a [modality] page", "new funnel for [skill]", "let's add /<slug>/", or names a new search intent we should target.
---

# Build a new skill-specific landing page

## When to use

The user wants to add another paid-ad landing page targeting a specific massage intent (e.g. "let's build a cupping page", "add a migraine massage funnel", "new page for car-accident recovery"). Each skill page is a self-contained ad funnel: ad click → tuned hero → benefits → session walkthrough → tuned picker grid → 4-question native quiz → recommended therapist → lead form → shared `/confirmation/` page.

Live URLs that already exist (don't re-build these; reference them as templates):

- `/massage-therapy-calgary/` (general / catch-all via Cloudflare splitter to Flow B v3)
- `/prenatal-massage-calgary/` (skill=prenatal)
- `/deep-tissue-massage-calgary/` (skill=deep_tissue)
- `/sports-massage-calgary/` (skill=sports)
- `/tmj-massage-calgary/` (skill=tmj)
- `/lymphatic-drainage-massage-calgary/` (skill=lymphatic)

The README has the full Live URLs table and the Adding a New Skill Page checklist that this skill expands on.

## Inputs the user must provide (ask up front if unclear)

1. **URL slug.** Pattern: `<modality>-massage-calgary` (e.g. `cupping-massage-calgary`, `migraine-massage-calgary`). Confirm before building so they can drop it into ad campaigns immediately.
2. **Skill ID for code.** Lowercase snake_case derived from the slug (e.g. `cupping`, `migraine`, `mva` for motor-vehicle-accident). Used as `skill: '...'` in picker-config.js and as the suffix on the sheet tab (`leads_<skill>`, `quiz_<skill>`).
3. **Therapist roster — who offers this skill.** Cross-check each therapist's source-of-truth doc under `public/<therapist>/<Therapist>_*_Source_Compilation.docx` (or just look at their existing tags/experience in `public/js/therapist-picker.js`). If you can't confirm someone offers a modality, exclude them and tell the user — they can override. Default exclusion biases:
   - Lindsey: gentle/calming brand — exclude from deep-tissue, sports, intensive clinical work
   - Meagan: whole-body/craniosacral — exclude from prenatal (no doc evidence), TMJ, lymphatic
   - Brookelyn: kinetic + active bodies — exclude from gentle-modality pages (lymphatic, TMJ)
   - Tif: personalized + lymphatic + TMJ — wide range, includes most modalities
   - Charlotte: clinical depth + many CEUs — includes almost all modalities
4. **Whether to add a "What a session looks like" 3-step section.** Defaults to YES for any modality where pre-booking anxiety is real ("will it hurt?", "what's it actually like?", "do you work inside my mouth?"). Defaults to NO for modalities where the visitor probably knows what to expect (prenatal didn't have one because the FAQ covers positioning anxiety thoroughly).

## Workflow

### Step 1 — Competitive research (15-min web sweep)

Read `feedback_skill_page_structure_reference.md` if not already loaded — this is the Hayahay benchmark we mirror structurally.

Then do a quick WebSearch + WebFetch on:
- The modality term + "Calgary" — find the top 3-5 clinic pages
- Google's "people also ask" suggestions for the modality
- Reputable benefits sources (Cleveland Clinic, Healthline, AMTA, etc.)

Pull from the research:
- 4-6 benefits visitors actually care about (we cap at 6 bullets)
- 8-10 FAQ-worthy questions visitors actually ask
- Hero headline framing competitors use (use as input, write our own warmer version)

Skip cross-linking between our service pages — these are paid-ad funnels, not SEO web pages (per `feedback_paid_ads_no_seo.md`).

### Step 2 — Draft per-therapist `skills.<skillId>` blocks

For each therapist on the roster, draft:

```js
{
  title: '[3-6 word specialty descriptor for detail panel under their name]',
  specialty: '[2-4 word picker-grid card subtitle, distinct from other therapists on the same page]',
  bio: 'Hi, I\'m [Name]. [2 paragraphs, first-person, mobile-conversational, ~50-90 words each. P1 = clinical approach + what makes them distinct on THIS skill. P2 = personal anchor: lived experience, relevant background, who they love working with.]\n\n[P2 here]',
  tags: ['[8 tags max, 1-3 words each]', '...', '...']
}
```

Critical: bios must be **first-person**, **mobile-text-message tone**, with `\n\n` between paragraphs. Tags differentiate therapists on the same page — they don't all just say the modality name. E.g. on prenatal, Lindsey leads with "Prenatal yoga (since 2014)" while Brookelyn leads with "Postpartum recovery".

Pull source material from:
- `public/<therapist>/<Therapist>_Source_Compilation.docx` — unzip word/document.xml and strip tags
- Existing `skills.<otherSkill>` blocks in `public/js/therapist-picker.js` (gives you their voice and what already worked)
- Each therapist's flat `tags` + `experience` arrays for credential pulls

Show the user the drafts before applying. Get sign-off, iterate copy, then write.

### Step 3 — Draft the 4-question native quiz

Each page gets exactly 4 questions in `picker-config.js`. Structure:

```js
const <SKILL>_QUIZ = [
  { id: 'q1_id', text: 'Question 1 (easy fact about visitor — stage, location, primary complaint)',
    options: [
      { id: 'opt_id', label: 'Option text', weights: { therapistId: 2, otherTherapistId: 1 } },
      // ...
    ] },
  { id: 'q2_id', text: 'Question 2 (still easy — duration, severity, what bothers them most)', options: [...] },
  { id: 'q3_id', text: 'Question 3 (medium reflection — preferred style, approach preference)', options: [...] },
  { id: 'q4_id', text: 'Question 4 (most thoughtful — matching preferences, who they want to be paired with)', options: [...] }
];
```

**Locked-in principles (do not deviate):**
- Order easy → harder. The first question must be a low-effort fact the visitor can answer in 1 second. The last question is the most reflective. This builds **completion bias** — once they've answered the easy ones, they're invested enough to finish the hard ones.
- Weight values: 1 = mild bias, 2 = moderate, 3 = strong. Anything stronger looks suspicious in the routing analysis later.
- Each option's `weights` map only includes therapists on this page's roster. No weights for filtered-out therapists.
- Last question of every quiz should have a "no preference" option with empty `weights: {}` — gives users a graceful out.
- Recommendation = highest-summed score across all answers. Ties bias toward Q1 (loaded most heavily for stage/context).

Show the user the quiz draft. Get sign-off. Iterate. Then write.

### Step 4 — Draft page copy

Six sections need original copy per page. Draft all six before writing the HTML:

1. **Hero** — H1 in `[Modality] for [Benefit]` pattern (Hayahay's structure). Subhead anchors what makes us different. Include the modality term naturally for ad quality score.
2. **Modality intro** — short paragraph "What is [modality]?" that defines the modality for visitors who don't fully know. 60-100 words. Distinguish from adjacent modalities so visitors understand what they're booking.
3. **Benefits** — exactly 6 bullets. Each bullet: bold one-line title + one-sentence elaboration. Pull from the competitive research.
4. **"What a session looks like" (optional)** — 3 steps if it reduces booking anxiety. Steps are: (1) Quick intake ~5 min, (2) Hands-on work ~45-50 min, (3) At-home plan ~5 min. Customize each step's body to the modality (e.g. TMJ explicitly mentions intra-oral consent at intake).
5. **Final CTA** — eyebrow + H2 + body + button copy. Body should restate the offer ($49 starter + 100% guarantee), reference the modality intent, and end with "starting with the right match for you" or similar matching-focused close.
6. **FAQ** — exactly 10 items. Lead with the most common visitor anxiety/question for this modality. Include "Will my insurance cover it?" as item 9 or 10 (always the same answer text). Each answer ~50-100 words, conversational. JSON-LD `FAQPage` schema generated from the same Q&A pairs.

Reuse without edits (these don't change per page):
- Site topbar (Book Now button with DORMANT Call-us comment block)
- Hero offer card (price + FUDx + 100% Guarantee + body)
- Stats section (1,749+ / 28 / 91% / 100%)
- Why Work With Us — 6 cards (Deeply In-tune, Nervous System, Detectives First, Whole Body, Personalized Plans, Pain ≠ gain)
- Healing isn't just the hour
- Testimonials (one card carried over from general for now; we'll prune to modality-specific reviews once we have them)
- Footer

The Why Work With Us **subhead** gets a per-page rewrite leading into the matching-focused close. Same for the Healing section subhead — both retune around the modality without changing the cards.

### Step 5 — Add data + config (code changes)

Edit in order:

1. **[public/js/therapist-picker.js](public/js/therapist-picker.js)** — add a `skills.<skillId>` block inside each therapist on the roster. Drop them into the existing `skills: { ... }` map, or create a new `skills: { ... }` map if a therapist had none before.

2. **[public/js/picker-config.js](public/js/picker-config.js)** —
   - Add the `<SKILL>_QUIZ` constant array.
   - Add a new entry to `PAGE_CONFIGS` with the new URL pathname as the key:
     ```js
     '/<slug>/': {
       skill: '<skill_id>',
       sheetTab: 'leads_<skill_id>',
       quizQuestions: <SKILL>_QUIZ
     }
     ```

### Step 6 — Build the page HTML

Clone an existing skill page as the template:

- Closest analog by structure: `public/deep-tissue-massage-calgary/index.html` (has all four optional sections: modality-intro, benefits, session-steps, retuned why subhead) — use this for clinical/intensive modalities.
- Skip session-steps section for any page where it doesn't help (rare — most modalities benefit from it).

Update in the template:

- `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<link rel="canonical">`
- Hero H1 + subhead
- Modality intro `<h2>` + body
- Benefits list (6 `<li>` items)
- Session steps list (3 `<li>` items) — if included
- Why Work With Us subhead (cards unchanged)
- Healing section subhead (checks + buttons unchanged)
- 10 FAQ items in `<div class="faq-list">`
- Matching FAQPage JSON-LD in `<head>`
- Final CTA H2 + body
- Page-stamping inline script: `page_variant=<skill>` and `flow=<skill>`
- Topbar markup: keep the DORMANT Call-us HTML comment block intact above the active Book Now `<button>` — never remove the comment block (see `feedback_topbar_book_now_dormant_call_us.md`)
- Picker-config.js + therapist-picker.js script tags at the bottom (in that order — config must register before the picker reads it)

CSS for the modality-intro, benefits, session-steps sections is **inline** in each skill page's `<style>` block (intentionally — kept local until we have enough pages to justify moving to the shared sheet). Copy from `deep-tissue-massage-calgary/index.html`.

### Step 7 — Verify locally

```bash
npx http-server public -p 8087 --silent &
# then probe
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8087/<slug>/"
```

Open in browser at iPhone-class width (~390px DevTools). Verify:
- Hero, modality intro, benefits, session steps (if included), why, healing, testimonials, FAQ, final CTA all render in order
- All four+ CTAs (`data-open-picker`) open the lightbox
- Native quiz renders with the right 4 questions on the right page
- After completing the quiz with answers that should recommend a specific therapist, the picker grid loads with that therapist's "We recommend" badge
- Picker grid filters correctly — only the roster shows; filtered-out therapists are not visible
- Tapping into a therapist's detail panel shows the per-skill bio, specialty pill, and tags (not their general profile)

### Step 8 — Commit, push, and remind about Apps Script

Commit message format (mirror past commits):

```
<skill>: launch /<slug>/ page + per-skill picker tuning + native quiz routing

[2-3 paragraphs describing the page, the per-therapist skill blocks
added, the quiz design, and any noteworthy copy decisions]

User must redeploy Apps Script to activate leads_<skill> / quiz_<skill>
tabs. Until then those rows route to the legacy 'Leads' tab with the
Skill column populated correctly.
```

Push to origin/main. Cloudflare Pages auto-deploys in ~1-3 min.

**End the response by reminding the user** to manually redeploy the Apps Script for the new sheet tabs to activate:

> One required manual step from you: open your Google Sheet → Extensions → Apps Script → paste the latest `public/js/apps-script-lead-capture.gs` contents → Save → Deploy → Manage Deployments → Edit existing deployment → New version → Deploy. Until you do, lead + quiz rows for this new skill will write to the legacy `Leads` tab with the `Skill` column populated correctly.

If the Apps Script has not changed since the last skill page was added, the user does not need to redeploy — only mention it if the .gs file was modified in this session.

### Step 9 — Update the README

Edit [`README.md`](README.md) Live URLs table to add the new URL with status "live". The Adding a New Skill Page checklist already lives there for the next time; you usually won't need to update it.

## Reference materials to consult (in order)

1. `feedback_skill_page_structure_reference.md` (memory) — Hayahay benchmark rules
2. `feedback_topbar_book_now_dormant_call_us.md` (memory) — dormant CTA snapshot rules
3. `feedback_paid_ads_no_seo.md` (memory) — these are paid-ad funnels, not SEO pages
4. [`README.md`](README.md) — Live URLs table + Adding a New Skill Page checklist
5. [`public/deep-tissue-massage-calgary/index.html`](public/deep-tissue-massage-calgary/index.html) — best structural template (has all four optional sections)
6. [`public/js/therapist-picker.js`](public/js/therapist-picker.js) — existing therapist data + skills overrides
7. [`public/js/picker-config.js`](public/js/picker-config.js) — existing page configs + quizzes
8. Therapist source docs under `public/<therapist>/<Therapist>_*_Source_Compilation.docx`

## Anti-patterns (don't do these)

- Don't cross-link to other service pages in the footer. These are paid-ad funnels; each page is a single conversion path.
- Don't remove the DORMANT Call-us HTML comment block above the Book Now button. Even if it looks redundant in markup, it's the snapshot we restore from when the client flips back to taking calls.
- Don't use em dashes anywhere in user-facing copy. Comma, period, or `—` written as `,` per established voice convention (user removed all em dashes globally on 2026-05-09).
- Don't write third-person bios. All therapist bios are first-person, mobile-text-message tone.
- Don't write more than 6 benefits or fewer than 10 FAQ items.
- Don't make the first quiz question hard. Order is easy → harder for completion bias, always.
- Don't introduce a new framework, build step, or transpile pipeline. Pages are plain static HTML in `public/`.
- Don't propose SEO work (meta robots, internal linking strategy, schema beyond FAQPage, sitemap entries). Crawlers are blocked at Cloudflare.
- Don't redeploy Apps Script silently. Either remind the user explicitly or skip the reminder if `.gs` didn't change.

## Tone to use throughout

- Warm, grounded, conversational.
- First-person on therapist bios; second-person on page copy (we / you).
- Mobile-text-message tone where possible — short sentences, real talk.
- Nervous-system-aware framing where relevant.
- Specific examples over generic claims ("Charlotte and Brookelyn both work with chronic pain regularly" beats "our therapists work with pain").
- Acknowledge real concerns visitors have ("Will it hurt?", "Is it weird?", "Will I be sore?") — don't pretend they don't exist.

---

# Session history — how these pages got built

> **Why this section exists.** Everything above is the *procedure*. This section is the *story* — the actual back-and-forth from the planning + build sessions (May 2 → June 19, 2026, session `5ea9fd9e-3de2-4a70-a547-3baeb94c905d`) that produced the prenatal page and the other four. It's here so that when the user asks for an adjustment, the answer is never "let me reverse-engineer why we did this." It's "you said X, we landed on Y, here's the reason — so moving to Z costs W." Quotes are verbatim (original spelling preserved); commit hashes pin the shipped state. Durable rules live in the memory files cross-referenced throughout (`feedback_skill_page_structure_reference.md`, `feedback_topbar_book_now_dormant_call_us.md`, `feedback_paid_ads_no_seo.md`, `project_therapist_roster.md`) — this narrative points at them rather than duplicating them.
>
> **Timeline anchors:** Flow B v3 ship + splitter→100% (May 2–3) → lightbox polish + Tally recommendation-bug hunt + Tif rough-in (May 7–8) → **the architecture brief** (May 8, the pivot to skill pages) → prenatal build + hero edits (May 8–9) → remaining-pages plan + Hayahay benchmark + deep-tissue slug (May 13) → Book Now topbar swap (Jun 3) → catch-up + `/add-skill-page` skill authored + keyword/QS planning (Jun 15–19).

## 1. The skill-page concept itself (the architecture brief)

This is the keystone. On 2026-05-08 (the long "For greater context about where I want to go with this project" message) the user laid out the entire model in one breath. The general Flow B picker was, in his words, the **"general" bucket**:

> "they will receive visitors whose searches are broad in nature such as massage therapy calgary, whereby we dont necessarily know what specific needs they may need because of how broad the search was, so can be considered our 'catch all'. Once we have this one complete I want to move onto creating distinct landing pages that are similar to flow b but distinctly for the visitors who searched more specific massage terms such as prenatal massaget therapy, deep tissue massage, sports rehabiliation massage, etc."

The mechanism he specified, verbatim:

> "the lightbox therapist picker is the same as it is now on flow-b but has a mechanism that reads the page url ex: /prenatal-massage-calgary/ then references our list of practitioners and the services they offer, then dynamically displays only the therapists in the picker grid that have those skill sets associated to that particular page... and also tunes the profile of the therapist to lean more into the skillset."

That single message seeded six of the features below at once: URL→skill resolution, roster filtering, per-skill profile tuning, the native quiz replacing Tally, the weighting system, and per-page sheet logging. **Shipped:** `f6588ac` (the `getProfile(t, skill)` / `hasSkill` / `visibleTherapists()` engine + `picker-config.js` page→skill resolver). The engine was built backward-compatible so the existing Flow B "general" picker was untouched — `'general'`/`undefined` skill returns the flat profile.

## 2. Hayahay as the structural benchmark

The user didn't name Hayahay until the deep-tissue conversation (2026-05-13), while reasoning about how to split intents across pages:

> "have a look at this following website which is probably one of the best representations in terms of marketing the advertising the SEO and the overall structure of how they organize intent into their service pages — https://hayahaymassage.ca/"

After the review he made it the standing reference and asked for it to be persisted:

> "Lets keep Hayahay As a prime leading example of how we should also be following and structuring our skills pages, can you write that to the memory so that we stay on track with that for everything we build going forward."

**What to copy / not copy** was settled in the same message — see `feedback_skill_page_structure_reference.md` for the durable rule. Adopt: `[Modality] for [Benefit]` H1s, modality-first section order, 6-benefit cap, one-modality-per-page. Explicitly **do not** copy cross-linking (item 16 below). The "what to expect" section idea (item 9) also comes from here.

## 3. Per-page architecture decisions (slugs, intent-splitting)

When the user dropped into picking the deep-tissue slug (2026-05-13) he first proposed bundling intents:

> "for deep tissue massage Let's put deep tissue and relaxation massage Calgary for the slug"

Claude pushed back that "deep tissue and relaxation" covers two different intents. The user agreed and went further, surfacing the one-page-per-intent principle himself:

> "let's get rid of the relaxation component then and focus on the deep tissue aspect As deep tissue is actually part of the sports page because Of the intent, at least that's how I see it but maybe you see it differently and you should inform me about that."

This is the origin of the **slug = `<modality>-massage-calgary`, one intent per page** rule (Step "Inputs" above). It also established the collaborative pattern the user explicitly invited: *tell me if you see it differently.* In the same May-13 thread he asked for the general catch-all URL to be documented alongside the skill pages, which became the Live URLs table.

## 4. First-person, mobile-text-message bios

Claude's first prenatal bios were third-person. The user's correction (2026-05-08) is the exact rule now baked into Step 2 and the Anti-patterns:

> "I think that we could have a little bit more engagement by writing them from the first person as though the therapist wrote them and it's a text message almost Because most people are looking at this on their mobile phone we want it to read and look and feel very personal and having it come from the first person can help us achieve that."

The preceding bio expansion (2026-05-08) set the depth: bios aren't one-liners because **"the therapist really is the product"**:

> "The bios don't necessarily need to be just two or three sentences They can be two paragraphs of three to four sentences so that we can get more details across about the therapist because the therapist really is the product and we really need the person visiting this page to connect with that therapist at a deeper more emotional level."

**Shipped:** the 2-paragraph emotional bios in `bc2fb24`, then re-voiced to first-person across the skills blocks in the prenatal launch `f6588ac`.

## 5. Per-therapist skill-tuned profiles (the `skills.<skillId>` data model)

From the same architecture brief, the user's own example is why the same therapist reads differently per page:

> "Brookelyn is more sports oriented in our general page but on a prenatal page her picker grid and profile would focus heavily on the prenatal side of what she does. The picker grid would also differentiate the therapists as much as possible versus just having it say prenatal for all of them it might go deeper into saying what specifics of prenatal they do this way when they picker grid they can differentiate and choose the right person."

That "differentiate, don't all-say-prenatal" instruction is exactly why Step 2 insists tags lead with distinct angles (Lindsey → "Prenatal yoga since 2014", Brookelyn → "Postpartum recovery"). The data model that supports it — an optional `skills.<skill>` override merged on top of the flat fields by `getProfile` — shipped in `f6588ac`.

**Source-of-truth for profiles:** the user proposed (2026-05-08) feeding one document per therapist as the canonical input —

> "if I was to give you one clear document for each therapist which had a bunch of information including questions they've answered directly would you have a look at each of these and then determine whether or not we need to update the therapist picker page"

He then uploaded those to `public/<therapist>/` and directed: stop using the old Flow A standalone pages as truth, use the uploaded docs instead (they're "for flow A" and "no longer part of the flow that we are going with which is now flow B"). Refresh shipped in `990640c`. Profile-tuning details from that round: keep Charlotte's nutritional biochemistry, leave Lindsey as-is, Tif's card can stay lighter for now (2026-05-08).

## 6. Quiz progression principle (easy → harder, completion bias)

Stated by the user on 2026-05-08, now a locked-in principle in Step 3:

> "for the questions the first question should be pretty straightforward and easy to answer with the harder questions more towards the end because it's building up completion bias would make it easy for them to make one selection and then make it a little bit harder on the next 1 a little bit harder on the next one and so forth because now they're it's the easy ones at the front make it easier to complete and then they have the desire to then just complete them even though there might be a higher ask on the last questions."

**Shipped:** prenatal quiz Q1 is the low-effort "Where are you right now?" stage question; the reflective matching question lands last (`f6588ac`, `picker-config.js` `PRENATAL_QUIZ`).

## 7. Weighted recommendation logic

Specified inside the architecture brief as a port of the Tally behavior:

> "based on the selections or the answers in that quiz we would then make a recommendation just as we do currently but only for the handful of therapists So we would need a weighting system much like we have for tally quiz right now so we can make a confident recomendation based on their answers in relation to that specific page."

**Shipped:** per-option `weights` maps on a 1/2/3 scale, recommendation = highest summed score, ties biased toward Q1 (`f6588ac`). The 1/2/3 ceiling is a deliberate constraint (Step 3) — stronger weights "look suspicious in the routing analysis later."

## 8. The 6-benefit cap and the modality-intro section

The 6-benefit cap is a Hayahay-derived rule (`feedback_skill_page_structure_reference.md`). The **softening of a too-clinical benefit** came from the user reviewing a draft on 2026-05-08:

> "for the benefits section I don't if that one necessarily fits completely because we're talking about lymphatic drainage specifically but maybe it should be tuned to saying something more like it helps with lymphatics and swelling."

Principle extracted: a benefit that reads generic/clinical for the specific modality gets retuned to the visitor's actual concern (swelling) rather than the textbook claim. This is the seed of the broader voice rule in item 11.

## 9. "What a session looks like" 3-step section

Adopted from Hayahay's "what to expect during your session" pattern (`feedback_skill_page_structure_reference.md`). Decision rule, encoded in the Inputs step: **include it when pre-booking anxiety is real** for the modality (deep tissue, lymphatic, TMJ — "will it hurt?", "do you work inside my mouth?"), skip it when the visitor already knows what to expect. Prenatal deliberately shipped **without** one because its FAQ covers positioning anxiety thoroughly. TMJ's version explicitly names intra-oral consent at the intake step (`92a66fd`).

## 10. FAQ count and topics

Settled at **exactly 10 items per page**, anxiety-led ordering, with "Will my insurance cover it?" always present. This is a "where we beat Hayahay" differentiator (they have none — `feedback_skill_page_structure_reference.md`). FAQs are picked from real visitor worry, not keyword bait: TMJ's FAQ leads with intra-oral consent so visitors know what they're booking (`92a66fd`); prenatal's covers side-lying positioning safety (`f6588ac`). Each page ships matching `FAQPage` JSON-LD generated from the same Q&A pairs (the one schema type allowed — see item 16).

## 11. Voice softening / cold-language fixes

The single sharpest voice note, 2026-05-08, reviewing the prenatal draft:

> "For the Why work with Us section where it talks about with therapists who've trained specifically for the bodies you bring them sounds really cold and clunky It needs to be updated. The same can be said for the final call to action section body copy where it mentions pregnancy and postpartum bodies. Just saying that almost makes the reader feel alienated when we should make them feel welcomed because just saying the word bodies is very cold and isolating."

This generalizes to the **voice-priority rule**: anxious humans read this copy, not bots — if a line sounds clinical or isolating, rewrite it warm even at a keyword cost. **Shipped:** hero subhead reworded from "RMTs trained in pregnancy and postpartum bodies" to "RMTs who've trained for this work and many of whom have lived it themselves" (`5f305d6`). The user then caught that this line now echoed between the hero and the Why-WWU subhead and asked for the second one to be re-pointed at the matching angle (2026-05-09) — shipped in `ab3acd0` ("with the right therapist matched to your specific stage and concerns"). Same round: a one-word naturalness fix, "through your sixth-week postpartum check" → "through **to** your sixth-week postpartum check."

## 12. Em dash removal

A flat global instruction, 2026-05-08: **"Remove all the em dashes."** Now an Anti-pattern and a hard constraint. **Shipped:** global sweep in `bc2fb24`; every page since is authored em-dash-free.

## 13. Topbar Book Now / Call us swap with DORMANT comment

Requested 2026-06-03 ("the client has requested that the Call Us button in the top right be adjusted to simply be a [Book] Now button which will just mimic the actions and bring out the same light box"). The durable part is the user's instruction to make it **reversible from a snapshot**, and his pre-warning about how he'd phrase the flip-back later:

> "let's remember how we have it set up so that when the client is ready to receive calls that we can just switch it back no problem. And next time I come back in I might not remember this but I might just say something like OK let's add a Call Us button in the top right corner and at that point that should indicate to you that we should flip back to this snapshot that we're taking of what it is currently and then inform me of that"

That is exactly the flip-back trigger language captured in `feedback_topbar_book_now_dormant_call_us.md`. **Shipped:** `92a66fd` — original `<a href="tel:...">` Call-us markup preserved verbatim inside a `DORMANT` HTML comment above the active Book Now `<button>` on every page; `.hero-call` CSS extended so one class serves both `<a>` and `<button>`. **Never delete the comment block.** (The client is not taking calls during the demand-test phase — context in the memory.)

## 14. Tally → native quiz migration (and the always-Brookelyn bug)

Two threads converged here. First, the architecture brief asked to replace Tally with code that **"act and feel in the same way that it does with tally"** while sending data to a new per-page sheet tab. Second, a real bug forced the issue: on 2026-05-07 the user reported the recommendation was stuck —

> "no matter what I put into the tally form the light on the therapist picker always says that Brooklyn is the recommended therapist rather than updating for whatever URL Talley sends our way."

He diagnosed the root cause himself the next day — Tally was emitting a static slug, not a dynamic one:

> "I need to the slug where it says Brooklyn to be a dynamic field to output based on the recommended therapist based on the calculations in the form for the weighting"

and asked Claude to revert the badge-side edits so he could fix it at the Tally form layer first. (Related earlier symptom, 2026-05-03: "the tally form doesnt show, just goes direct to the therapist picker.") The diagnostic dump that helped trace it shipped in `0de6dbc`; the path-anchored recommendation match in `ad8931a`. The lasting fix was the native quiz itself (`f6588ac`), which removed the Tally dependency for skill pages while leaving Tally on the Flow B "general" page.

## 15. Lead-form → /confirmation/ demand-test endpoint

Decided 2026-05-08, the explicit reason the funnel ends at a "no availability" page instead of a real booking:

> "when clicking book now it should dirct to the same process as for all therapists right now to the confirmation page where we state that there is no more availability which is a temporary thing so we can test the demand for the offer"

This is the demand-test endpoint the whole booking-flow plan (Phase 1) now replaces. Tif's Book button still routes here (she has no Cal.com — `project_therapist_roster.md`), which is why the plan keeps `/confirmation/` alive as the inactive-therapist fallback.

## 16. No cross-linking decision (paid-ads-not-SEO)

When approving the four-page rollout (2026-05-13) the user carved out the one Hayahay pattern to reject:

> "clear to pro ceed with those 4 pages as you have described here with the exception to the cross linking two to three of related service pages in the footer. Remember we're building landing pages Paid ad campaigns not an SEO focused page on a website."

This sits on top of the standing paid-ads-only rule (`feedback_paid_ads_no_seo.md`): crawlers are blocked at Cloudflare, so no canonical/sitemap/internal-linking work, and `FAQPage` is the only schema we ship. Each page is a single conversion path — no footer links out to sibling services.

## 17. Apps Script tab routing

From the architecture brief: the new quiz/lead data **"would go to the same spreadsheet just in a new tab specifically for that page."** **Shipped** in `f6588ac`: `leads_<skill>` and `quiz_<skill>` snake_case tabs, auto-created with header rows on first write, with backward-compat so a missing/`general` skill still writes to the legacy `Leads` tab and the new `Skill` column gets appended by `syncHeaders()`. This is why Step 8 always reminds the user to redeploy the Apps Script when `.gs` changed — the tab routing doesn't activate until the Web App is redeployed.

## 18. The five pages, the order they were built, and per-page tuning

Order was driven by the user. Prenatal first as the template, chosen 2026-05-08 because the full skill list wasn't ready yet:

> "I dont have a full list yet but we can get started with the Pregnancy aka Prenatal and postnatal and postpartum focussed page."

Prenatal launched in `f6588ac` (2026-05-08), roster `{brookelyn, charlotte, lindsey, tif}` with **Meagan deliberately excluded** (her source doc surfaced no prenatal evidence — add a `skills.prenatal` block later if she takes prenatal clients). Hero refined twice over 2026-05-09: the user wanted the H1 to carry all three search variants for ad quality score while still reading human —

> "The hero headline needs to be centered around prenatal, postnatal and postpartum, somehting that lists those terms for ad quality score but also drives home the point about suport during all times of pregnancy."

shipped as "Prenatal, postnatal, and postpartum massage. Support at every stage of pregnancy and beyond." (`5f305d6`), then the subhead/Why-WWU polish in `ab3acd0`. **This is the earliest instance of the hero-focal-keyword principle that Phase 2 formalizes** — H1 carries the highest-intent terms verbatim, variations rotate through later sections, but it still has to read naturally.

Then the user greenlit the rest (2026-05-13): "lets proceed and do the remaining pages... share the urls with me for the next pages as I need to drop those into the ad campaigns right now." Deep tissue, sports, TMJ, and lymphatic followed, with per-page rosters set by who actually does the modality:

- **Deep tissue** — page content first committed in `01753f8`, finalized alongside the topbar swap in `92a66fd`. (The intent-split reasoning that birthed its slug is item 3.)
- **Sports** — Brookelyn (kinetic SI/cervical, runner/strength), Charlotte (injury recovery + myofascial), Meagan (whole-body athletic recovery); Lindsey + Tif excluded (`92a66fd`).
- **TMJ** — Tif as lead (TMJ + facial), Charlotte (trigger point + jaw); FAQ names intra-oral consent (`92a66fd`).
- **Lymphatic** — Charlotte (CEU lymphatic + post-surgical), Tif (lymphatic + edema) (`92a66fd`).

**Tif's rough-in** traces to 2026-05-07: the user supplied her website profile (Swedish, deep tissue, lymphatic, pre/post-natal, TMJ/facial) and photo, noting **"She doesn't have a cal.com handle yet but yes use similar to other therapists"** and that her review card is a stub to fill later. Per-skill blocks for her exist on prenatal/deep-tissue/TMJ/lymphatic; her Book button still routes to the `/confirmation/` demand-test page until a calendar is provisioned (item 15, `project_therapist_roster.md`). Tif and path-anchored recommendation matching shipped in `ad8931a`; the "remove social-proof card until we have a real review" call (Brookelyn/Lindsey/Tif) was made 2026-05-08 and shipped in `6c8b584`.

## Cross-cutting polish decisions worth remembering

A few non-section decisions from the same sessions that affect any new page:

- **Standalone therapist pages must NOT get `?page_variant=b&flow=b` appended.** The user caught this leaking onto `/charlotte/` etc. on 2026-05-08 ("the B variant in the URL is being attached... when it should not on these"). URL stamping was dropped on standalone pages in `990640c`. New skill pages *do* stamp `page_variant=<skill>` & `flow=<skill>` (item 1); standalone therapist pages do not.
- **Lightbox UX:** phone back-button should walk the lightbox views, not exit the page (`ad8931a`); detail panel opens scrolled to the top (face first), credentials moved below the specialty pills so the Google review sits just above the price/offer (`493e654`); scroll-to-top on every view change.
- **Tags cap:** the user set the chip limit himself — "limit the number of chips to maybe 8 or so" with per-line credentials for readability (2026-05-08). That's the 8-tag cap in Step 2.
- **The `/add-skill-page` skill itself** was the user's idea, 2026-06-15: "lets build a skill for this since Id like to make more funnels like this in the future" — authored in `a90fb2e`. The portability goal that frames Phase 6 was stated 2026-06-18: package the engine "to make additional pages but also to package it all up and duplicate it into another client say in a different city in an entirely different clinic with entirely different therapists and entirely different skills. That is the ultimate goal."

---

# Booking-flow architecture — decisions and the *why* (Phase 1, in progress)

> **Why this section exists.** This is the factory's shared brain for the booking layer. We're not just wiring Cal.com onto Maximum Health's pages — we're defining the booking pattern every future client inherits. So each decision below is recorded with its *reasoning*, in the repo (not just a maintainer's local memory), so a teammate with zero prior context can replicate the thinking and not silently undo it. Decisions captured live as they're settled; this section is the running record for Phase 1. Durable Maximum-Health-specific facts (payloads, ids) are cross-referenced to memory; the *reasoning* lives here because reasoning is what has to travel.

**Status:** discovery + design settled (June 2026); implementation pending. The funnel today still ends at the demand-test `/confirmation/` page — these decisions describe the booking flow that replaces it.

## The funnel, end to end

```
Ad click (UTMs/gclid on URL)  →  skill page  →  quiz (→ recommended therapist)
  →  "Book with <therapist>"  →  Cal.com calendar opens IMMEDIATELY (no form of ours)
  →  visitor picks a time + enters name/email/phone in CAL.COM's own form  →  booking succeeds
  →  ┌ CHANNEL A (browser): bookingSuccessfulV2 → fire count-only ad conversion + redirect to /booking-confirmed/
     └ CHANNEL B (server):  BOOKING_CREATED webhook → full record (name/email/phone) → bookings_<skill> + cap count
```

## Decision 1 — Calendar-first, never a lead form before the calendar

`Book Now` / `Book with <therapist>` opens the Cal.com calendar **immediately**. No name/email/phone step of ours in front of it. **Why (user, 2026-06-19):** seeing live availability the instant they click is the expectation and pulls them straight into "does Tuesday at 6 work for me?" — they're engaged in *answering*, not deciding whether to start. The calendar is just one more easy, natural question ("what time are you available?"), and people resist leaving a presented question unanswered. A form first interrupts that momentum with an unrelated ask and hands them an off-ramp. Same completion-bias logic as opening the quiz with an easy question. Judged to maximize conversion. The old `lead-form` lightbox view is **retired for the active flow** — kept only as the fallback for therapists with no Cal.com handle (Decision 5). Memory: `feedback_calendar_first_no_preform.md`.

## Decision 2 — Two data channels, because the browser event is lean

A live test booking (2026-06-19) proved the client-side `bookingSuccessfulV2` event carries **only** booking `uid`, `title` (names embedded in a string), `startTime`/`endTime`, `eventTypeId`, `status`. It does **not** carry attendee email, phone, or the UTMs/gclid — even when those are passed as embed query params. So the flow splits:
- **Channel A (browser event) → conversion + redirect.** Doesn't need contact info. We push `booking_id`/`scheduled_time`/`event_type_id` from the event plus `skill`/`recommended_therapist_id`/UTMs **from our own page state** (we already hold those), fire the ad + GA conversion, and redirect to `/booking-confirmed/`.
- **Channel B (`BOOKING_CREATED` webhook) → the record.** Cal.com's server POSTs the full payload (name/email/phone) to our backend, which writes `bookings_<skill>` and increments the monthly cap. Also more reliable than a client POST (fires even if the browser closes mid-redirect). **Why this matters for the factory:** the webhook is also the Phase 6 Cloudflare-Worker entry point — same contract, just a different endpoint URL. Memory: `project_calcom_booking_integration.md`.

## Decision 3 — Contact details come from Cal.com + the webhook, not from us

Because of Decision 1 (no pre-form), our page never sees what the visitor types into Cal's form. So the **only** source of email/phone for our own records is Channel B. **Why keep our own copy at all** (vs. letting Cal.com/Jane hold it): we want to reconcile bookings against ad spend at contact level, own the lead data for follow-up, and get reliable server-side cap counts. The webhook is a one-time setup and is the same pattern we migrate to a Worker in Phase 6. Jane gets the UTM/skill note via Cal.com **prefill** (we pass it into the booking at embed time), *not* via the webhook — keep those two mechanisms distinct.

## Decision 4 — Ad conversion fires count-only (no conversion value)

The Google Ads `booking_confirmed` conversion (`AW-17632628958`) fires with **no value** — Google optimizes toward number of bookings. **Why:** simplest to start; the tag is wired value-ready so a value (e.g. $49 starter, or new-patient LTV) can be added later as a one-field GTM change without re-instrumenting. User decision, 2026-06-19.

## Decision 5 — Inactive therapists fall back to the demand-test page

A therapist without a provisioned Cal.com handle (currently Tif) keeps an `active: false` flag; her Book button routes to the existing `/confirmation/` "hold a spot" page instead of the calendar. Flipping `active: true` is the one-char change that turns on her real booking flow. **Why:** lets us run ad traffic to her page and capture demand before her calendar exists, without showing a broken/empty calendar. Memory: `project_therapist_roster.md`.

## Decision 6 — One canonical post-booking confirmation page (`/booking-confirmed/`), reconcile in-build

There are currently **two** post-booking thank-you pages doing the same job: the legacy **`/appointment-confirmed/`** that the standalone therapist pages (`/brookelyn/` etc.) already redirect to after a Cal.com booking, and the new branded **`/booking-confirmed/`** the plan builds for the lightbox funnel (Phase 1.1). **There is no meaningful semantic difference between "appointment" and "booking" here** — the two URLs are incidental, born at different times in different parts of the funnel, not a deliberate distinction. **Decision (2026-06-19): standardize on `/booking-confirmed/` as the single canonical page**, and repoint the standalone pages' `bookingSuccessfulV2` redirect at it (forwarding the same context params), retiring `/appointment-confirmed/`. **Why `/booking-confirmed/` wins:** it matches the rest of the new instrumentation vocabulary — the GTM custom event is `booking_confirmed` and the Cal event is `bookingSuccessfulV2`, so "booking" is already the term of art; aligning the page name keeps event→page naming consistent. **Treated as core Phase 1.1, not a Phase 7 polish item** (the user pulled it out of the Phase 7 backlog 2026-06-19) — the consolidation ships with the booking flow, not at the end, so we never run two divergent confirmation pages in production.

## Channel B — `BOOKING_CREATED` webhook field map + design (captured 2026-06-20)

The webhook payload shape is identical across clients (it's Cal.com's, not ours), so this map is factory-reusable. Everything lives under `payload`:
- **Join key to Channel A:** `payload.uid` (same uid the browser event reports as `data.uid`); `payload.bookingId` is the numeric internal id.
- **Patient:** `payload.attendees[0].{firstName,lastName,name,email,phoneNumber}` — the contact fields the browser event lacked.
- **Therapist (organizer):** `payload.organizer.{username,name,email}` (e.g. `username: "bbrolly"`).
- **When/what:** `payload.startTime`/`endTime`, `payload.length` (minutes, session+buffer), `payload.eventTypeId`, `payload.status`, `payload.location`.
- **Attribution:** `payload.responses.{utm_source,utm_medium,utm_campaign,gclid}` (+ `payload.userFieldsResponses`). The Cal event type **already carries hidden `utm_source/medium/campaign/gclid` fields** — empty unless the embed prefills them — so UTM passthrough into the webhook + Jane note works once we prefill. `utm_term`/`utm_content` are NOT defined yet.

**Design (Channel B is the single writer of the booking record):** add hidden **`skill`** and **`recommended_therapist_id`** fields to each Cal event type (same pattern as the existing UTM fields) and prefill them — plus the UTMs — via the embed. The webhook then carries contact + attribution + skill + therapist, so the backend writes `bookings_<skill>` and increments `bookings_count` from the webhook alone; Channel A stays conversion+redirect only. Identify the therapist from `organizer.username` or the prefilled `recommended_therapist_id`.

## Open discovery items / build decisions

- **Hidden fields to add to each Cal event type:** `skill`, `recommended_therapist_id`, and (if we want all five UTMs) `utm_term` + `utm_content`. Without these, the webhook can't route to `bookings_<skill>` or carry full attribution.
- **`/booking-confirmed/` "what happens next" copy (decided 2026-06-20):** offer **no** self-service reschedule/cancel — not via Cal (stays disabled) and **nowhere on our pages**. Patients get an email from **Jane** with their account details and reschedule/cancel **from within their Jane account**. The page sets that expectation (watch for the Jane email; manage your appointment there). Overrides the plan brief's "cancellation/reschedule link via Cal.com" item.
- **Phase 1.7 GTM spec** — data-layer variables → `booking_confirmed` custom-event trigger → re-target `AW-17632628958` (count-only) → new GA4 event tag. Drafted; folds into this skill so future clients reuse the pattern.

## How we record decisions going forward (the cadence)

Two tiers, deliberately:
1. **This repo (SKILL.md / docs) = the shared source of truth.** Every load-bearing decision *and its why* lands here so it travels to any teammate or client. Reasoning is the thing that must survive a context handoff — capture it, not just the outcome.
2. **Maintainer memory (`.claude/projects/.../memory/`, gitignored) = a local fast-recall cache.** Keeps the active maintainer consistent across sessions; never the source of truth, never where a decision lives *only*. Memory and repo are kept in sync — if it's load-bearing, it exists in both.

---

# Phase 6 — repo & deployment architecture (decided 2026-06-19)

**Decision: separate repos — a private *factory/engine* repo + one private repo *per client*. Not a monorepo.** This is the structure the factory ships into.

**Why (verified against current docs, June 2026):**
- **GitHub cost is a non-issue.** Unlimited private repos on every plan including Free (since 2019). Repo count costs nothing; the Team plan ($4/user/mo) buys seats + collaboration features, not repos. So nothing pushes us toward a monorepo for cost.
- **Cloudflare Pages penalizes many-projects-per-repo.** Pages supports multiple projects per repo, each with its own root directory + custom domain — **but the default cap is 5 Pages projects per repository** (increase only by request). A monorepo with one project per client therefore caps at ~5 clients. Worse, by default **any file change rebuilds every project connected to that repo**, burning the 500-builds/month Free budget and coupling all clients' deploys. (Account-wide soft limit is 100 projects; custom domains 100/project on Free.)
- **Separate repos win on the axes that matter:** 1 Pages project per client repo → no 5-per-repo wall, clean build isolation (a client push builds only their site, own custom domain), blast radius limited to one client, per-client access scoping + clean client handoff, and the **"why"/factory docs live only in the private factory repo, never in a client deploy repo.**
- **The one cost — engine propagation — is cheap here** because of the hard no-build-step / plain-static-HTML rule. The factory repo holds the engine + this SKILL.md (the why) + a **template**; each client repo is stamped from the template with the engine **vendored in** (copy, or `git subtree`/submodule). Engine upgrades are **re-synced deliberately** into client repos — which is safer than a monorepo where one push can rebuild/break every client at once.

**Implication for this repo:** under this model `maximummassage` becomes (or seeds) a per-client repo, and the engine + SKILL.md migrate to the private factory repo. Nothing committed so far is locked — it's all reorganizable when Phase 6 is formalized.

**Sources:** [Cloudflare Pages monorepos](https://developers.cloudflare.com/pages/configuration/monorepos/) · [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/) · [GitHub pricing/plans](https://docs.github.com/en/enterprise-server@3.12/get-started/learning-about-github/githubs-plans).

**Open (formalize in Phase 6):** the factory-repo → client-repo template mechanics — the exact vendoring method (copy vs subtree vs submodule) and the engine-sync workflow.
