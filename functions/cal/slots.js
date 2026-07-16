// functions/cal/slots.js — GET /cal/slots?therapist=<id>&start=<ISO>&end=<ISO>
//
// Server-side proxy to Cal.com GET /v2/slots. Attaches the therapist's secret
// Cal key (never exposed to the browser) and returns real availability grouped
// by date so the custom calendar can (a) mark bookable days and (b) list a
// chosen day's times:  { ok:true, slots: { "YYYY-MM-DD": [{start}], ... } }
//
// start/end are UTC ISO 8601. timeZone is fixed to the clinic's America/Edmonton
// so returned slot times are already local.

import { CAL_BASE, CAL_TZ, CAL_SLOTS_VERSION, resolveTherapist, applyEventType, json } from './_cal.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const therapistId = url.searchParams.get('therapist');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!start || !end) return json({ ok: false, error: 'missing_range' }, 400);

  const r = resolveTherapist(env, therapistId);
  if (!r.ok && r.reason === 'unknown_therapist') return json({ ok: false, error: 'unknown_therapist' }, 400);
  // Key not configured yet — graceful no-op so the front-end shows its fallback.
  if (!r.ok && r.reason === 'unconfigured') return json({ ok: false, configured: false, slots: {} });

  const qs = new URLSearchParams({ start: start, end: end, timeZone: CAL_TZ });
  applyEventType(qs, r.therapist);

  let res, data;
  try {
    res = await fetch(`${CAL_BASE}/slots?${qs.toString()}`, {
      headers: {
        'Authorization': `Bearer ${r.key}`,
        'cal-api-version': CAL_SLOTS_VERSION
      }
    });
    data = await res.json();
  } catch (e) {
    return json({ ok: false, error: 'upstream_unreachable' }, 502);
  }

  if (!res.ok) return json({ ok: false, error: 'cal_error', status: res.status, detail: data }, 502);

  // Cal v2 shape: { status:"success", data: { "YYYY-MM-DD": [{start}] } }
  const slots = (data && data.data) ? data.data : {};
  return json({ ok: true, slots: slots });
}
