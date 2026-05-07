// functions/track.js — server-side GA4 Measurement Protocol relay.
//
// Replaces the 160 KB client-side gtag.js (G-DVHL7E1D9C) bundle with a
// single edge fetch. The client posts a small JSON payload to /track and
// this function forwards it to Google Analytics 4 via the Measurement
// Protocol, enriched with server-side context (CF country, city, IP).
//
// REQUIRED ENV (Cloudflare Pages → Settings → Environment Variables):
//   GA4_API_SECRET     — created in GA4 admin → Data Streams → click the
//                        web stream → Measurement Protocol API secrets →
//                        "Create" → copy the secret value.
//
// OPTIONAL ENV:
//   GA4_DEBUG=1        — sends to /debug/mp/collect instead of /mp/collect
//                        so you can validate payloads in DebugView before
//                        cutting over.
//
// MANUAL STEPS to fully retire client-side gtag.js for GA4:
//   1. Add GA4_API_SECRET as a CF Pages env var (Production + Preview).
//   2. Push this code; visit the live page; confirm GA4 → Realtime shows
//      page_view events arriving with the correct geo + UTM params.
//   3. In the GTM container (GTM-5M8LTCF8), disable the "GA4 Configuration"
//      tag (or set its trigger to "None"). Publish the container.
//   4. Re-run PSI; the 160 KB gtag.js?id=G-DVHL7E1D9C should be gone.
//
// Google Ads conversion tracking (AW-17632628958) is NOT migrated here —
// that needs the Google Ads Enhanced Conversions API, separate work.

const GA4_MEASUREMENT_ID = 'G-DVHL7E1D9C';
const ENDPOINT_PROD = 'https://www.google-analytics.com/mp/collect';
const ENDPOINT_DEBUG = 'https://www.google-analytics.com/debug/mp/collect';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return jsonResponse({ ok: false, error: 'no_events' }, { status: 400 });
  }

  if (!env.GA4_API_SECRET) {
    // Return 200 so the client doesn't retry / log errors. The function is
    // intentionally a no-op until the secret is configured.
    return jsonResponse({ ok: true, configured: false });
  }

  // Stable per-visitor id stored as a cookie. Generated once on first
  // tracked event, reused for the next 2 years. Maps to GA4 client_id.
  const cookieHeader = request.headers.get('Cookie') || '';
  const cidMatch = cookieHeader.match(/(?:^|;\s*)_mh_cid=([A-Za-z0-9-]+)/);
  const clientId = cidMatch ? cidMatch[1] : crypto.randomUUID();

  const cfHeaders = request.cf || {};
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';

  const payload = {
    client_id: clientId,
    timestamp_micros: Date.now() * 1000,
    non_personalized_ads: false,
    events: body.events.slice(0, 25).map((e) => ({
      name: String(e.name || 'unknown').slice(0, 40),
      params: {
        ...(e.params || {}),
        // Server-side enrichment — reliable, can't be spoofed by client.
        ...(cfHeaders.country ? { geo_country: String(cfHeaders.country) } : {}),
        ...(cfHeaders.city ? { geo_city: String(cfHeaders.city) } : {}),
        ...(cfHeaders.region ? { geo_region: String(cfHeaders.region) } : {}),
        engagement_time_msec: e.params && e.params.engagement_time_msec ? e.params.engagement_time_msec : 1
      }
    })),
    ...(body.user_properties ? { user_properties: body.user_properties } : {})
  };

  const endpoint = env.GA4_DEBUG === '1' ? ENDPOINT_DEBUG : ENDPOINT_PROD;
  const url = `${endpoint}?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`;

  // Fire and forget — let the response return immediately. waitUntil keeps
  // the worker alive long enough to complete the upstream request.
  const upstream = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Pass real client UA + IP so GA4 can geolocate / device-detect.
      'User-Agent': ua,
      'X-Forwarded-For': ip
    },
    body: JSON.stringify(payload)
  }).catch(() => null);

  if (env.GA4_DEBUG === '1') {
    // In debug mode, await + return the validation response so the
    // browser DevTools can show field-level errors from GA4.
    const r = await upstream;
    const text = r ? await r.text() : '{}';
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  context.waitUntil(upstream);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (!cidMatch) {
    headers.append(
      'Set-Cookie',
      `_mh_cid=${clientId}; Path=/; Max-Age=63072000; SameSite=Lax; Secure; HttpOnly`
    );
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
