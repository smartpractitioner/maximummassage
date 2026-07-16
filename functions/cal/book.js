// functions/cal/book.js — POST /cal/book
//
// Server-side proxy to Cal.com POST /v2/bookings. Creates a REAL Cal.com booking
// so the entire existing downstream is preserved unchanged: Cal fires its
// BOOKING_CREATED webhook -> Apps Script -> bookings_<skill> + Jane sync +
// monthly-cap derivation, exactly as with the old iframe. This function only
// adds the secret key server-side; it does NOT fire the ad conversion (that
// stays on /booking-confirmed/ load, deduped by uid — Decision 4).
//
// Attribution (skill, recommended_therapist_id, user_id, gclid, utm_*) rides
// `bookingFieldsResponses` under the SAME slugs the Cal prefill used, so the
// webhook's payload.responses.* is identical to today.
//
// Request body:
//   { therapist, start (UTC ISO), attendee:{ name, email, phone },
//     attribution:{ skill, recommended_therapist_id, user_id, gclid, utm_* } }
// Response: { ok:true, uid, id, start }

import { CAL_BASE, CAL_TZ, CAL_BOOKINGS_VERSION, resolveTherapist, applyEventType, json } from './_cal.js';

const ATTRIB_KEYS = [
  'skill', 'recommended_therapist_id', 'user_id',
  'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
];

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }

  const a = body.attendee || {};
  if (!body.start || !a.name || !a.email) return json({ ok: false, error: 'missing_fields' }, 400);

  const r = resolveTherapist(env, body.therapist);
  if (!r.ok && r.reason === 'unknown_therapist') return json({ ok: false, error: 'unknown_therapist' }, 400);
  // Key not configured yet — graceful no-op so the front-end shows its phone fallback.
  if (!r.ok && r.reason === 'unconfigured') return json({ ok: false, configured: false });

  const attribution = body.attribution || {};
  const responses = {};
  ATTRIB_KEYS.forEach((k) => { if (attribution[k]) responses[k] = String(attribution[k]).slice(0, 200); });

  const payload = {
    start: body.start,
    attendee: {
      name: String(a.name).slice(0, 120),
      email: String(a.email).slice(0, 160),
      timeZone: CAL_TZ,
      language: 'en'
    },
    bookingFieldsResponses: responses
  };
  if (a.phone) payload.attendee.phoneNumber = String(a.phone).slice(0, 40);
  applyEventType(payload, r.therapist);

  let res, data;
  try {
    res = await fetch(`${CAL_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${r.key}`,
        'cal-api-version': CAL_BOOKINGS_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    data = await res.json();
  } catch (e) {
    return json({ ok: false, error: 'upstream_unreachable' }, 502);
  }

  if (!res.ok) return json({ ok: false, error: 'cal_error', status: res.status, detail: data }, 502);

  const d = (data && data.data) ? data.data : {};
  return json({ ok: true, uid: d.uid, id: d.id, start: d.start });
}
