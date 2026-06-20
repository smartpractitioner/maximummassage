# SOP — Capture a Cal.com Booking Webhook Payload (discovery step)

> **Heads-up — verify against the current UI before trusting these steps.** Cal.com (and webhook.site) change their interfaces and menu labels over time. The steps below were accurate on **2026-06-20**. If anything you see on screen doesn't match — a menu is renamed, a setting moved, an option missing — **stop and look up Cal.com's current webhook documentation** (developers.cloudflare-style docs at `cal.com/docs` / the in-app Settings → Developer area) and follow the up-to-date steps instead. Treat this SOP as the intent + checklist, not gospel on exact click paths.

---

## Purpose

Before wiring a client's booking backend, capture the **real `BOOKING_CREATED` webhook payload** so the handler is built against actual field names, not guesses. This is a one-time discovery step per client (and worth re-running if the client changes their Cal.com booking form fields).

## Prerequisites

- Admin access to the client's Cal.com account.
- A test email **and** phone number you control.
- A therapist with a live Cal.com event type / public booking page (e.g. a 60-minute session).

## Steps

1. Open **https://webhook.site** in a browser. Copy the **"Your unique URL"** it generates (the `https://webhook.site/<id>` form, not the editor `#!` link). Leave the tab open — requests appear here live.
2. In Cal.com, go to **Settings → Developer → Webhooks → New** (label may read "Create Webhook").
3. Paste the webhook.site URL as the **Subscriber URL**. Under **Event Triggers**, check **Booking Created** only (uncheck cancelled, rescheduled, etc.). Make sure it's **enabled**, then **Save**. *(If asked account-wide vs. a specific event type, account-wide is fine.)*
4. Open the therapist's public booking page and **make one test booking** with your test name, email, and phone. Pick any available time.
5. Return to the webhook.site tab. Click the new **POST** request in the left column, find **Raw Content**, and **copy the full JSON**. This is the payload — paste it to the developer / into the build ticket.
6. **Cleanup:**
   - In Cal.com, **cancel the test booking** so the clinic's calendar isn't held.
   - In **Settings → Developer → Webhooks**, **delete or disable** the webhook.site entry. (The real production webhook, pointed at the client's backend, is created later during the build — not here.)

## What you get

The exact field paths the booking-record handler is built from:

- **Patient contact:** `payload.attendees[0]` → `firstName`, `lastName`, `name`, `email`, `phoneNumber`
- **Therapist (organizer):** `payload.organizer` → `username`, `name`, `email`
- **Timing / event:** `payload.startTime`, `payload.endTime`, `payload.length`, `payload.eventTypeId`, `payload.status`, `payload.location`
- **Booking ids:** `payload.uid` (joins to the client-side `bookingSuccessfulV2` event), `payload.bookingId`
- **Custom / UTM fields:** `payload.responses` (any hidden fields on the event type — e.g. `utm_source`, `gclid` — show here; empty unless the booking embed prefills them)

## Notes for the build (Maximum Health, captured 2026-06-20)

- The event type already carried hidden `utm_source/medium/campaign/gclid` fields. To complete attribution + routing, the booking embed must prefill these plus newly-added hidden `skill`, `recommended_therapist_id`, and (if all five UTMs are wanted) `utm_term` + `utm_content` fields.
- The captured booking had attendee self-reschedule/cancel **disabled**, so the post-booking confirmation page should tell patients to **contact the clinic** to change an appointment, not "reschedule via Cal.com."
