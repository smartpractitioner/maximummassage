(function () {
  'use strict';

  // Single choke point for EVERY front-end -> backend call.
  //
  // Why this exists: the whole backend (Google Apps Script today, a Cloudflare
  // Worker in Phase 6) can be swapped by changing ONE value -- window.MH_BACKEND_URL.
  // The action contracts (lead, quiz_submission, notify, update_contact,
  // available_therapists, ...) stay identical, so migration day is zero front-end
  // rework. Set window.MH_BACKEND_URL BEFORE this script loads to override the
  // default below -- that's the per-client configuration hook for the factory.
  window.MH_BACKEND_URL = window.MH_BACKEND_URL ||
    'https://script.google.com/macros/s/AKfycbwt0ZJ1RW8unG2Uj5vyXWC4Xn7k5fhPGpUL57ysYYoGX-i0fkacxyr-uIGhxx3Le_cKFQ/exec';

  function endpoint() {
    var url = window.MH_BACKEND_URL;
    if (!url || url === 'REPLACE_WITH_APPS_SCRIPT_URL') return null;
    return url;
  }

  // Fire-and-forget write. Mirrors the historical Apps Script call shape
  // (no-cors + text/plain), so the response is opaque by design. Always returns
  // a Promise so callers can .then / .catch / .finally uniformly.
  function post(action, payload) {
    var url = endpoint();
    if (!url) return Promise.resolve(null);
    try {
      return fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: action }, payload || {}))
      });
    } catch (_) {
      return Promise.resolve(null);
    }
  }

  // Readable GET (e.g. available_therapists). Left in default (cors) mode so the
  // caller can read the JSON body -- the backend must return permissive CORS JSON
  // for this to work (handled backend-side in Phase 1.5).
  function get(action, params) {
    var url = endpoint();
    if (!url) return Promise.resolve(null);
    var qs = new URLSearchParams(Object.assign({ action: action }, params || {})).toString();
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    return fetch(url + sep + qs, { method: 'GET' });
  }

  window.mhBackend = { post: post, get: get };
})();
