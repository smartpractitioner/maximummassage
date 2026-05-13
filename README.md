# Maximum Health — go.maximummassage.ca

Paid-ads landing site for Maximum Health Massage Therapy in Calgary. The site
is **not for SEO** — `go.maximummassage.ca` is locked down to paid traffic only
(crawlers blocked at the Cloudflare dashboard). Don't propose SEO work.
Skill-specific landing pages exist to match paid-ad intent, not to rank.

> **When you change a behavior, update this README.** It's the single source of
> truth for what's wired together; keep it in sync with the code.

---

## Live URLs

| Path | What it is |
| --- | --- |
| `/massage-therapy-calgary/` | Public entry — Cloudflare splitter (currently 100% Flow B) |
| `/massage-therapy-calgary-flow-b/` | Flow B "general" landing page (catch-all for broad searches) |
| `/prenatal-massage-calgary/` | Prenatal / postnatal / postpartum skill page |
| `/deep-tissue-massage-calgary/` | Deep tissue skill page *(in progress)* |
| `/sports-massage-calgary/` | Sports rehab skill page *(in progress)* |
| `/tmj-massage-calgary/` | TMJ + jaw + tension headache skill page *(in progress)* |
| `/lymphatic-drainage-massage-calgary/` | Lymphatic drainage skill page *(in progress)* |
| `/massage-therapy-calgary-flow-b/confirmation/` | Shared "Hold a spot for me" page after lead capture (used by every skill page) |
| `/massage-therapy-calgary-flow-a/` | Flow A archived control (Landingi design) — no live traffic, kept for rollback |
| `/massage-therapy-calgary-flow-b-v1/`, `…-v2/` | Earlier Flow B snapshots, preserved for rollback |
| `/brookelyn/`, `/meagan/`, `/charlotte/`, `/lindsey/`, `/tif/` | Per-therapist standalone pages (Flow A artifacts; not in the active funnel) |

---

## Edge splitter (Cloudflare Pages Function)

[`functions/_lib/split.js`](functions/_lib/split.js) sits in front of
`/massage-therapy-calgary/` and rewrites to either `flow-a` or `flow-b` based
on a percentage constant, then sets a `mh_flow` cookie so returning visitors
stick to the same variant.

- **Current state: 100% Flow B.** `FLOW_B_PERCENTAGE = 100` (set 2026-05-02).
- At the 0 or 100 extremes the splitter ignores the stale cookie so retired-
  variant visitors don't get stranded.
- Splitter also stamps `page_variant=a|b` plus `flow=a|b` query params for
  attribution. Skill pages do the same with their own slug
  (`page_variant=prenatal`, etc.) via an inline IIFE in each page.

---

## Page architectures

### Flow B "general" (`/massage-therapy-calgary-flow-b/`)

The catch-all for broad searches ("massage therapy calgary"). Uses **Tally
quiz** in the lightbox.

- HTML at [`public/massage-therapy-calgary-flow-b/index.html`](public/massage-therapy-calgary-flow-b/index.html)
  — full Flow B v3 redesign (9 sections, cream theme, $49 offer card, 100%
  guarantee, 13-item general FAQ).
- CSS inlined into the page for render-blocking elimination (see comments
  near top of file).
- Loads `picker-config.js` + `therapist-picker.js`. Page config resolves to
  `skill: 'general'` with `quizQuestions: null`, which makes the picker fall
  back to the Tally iframe (form ID `0QPyJQ`).

### Skill-specific landing pages

One page per paid-ad intent. Each page is a **unique HTML document** using
the **shared Flow B v3 design system** (`/css/flow-b-v3.css` + `/css/picker.css`),
not a clone of the general page. Page-specific copy, modality-relevant
hero image, page-specific FAQ, page-specific benefits section, retuned
final CTA. Reference benchmark for structure: [hayahaymassage.ca](https://hayahaymassage.ca/)
— same modality-first pattern, intent-paired `[Modality] for [Benefit]`
headlines, dedicated benefits + what-to-expect sections where applicable.
Do **not** cross-link between service pages — these are paid-ad funnels,
not SEO web pages.

Each skill page:

1. Loads `flow-b-v3.css` + `picker.css` (shared design system)
2. Loads `picker-config.js` *before* `therapist-picker.js`
3. Drops `picker-config.js` `PAGE_CONFIGS` entry into the picker, which
   resolves the URL → `skill` + per-skill quiz questions + sheet tab name
4. Stamps `page_variant=<skill>&flow=<skill>` on the URL via inline IIFE
5. Routes lead-form submission to the shared `/confirmation/` page

Skill pages share with the general page: sticky topbar, $49 offer card,
guarantee block, footer.

Skill pages do their own version of: hero (copy + image), benefits list,
why-work-with-us subhead, healing section subhead, FAQ items, final CTA,
JSON-LD `FAQPage` data.

---

## Therapist picker (lightbox)

[`public/js/therapist-picker.js`](public/js/therapist-picker.js) is the
shared lightbox loaded on every page. Same UX everywhere: quiz → grid →
detail → lead form → redirect to `/confirmation/`.

### Data model — `general` + per-skill overrides

The `therapists` array at the top of the file has flat fields that
represent the **general** profile (title, specialty, bio, tags, experience,
review). For per-skill tuning, a therapist gets a `skills.<skillId>` block
with override fields:

```js
{
  id: 'lindsey',
  // ... general profile (flat fields)
  title: 'Prenatal & postnatal + fascia release specialist',
  specialty: 'Prenatal & Postnatal + Fascia Release',
  bio: '...',
  tags: [...],
  // ...
  skills: {
    prenatal: {
      title: 'Prenatal & postpartum specialist',
      specialty: 'Prenatal yoga + doula',
      bio: '...first-person bio for prenatal...',
      tags: [...]
    }
    // future skills go here
  }
}
```

`getProfile(t, skill)` returns the merged profile — override fields fall back
to the flat-field general values for anything the override doesn't redefine.
`hasSkill(t, skill)` returns true if a therapist offers that skill.
`visibleTherapists()` filters the grid by current page's skill (general
shows everyone; skill pages show only those with that skill defined).

### Page config — `picker-config.js`

[`public/js/picker-config.js`](public/js/picker-config.js) exposes
`window.MaximumHealth.PAGE_CONFIGS` mapping pathname → config:

```js
'/prenatal-massage-calgary/': {
  skill: 'prenatal',
  sheetTab: 'leads_prenatal',
  quizQuestions: [...]   // 4 weighted questions
}
```

`resolvePageConfig(pathname)` handles exact, trailing-slash, and prefix
matches. Picker reads this on init; if nothing matches, defaults to
`skill='general'` + Tally quiz.

### Native quiz (skill pages only)

When the active page config has `quizQuestions`, `showQuiz()` renders a
native multi-step quiz instead of the Tally iframe. Sequence:

1. Question 1 displays with all options as large buttons
2. Tapping an option records the answer's `weights` map (per-therapist
   point contributions) and auto-advances
3. After the final question, compute totals per therapist, recommend
   the highest-scoring one
4. Fire-and-forget `action: 'quiz_submission'` to the Apps Script (writes
   the answers + UTMs to `quiz_<skill>` tab)
5. Call `showGrid(recommendedId)` so the picker grid loads with the
   "We recommend" badge already on the right card

Quiz questions are deliberately ordered easy → harder to build completion
bias. First question is always a low-effort fact about the visitor
(e.g. "Where are you right now?"); last question is the most reflective.

### Tally quiz (general / Flow B only)

When `quizQuestions` is null, picker falls back to embedding the Tally
form (`tally.so/embed/0QPyJQ`). Recommendation comes from a path-anchored
regex on the postMessage payload — matches the redirect URL slug in
`brookelyn|meagan|charlotte|lindsey|tif`. The regex is path-anchored
(`/[\/=](id)(?:[\/?#&"']|$)/i`) so it doesn't false-positive on therapist
names appearing in quiz option text.

---

## Lead capture / Google Sheet

Front-end POSTs go to a Google Apps Script web-app endpoint (URL stored
as `LEAD_CAPTURE_ENDPOINT` in
[`public/js/therapist-picker.js`](public/js/therapist-picker.js) and
[`confirmation/index.html`](public/massage-therapy-calgary-flow-b/confirmation/index.html)).

The Apps Script source lives in
[`public/js/apps-script-lead-capture.gs`](public/js/apps-script-lead-capture.gs)
**but that file is not the deployed code.** Apps Script runs from a Google
Sheet — keep them in sync manually (see [Apps Script deployment](#apps-script-deployment)).

### Per-skill sheet tabs

Every payload carries a `skill` field (pulled from the page config and
piped through `collectUtms()` companion fields). Apps Script routes:

- `action: lead` / `notify` / `update_contact` → `leads_<skill>` tab
  (defaults to legacy `Leads` tab if skill is `general` or missing,
  for backward compatibility with Flow B "general" rows)
- `action: quiz_submission` → `quiz_<skill>` tab (NEW; logs quiz answers
  + UTMs before the visitor reaches the lead form)

Tabs auto-create with the right header row on first write.
`syncHeaders()` extends the header row when new columns are added to
`LEAD_HEADERS` / `QUIZ_HEADERS`, so adding columns over time doesn't
require manual sheet edits — just redeploy.

### Confirmation page (`/massage-therapy-calgary-flow-b/confirmation/`)

**Shared by every skill page.** Reads `mh_lead` from sessionStorage
(written by the picker on form submit) and personalizes the headline.

Two paths from the ask state:
- **Yes, hold a spot for me** → spinner ~3.5s → thanks state. Posts
  `action: "notify"` with `notify_preference: "yes"` plus a CASL consent
  record (client IP from `api.ipify.org`, ISO timestamp, user agent,
  the phone + email being consented to, verbatim consent text). Apps
  Script writes these into the Consent IP / Consent At / Consent User
  Agent / Consent Phone / Consent Email / Consent Text columns of the
  appropriate `leads_<skill>` tab.
- **No thanks** → `action: "notify"` with `"no"` → noted state. No
  consent fields written.

The thanks state shows the user's actual phone + email and a "Not
right? Edit details" link. Saving fires `action: "update_contact"`,
which finds the existing row by GCLID (or old email) and overwrites
Phone / Email.

UTMs and the `skill` field travel through the entire chain so attribution
and per-skill row routing stay consistent through `notify` and
`update_contact` updates.

---

## Manual deployment steps

These don't happen automatically when you push. Don't forget them.

### Apps Script deployment

When [`public/js/apps-script-lead-capture.gs`](public/js/apps-script-lead-capture.gs) changes:

1. Open the Google Sheet that backs the leads.
2. **Extensions → Apps Script.** This opens the script editor.
3. Replace the entire `Code.gs` contents with the contents of
   [`public/js/apps-script-lead-capture.gs`](public/js/apps-script-lead-capture.gs).
4. **Save.**
5. **Deploy → Manage deployments → pencil icon on the active deployment →
   Version: New version → Deploy.**
6. The deployment URL stays the same, so no front-end changes are needed.

### GA4 server-side tracking (Cloudflare Pages Function)

GA4 events are fired from the edge via [`functions/track.js`](functions/track.js)
instead of the client-side `gtag.js` bundle. This saves ~160 KB on every
page load. Setup is a one-time manual procedure:

1. **Create a GA4 Measurement Protocol API secret.**
   - GA4 admin → **Data Streams** → click the web stream for
     `G-DVHL7E1D9C` → **Measurement Protocol API secrets** → **Create**.
   - Give it a nickname like "Cloudflare edge". Copy the secret value.
2. **Add it to Cloudflare Pages env vars.**
   - Cloudflare dashboard → Pages → maximummassage → **Settings → Environment
     Variables**.
   - Add `GA4_API_SECRET` to **both** Production and Preview environments.
   - Paste the secret value. Save.
   - The next deploy picks it up automatically; push any commit to redeploy.
3. **Verify in GA4 Realtime.** Visit the live URL, then check
   GA4 → Reports → Realtime → expect a `page_view` event within ~30s.
4. **Disable the client-side GA4 tag in GTM** (GTM container
   `GTM-5M8LTCF8` → GA4 Page View tag → trigger to None → Submit + Publish).

The Google Ads conversion tag (`AW-17632628958`) is still client-side
through GTM. Migrating it to the edge needs Google Ads Enhanced Conversions
API — separate work.

### Cloudflare Pages auto-deploy

Pushing to `main` triggers auto-deploy. No manual step.

### Cloudflare zone settings (verified 2026-05-06)

Don't change these unless you understand why. The current state is the
result of perf tuning:

- **Speed → Optimization → Auto Minify:** deprecated by Cloudflare — toggle
  no longer takes effect. Don't try to enable.
- **Speed → Optimization → Brotli:** ON (also deprecated as toggle — always
  on for non-Enterprise zones).
- **Speed → Optimization → Early Hints:** ON.
- **Speed → Optimization → Rocket Loader:** OFF. Keep it off — it rewrites
  JS in ways that fight our explicit Tally / GTM / picker init ordering.
- **Caching → Configuration → Browser Cache TTL:** "Respect Existing
  Headers". `public/_headers` declares `max-age=14400` (4h) on static assets.

### Splitter ramp

Edit `FLOW_B_PERCENTAGE` in
[`functions/_lib/split.js`](functions/_lib/split.js) and push. At 0 or 100
the splitter ignores stale `mh_flow` cookies so retired-variant visitors
don't get stranded.

---

## Adding a new skill page (checklist)

1. **Pick the URL slug** — `<modality>-massage-calgary` is the established
   pattern.
2. **Add `skills.<skillId>` blocks** to the relevant therapists in
   [`public/js/therapist-picker.js`](public/js/therapist-picker.js).
   Each block needs: `title`, `specialty`, `bio` (first-person, mobile-
   conversational, two paragraphs separated by `\n\n`), `tags` (up to ~8
   chips, more if heavily credentialed). `experience` and `review` inherit
   from the general profile by default.
3. **Add a PAGE_CONFIGS entry** in
   [`public/js/picker-config.js`](public/js/picker-config.js) with the
   skill id, sheet tab name, and 3-5 weighted quiz questions. First
   question should be easy; build completion bias toward the harder
   questions later.
4. **Create the page** at `public/<slug>/index.html`. Clone an existing
   skill page (e.g. `/prenatal-massage-calgary/index.html`), then rewrite:
   hero copy + image, benefits section (6 bullets, modality-specific),
   why-work-with-us subhead, healing subhead, FAQ items (10 modality-
   specific Q+A) + matching FAQPage JSON-LD, final CTA copy. Add a
   "What a session looks like" 3-step section between Benefits and Why
   when pre-booking anxiety is real for that modality.
5. **Update the page-stamping inline script** so it stamps
   `page_variant=<skill>&flow=<skill>`.
6. **No cross-links** between skill pages — these are paid-ad funnels,
   not SEO pages. One funnel per page.
7. **Redeploy Apps Script** so `leads_<skill>` and `quiz_<skill>` tabs
   auto-create on first write.
8. **Update this README's Live URLs table** with the new page.

---

## Local development

```bash
npx http-server public -p 8087 -c-1
# then visit http://127.0.0.1:8087/prenatal-massage-calgary/
```

There is no build step for the landing pages — they're served as-is from
`public/`. The `npm run build:monthly` script in [`package.json`](package.json)
is for the unrelated monthly EHR reports under
[`reports-workspace/`](reports-workspace/).

---

## Repo layout

```
public/
├── _headers, _redirects                              Cloudflare Pages config
├── massage-therapy-calgary-flow-b/                   Flow B "general" landing page + /confirmation/
├── prenatal-massage-calgary/                         Skill page: prenatal/postnatal/postpartum
├── deep-tissue-massage-calgary/                      Skill page: deep tissue (in progress)
├── sports-massage-calgary/                           Skill page: sports rehab (in progress)
├── tmj-massage-calgary/                              Skill page: TMJ (in progress)
├── lymphatic-drainage-massage-calgary/               Skill page: lymphatic drainage (in progress)
├── massage-therapy-calgary-flow-a/                   Flow A archived control (no live traffic)
├── massage-therapy-calgary-flow-b-v1/, …-v2/         Earlier Flow B snapshots, kept for rollback
├── brookelyn/, meagan/, charlotte/, lindsey/, tif/   Per-therapist standalone pages + source docs
├── images/flow-b-v3/                                 Flow B v3 design-system assets (logo, hero, icons)
├── images/therapists/                                Therapist portraits
├── css/flow-b-v3.css                                 Shared design system (used by every Flow B / skill page)
├── css/picker.css                                    Therapist-picker overlay styles
├── css/shared.css, flow-b.css                        Confirmation page styles
├── js/picker-config.js                               Page → skill / quiz / sheet-tab mapping
├── js/therapist-picker.js                            Picker overlay + native quiz + Tally fallback
├── js/utm-capture.js                                 UTM persistence helper
└── js/apps-script-lead-capture.gs                    Source-of-truth for the deployed Apps Script
functions/
├── _lib/split.js                                     Cloudflare A/B splitter (currently 100% Flow B)
├── massage-therapy-calgary.js, .../index.js          Splitter entry points
└── track.js                                          GA4 server-side tracking endpoint
scripts/, reports-workspace/                          Unrelated EHR monthly-report tooling
```
