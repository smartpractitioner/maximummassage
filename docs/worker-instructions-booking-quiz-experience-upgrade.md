# Worker instructions — Booking + quiz experience upgrade (engine-level)

> **REVISED 2026-07-15:** Part B's Cal.com API proxy is now a **Cloudflare Pages Function** (following `functions/track.js`), NOT Apps Script. If you read this file during Part A, re-read the "Proxy the Cal.com API…" subsection under Part B before building it.

> **Read this whole brief before starting.** This is a **shared-engine** upgrade to the picker/quiz/booking funnel in `public/js/therapist-picker.js` + `public/css/picker.css`. It is NOT prenatal-content work — it changes the funnel *engine*, so it propagates to every skill page and every future client automatically. Do the work + QA on the **prenatal page** (canonical template), then it benefits all pages.
>
> **Decided 2026-07-15 (Victor).** Design target: the "Book a free strategy call" lightbox at **leadgenjay.com/consult** (mobile). Pulled forward from Phase 8 items 8.10 (custom calendar UI) + 8.11 (quiz/picker polish) into active work as **plan Phase 3.5**. The PractiCal engine swap (8.1) stays Phase 8 — do NOT touch the Cal.com *engine*, only its *UI*.
>
> **Two parts, done ONE AT A TIME with an approval gate between them.** Ship **Part A (quiz/picker polish) first** — it's cheap, low-risk, self-contained. **Then STOP and wait for Victor's review + approval before starting Part B.** Do not begin Part B (the custom calendar) in the same pass. Part B specifics may be refined based on what Part A surfaces.
>
> **Reference screenshots:** Victor is providing a set of mobile screenshots of the leadgenjay.com/consult flow (contact step, 5 quiz questions with animated progress, matched-strategist card, month calendar, the tap-date-to-slots-column transition, and the slot-confirm). **These screenshots are the visual source of truth for the target look/feel — if you don't have them, ask Victor for them before starting.** You cannot see them otherwise, and you cannot easily walk that mobile lightbox flow yourself.

---

## Hard constraints (carry through both parts)

- **Keep Cal.com as the booking ENGINE.** We are replacing Cal.com's *iframe UI* with our own, driven by Cal.com's public API. Every booking is still a real Cal.com booking, so the entire downstream is preserved unchanged: the `BOOKING_CREATED` webhook still fires → `bookings_<skill>` + Jane sync + monthly-cap derivation + `/booking-confirmed/` conversion. **If any of that breaks, the change is wrong.**
- **No new framework / no build step.** Plain static HTML + vanilla JS + CSS, per the SKILL.md hard rule. Do NOT pull in Cal.com's React "Platform Atoms" or any bundler. Hand-roll the calendar component.
- **Calendar-first stays intact (Decision 1).** Booking still opens straight into availability — no lead form *before* the calendar. Contact details (name/email/phone) are collected as the **last** step, *after* the visitor picks a slot (Calendly-style). That preserves completion bias.
- **Preserve attribution (this is load-bearing).** `skill`, `recommended_therapist_id`, `user_id`, and all UTMs/`gclid` must still reach the booking so the webhook carries them. Today `calPrefillParams()` passes these into the embed URL; in the API flow they go into the booking-create request body. If `skill` is lost, `bookings_<skill>` routing + ROI attribution break (it has no fallback — one event type serves every skill page).
- **Brand = ours.** Use the client's brand tokens (currently in `flow-b-v3.css` / `picker.css`; post-Phase-7 these become `client-config.css`). Where you introduce new visual values (corner radius, animation timing), add them as CSS custom properties so the brand-capture step (plan 7.2a) can theme them per client. Behavior = engine default; look = token.
- **No em dashes in any user-facing copy. First-person / warm voice** per existing conventions.

---

## Part A — Quiz + picker interaction polish (was 8.11)

Port the *feel* of the leadgenjay quiz (Victor's screenshots, images 1-6), using OUR colors. Six changes, all in `therapist-picker.js` (quiz/selection/progress logic) + `picker.css` (transitions/styling):

1. **Rounded button corners** on quiz options + the primary CTA + picker cards. Softer radius than current. Expose as a CSS custom property (e.g. `--mh-radius-control`) so it's a brand token.
2. **Palpable selection animation.** When a visitor taps an answer, the **whole option card fills / illuminates in a gradual motion** (background eases to the brand tint + a check appears), rather than an instant state flip. Target ~300-400ms ease. THEN advance. (Check current behavior first: if the quiz currently auto-advances on tap, keep auto-advance but add the fill animation before the slide; if it uses a Continue button, keep the button but still animate the fill on tap. Confirm the auto-advance-vs-Continue choice with Victor if ambiguous — match the leadgenjay feel, which fills then advances.)
3. **Tactile radio styling** — the filled-circle-with-check treatment on the selected option (see images 2-5).
4. **Back button at the BOTTOM** of each quiz step (below the primary CTA), not the top.
5. **Smooth animated progress bar** — the fill **slides** to the new percentage with easing (CSS `transition` on width), never jumps in discrete jerks. (leadgenjay shows a thin bar that glides on each step.)
6. **Question-to-question transition** — a gentle slide/fade between questions so it feels like moving forward, not repainting.

All of the above are CSS transitions/animations + small JS timing tweaks. No dependencies. Respect `prefers-reduced-motion` (disable the non-essential animations for users who set it).

---

## Part B — Custom calendar UI on Cal.com's API (was 8.10)

Replace the Cal.com inline iframe (currently at ~`therapist-picker.js:1028`) with our own calendar, matching the leadgenjay flow (images 7-9): **month calendar → tap an available date → the calendar collapses and the view slides to a clean column of that day's time slots with a back button → tap a slot → confirm.**

### Proxy the Cal.com API through a Cloudflare Pages Function (NOT client-side, NOT Apps Script) — revised 2026-07-15

The two Cal.com API calls (slots read + booking create) run through a **Cloudflare Pages Function**, following the exact pattern **already in this repo** at [`functions/track.js`](../functions/track.js) (which proxies to GA4 with a secret held as a Cloudflare Pages environment variable). This supersedes any earlier "proxy via mhBackend/Apps Script" wording.

**Why a proxy is non-negotiable:** booking creation must never run in the browser — a write-capable key in client-side JS lets anyone spam or cancel bookings on the therapists' calendars — and Cal.com keys are account-level (broad), so the slots read can't safely expose one either. Both calls go server-side.

**Why a Pages Function specifically (not Apps Script):** it's faster (edge, sub-50ms, which matters because the visitor is waiting when they tap a date), it's the pattern already running in this repo, the key lives as a proper CF secret, and it deploys automatically with the normal Pages push — no wrangler, no separate Worker, no Apps Script redeploy ritual. It's also a natural first step toward the Phase 7 Cloudflare backend rather than throwaway Apps Script work.

**Build:** new Pages Function(s) — e.g. `functions/cal/slots.js` (GET availability) and `functions/cal/book.js` (POST create booking) — mirroring the `functions/track.js` structure (`onRequestGet` / `onRequestPost(context)`, read secrets from `context.env`, return JSON). The front-end calendar calls these **same-origin** endpoints (`/cal/slots`, `/cal/book`); the function attaches the secret Cal key and calls Cal.com; **the key never reaches the browser.**

**Manual step for Victor (keys — he already has them):** Victor has a **Cal.com API key per therapist calendar**. Add each as a **Cloudflare Pages environment variable** (Cloudflare → Pages → Settings → Environment Variables, set for **both** Production and Preview), keyed by therapist — e.g. `CAL_KEY_BROOKELYN`, `CAL_KEY_MEAGAN`, `CAL_KEY_CHARLOTTE`, `CAL_KEY_LINDSEY`. The Pages Function selects the right key by the requested therapist. Confirm the exact env-var names + per-therapist event-type IDs with Victor before wiring.

**Downstream is unchanged:** a booking created via `POST /v2/bookings` still fires Cal's `BOOKING_CREATED` webhook → Apps Script → `bookings_<skill>` + Jane, exactly as today. The Pages Function only handles the front-end's slot-read + booking-create; the webhook path (Channel B) is untouched.

### Endpoints (verify exact shapes against current Cal.com API v2 docs — measure twice)

- **Availability:** `GET /v2/slots` — params `eventTypeId`, `start`, `end`, `timeZone=America/Edmonton`. Header `cal-api-version: 2024-09-04`. Returns slots grouped by date. Use this to (a) mark which days in the month have any availability, and (b) list a chosen day's slots.
- **Create booking:** `POST /v2/bookings` — attendee (name/email/phone/timeZone), `eventTypeId`, `start`, and our attribution fields (`skill`, `recommended_therapist_id`, `user_id`, UTMs/`gclid`) mapped to the same booking fields the webhook reads (`payload.responses.*`). **Confirm the correct `cal-api-version` header for the bookings endpoint from the docs — do not assume it matches the slots version.**
- (Optional) the slot-reservation endpoint to hold a slot during the contact step and avoid a race.

Per-therapist `eventTypeId` (and the existing handle) become per-client config alongside the current handle map.

### The flow to build

1. Visitor clicks **Book with <therapist>** → our calendar view opens (no iframe).
2. Fetch the current month's availability (`GET /v2/slots`), render our own month grid, mark bookable days in the brand color (like leadgenjay's styled dates). Month nav arrows fetch adjacent months.
3. **Tap an available day → the calendar collapses and the view slides to a slot-only screen** for that day: a back arrow (returns to the month), the day heading, and the day's times as a tappable column. This is the core UX Victor wants.
4. Tap a slot → a brief confirm affordance (leadgenjay shows the slot greying + a "Select" button; match that feel).
5. **Contact step (last):** a short name / email / phone form (reuse the retired `lead-form` view's styling if it helps). This is where we collect what Cal's own form used to.
6. Submit → `POST /v2/bookings` (via the backend proxy) with contact + attribution → on success:
   - Redirect to `/booking-confirmed/?uid=<cal uid>&skill=...&therapist=...&first=...&time=...` carrying the same context params the current flow passes.
   - **Conversion is unchanged:** `/booking-confirmed/` fires `booking_confirmed` on load, guarded + deduped by `uid` (Decision 4). We are NOT firing conversion from the API handler — we just hand the same context to `/booking-confirmed/`, which fires it exactly as it does today. The only thing that changes upstream is that the redirect is triggered by our API-success callback instead of the iframe's `bookingSuccessfulV2` event.
7. **States to handle:** empty availability for a month ("no times this month, try next" + a next-month nudge; leadgenjay's "I need additional slots open / Not enough availability" is a good pattern), API error (graceful retry + a phone-number fallback), loading spinners.

### What does NOT change

- **Monthly cap gray-out (Decision 8)** stays as-is — the grid still grays capped therapists via `available_therapists` from our backend, independent of Cal availability. The custom calendar only ever shows a therapist's real open Cal slots.
- **Inactive therapists (Tif, Decision 5)** still route to the `/confirmation/` demand-test page, not the calendar.
- **Timezone:** default `America/Edmonton`. A local clinic almost always books local; you may hide the selector for cleanliness or keep a minimal one. Confirm with Victor.
- **Reschedule/cancel:** none on our side — Jane owns it (unchanged).

---

## Verification (required before commit)

**Part A:** at 390px width, tap through the quiz — confirm the fill animation, smooth progress bar, bottom back button, and question transitions all feel right and respect `prefers-reduced-motion`.

**Part B — the whole point is that downstream still works, so prove it:**
1. At 390px, run the funnel: quiz → grid → detail → Book → **custom calendar → tap date → slots-column-with-back → slot → contact → submit**. Confirm the collapse-and-back flow is fluid.
2. Confirm a real test booking **completes** and lands in Cal.com.
3. Confirm the `BOOKING_CREATED` webhook fired and `payload.responses` still carries `skill`, `recommended_therapist_id`, `user_id`, and the UTMs (attribution preserved).
4. Confirm a row wrote to `bookings_<skill>` and Jane received the appointment.
5. Confirm the redirect to `/booking-confirmed/` renders and `booking_confirmed` fired **once** (GTM Preview), and the monthly-cap count still derives correctly.
6. **Cancel the test booking in Cal.com** (it's real).
7. Desktop width check too.
8. Confirm inactive therapist (Tif) still routes to `/confirmation/`, and a capped therapist still grays out in the grid.

If any downstream step (webhook / attribution / bookings row / Jane / conversion) breaks, stop and report — do not work around it.

---

## Record it (factory infrastructure — do this as part of the task)

- Add a **decision record to `.claude/skills/add-skill-page/SKILL.md`** under the booking-flow section: the custom-UI-on-Cal-API approach + WHY (fluid mobile flow + full branding while keeping Cal's engine and all downstream), the contact-after-slot flow change, and the Part-A quiz interaction standards as **engine defaults**. Note which design values became brand tokens.
- These are engine defaults + the canonical experience, so future skill pages and clients inherit them; the SKILL.md is where that durable pattern lives.
- The prenatal Phase 3.6 lessons-capture step will fold in whatever was learned.
