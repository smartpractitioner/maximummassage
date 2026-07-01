# Phase 7 — Post-launch polish + nice-to-haves backlog

> **Companion to** `docs/plan-bookings-and-qs-handoff.md`. Add this as the final phase of that project. Do not start any 7.X item until Phases 0-6 are complete.

---

## How to use this file

This phase is a **parking lot** for everything that isn't core to the booking funnel. Throughout Phases 0-6, when something surfaces that would polish the experience but would slow down core work if done inline, drop it here as a new `7.X` subsection with whatever context exists at the time. Circle back at the end of the project to work through the backlog so what ships is polished, not just functional.

**Rules of the parking lot:**

- **Don't fix nice-to-haves inline during the main build.** If something is non-core and surfaces mid-Phase, add an entry here and keep moving.
- **Each subsection includes:** what the item is, why it matters, any dependencies or open questions, and (if known) an implementation sketch. Even a one-line stub is fine — better to capture imperfectly than to forget.
- **Order is loose.** Don't treat the numbering as strict priority. Re-prioritize at backlog-review time once Phase 6 is done and the real picture of what's left is clearer.
- **Add items as you go.** This file should grow during the project, not be authored once and frozen.

---

## 7.1 — Direct-booker enforcement automation

### Context — why this item exists

The Jane appointment type configuration for the booking flow (set up manually outside this plan) uses one promotional appointment type per therapist named "Starter Session (Private)" at $49, sitting alongside a regular full-price ($124) appointment type per therapist. The promo type's Before Booking description warns direct-bookers off:

> "This Starter Session is reserved for new clients who arrived via a promotional invitation link. If you booked this without receiving an invite directly from us, your appointment may be canceled and asked to be rebooked at the standard session rate."

That deflection copy does ~70-80% of the work of keeping direct-website-bookers off the promo. This item is the enforcement layer that catches the remaining 20-30% — visitors who book the promo from the public website despite the warning. When a $49 promo booking arrives in Jane without a matching landing-page lead record in PatientSync's database, the therapist is notified so they can decide whether to cancel + rebook at the standard rate, or honor the booking.

This matters because the price (and therefore the offer) is publicly visible on the maximummassage.ca "Book Now" widget — the client requires it. Jane cannot hide pricing per client preference, so we can't fully hide the promo from determined direct-bookers. This item closes the loop.

### Hard dependency — confirmation from Justin before building

Before any code work begins, Victor needs to confirm with Justin (the PatientSync developer) that the bidirectional data capture this item depends on is feasible. The question for Justin:

> "Can PatientSync capture the patient identity (email at minimum, full name + phone ideally) from a Jane appointment that's been synced through ClinicSync Pro into PatientSync, and reliably match that identity bidirectionally against incoming landing-page lead records that PatientSync received from Cal.com / our backend? Specifically: when a booking shows up in Jane for the `Starter Session (Private)` appointment type, can PatientSync (or the bidirectional sync layer) look up the patient's email against the landing-page leads database, decide whether a match exists within a 48-72 hour recency window, and surface the result to a downstream automation?"

**If Justin says yes** → proceed with the build below.

**If Justin says no** → this item is unbuildable without re-architecting the data flow. Stop here, document the limitation in the SKILL.md, accept the standing leakage rate. Don't try to work around it.

### Architecture (assuming Justin confirms feasibility)

```
Cal.com booking ──→ PatientSync ──→ ClinicSync Pro ──→ Jane (writes appointment)
                          │
                          └── (bidirectional sync) ──→
                                Jane ──→ ClinicSync Pro ──→ PatientSync writes back the appointment record
                                                                  │
                                                                  └──→ Match patient against landing-page leads database
                                                                              │
                                                                              ├── Match found within window → silent success, attribution recorded
                                                                              └── No match → email assigned therapist with cancel/honor options
```

### Match logic

- **Recency window:** 48-72 hours between landing-page lead capture timestamp and Jane booking timestamp. Start with 72h, tune based on observed false-positive rate.
- **Match key:** patient email primary, fallback to first-name + last-name + phone if email mismatch (e.g., personal vs. work email).
- **First-booking filter:** only run the check on first-time appointments. If the patient has any prior history in Jane (any appointment, any type), skip the check — they're an existing patient, not a direct-booker hijacking the promo.

### Therapist email template (sent on no-match)

```
Subject: FYI — Starter Session (Private) booking without landing-page match

Patient: [first name + last name]
Email: [email]
Phone: [phone if available]
Booking time: [date + time]
Appointment type: Starter Session (Private)

This booking landed under the promotional Starter Session type in Jane, but PatientSync couldn't find a matching landing-page lead within the last 72 hours. This usually means the patient booked directly via the website and ignored the Before Booking deflection note.

Your options:
- Cancel and reach out to the patient to rebook under the standard session rate.
- Honor the booking as-is (e.g. if you recognize the patient or have other context).
```

### Volume calibration before building

Before designing the email cadence or any escalation logic, **collect 30+ days of leakage data** post-launch by comparing `bookings_<skill>` against Jane Starter Session (Private) bookings:

- **0-1/month** → email-per-leak is fine, no rate-limiting needed
- **5-10/month** → email-per-leak is fine but consider a weekly digest as an alternative
- **20+/month** → the deflection copy is failing harder than expected; redesign the copy first, automation second

### Tuning levers (post-launch)

- Adjust recency window (48h vs. 72h) based on false-positive rate
- Add a confidence score to the email so therapists can prioritize action ("strong match miss" vs. "ambiguous")
- Add an opt-in for therapists who prefer auto-cancel vs. notification-only
- Eventually surface a leakage dashboard for clinic owners showing direct-booker rate per month

### Files this item touches

- New automation logic in PatientSync — exact path depends on PatientSync's architecture (Justin owns this design)
- A new email template asset
- Possibly a new dashboard or admin view if leakage volume justifies it later
- Maximum Health-specific config: which therapists get the alert emails, recency window, match logic toggles

---

## 7.2 — Cal.com embed theming to match the landing page brand

### Context — why this item exists

Phase 1.1 wires the Cal.com inline embed into the picker lightbox as the booking step. By default, Cal.com's embed ships with its own brand colors, typography, and button styling — clean, but unmistakably "third-party widget." After a visitor walks through a polished, branded landing page and picker experience, dropping them into a Cal.com-themed booking step breaks the visual continuity at the most critical conversion moment.

Match the embed's colors, font, and button styling to Maximum Health's brand teal + the landing page typography so the booking step feels like a continuation of the experience rather than a hand-off to a third party. Same principle applies to the Cal.com booking step on the standalone therapist pages (`/brookelyn/`, `/meagan/`, etc.) if they continue to be used.

### Why it matters

The hero-to-CTA visual flow is one of the strongest conversion levers — and the booking step IS the conversion. A jarring style transition at the exact moment a visitor commits introduces hesitation. Brand consistency at this step preserves trust and momentum.

### Implementation sketch

Cal.com's embed supports theming via the embed SDK:

```js
Cal("ui", {
  theme: "light",
  styles: {
    branding: { brandColor: "<Maximum Health brand teal>" }
  },
  cssVarsPerTheme: {
    light: {
      "cal-brand": "<brand teal>",
      "cal-text": "<body text color>",
      "cal-bg": "<background>",
      // see Cal.com embed theming docs for the full CSS var list
    }
  }
})
```

Match brand tokens from `public/css/flow-b-v3.css` (or wherever the design tokens land after the Phase 6 client-config extraction):
- Brand teal — primary button + accent
- Body font — match the landing page typeface so date pickers + form fields don't shift fonts
- Button radius + shadow conventions — keep the booking button visually consistent with the page's primary CTAs

### Open questions

- **What Cal.com plan tier is the client on?** Determines theming flexibility. The free tier has limited theming; paid tiers unlock full CSS variable control and "powered by Cal.com" branding removal.
- **Should the "powered by Cal.com" footer be removed?** Requires paid plan. Lower priority — visitors at this stage are committing, not browsing.
- **Standalone therapist pages too?** If `/brookelyn/`, `/meagan/`, etc. continue to serve any traffic, theme them as well. Same Cal.com config logic.

### Files this item touches

- `public/js/therapist-picker.js` — where the Cal.com embed `init` happens (added in Phase 1.1)
- Possibly `public/css/picker.css` — wrapper styling if any
- `public/<therapist-handle>/index.html` (the five standalone therapist pages) — if those continue to be used
- Cal.com app settings dashboard for any account-level theming
- After Phase 6 portability extraction: Cal.com theming becomes per-client-config so the next clinic's brand colors apply automatically

---

## 7.3 — Cal.com appointment duration vs. Jane buffer time

### Context — why this item exists

Identified 2026-06-20. Jane appointment types include **buffer time** (e.g., Brookelyn = 60-min session + 20-min buffer = **80 min total blocked**). The Cal.com calendar's blocked duration must match what Jane blocks, or availability drifts between the two systems. The project-brief SOP currently mandates a **fixed 80-minute duration** set in the Cal.com duration field (session + buffer baked into one number) — **but this hasn't been tested**, and Cal.com also supports a separate before/after **buffer** setting on an event type. Open question is whether a 60-min event type **+ buffer** blocks the full 80 min (and syncs to Jane) while still *displaying* "60 min" to the visitor.

### Why it matters

- **Sync correctness:** Cal.com's blocked time must equal Jane's blocked time (session + buffer) or the two systems disagree on availability and risk mismatches/double-books.
- **Booking-page UX / conversion:** if the duration field is the fixed 80 min, the Cal.com calendar shows **"1 hr 20 min"** for what's marketed and understood as a *60-minute* appointment — potentially confusing or off-putting at the exact conversion moment. A 60-min event type with a hidden buffer would display "60 min" while still reserving 80. Conversion-relevant, but non-core to the booking mechanism working — hence parked.

### Justin's reply — must be tested empirically

Victor's question out to Justin (PatientSync / Jane-sync owner), as sent:

> In Cal.com we need the duration to match Jane including buffer time — so a 60-minute appointment with a 20-minute buffer (like Brookelyn) is 80 minutes total. In Cal, is it possible to select 60 minutes and **add a buffer time** and have that still work, or does it have to be a fixed 80 minutes set in the duration field? Our project-brief SOP says fixed 80, but have we tested it? The reason: in the calendar booking it says "1 hr 20 min," which might confuse someone booking a "60-min" appointment.

**Justin's reply (2026-06-20): no guaranteed answer — we have to test it.** So this item is gated on running the test below, not on further confirmation.

### Test procedure (run when this item is picked up)

1. Take **one** therapist's Cal.com event type to start — **Brookelyn**. Set the **duration to 60 minutes**, **turn off "select multiple durations,"** and **add a 20-minute buffer** (before/after) so the total blocked time is still **80 minutes**.
2. Make a test booking and verify whether the **80-minute block syncs through to Jane and matches** (same blocked time, correct appointment), while the Cal calendar shows **"60 min"** to the visitor (not "1 hr 20 min").
3. **If it passes through and matches Jane** → adopt 60-min + 20-min buffer across all event types (cleaner "60 min" display, removes the confusion).
4. **If it does NOT sync/match correctly** → revert and **stick with the existing fixed-80-minute path** (the current SOP). Accept the "1 hr 20 min" label, or consider relabeling the event-type name so it doesn't confuse a 60-min expectation.

Note: the captured `BOOKING_CREATED` webhook from a current (fixed-80) booking reports `payload.length: 80` — useful baseline to compare against when testing the 60+buffer config.

### Open questions

- Does Cal.com's per-event-type buffer block the calendar **and** propagate the full blocked time to Jane through the sync layer?
- Buffers likely differ per therapist (Brookelyn 20 min; others TBD) — need each therapist's buffer value from Jane.
- Can the duration *label* on the embed be customized independently of the underlying block length?

### Files / config this touches

- Cal.com event-type settings per therapist (duration + buffer).
- Possibly the embed config in `public/js/therapist-picker.js` (added Phase 1.1) if duration labels surface there.
- The project-brief SOP ("fixed 80 minutes" instruction) — update once tested.

---

## 7.4 — Replace Cal.com with our own internal calendar/booking script

> **Scope caveat:** this is **not** a nice-to-have polish item — it's a major architectural build (a whole booking engine). It's parked here per the user's request (2026-06-20), but flagged as a **gate before the factory is considered "complete,"** and it should likely be promoted into its own design pass / phase when picked up rather than treated as an end-of-list polish. Re-evaluate its priority at backlog-sweep time.

### Context — why this item exists

The user wants to **own the calendar layer** — replace the third-party Cal.com dependency with our own internal calendar/booking script — before the factory buildout is finished. Right now Cal.com is the booking engine (inline embed → `bookingSuccessfulV2` → `/booking-confirmed/`, and a `BOOKING_CREATED` webhook feeds Jane via ICS/ClinicSync).

### Why it matters (user's stated reasons, 2026-06-20)

- **Eliminate laborious per-practitioner setup (the primary driver):** Cal.com takes "way too many laborious clicks inside the account," and you have to set up a **separate account/config for each practitioner** — repeated for every client. That doesn't scale as a factory. The goal: **the factory pumps out the calendar script and integrates it completely** per client/practitioner — no manual Cal.com account provisioning each time.
- **Control the emailing — let Jane do it all:** Cal.com sends too many notification emails we can't control. We want the client's **Jane EHR to own all patient emailing** (confirmations, reminders, etc.). An owned calendar would send **no patient email of its own** and defer entirely to Jane.
- **Remove the Cal.com branding** in the booking step (a secondary annoyance; overlaps 7.2 theming).
- *(Follow-on benefits, inferred — confirm at planning time):* we'd own the **complete booking payload** directly (no lean-event + webhook workaround), drop the **per-seat SaaS cost** at factory scale, and make **7.2 (theming)** and **7.3 (buffer/duration)** moot while removing Cal UI-drift risk from our SOPs.

> **Near-term implication (flag for the Phase 1 build, don't wait for 7.4):** while we're still on Cal.com, its own confirmation/reminder emails will fire on live bookings **on top of** Jane's. Decide during the build whether to **mute Cal.com's notifications** (turn off its email workflows so only Jane emails the patient) so we don't ship a double-emailing flow. This is a Cal.com settings change, separate from the full 7.4 replacement.

### Dependencies / open questions

- **Big scope:** availability management, slot selection, timezone handling, double-booking prevention, confirmation + reminder emails/texts, cancellation/reschedule (routed to Jane per current policy), and a **Jane / ClinicSync / PatientSync sync adapter** to replace the ICS feed. Needs Justin's input on the sync side.
- **Natural home:** Cloudflare Workers + KV/D1 (aligns with the Phase 6.3 Apps Script → Workers migration). Build the calendar as a Worker service.
- **Front-end swap is cheap if we plan for it:** if the booking step goes through the `mhBackend` abstraction (Phase 1.6), swapping Cal.com for the internal calendar is mostly repointing the booking step + endpoint, not a rewrite of the funnel.
- **Migration:** how to cut existing/live Cal.com bookings over without disruption.

### Implementation sketch (stub — expand at planning time)

Worker-based booking service: availability rules per therapist → public slot API → booking write (with our own full payload incl. skill/therapist/UTMs, no hidden-field workaround) → confirmation page + reminders → sync adapter to Jane. Front-end booking step calls it via `mhBackend`.

### Files / systems this touches (eventual)

- New `workers/` calendar service; `public/js/therapist-picker.js` booking step; `public/js/mh-backend.js`; the Jane/ClinicSync sync layer (Justin); per-client config (availability, therapist calendars).

---

## Future items (add as they come up)

> Drop new subsections here as `7.5`, `7.6`, etc. when polish items surface during Phases 0-6. Keep each entry brief — what it is, why it matters, any sketch or dependency. Format follows 7.1 and 7.2 above.
>
> *(Note: the confirmation-page reconciliation that briefly lived here was promoted to core Phase 1.1 on 2026-06-19 — see the "single canonical confirmation page" decision in `.claude/skills/add-skill-page/SKILL.md`. Not a parking-lot item.)*
