# Maximum Health — go.maximummassage.ca

Paid-ads landing site for Maximum Health Massage Therapy in Calgary. The site
is **not for SEO** — `go.maximummassage.ca` is locked down to paid traffic only
(crawlers blocked at the Cloudflare dashboard). Don't propose SEO work.

> **When you change a behavior, update this README.** It's the single source of
> truth for what's wired together; keep it in sync with the code.

---

## Live URLs

| Path | What it is |
| --- | --- |
| `/massage-therapy-calgary/` | Public entry — Cloudflare splitter routes to flow A or flow B |
| `/massage-therapy-calgary-flow-a/` | Flow A control (Landingi-exported design, Tally quiz) |
| `/massage-therapy-calgary-flow-b/` | Flow B variant (same Flow A design, different CTA target) |
| `/massage-therapy-calgary-flow-b/confirmation/` | "Hold a spot for me" page after lead capture |
| `/massage-therapy-calgary-flow-b-v1/` | Archived previous Flow B (mobile-first design) — preserved for rollback, gets no live traffic |
| `/brookelyn/`, `/meagan/`, `/charlotte/`, `/lindsey/` | Per-therapist detail pages |

---

## A/B split

The Cloudflare Pages function in [`functions/_lib/split.js`](functions/_lib/split.js)
sticks a visitor to either Flow A or Flow B and stamps `page_variant=a|b` plus
`flow=a|b` query params so attribution flows through Tally → Apps Script → Sheet.

The splitter ramp is currently set to **0% Flow B** until polish completes.

---

## Flow A (control)

- Pure Landingi export under `public/assets/css/landingi/` and
  `public/assets/js/landingi/`.
- CTAs all anchor to a removed quiz section. A small inline IIFE intercepts
  clicks on labels starting with "Take the Quiz" and opens a
  full-screen Tally form (`tally.so/embed/0QPyJQ`) in a modal.
- On Tally submit, the form redirects the iframe to a per-therapist URL
  (`/brookelyn/`, `/meagan/`, `/charlotte/`, `/lindsey/`).
- Page-level overrides in [`public/assets/css/overrides.css`](public/assets/css/overrides.css).

## Flow B (variant)

- HTML is a copy of Flow A's Landingi page so both variants look identical.
- Inline IIFE in [`index.html`](public/massage-therapy-calgary-flow-b/index.html):
  - stamps `page_variant=b`/`flow=b` onto the URL
  - persists UTMs to sessionStorage
  - tags every Flow A CTA with `data-open-picker`
- [`public/js/therapist-picker.js`](public/js/therapist-picker.js) hooks
  `[data-open-picker]` and opens the **therapist picker lightbox**:
  1. Tally quiz (currently **bypassed** — see "Tally quiz toggle" below)
  2. Therapist grid (Brookelyn, Meagan, Charlotte, Lindsey shown live;
     Kassandra, Tracy shown disabled / fully booked)
  3. Therapist detail panel
  4. Lead-capture form (first/last name, email, phone)
  5. POST to Apps Script → redirect to `/confirmation/`
- Picker styles are isolated to the overlay in
  [`public/css/picker.css`](public/css/picker.css) so they don't clash with
  Landingi's absolute-positioned widgets.

### Tally quiz toggle

[`public/js/therapist-picker.js`](public/js/therapist-picker.js) has a
`SKIP_QUIZ_FOR_DESIGN_REVIEW` constant. While polishing the page, it's `true`
so each CTA click lands directly on the therapist grid. **Flip back to `false`
before opening the splitter past 0%.**

### Confirmation page (`/massage-therapy-calgary-flow-b/confirmation/`)

Reads `mh_lead` from sessionStorage (written by the picker on form submit) and
shows a personalized "Sorry, [Firstname]…" headline.

Two paths from the ask state:
- **Yes, hold a spot for me** → spinner for ~3.5s → thanks state. Posts
  `action: "notify"` with `notify_preference: "yes"`.
- **No thanks** (small text link) → `action: "notify"` with `"no"` → noted state.

The thanks state shows the user's actual phone + email and a "Not right? Edit
details" link. Saving fires `action: "update_contact"` to the Apps Script,
which finds the existing row by GCLID (or old email) and overwrites Phone /
Email.

---

## Lead capture / Google Sheet

Front-end POSTs go to a Google Apps Script web-app endpoint (URL stored as
`LEAD_CAPTURE_ENDPOINT` in
[`public/js/therapist-picker.js`](public/js/therapist-picker.js) and
[`confirmation/index.html`](public/massage-therapy-calgary-flow-b/confirmation/index.html)).

The Apps Script source lives in [`public/js/apps-script-lead-capture.gs`](public/js/apps-script-lead-capture.gs)
**but that file is not the deployed code.** Apps Script runs from a Google
Sheet. Keep them in sync manually — see the [Apps Script deployment](#apps-script-deployment)
section below.

Actions handled:
- `lead` → append a new row
- `notify` → set Notify Preference (yes/no) on the row, matched by GCLID then email
- `update_contact` → overwrite Phone + Email on the row, matched by GCLID then old email

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

### Cloudflare Pages

Pushing to `main` triggers an auto-deploy. No manual step.

### Splitter ramp

To change the Flow B traffic share, edit the rollout percentage in
[`functions/_lib/split.js`](functions/_lib/split.js) and push.

---

## Local development

```bash
npx http-server public -p 8765 -c-1
# then visit http://127.0.0.1:8765/massage-therapy-calgary-flow-b/
```

There is no build step for the landing pages — they're served as-is from
`public/`. The `npm run build:monthly` script in [`package.json`](package.json)
is for the unrelated monthly EHR reports under [`reports-workspace/`](reports-workspace/).

---

## Repo layout

```
public/
├── _headers, _redirects        Cloudflare Pages config
├── massage-therapy-calgary-flow-a/    Flow A landing page
├── massage-therapy-calgary-flow-b/    Flow B landing page + /confirmation/
├── massage-therapy-calgary-flow-b-v1/ Archived previous Flow B
├── brookelyn/, meagan/, charlotte/, lindsey/   Per-therapist pages
├── assets/css/landingi/        Landingi-exported CSS (Flow A and shared)
├── assets/css/overrides.css    Project-level Landingi overrides
├── css/shared.css, flow-b.css  Confirmation page styles
├── css/picker.css              Therapist-picker overlay styles
├── js/therapist-picker.js      Picker overlay + Tally quiz integration
├── js/utm-capture.js           UTM persistence helper
└── js/apps-script-lead-capture.gs   Source-of-truth for the deployed Apps Script
functions/_lib/split.js         Cloudflare A/B splitter
scripts/, reports-workspace/    Unrelated EHR monthly-report tooling
```
