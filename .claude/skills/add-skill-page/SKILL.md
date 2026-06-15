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
