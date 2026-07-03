# Resume handoff — booking-flow build, state as of 2026-07-02

Drop this into a fresh Claude Code session as the starting brief.

## How to resume
1. Read this file.
2. Read `.claude/skills/add-skill-page/SKILL.md` — the full decision record + session history (all the "why").
3. Skim `docs/plan-bookings-and-qs-handoff.md` (the 6-phase plan) and `docs/phase-7-polish-backlog.md` (parking lot; note it was reordered 2026-07-02 — 7.1 is now the Cal.com replacement, aka **PractiCal**).
4. Memory auto-loads (see MEMORY.md). Repo = source of truth. Push with the `vpidkowich-man` gh account (it sometimes flips back to `vpidkowich` and 403s — `gh auth switch --user vpidkowich-man`).

## Where we are — Phase 1 booking flow COMPLETE + confirmed (prenatal, gated)
- ✅ Phase 0, 1.0 discovery.
- ✅ 1.6 mhBackend (LIVE). 1.1 calendar step + `/booking-confirmed/` (LIVE, gated to prenatal; tested Brookelyn/Charlotte/Lindsey; multi-provider add-to-calendar with 1d/2h reminders).
- ✅ 1.5 Cal `BOOKING_CREATED` webhook backend (writes `bookings_<skill>`, Slack, `available_therapists`) — DEPLOYED + working; **Slack confirmed** posting.
- ✅ 1.2 gray-out — BUILT + CONFIRMED. Caps derived live from the booking rows (booked-on date, current month, global across skills — Decision 8); `bookings_count` tab retired. Grays at *exactly* the cap. Only CAPPED therapists dim ("Fully booked this month"); inactive Tif stays a clickable notify-me card.
- ✅ 1.3/1.7 conversion via GTM — built + Preview-tested. **GTM container still NOT Published** (open item 2).
- ✅ 1.4 Tif `active:false`.

## Open items right now (finish Phase 1)
1. **Add the Cal `BOOKING_CREATED` webhook to Meagan / Charlotte / Lindsey Cal accounts** (separate login each; subscriber URL = the Apps Script URL in Key facts). **Only Brookelyn's is wired** — so the other three's bookings don't yet reach our backend (no record / Slack / cap count). Tif has no Cal account (notify-me fallback).
2. **Publish GTM** — Submit/Publish the container so real bookings count as Google Ads conversions + GA4 events (currently only firing in Preview). Do one real test booking after to confirm in Google Ads → Conversions + GA4 DebugView, then cancel.
3. (Optional) per-therapist QA sweep — Charlotte 90-min; confirm Tif fallback.

**Resolved since the earlier handoff:** Slack (was a missing `script.external_request` OAuth scope in the Apps Script — fix: add it to `appsscript.json` `oauthScopes` or delete the array to auto-detect, re-run to re-consent, redeploy); backend URL consolidated to `…AKfycbwTrxuf…`; caps off-by-one (now derive-based, `>= cap`).

## Then
Phase 2 (QS copy/keyword audit on prenatal) → 3 (iterate prenatal) → 4 (full E2E) → 5 (rollout lymphatic → deep tissue → therapeutic) → 6 (portability: client-config + Cloudflare Workers/D1/KV migration; separate factory + per-client repos) → 7 (polish backlog; 7.1 = build PractiCal, our own calendar).

## Key facts / IDs
- **Apps Script Web App URL (front-end + ALL Cal webhooks — single source):** `https://script.google.com/macros/s/AKfycbwTrxufbNKu1GqOd9d1pPqMdnmMJmYXXmk6z_dpIj6auXULvNDb2oJ5ESTgtSGxyiKoUQ/exec`
- **GTM** `GTM-5M8LTCF8` · **Google Ads** `AW-17632628958` (conversion "Booking confirmed", count-only, label `Vr11CIibkckcEN6h8tdB`) · **GA4** `G-DVHL7E1D9C`.
- Cal handles: `bbrolly/60min`, `meaganb/60min`, `ctooth/90min`, `lstauffer/60min`; Tif inactive (`thenderson` placeholder). Caps: Meagan 10, Brookelyn 15, Charlotte/Lindsey unlimited, Tif 15.
- **Two data channels:** browser `bookingSuccessfulV2` = redirect + guarded/deduped conversion on `/booking-confirmed/`; Cal `BOOKING_CREATED` webhook = full record (email/phone) + count + Slack. Prefill of skill/recommended/UTMs rides hidden Cal fields.
- One central Google Sheet, tabs per skill. D1/KV in Phase 6.
- **PractiCal** = the agreed name for our future in-house calendar (Phase 7.1) that replaces Cal.com.
- Slack: `#maximumhealth-google-ads-bookings`, posted from the backend (`SLACK_BOOKINGS_WEBHOOK_URL` Script Property); old Brookelyn Zap disabled.

## Cadence reminder
Every load-bearing decision + its *why* goes into the repo (SKILL.md / docs), not just memory. Reviewable chunks for code; commit + push (behavior-neutral or after local smoke test). Phase 7 items get parked, never built until Phase 6 is done.
