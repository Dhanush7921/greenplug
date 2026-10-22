/**
 * GREENPLUG lead capture — Google Apps Script web app.
 *
 * Records website form submissions in the Google Sheet this script is bound to,
 * one tab per form type (general, driver, host, partner).
 *
 * Setup (about 5 minutes):
 *   1. Create a Google Sheet (e.g. "GREENPLUG leads"). Extensions -> Apps Script.
 *   2. Replace the default code with this file and click Save.
 *   3. Deploy -> New deployment -> type "Web app".
 *        Execute as: Me
 *        Who has access: Anyone
 *      Authorise when asked, then copy the Web app URL (ends with /exec).
 *   4. Put that URL in VITE_LEADS_ENDPOINT (GitHub repository variable or local .env) and rebuild.
 *
 * Security notes:
 *   - The URL is public by design (it ships in the website). This script only appends rows; it never
 *     returns sheet data. Keep the Sheet itself private.
 *   - Inputs are validated, length-limited and protected against spreadsheet formula injection.
 *   - Duplicate submissions (same submissionId within 6 hours) are ignored.
 *   - After editing this file, use Deploy -> Manage deployments -> Edit -> New version, so the URL stays the same.
 */

const FORMS = {
  general: ['name', 'email', 'topic', 'message'],
  driver: ['name', 'email', 'phone', 'city', 'vehicle', 'model', 'connector', 'needs'],
  host: ['name', 'email', 'phone', 'city', 'property', 'setup', 'vehicles', 'notes'],
  partner: ['name', 'organisation', 'email', 'phone', 'partnerType', 'message'],
};
const REQUIRED = {
  general: ['name', 'email', 'topic', 'message'],
  driver: ['name', 'email', 'city', 'vehicle'],
  host: ['name', 'email', 'phone', 'city', 'property', 'setup', 'vehicles'],
  partner: ['name', 'organisation', 'email', 'partnerType', 'message'],
};
const MAX_LEN = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const type = String(body.type || '');
    if (!FORMS[type]) return json_({ ok: false, error: 'Unknown form type.' });

    const data = body.data || {};
    if (data.website) return json_({ ok: false, error: 'Rejected.' }); // honeypot
    if (data.consent !== true) return json_({ ok: false, error: 'Consent is required.' });
    for (const f of REQUIRED[type]) {
      if (!String(data[f] || '').trim()) return json_({ ok: false, error: 'Missing field: ' + f });
    }
    if (!EMAIL_RE.test(String(data.email || ''))) return json_({ ok: false, error: 'Invalid email address.' });

    const id = String(body.submissionId || '').slice(0, 64);
    const cache = CacheService.getScriptCache();
    if (id && cache.get('sub:' + id)) return json_({ ok: true, duplicate: true });

    const sheet = sheetFor_(type);
    const row = [new Date(), id, String(body.page || '').slice(0, 120)].concat(FORMS[type].map((f) => clean_(data[f])), ['yes']);
    sheet.appendRow(row);
    if (id) cache.put('sub:' + id, '1', 6 * 60 * 60);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'Server error. Please try again later.' });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

/** Health check: opening the URL in a browser shows this message. */
function doGet() {
  return json_({ ok: true, service: 'GREENPLUG leads', accepts: Object.keys(FORMS) });
}

function sheetFor_(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(type);
  if (!sheet) {
    sheet = ss.insertSheet(type);
    sheet.appendRow(['Received', 'Submission ID', 'Page'].concat(FORMS[type], ['Consent']));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Trim, limit length and neutralise values that a spreadsheet would treat as formulas. */
function clean_(v) {
  let s = String(v == null ? '' : v).trim().slice(0, MAX_LEN);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
