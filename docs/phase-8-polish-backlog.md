# Phase 8 — Post-launch polish + nice-to-haves backlog

> **Companion to** `docs/plan-bookings-and-qs-handoff.md`. Add this as the final phase of that project. Do not start any 8.X item until Phase 7 (Portability + multi-agent factory staffing) is complete.
>
> **Restructured 2026-07-03 (two moves same day — read carefully).** This file was originally Phase 7 with items labeled 7.1 through 7.8. First move: renumbered to Phase 8 (items to 8.1-8.8) when BI + Reporting was inserted as the new Phase 7 to sit ahead of polish. Second move (same day): BI was then promoted ahead of factory-buildout, so BI is now Phase 6 (`docs/phase-6-bi-reporting-design.md`) and factory-buildout (portability + multi-agent factory staffing) is now Phase 7. This polish file stays as Phase 8. Historical references anywhere in the repo:
>
> - "Phase 7 = polish" pre-2026-07-03 → now Phase 8
> - "Phase 6 = portability" pre-2026-07-03 → now Phase 7
> - "Phase 7 = BI" from earlier in 2026-07-03 (intermediate state) → now Phase 6
> - "7.1 = PractiCal" pre-2026-07-03 → now 8.1

---

## How to use this file

This phase is a **parking lot** for everything that isn't core to the booking funnel. Throughout Phases 0-6, when something surfaces that would polish the experience but would slow down core work if done inline, drop it here as a new `7.X` subsection with whatever context exists at the time. Circle back at the end of the project to work through the backlog so what ships is polished, not just functional.

**Rules of the parking lot:**

- **Don't fix nice-to-haves inline during the main build.** If something is non-core and surfaces mid-Phase, add an entry here and keep moving.
- **Each subsection includes:** what the item is, why it matters, any dependencies or open questions, and (if known) an implementation sketch. Even a one-line stub is fine — better to capture imperfectly than to forget.
- **Order is loose.** Don't treat the numbering as strict priority — except for 8.1, which IS the highest-priority item and was promoted deliberately.
- **Add items as you go.** This file should grow during the project, not be authored once and frozen.

---

## 8.1 — Replace Cal.com with our own internal calendar/booking script (PractiCal), unified with in-house calendar provisioning

> **PROMOTED to 8.1 on 2026-07-02 (was 8.4).** Elevated because so much of the factory story depends on this — per-practitioner Cal.com account setup is the primary manual bottleneck that kills factory-scale. Owning the calendar layer removes it.
>
> **Unified with old 8.8 on 2026-07-03.** The former 8.8 ("Bring PatientSync calendar provisioning in-house to the factory") is now folded into this item — see the "In-house calendar provisioning" section below. Reason: they're one architectural evolution, not two. Once we own the calendar layer (PractiCal), PatientSync's Cal.com-provisioning role either disappears entirely (if PractiCal replaces Cal.com fully) or evolves into direct PractiCal integration (if PractiCal ships alongside Cal.com during transition). Treating them as separate items fragments the design conversation. **Coordinate directly with Justin** — this is one integrated design pass, not two.
>
> **Scope caveat:** this is **not** a nice-to-have polish item — it's a major architectural build (a whole booking engine + PatientSync integration). Given its factory-blocker status, **consider promoting it to its own dedicated phase (Phase 9 or similar)** rather than treating it as end-of-list polish work when picked up. Re-evaluate at backlog-sweep time.
>
> **Does NOT block the current client.** Maximum Health launches on **Cal.com now** — speed to launch is the priority. The Cal.com embeds get swapped for the owned calendar later, which stays cheap because the booking step routes through the `mhBackend` abstraction (repoint the booking step + endpoint, not a funnel rebuild).

### Context — why this item exists

The user wants to **own the calendar layer** — replace the third-party Cal.com dependency with our own internal calendar/booking script — before the factory buildout is finished. Right now Cal.com is the booking engine (inline embed → `bookingSuccessfulV2` → `/booking-confirmed/`, and a `BOOKING_CREATED` webhook feeds Jane via ICS/ClinicSync).

### Why it matters (user's stated reasons, 2026-06-20)

- **Eliminate laborious per-practitioner setup (the primary driver):** Cal.com takes "way too many laborious clicks inside the account," and you have to set up a **separate account/config for each practitioner** — repeated for every client. That doesn't scale as a factory. The goal: **the factory pumps out the calendar script and integrates it completely** per client/practitioner — no manual Cal.com account provisioning each time.
- **Control the emailing — let Jane do it all:** Cal.com sends too many notification emails we can't control. We want the client's **Jane EHR to own all patient emailing** (confirmations, reminders, etc.). An owned calendar would send **no patient email of its own** and defer entirely to Jane.
- **Remove the Cal.com branding** in the booking step (a secondary annoyance; overlaps 8.3 theming — which becomes moot once this ships).
- *(Follow-on benefits, inferred — confirm at planning time):* we'd own the **complete booking payload** directly (no lean-event + webhook workaround), drop the **per-seat SaaS cost** at factory scale, and make **8.3 (theming)** and **8.4 (buffer/duration)** moot while removing Cal UI-drift risk from our SOPs.

> **Near-term implication (flag for the Phase 1 build, don't wait for 8.1):** while we're still on Cal.com, its own confirmation/reminder emails will fire on live bookings **on top of** Jane's. Decide during the build whether to **mute Cal.com's notifications** (turn off its email workflows so only Jane emails the patient) so we don't ship a double-emailing flow. This is a Cal.com settings change, separate from the full 8.1 replacement.

### Dependencies / open questions

- **Big scope:** availability management, slot selection, timezone handling, double-booking prevention, confirmation + reminder emails/texts, cancellation/reschedule (routed to Jane per current policy), and a **Jane / ClinicSync / PatientSync sync adapter** to replace the ICS feed. Needs Justin's input on the sync side.
- **Natural home:** Cloudflare Workers + KV/D1 (aligns with the Phase 6.3 Apps Script → Workers migration). Build the calendar as a Worker service.
- **Front-end swap is cheap if we plan for it:** if the booking step goes through the `mhBackend` abstraction (Phase 1.6), swapping Cal.com for the internal calendar is mostly repointing the booking step + endpoint, not a rewrite of the funnel.
- **Migration:** how to cut existing/live Cal.com bookings over without disruption.

### Implementation sketch (stub — expand at planning time)

Worker-based booking service: availability rules per therapist → public slot API → booking write (with our own full payload incl. skill/therapist/UTMs, no hidden-field workaround) → confirmation page + reminders → sync adapter to Jane. Front-end booking step calls it via `mhBackend`.

**Build vs. adopt open-source (evaluate first):** before building a scheduler from scratch, look at self-hosting/forking an existing open-source one — e.g. **[cal.diy](https://www.cal.diy/)** or the **Cal.com open-source GitHub repo** (Cal.com is AGPL and self-hostable). A self-hosted fork could hand us the calendar engine to fully theme + control emails + script per-practitioner setup + drop per-seat SaaS cost, without writing availability/booking logic ourselves. Weigh the maintenance burden of a self-hosted fork (upgrades, infra) vs. lean custom Worker endpoints — either path still delivers the branding/email-control/setup-automation wins.

### Files / systems this touches (eventual)

- New `workers/` calendar service; `public/js/therapist-picker.js` booking step; `public/js/mh-backend.js`; the Jane/ClinicSync sync layer (Justin); per-client config (availability, therapist calendars).

### In-house calendar provisioning (was 8.8, now folded here)

Today, when we onboard a new client, someone (Justin or ops) has to **log into the PatientSync dashboard and manually add the calendar** as one of the client-setup steps. It's a per-client manual step that:

- Requires PatientSync-specific dashboard knowledge
- Creates a hard dependency on Justin's availability
- Doesn't fit the factory model — the goal is "any team member can hand the factory the client inputs and reproduce the outcome," not "any team member plus Justin doing a dashboard configuration."

Victor's framing to Justin (2026-07-02), captured verbatim as the seed for this piece:

> "As I've been building out her new infrastructure I've been having Claude build a factory so that we can basically have any team member hand it the inputs from the client and reproduce the outcome. I think there will be a time when we join PatientSync with that factory. Think of it like instead of the factory having to order a part from across the country it brings in-house the making of that part. I think it would be a lot easier to deploy a new calendar in PatientSync that way versus having to log into the dashboard and manually add the calendar."

**How this folds into PractiCal (why the merger makes sense):**

- **If PractiCal fully replaces Cal.com** → the calendar-provisioning step disappears entirely. The factory creates the calendar directly by writing config into PractiCal's own D1 tables at client-setup time. No PatientSync dashboard step, no external system to provision. Single build path.
- **If PractiCal ships alongside Cal.com during transition** → PatientSync needs API/scripting hooks the factory can call for calendar provisioning (whether the target is Cal.com or PractiCal). Same PatientSync integration work, but pointed at whichever calendar backend is active for that client. Justin's cooperation still gates it, but the design conversation is one unified pass.

**Either way, this is one architectural decision, not two.** Do NOT design "in-house calendar provisioning for PatientSync" as a separate item — coordinate with Justin as part of the PractiCal design conversation.

**Data contract to define with Justin:** what the factory sends when it triggers calendar provisioning (therapist metadata, event-type mapping, buffer times, availability rules, sync-target Jane appointment-type names). Auth model (service account, API token, per-client scoped tokens matching the Cloudflare pattern). Failure handling + idempotency. Where the step slots in relative to Cloudflare zone creation, Worker deploy, Jane appointment-type setup, and ad-campaign wiring.

---

## 8.2 — Direct-booker enforcement automation

> **Was 8.1 before the 2026-07-02 reorder — moved down one slot when Cal.com replacement was promoted.**

### Context — why this item exists

The Jane appointment type configuration for the booking flow (set up manually outside this plan; **source-of-truth SOP for the Jane side is [`docs/sop-jane-booking-confirmation-email.md`](sop-jane-booking-confirmation-email.md)**) uses one promotional appointment type per therapist named "Starter Session - By Invite Only" at $49, sitting alongside a regular full-price ($124) appointment type per therapist. The promo type's Description (before booking) warns direct-bookers off:

> "Do Not Choose - If you book this without going through the right channels, your appointment will be canceled and you will be asked to rebook at the standard session rate. To book a standard session right now, please review the other treatments in this list and select a regular massage option."

That deflection copy does ~70-80% of the work of keeping direct-website-bookers off the promo. This item is the enforcement layer that catches the remaining 20-30% — visitors who book the promo from the public website despite the warning.

**Design goal: fully automated.** When a $49 promo booking arrives in Jane without a matching landing-page lead record in PatientSync's database, the system **auto-cancels the appointment and emails the patient** an apologetic-professional message with a link to rebook at the standard rate. No therapist involvement per leak — this needs to run hands-off at factory scale, and adding "review each leaked booking" to therapist workload defeats the purpose. Human involvement is reserved for the exception path (kill-switch triggered, confidence-threshold failures) — see Risk mitigations below.

This matters because the price (and therefore the offer) is publicly visible on the maximummassage.ca "Book Now" widget — the client requires it. Jane cannot hide pricing per client preference, so we can't fully hide the promo from determined direct-bookers. This item closes the loop.

### Hard dependency — confirmation from Justin before building

Before any code work begins, Victor needs to confirm with Justin (the PatientSync developer) that the bidirectional data capture this item depends on is feasible. The question for Justin:

> "Can PatientSync capture the patient identity (email at minimum, full name + phone ideally) from a Jane appointment that's been synced through ClinicSync Pro into PatientSync, and reliably match that identity bidirectionally against incoming landing-page lead records that PatientSync received from Cal.com / our backend? Specifically: when a booking shows up in Jane for the `Starter Session - By Invite Only` appointment type, can PatientSync (or the bidirectional sync layer) look up the patient's email against the landing-page leads database, decide whether a match exists within a 48-72 hour recency window, and surface the result to a downstream automation?"

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
                                                                              └── No match → confidence check → auto-cancel booking in Jane + email patient with rebook-at-standard link + log the action
```

### Match logic

- **Recency window:** 48-72 hours between landing-page lead capture timestamp and Jane booking timestamp. Start with 72h, tune based on observed false-positive rate.
- **Match key:** patient email primary, fallback to first-name + last-name + phone if email mismatch (e.g., personal vs. work email).
- **First-booking filter (HARD SAFEGUARD):** only run the check on first-time appointments. If the patient has any prior history in Jane (any appointment, any type), **skip the check entirely** — they're an existing patient rebooking, not a direct-booker hijacking the promo. Auto-canceling a real returning patient is the highest-cost failure mode; the first-booking filter is the primary defense against it.

### Risk mitigations (before auto-cancel fires)

Full automation only lands cleanly if the false-positive rate stays near zero. Layered defenses:

- **First-booking filter (above)** — the biggest single guard. Any prior Jane appointment for this patient = skip.
- **Confidence threshold on the match/no-match verdict.** Only auto-cancel when the "no landing-page lead within 72h" verdict is HIGH-confidence (clean email match against the leads database returned zero hits AND the fallback name+phone match also returned zero). Anything ambiguous — email delivery failures, name-only partial matches, cross-timezone timing edge cases — falls to the exception path (see Kill-switch fallback).
- **Audit log every auto-action.** Every auto-cancel writes a row to a `direct_booker_auto_cancels` table/tab: patient contact, appointment id, timestamp, match-check result + confidence score, email sent, cancellation confirmation from Jane. This is the false-positive detection surface.
- **Kill-switch config flag.** A single flag disables auto-cancel and falls the item BACK to therapist-notification mode (the pre-auto-cancel design — email the assigned therapist with cancel/honor options, human decides). If auto-cancel starts misfiring, flip the flag; the enforcement doesn't stop, it just gets a human back in the loop while we debug.
- **Exception path.** Confidence-threshold failures + kill-switch mode both route to a therapist notification (using the "Fallback therapist email" template below), not to inaction. Silence would let leakage grow unchecked.

### Patient email template (sent when auto-cancel fires)

Apologetic-professional. Explains WHY. Clear rebook path. Escape hatch for the false-positive case.

```
Subject: Your booking couldn't be honored — quick rebook option inside

Hi [first name],

Thanks for booking with Maximum Health Massage. Unfortunately, the Starter Session appointment type you selected is reserved for new clients who arrived via a promotional invitation link, and our records don't show a matching invite for your email address.

Your appointment on [date + time] with [therapist name] has been canceled.

You're welcome to rebook right now at our standard session rate — most sessions are 60 minutes at $124. Book here: [rebook link → Jane standard-treatment page for that therapist]

If you believe this is an error — for example, you did click through our ad but our system missed the match, or you booked using a different email address than the one you clicked from — please reply to this email or call us at (403) 283-0725 and we'll sort it out.

Thanks for understanding,
Maximum Health Massage
(403) 283-0725
```

### Fallback therapist email template (kill-switch mode OR confidence threshold failed)

Same as the original pre-auto-cancel design — human makes the decision instead of the system:

```
Subject: FYI — Starter Session - By Invite Only booking without landing-page match

Patient: [first name + last name]
Email: [email]
Phone: [phone if available]
Booking time: [date + time]
Appointment type: Starter Session - By Invite Only
Confidence: [high / medium / low — from the match check]

This booking landed under the promotional Starter Session type in Jane, but PatientSync couldn't find a matching landing-page lead within the last 72 hours (or the match was low-confidence). This usually means the patient booked directly via the website and ignored the Before Booking deflection note.

Your options:
- Cancel and reach out to the patient to rebook under the standard session rate.
- Honor the booking as-is (e.g. if you recognize the patient or have other context).
```

### Volume calibration before building

Before designing the email cadence or any escalation logic, **collect 30+ days of leakage data** post-launch by comparing `bookings_<skill>` against Jane Starter Session - By Invite Only bookings:

- **0-1/month** → email-per-leak is fine, no rate-limiting needed
- **5-10/month** → email-per-leak is fine but consider a weekly digest as an alternative
- **20+/month** → the deflection copy is failing harder than expected; redesign the copy first, automation second

### Tuning levers (post-launch)

- Adjust recency window (48h vs. 72h) based on false-positive rate observed in the audit log
- Adjust confidence-threshold cutoff (what counts as "high confidence" — email-hit-required vs. name+phone fallback accepted)
- Flip the kill-switch to therapist-notification mode if auto-cancel starts misfiring; keep both templates in play so we can toggle without a code change
- Eventually surface a leakage dashboard for clinic owners showing direct-booker rate per month, auto-cancels fired, and false-positive count

### Files this item touches

- New automation logic in PatientSync — exact path depends on PatientSync's architecture (Justin owns this design). Needs to include: the match/no-match check, the Jane appointment-cancellation call, the patient email send, the audit-log write, and the confidence-threshold + kill-switch gating.
- Two email template assets (patient auto-cancel template + fallback therapist template)
- New audit log surface (`direct_booker_auto_cancels` table or sheet tab) — critical for false-positive detection
- A leakage dashboard eventually if volume justifies it
- Maximum Health-specific config: kill-switch flag (default: on / auto-cancel enabled), confidence-threshold cutoff, recency window, per-therapist rebook-link map for the patient email

---

## 8.3 — Cal.com embed theming to match the landing page brand

> **Moot if 8.1 (Cal.com replacement) ships** — the owned calendar layer removes Cal.com's embed entirely, which means there's no third-party UI to theme. Keep this section only as a fallback if we decide NOT to build 8.1 and stay on Cal.com long-term. Was 8.2 before the 2026-07-02 reorder.

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

## 8.4 — Cal.com appointment duration vs. Jane buffer time

> **Moot if 8.1 (Cal.com replacement) ships** — the owned calendar layer defines its own duration/buffer model without Cal.com's constraints. Keep this section only as a fallback if we stay on Cal.com long-term. Was 8.3 before the 2026-07-02 reorder.

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

## 8.5 — Automated QA pass for the per-therapist / per-skill booking flow

### Context — why this item exists

Every skill page needs a QA pass **per active therapist** (see the "Per-therapist QA pass" step in `.claude/skills/add-skill-page/SKILL.md`): calendar loads with the right Cal handle, prefill lands, redirect to `/booking-confirmed/` renders, conversion fires. Doing that by hand across N therapists × M skill pages × every client is tedious and error-prone.

### Why it matters

Factory scale. Manual-only doesn't scale; but fully hands-off automation misses human judgment (does the calendar *feel* right, is the copy off, is the embed janky). Hybrid is the goal.

**Belongs in factory documentation.** When picked up, this item should also produce a new SOP (e.g. `docs/sop-automated-qa-pass.md`) capturing how to configure and run the test suite per client, AND get folded into the `/onboard-new-client` skill as a required per-client onboarding step. The Playwright suite is a factory deliverable, not a Maximum Health-only tool.

### Sketch / earmark

Automate the repetitive funnel walk with **Playwright** (or similar): a team member launches the tool and it drives quiz → grid → detail → Book → calendar → asserts the `booking_confirmed` dataLayer push + redirect for each therapist. **Hard rule: the team member must still do at least 2 manual runs themselves** to catch concerns a script won't. Open questions: how to avoid spamming real Cal bookings (test event type / auto-cancel via Cal API); GTM tag-firing + Jane sync likely stay semi-manual (Tag Assistant / EHR aren't easily scriptable).

---

## 8.6 — Internal front-end / UI for the factory (team-facing) — genuine "might or might not build"

### Context — why this item exists

Today the factory runs via Claude Code + config files + SOPs. A GUI could let less-technical team members spin up a client / skill page by filling a form (business info, roster, keyword themes) → generate config → deploy, making the whole thing easier to operate.

### Scope note (2026-07-03) — this might or might not ever happen

Explicit non-commitment: **the GUI might never get built**, might get built partially (staff just deposit specific config items via GUI, everything else stays in Claude Code), or might get built end-to-end. All three outcomes are on the table. When this item is picked up:

1. **Gather implementation ideas from the session working on it** — not a preordained scope. Have the agent propose what would meaningfully speed things up vs. what's overkill.
2. **Then determine whether it's useful, helpful, and speeds things up** — vs. just running Claude Code end-to-end without a GUI layer.
3. **Decide the outcome from there.** Abandon, build partial, or build end-to-end. Each is a valid answer depending on what the implementation ideas surface.

### Consideration pass FIRST (before building anything)

This one gets a deliberate think before we act. Questions to answer at pickup time:
- **Does a GUI in any way break our process or the quality of outputs?** The Claude-Code-guided workflow is reasoning-rich (the SKILL.md "why", copy/QS judgment, per-therapist tuning). If a form-driven GUI bypasses that, do pages get worse? What must stay human/Claude-judged vs. what's safe to formify?
- What could the GUI own (config entry, deploy triggers) vs. what stays in Claude Code (copywriting, keyword theming, QS judgment)?
- Build vs. buy; who maintains it; who actually uses it; does it earn its keep vs. just running the SOPs?
- **Partial-GUI option:** would a narrow GUI covering only client-config entry (business info, credentials, brand tokens) — while all creative work stays in Claude Code — be the right compromise? Faster team onboarding without eroding output quality.

### Why it matters

Ease of team use at factory scale — but only if it doesn't erode the output quality that's the whole point. And only if it's actually needed vs. Claude Code being fine end-to-end. Decide the consideration pass before committing.

---

## 8.7 — GTM housekeeping: site-wide tags double-firing per page

### Context — why this item exists

During Phase 1.1 testing, GTM Preview showed several **pre-existing** site-wide tags firing **2× on a single page load** — `Google Tag`, `Google Ads - Page View` (remarketing), `Conversion Linker`, `Microsoft Clarity`. Likely they're triggered on both Initialization **and** All Pages (or container-load + a follow-up event).

### Why it matters

It does **not** affect booking-conversion accuracy — our `booking_confirmed` conversion fires exactly once. But double-firing the page-view/remarketing tags inflates those counts and sends redundant hits (noisier remarketing audiences, doubled page-view pings).

### Sketch

Audit the trigger config on those tags; ensure each fires **once** per page (a single trigger — e.g. `Initialization - All Pages` OR `All Pages`, not both). Verify in Preview that each fires once. Low-risk, GTM-only. Not booking-critical — parked.

---

## 8.8 — [MERGED into 8.1 on 2026-07-03]

The former 8.8 ("Bring PatientSync calendar provisioning in-house to the factory") was merged into 8.1 (PractiCal) on 2026-07-03. Reason: they're one architectural evolution, not two separate items — see the "In-house calendar provisioning" section within 8.1 above for the folded content, including Victor's verbatim framing to Justin and the design questions.

**Do not treat these as separate builds.** Coordinate directly with Justin as part of the PractiCal design conversation.

---

## Future items (add as they come up)

> Drop new subsections here as `7.9`, `8.10`, etc. when polish items surface during Phases 0-6. Keep each entry brief — what it is, why it matters, any sketch or dependency. Format follows the sections above.
>
> *(Note: the confirmation-page reconciliation that briefly lived here was promoted to core Phase 1.1 on 2026-06-19 — see the "single canonical confirmation page" decision in `.claude/skills/add-skill-page/SKILL.md`. Not a parking-lot item.)*
