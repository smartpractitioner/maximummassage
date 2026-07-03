/**
 * Maximum Health — Lead-capture + quiz-submission endpoint (Google Apps Script).
 *
 * Paste this file into your Google Sheet at Extensions → Apps Script.
 * Then Deploy → New deployment → Type: Web app.
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the deployment URL and paste it into:
 *   public/js/therapist-picker.js       (LEAD_CAPTURE_ENDPOINT)
 *   public/massage-therapy-calgary-flow-b/confirmation/index.html  (LEAD_CAPTURE_ENDPOINT)
 *
 * POST actions (front-end, via window.mhBackend):
 *   - action: "lead"             → appends a new row with the form data
 *   - action: "notify"           → updates that row with notify_preference (yes/no)
 *   - action: "update_contact"   → updates phone + email on the existing row
 *   - action: "quiz_submission"  → appends a quiz answer row (no contact info yet)
 *
 * POST — Cal.com webhook (Phase 1.5, Channel B, no `action`):
 *   - body.triggerEvent === "BOOKING_CREATED" → writes bookings_<skill> and
 *     posts to Slack. Set the Cal Booking-Created webhook subscriber URL to
 *     this Web App (per Cal account). Slack URL comes from Script Property
 *     SLACK_BOOKINGS_WEBHOOK_URL. The monthly cap count is derived live from
 *     the booking rows (no counter tab).
 *
 * GET:
 *   - ?action=available_therapists[&callback=fn] → JSON (or JSONP) of
 *     { therapistId: { available, reason? } } for the picker gray-out (1.2).
 *
 * Per-skill routing (added 2026-05):
 * Each payload carries a `skill` field. Lead/notify/update_contact rows are
 * written to a tab named `leads_<skill>` (defaulting to legacy `Leads` if no
 * skill provided, for backward compatibility with Flow B "general"). Quiz
 * submissions go to a separate `quiz_<skill>` tab. Tabs are auto-created
 * with the appropriate header row on first write.
 *
 * Rows are matched back by GCLID when available. If GCLID is empty
 * (direct/organic traffic), the most recent row with the same email is
 * updated. For "update_contact", match_email carries the OLD email so we
 * can find the row before applying the new email.
 */

const LEGACY_LEADS_TAB = 'Leads';

const LEAD_HEADERS = [
  'Timestamp',
  'First Name',
  'Last Name',
  'Email',
  'Phone',
  'Selected Therapist',
  'Recommended Therapist',
  'Matched Recommendation',
  'Skill',
  'GCLID',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'page_variant',
  'flow',
  'Notify Preference',
  'Notify Recorded At',
  // CASL consent record — populated when the user clicks
  // "Yes, hold a spot for me" on the confirmation page.
  'Consent IP',
  'Consent At',
  'Consent User Agent',
  'Consent Phone',
  'Consent Email',
  'Consent Text'
];

const QUIZ_HEADERS = [
  'Timestamp',
  'Skill',
  'Recommended Therapist ID',
  'Answers (JSON)',
  'GCLID',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'page_variant',
  'flow'
];

const BOOKING_HEADERS = [
  'Timestamp', 'Booking UID', 'Booking ID', 'Status',
  'Skill', 'Booked Therapist', 'Booked Handle', 'Recommended Therapist ID', 'Matched Recommendation',
  'First Name', 'Last Name', 'Email', 'Phone',
  'Start Time', 'End Time', 'Event Type ID', 'Location',
  'GCLID', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
];

// Per-therapist monthly cap + active flag (global across all skill pages).
// cap === null means unlimited. The month count is DERIVED live from the
// booking rows (see bookingCountForMonth) — no counter tab — so caps reset on
// the 1st with nothing to maintain. PER-CLIENT CONFIG.
const THERAPIST_CONFIG = {
  brookelyn: { name: 'Brookelyn Brolly', cap: 15,   active: true },
  meagan:    { name: 'Meagan Brown',     cap: 10,   active: true },
  charlotte: { name: 'Charlotte Tooth',  cap: null, active: true },
  lindsey:   { name: 'Lindsey Stauffer', cap: null, active: true },
  tif:       { name: 'Tif Henderson',    cap: 15,   active: false }
};

// Cal.com organizer.username -> our therapist id. PER-CLIENT CONFIG.
const HANDLE_TO_ID = {
  bbrolly: 'brookelyn',
  meaganb: 'meagan',
  ctooth: 'charlotte',
  lstauffer: 'lindsey',
  thenderson: 'tif'
};

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    // Cal.com BOOKING_CREATED webhook (Channel B) — server-to-server, no `action`.
    if (body.triggerEvent === 'BOOKING_CREATED' && body.payload) {
      handleCalBooking(body.payload);
      return jsonOk();
    }

    if (action === 'lead') {
      const sheet = getOrCreateLeadsSheet(body.skill);
      appendLead(sheet, body);
      return jsonOk();
    }
    if (action === 'notify') {
      const sheet = getOrCreateLeadsSheet(body.skill);
      updateNotify(sheet, body);
      return jsonOk();
    }
    if (action === 'update_contact') {
      const sheet = getOrCreateLeadsSheet(body.skill);
      updateContact(sheet, body);
      return jsonOk();
    }
    if (action === 'quiz_submission') {
      const sheet = getOrCreateQuizSheet(body.skill);
      appendQuiz(sheet, body);
      return jsonOk();
    }
    return jsonErr('unknown action: ' + action);
  } catch (err) {
    return jsonErr(err && err.message ? err.message : String(err));
  }
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action === 'available_therapists') {
    const data = availableTherapists();
    const cb = e.parameter.callback;
    // JSONP when a callback is given (lets the browser read the result
    // cross-origin without CORS headaches on Apps Script GET responses).
    if (cb) {
      return ContentService
        .createTextOutput(cb + '(' + JSON.stringify(data) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput('Maximum Health lead capture endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Resolve the leads tab name for a given skill. Backward compatible:
 *   - undefined / 'general' / '' → legacy 'Leads' tab (so Flow B's
 *     existing data stays in one place)
 *   - any other skill → 'leads_<skill>' tab (e.g. 'leads_prenatal')
 */
function leadsTabName(skill) {
  if (!skill || skill === 'general' || String(skill).trim() === '') return LEGACY_LEADS_TAB;
  return 'leads_' + sanitizeSkillForTab(skill);
}

function quizTabName(skill) {
  return 'quiz_' + sanitizeSkillForTab(skill || 'general');
}

function sanitizeSkillForTab(skill) {
  return String(skill).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
}

function getOrCreateLeadsSheet(skill) {
  return getOrCreateSheet(leadsTabName(skill), LEAD_HEADERS);
}

function getOrCreateQuizSheet(skill) {
  return getOrCreateSheet(quizTabName(skill), QUIZ_HEADERS);
}

function getOrCreateSheet(tabName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    syncHeaders(sheet, headers);
  }
  return sheet;
}

/**
 * Append any headers that aren't already in the sheet's first row. Lets us
 * add columns over time (e.g. CASL consent fields, Skill column) without
 * forcing a manual edit of the spreadsheet — the script just extends the
 * header row the first time it sees a missing label.
 */
function syncHeaders(sheet, headers) {
  const lastCol = sheet.getLastColumn();
  const existing = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const missing = headers.filter((h) => existing.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
    sheet.setFrozenRows(1);
  }
}

function appendLead(sheet, body) {
  const row = [
    new Date(),
    body.first_name || '',
    body.last_name || '',
    body.email || '',
    body.phone || '',
    body.selected_therapist || '',
    body.recommended_therapist || '',
    body.matched_recommendation === true ? 'TRUE'
      : body.matched_recommendation === false ? 'FALSE' : '',
    body.skill || '',
    body.gclid || '',
    body.utm_source || '',
    body.utm_medium || '',
    body.utm_campaign || '',
    body.utm_term || '',
    body.utm_content || '',
    body.page_variant || '',
    body.flow || '',
    '',
    ''
  ];
  sheet.appendRow(row);
}

function appendQuiz(sheet, body) {
  const row = [
    new Date(),
    body.skill || '',
    body.recommended_therapist_id || '',
    JSON.stringify(body.answers || []),
    body.gclid || '',
    body.utm_source || '',
    body.utm_medium || '',
    body.utm_campaign || '',
    body.utm_term || '',
    body.utm_content || '',
    body.page_variant || '',
    body.flow || ''
  ];
  sheet.appendRow(row);
}

function updateNotify(sheet, body) {
  const data = sheet.getDataRange().getValues();
  const gclidCol = LEAD_HEADERS.indexOf('GCLID');
  const emailCol = LEAD_HEADERS.indexOf('Email');
  const notifyCol = LEAD_HEADERS.indexOf('Notify Preference');
  const notifyTsCol = LEAD_HEADERS.indexOf('Notify Recorded At');
  const consentIpCol = LEAD_HEADERS.indexOf('Consent IP');
  const consentAtCol = LEAD_HEADERS.indexOf('Consent At');
  const consentUaCol = LEAD_HEADERS.indexOf('Consent User Agent');
  const consentPhoneCol = LEAD_HEADERS.indexOf('Consent Phone');
  const consentEmailCol = LEAD_HEADERS.indexOf('Consent Email');
  const consentTextCol = LEAD_HEADERS.indexOf('Consent Text');

  let targetRow = -1;

  if (body.gclid) {
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][gclidCol]) === String(body.gclid)) { targetRow = i + 1; break; }
    }
  }
  if (targetRow === -1 && body.email) {
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][emailCol]).toLowerCase() === String(body.email).toLowerCase()) {
        targetRow = i + 1; break;
      }
    }
  }

  // Only "yes" answers are CASL consent. "no" / no-answer never writes
  // to the consent columns.
  const isConsent = body.notify_preference === 'yes';

  if (targetRow !== -1) {
    sheet.getRange(targetRow, notifyCol + 1).setValue(body.notify_preference || '');
    sheet.getRange(targetRow, notifyTsCol + 1).setValue(new Date());
    if (isConsent) {
      writeConsent(sheet, targetRow, body, {
        consentIpCol: consentIpCol,
        consentAtCol: consentAtCol,
        consentUaCol: consentUaCol,
        consentPhoneCol: consentPhoneCol,
        consentEmailCol: consentEmailCol,
        consentTextCol: consentTextCol
      });
    }
  } else {
    // No matching row found — append a new "notify only" row so we don't lose the signal
    const row = new Array(LEAD_HEADERS.length).fill('');
    row[0] = new Date();
    row[emailCol] = body.email || '';
    row[LEAD_HEADERS.indexOf('Phone')] = body.phone || '';
    row[LEAD_HEADERS.indexOf('Skill')] = body.skill || '';
    row[gclidCol] = body.gclid || '';
    row[LEAD_HEADERS.indexOf('page_variant')] = body.page_variant || '';
    row[LEAD_HEADERS.indexOf('flow')] = body.flow || '';
    row[notifyCol] = body.notify_preference || '';
    row[notifyTsCol] = new Date();
    if (isConsent) {
      row[consentIpCol] = body.consent_ip || '';
      row[consentAtCol] = body.consent_at ? new Date(body.consent_at) : new Date();
      row[consentUaCol] = body.consent_user_agent || '';
      row[consentPhoneCol] = body.consent_phone || body.phone || '';
      row[consentEmailCol] = body.consent_email || body.email || '';
      row[consentTextCol] = body.consent_text || '';
    }
    sheet.appendRow(row);
  }
}

function writeConsent(sheet, targetRow, body, cols) {
  if (cols.consentIpCol !== -1) sheet.getRange(targetRow, cols.consentIpCol + 1).setValue(body.consent_ip || '');
  if (cols.consentAtCol !== -1) sheet.getRange(targetRow, cols.consentAtCol + 1).setValue(body.consent_at ? new Date(body.consent_at) : new Date());
  if (cols.consentUaCol !== -1) sheet.getRange(targetRow, cols.consentUaCol + 1).setValue(body.consent_user_agent || '');
  if (cols.consentPhoneCol !== -1) sheet.getRange(targetRow, cols.consentPhoneCol + 1).setValue(body.consent_phone || body.phone || '');
  if (cols.consentEmailCol !== -1) sheet.getRange(targetRow, cols.consentEmailCol + 1).setValue(body.consent_email || body.email || '');
  if (cols.consentTextCol !== -1) sheet.getRange(targetRow, cols.consentTextCol + 1).setValue(body.consent_text || '');
}

function updateContact(sheet, body) {
  const data = sheet.getDataRange().getValues();
  const gclidCol = LEAD_HEADERS.indexOf('GCLID');
  const emailCol = LEAD_HEADERS.indexOf('Email');
  const phoneCol = LEAD_HEADERS.indexOf('Phone');

  let targetRow = -1;

  if (body.match_gclid) {
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][gclidCol]) === String(body.match_gclid)) { targetRow = i + 1; break; }
    }
  }
  if (targetRow === -1 && body.match_email) {
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][emailCol]).toLowerCase() === String(body.match_email).toLowerCase()) {
        targetRow = i + 1; break;
      }
    }
  }

  if (targetRow !== -1) {
    if (body.phone) sheet.getRange(targetRow, phoneCol + 1).setValue(body.phone);
    if (body.email) sheet.getRange(targetRow, emailCol + 1).setValue(body.email);
  } else {
    // No matching row found — append a "contact-only" row so we don't lose the signal
    const row = new Array(LEAD_HEADERS.length).fill('');
    row[0] = new Date();
    row[emailCol] = body.email || '';
    row[phoneCol] = body.phone || '';
    row[LEAD_HEADERS.indexOf('Skill')] = body.skill || '';
    sheet.appendRow(row);
  }
}

function jsonOk() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonErr(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================================
 * Phase 1.5 — Cal.com BOOKING_CREATED webhook (Channel B)
 * Cal.com POSTs the booking here (set the webhook subscriber URL to this
 * Web App URL, account-level, trigger = Booking Created). We write the full
 * record to bookings_<skill> and post to Slack (the monthly cap count is
 * derived from these rows in availableTherapists). Attribution
 * (skill/recommended/UTMs) rides the hidden Cal fields we prefill on the
 * embed; contact rides attendees[0].
 * ===================================================================== */

function handleCalBooking(payload) {
  const attendee = (payload.attendees && payload.attendees[0]) || {};
  const organizer = payload.organizer || {};
  const skill = resp(payload, 'skill') || 'general';
  const bookedId = HANDLE_TO_ID[organizer.username] || organizer.username || '';
  const recommendedId = resp(payload, 'recommended_therapist_id') || '';
  const matched = recommendedId ? (recommendedId === bookedId ? 'TRUE' : 'FALSE') : '';

  const r = {
    uid: payload.uid || '',
    bookingId: payload.bookingId || '',
    status: payload.status || '',
    skill: skill,
    bookedId: bookedId,
    handle: organizer.username || '',
    recommendedId: recommendedId,
    matched: matched,
    firstName: attendee.firstName || '',
    lastName: attendee.lastName || '',
    email: attendee.email || '',
    phone: attendee.phoneNumber || '',
    start: payload.startTime || '',
    end: payload.endTime || '',
    eventTypeId: payload.eventTypeId || '',
    location: payload.location || '',
    gclid: resp(payload, 'gclid'),
    utm_source: resp(payload, 'utm_source'),
    utm_medium: resp(payload, 'utm_medium'),
    utm_campaign: resp(payload, 'utm_campaign'),
    utm_term: resp(payload, 'utm_term'),
    utm_content: resp(payload, 'utm_content')
  };

  const sheet = getOrCreateSheet('bookings_' + sanitizeSkillForTab(skill), BOOKING_HEADERS);
  sheet.appendRow([
    new Date(), r.uid, r.bookingId, r.status,
    r.skill, r.bookedId, r.handle, r.recommendedId, r.matched,
    r.firstName, r.lastName, r.email, r.phone,
    r.start, r.end, r.eventTypeId, r.location,
    r.gclid, r.utm_source, r.utm_medium, r.utm_campaign, r.utm_term, r.utm_content
  ]);

  notifySlack(r);
}

// Read a hidden/custom field value out of Cal's responses object.
function resp(payload, key) {
  const a = payload.responses && payload.responses[key];
  if (a && typeof a.value === 'string') return a.value;
  const b = payload.userFieldsResponses && payload.userFieldsResponses[key];
  if (b && typeof b.value === 'string') return b.value;
  return '';
}

function currentYearMonth() {
  const tz = Session.getScriptTimeZone() || 'America/Edmonton';
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM');
}

// Monthly cap count — DERIVED live from the booking rows (single source of
// truth; no counter tab to drift). Counts a therapist's bookings BOOKED in the
// given year-month (by the row's Timestamp = booked-on date), across ALL
// bookings_<skill> tabs, since caps are global across skills. Resets by month
// automatically. Skips non-ACCEPTED rows (for when we handle cancellations).
function bookingCountForMonth(therapistId, yearMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = Session.getScriptTimeZone() || 'America/Edmonton';
  let count = 0;
  ss.getSheets().forEach(function (sheet) {
    if (sheet.getName().indexOf('bookings_') !== 0) return;  // only bookings_<skill> tabs
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;
    const hdr = data[0];
    const therapistCol = hdr.indexOf('Booked Therapist');
    const tsCol = hdr.indexOf('Timestamp');
    const statusCol = hdr.indexOf('Status');
    if (therapistCol === -1 || tsCol === -1) return;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][therapistCol]).toLowerCase().trim() !== therapistId) continue;
      if (statusCol !== -1) {
        const st = String(data[i][statusCol]).toUpperCase().trim();
        if (st && st !== 'ACCEPTED') continue;
      }
      if (monthOf(data[i][tsCol], tz) === yearMonth) count++;
    }
  });
  return count;
}

// A Timestamp cell is normally a Date; return its year-month in `tz`.
function monthOf(v, tz) {
  const d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, tz, 'yyyy-MM');
}

// { therapistId: { available: bool, reason?: 'fully_booked' | 'inactive' } }
function availableTherapists() {
  const ym = currentYearMonth();
  const out = {};
  Object.keys(THERAPIST_CONFIG).forEach(function (id) {
    const cfg = THERAPIST_CONFIG[id];
    if (!cfg.active) { out[id] = { available: false, reason: 'inactive' }; return; }
    if (cfg.cap == null) { out[id] = { available: true }; return; }
    const count = bookingCountForMonth(id, ym);
    out[id] = count >= cfg.cap ? { available: false, reason: 'fully_booked' } : { available: true };
  });
  return out;
}

/* ---------- Slack booking notification (Decision 7) ----------
 * Configure the webhook URL once via Project Settings -> Script Properties:
 *   SLACK_BOOKINGS_WEBHOOK_URL = https://hooks.slack.com/services/...
 * If unset, we skip silently (never breaks the booking write).
 */
function notifySlack(r) {
  const url = PropertiesService.getScriptProperties().getProperty('SLACK_BOOKINGS_WEBHOOK_URL');
  if (!url) return;
  const who = ((r.firstName + ' ' + r.lastName).trim()) || r.email || 'A patient';
  const via = [r.utm_source, r.utm_campaign].filter(String).join(' / ') || 'direct';
  let when = r.start;
  try { if (r.start) when = Utilities.formatDate(new Date(r.start), 'America/Edmonton', "EEE MMM d 'at' h:mm a") + ' MT'; } catch (e) {}

  // ===== EDIT THESE LINES to change what the Slack message says =====
  // Slack formatting: *bold*, _italic_, :emoji:, and each array item is a new
  // line. Available fields on `r`: firstName, lastName, email, phone, skill,
  // bookedId, handle, recommendedId, matched, start, end, eventTypeId,
  // location, gclid, utm_source/medium/campaign/term/content, uid.
  const cfg = THERAPIST_CONFIG[r.bookedId];
  const therapist = (cfg && cfg.name) || r.bookedId || r.handle;
  const text = [
    ':calendar: *New booking* — ' + who,
    '*Therapist:* ' + therapist,
    '*Skill:* ' + r.skill,
    '*When:* ' + when,
    '*Source:* ' + via + (r.gclid ? '   (gclid ✓)' : '')
  ].join('\n');
  // =================================================================
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: text }),
      muteHttpExceptions: true
    });
  } catch (err) { /* never let a Slack failure break the booking write */ }
}
