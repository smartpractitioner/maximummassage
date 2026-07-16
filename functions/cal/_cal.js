// functions/cal/_cal.js — shared config + helpers for the Cal.com API proxy.
//
// Underscore-prefixed: Cloudflare Pages does NOT route this file; it is imported
// by the sibling functions (/cal/slots.js, /cal/book.js). Same proxy pattern as
// functions/track.js — the secret lives as a Cloudflare Pages env var and never
// reaches the browser.
//
// REQUIRED ENV (Cloudflare Pages → Settings → Environment Variables,
// set for BOTH Production and Preview) — one Cal.com API key per therapist:
//   CAL_KEY_BROOKELYN, CAL_KEY_MEAGAN, CAL_KEY_CHARLOTTE, CAL_KEY_LINDSEY
// Until a therapist's key is set, that therapist's endpoints return a graceful
// no-op ({ ok:false, configured:false }) so the front-end shows its fallback
// instead of erroring. Tif is intentionally absent (no Cal.com — Decision 5;
// her Book routes to the /confirmation/ demand-test page, not the calendar).

export const CAL_BASE = 'https://api.cal.com/v2';
export const CAL_TZ = 'America/Edmonton';
// These two versions are DIFFERENT on purpose — confirmed against the v2 docs.
export const CAL_SLOTS_VERSION = '2024-09-04';    // GET /v2/slots
export const CAL_BOOKINGS_VERSION = '2026-02-25'; // POST /v2/bookings

// therapist id -> { keyEnv, username, eventTypeSlug }. Derived from the handle
// map in public/js/picker-config.js (e.g. 'lstauffer/60min'). If Victor supplies
// numeric eventTypeIds, add `eventTypeId` to a therapist here and the callers
// prefer it over username+slug automatically.
export const THERAPISTS = {
  brookelyn: { keyEnv: 'CAL_KEY_BROOKELYN', username: 'bbrolly',   eventTypeSlug: '60min' },
  meagan:    { keyEnv: 'CAL_KEY_MEAGAN',    username: 'meaganb',   eventTypeSlug: '60min' },
  charlotte: { keyEnv: 'CAL_KEY_CHARLOTTE', username: 'ctooth',    eventTypeSlug: '90min' },
  lindsey:   { keyEnv: 'CAL_KEY_LINDSEY',   username: 'lstauffer', eventTypeSlug: '60min' }
};

// Resolve a therapist id to its secret key + event identity, or a reason it
// can't be resolved (unknown id vs. key-not-configured-yet).
export function resolveTherapist(env, id) {
  const t = THERAPISTS[String(id || '').toLowerCase()];
  if (!t) return { ok: false, reason: 'unknown_therapist' };
  const key = env && env[t.keyEnv];
  if (!key) return { ok: false, reason: 'unconfigured', therapist: t };
  return { ok: true, key: key, therapist: t };
}

// Apply the event-type identity (id if we have it, else username+slug) onto a
// URLSearchParams (slots) or a plain object (booking body).
export function applyEventType(target, therapist) {
  if (therapist.eventTypeId) {
    if (target instanceof URLSearchParams) target.set('eventTypeId', String(therapist.eventTypeId));
    else target.eventTypeId = therapist.eventTypeId;
    return;
  }
  if (target instanceof URLSearchParams) {
    target.set('username', therapist.username);
    target.set('eventTypeSlug', therapist.eventTypeSlug);
  } else {
    target.username = therapist.username;
    target.eventTypeSlug = therapist.eventTypeSlug;
  }
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}
