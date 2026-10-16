/** Manual mail queue — the second file of the SAME Apps Script project as
 * payment-automation.gs (it shares props_, book_, json_, sheet_, literal_,
 * LOG_SHEET and LOG_HEADERS). See MAIL_TRACKING.md before enabling.
 *
 * Properties (in addition to SPREADSHEET_ID and TEAM_EMAIL):
 *   MAIL_QUEUE_TOKEN     shared secret, also set on the Worker (MAIL_QUEUE_TOKEN)
 *   MAIL_SEND_URL        https://kamehame-japan.com/api/mail/send
 *   MAIL_STATUS_URL      https://kamehame-japan.com/api/mail/status
 *   MANUAL_SEND_ENABLED  'true' to send approved mails (independent of LIVE_SEND_ENABLED)
 *   MAIL_THREAD_LOOKUP   'true' to look up the original Message-ID in Gmail for replies/reminders
 *   ARCHIVE_COPY_TO      optional address (e.g. the hello@ group) that receives an UNTRACKED copy of every
 *                        sent mail from the script's Gmail, for history. Staff opening it leaves the
 *                        customer's open/click columns untouched.
 *   ARCHIVE_BCC          optional Resend BCC. Not recommended: the copy shares the customer's tracking,
 *                        so a staff member opening it is recorded as the customer's open/click.
 *
 * Triggers (installMailQueue): processMailQueue every minute, reconcileMailQueue hourly,
 * onQueueEdit on edit. Nothing in this file enqueues acknowledgements, follow-ups or
 * payment mails, and nothing creates a ledger case: the case ID must already exist.
 */
var QUEUE_SHEET = 'メール送信キュー';
var QUEUE_HEADERS = ['メールID','案件ID','種別','宛先','件名','本文（英語・テキスト）','本文HTML（任意）','日本語訳（確認用）','返信元Message-ID（任意）','承認','承認日時','承認者','承認ハッシュ','状態','送信日時','ResendメールID','Message-ID','配達日時','開封（参考）','決済リンククリック（参考）','その他リンククリック（参考）','配達エラー','最終エラー','作成日時','作成経路','内部データ'];
var QC = {id:0,caseId:1,kind:2,to:3,subject:4,text:5,html:6,ja:7,inReplyTo:8,approved:9,approvedAt:10,approver:11,hash:12,status:13,sentAt:14,resendId:15,messageId:16,delivered:17,opened:18,payClick:19,otherClick:20,bounce:21,error:22,createdAt:23,source:24,data:25};
var QS = {draft:'下書き',approved:'承認済み',sending:'送信中',sent:'送信済み',error:'エラー',check:'要確認',cancelled:'取消'};
var OPEN_NA = '計測対象外（テキストのみ）', OPEN_NONE = '未検知', DELIVERED_RECONCILED = '配達済み（照合）';
var CASE_RE = /^KJ-[A-Z0-9-]{6,40}$/, EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/, MSGID_RE = /^<[^\s<>]+@[^\s<>]+>$/;
var PAY_LINK = /^https:\/\/(book|buy|checkout)\.stripe\.com\//;
var LINK_HEADERS = {sentAt:'最終個別メール送信日時',subject:'最終個別メール件名',opened:'最終開封（参考）',payClick:'最終決済リンククリック（参考）',count:'個別メール送信件数'};

function queue_() { return sheet_(QUEUE_SHEET, QUEUE_HEADERS); }
function qrows_() {
  var s = queue_(); if (s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, QUEUE_HEADERS.length).getValues()
    .map(function (r, i) { return { r: r, row: i + 2 }; })
    .filter(function (x) { return String(x.r[QC.caseId] || x.r[QC.to] || x.r[QC.subject]).trim() !== ''; });
}
function qsave_(row, r) {
  queue_().getRange(row, 1, 1, QUEUE_HEADERS.length).setValues([r.map(function (v) { return v instanceof Date || typeof v === 'boolean' ? v : literal_(v); })]);
  SpreadsheetApp.flush();
}
function hex_(bytes) { return bytes.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join(''); }
function content_(r) { return [String(r[QC.to]).trim().toLowerCase(), String(r[QC.subject]).trim(), String(r[QC.text]), String(r[QC.html] || ''), String(r[QC.inReplyTo] || '').trim()]; }
/** The approval is bound to exactly this content; any edit changes the hash and voids it. */
function approvalHash_(r) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(content_(r)), Utilities.Charset.UTF_8)); }
function data_(r) { try { return r[QC.data] ? JSON.parse(r[QC.data]) : {}; } catch (e) { return {}; } }
function setData_(r, d) { r[QC.data] = JSON.stringify(d); }

/** '' when the row can be approved/sent, otherwise the reason (in Japanese). */
function validate_(r) {
  var caseId = String(r[QC.caseId]).trim(), to = String(r[QC.to]).trim();
  if (!CASE_RE.test(caseId)) return '案件IDの形式が不正（KJ-…）';
  if (!EMAIL_RE.test(to)) return '宛先メールアドレスが不正';
  if (!String(r[QC.subject]).trim() || /[\r\n]/.test(String(r[QC.subject]))) return '件名が空か改行を含む';
  if (!String(r[QC.text]).trim()) return '本文（テキスト）が空';
  if (String(r[QC.html] || '').trim() && !/<[a-z][\s\S]*>/i.test(String(r[QC.html]))) return 'HTML欄がHTMLではない';
  if (String(r[QC.inReplyTo] || '').trim() && !MSGID_RE.test(String(r[QC.inReplyTo]).trim())) return '返信元Message-IDの形式が不正（<…@…>）';
  return '';
}
/** The ledger row of an existing case (never creates one). */
function caseRow_(caseId) {
  var s = book_().getSheetByName('予約一覧'); if (!s || s.getLastRow() < 2) return null;
  var h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0], emailCol = h.indexOf('メール');
  var ids = s.getRange(2, 1, s.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === caseId) return { row: i + 2, email: emailCol >= 0 ? String(s.getRange(i + 2, emailCol + 1).getValue()).trim().toLowerCase() : '' };
  return null;
}
/** KJ-261019-01-M01, -M02 … per case. */
function nextMailId_(caseId, rows) {
  var n = 0; rows.forEach(function (x) { var m = String(x.r[QC.id]).match(new RegExp('^' + caseId.replace(/[-]/g, '\\-') + '-M(\\d+)$')); if (m) n = Math.max(n, parseInt(m[1], 10)); });
  return caseId + '-M' + ('0' + (n + 1)).slice(-2);
}
function isPaymentLink_(link, caseLinks) {
  var l = String(link || '').split('?')[0];
  return PAY_LINK.test(l) || (caseLinks || []).some(function (u) { return u && String(u).split('?')[0] === l; });
}
/** Earliest-wins for first-time stamps, so a late-arriving earlier event still counts; never clears. */
function earliest_(current, at) {
  var d = at instanceof Date ? at : new Date(at);
  if (!(d.getTime() > 0)) return current;
  if (current instanceof Date && current.getTime() > 0) return d < current ? d : current;
  return d;
}

/** Installable on-edit trigger: approval binds to the content; editing content voids approval. */
function onQueueEdit(e) {
  try {
    var range = e && e.range; if (!range || range.getSheet().getName() !== QUEUE_SHEET || range.getRow() < 2) return;
    var s = range.getSheet(), row = range.getRow(), col = range.getColumn() - 1;
    var r = s.getRange(row, 1, 1, QUEUE_HEADERS.length).getValues()[0];
    var status = String(r[QC.status] || '').trim(), approved = r[QC.approved] === true;
    var editor = (e.user && e.user.getEmail && e.user.getEmail()) || '';
    if (col === QC.approved) {
      if (approved) {
        if ([QS.sending, QS.sent, QS.cancelled, QS.error].indexOf(status) >= 0) { r[QC.approved] = false; r[QC.error] = status + 'の行は承認できません（再送は新しい行で）'; return qsave_(row, r); }
        var why = validate_(r);
        if (why) { r[QC.approved] = false; r[QC.status] = QS.check; r[QC.error] = why; return qsave_(row, r); }
        if (!r[QC.id]) r[QC.id] = nextMailId_(String(r[QC.caseId]).trim(), qrows_());
        if (!r[QC.createdAt]) r[QC.createdAt] = new Date();
        if (!r[QC.source]) r[QC.source] = '手入力';
        r[QC.hash] = approvalHash_(r); r[QC.approvedAt] = new Date(); r[QC.approver] = editor; r[QC.status] = QS.approved; r[QC.error] = '';
      } else if (status === QS.approved || status === QS.check) {
        r[QC.hash] = ''; r[QC.approvedAt] = ''; r[QC.approver] = ''; r[QC.status] = QS.draft;
      }
      return qsave_(row, r);
    }
    if ([QC.caseId, QC.to, QC.subject, QC.text, QC.html, QC.inReplyTo].indexOf(col) >= 0) {
      if (status === QS.approved || (approved && status !== QS.sent && status !== QS.sending)) {
        r[QC.approved] = false; r[QC.hash] = ''; r[QC.approvedAt] = ''; r[QC.approver] = ''; r[QC.status] = QS.draft; r[QC.error] = '内容が変更されたため承認を解除しました。確認のうえ再承認してください';
        qsave_(row, r);
      } else if (status === QS.sent || status === QS.sending) {
        s.getRange(row, QC.error + 1).setValue('送信後の編集は送信内容に反映されません（記録のみ）');
      }
    }
  } catch (err) { console.error(String(err)); }
}

/** Every minute: send approved rows once, resume an interrupted send with the same key, hold anything unclear. */
function processMailQueue() {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(1000)) return;
  try {
    var enabled = props_().getProperty('MANUAL_SEND_ENABLED') === 'true', start = Date.now();
    qrows_().forEach(function (x) {
      if (Date.now() - start > 240000) return;
      var r = x.r, status = String(r[QC.status] || '').trim();
      if (status === QS.sending) return resumeSend_(x);
      if (status !== QS.approved || r[QC.approved] !== true) return;
      if (!enabled) return; // approved rows simply wait while sending is switched off
      sendApproved_(x);
    });
    props_().setProperty('LAST_MAIL_QUEUE_RUN', new Date().toISOString());
  } finally { lock.releaseLock(); }
}
function unapprove_(x, reason, status) { var r = x.r; r[QC.approved] = false; r[QC.hash] = ''; r[QC.approvedAt] = ''; r[QC.status] = status || QS.check; r[QC.error] = reason; qsave_(x.row, r); }
function payload_(r, key) {
  var p = { mailId: String(r[QC.id]), caseId: String(r[QC.caseId]).trim(), to: String(r[QC.to]).trim(), subject: String(r[QC.subject]).trim(), text: String(r[QC.text]), idempotencyKey: key };
  if (String(r[QC.html] || '').trim()) p.html = String(r[QC.html]);
  if (String(r[QC.inReplyTo] || '').trim()) p.inReplyTo = String(r[QC.inReplyTo]).trim();
  var bcc = props_().getProperty('ARCHIVE_BCC'); if (bcc && EMAIL_RE.test(bcc) && bcc.toLowerCase() !== p.to.toLowerCase()) p.bcc = bcc;
  return p;
}
function sendApproved_(x) {
  var r = x.r, caseId = String(r[QC.caseId]).trim();
  var why = validate_(r); if (why) return unapprove_(x, why);
  if (approvalHash_(r) !== String(r[QC.hash])) return unapprove_(x, '承認後に内容が変更されています。確認のうえ再承認してください', QS.draft);
  var c = caseRow_(caseId); if (!c) return unapprove_(x, '案件IDが予約一覧にありません（新規案件は先に台帳へ登録）');
  if (c.email && c.email !== String(r[QC.to]).trim().toLowerCase()) return unapprove_(x, '宛先が予約一覧のメール（' + c.email + '）と一致しません。台帳か宛先を直して再承認');
  if (!r[QC.id]) r[QC.id] = nextMailId_(caseId, qrows_());
  var d = data_(r);
  if (!String(r[QC.inReplyTo] || '').trim() && ['返信', 'リマインド'].indexOf(String(r[QC.kind]).trim()) >= 0 && props_().getProperty('MAIL_THREAD_LOOKUP') === 'true') {
    try { var found = gmailMessageId_(caseId, String(r[QC.to]).trim()); if (found) { r[QC.inReplyTo] = found; d.threadLookup = 'Gmail照合: ' + found; r[QC.hash] = approvalHash_(r); } } catch (err) { d.threadLookup = '照合失敗: ' + String(err); }
  }
  d.key = 'manual/' + r[QC.id] + '/' + String(r[QC.hash]).slice(0, 16); d.startedAt = new Date().toISOString(); d.attempts = 0;
  setData_(r, d); r[QC.status] = QS.sending; r[QC.error] = ''; qsave_(x.row, r);
  deliver_(x);
}
/** A send interrupted mid-flight (timeout, trigger cut) retries the SAME payload and key for one hour, then stops for a human. */
function resumeSend_(x) {
  var r = x.r, d = data_(r);
  if (!d.key || !d.startedAt) { r[QC.status] = QS.check; r[QC.error] = '送信中の記録が不完全。Resendの送信履歴を確認してから対応'; return qsave_(x.row, r); }
  if (Date.now() - Date.parse(d.startedAt) > 3600000) { r[QC.status] = QS.check; r[QC.error] = '送信開始から1時間超。Resendで送信済みか確認し、未送信なら新しい行で再送'; return qsave_(x.row, r); }
  if (approvalHash_(r) !== String(r[QC.hash])) { r[QC.status] = QS.check; r[QC.error] = '送信中に内容が変更されました。Resendの送信履歴を確認'; return qsave_(x.row, r); }
  deliver_(x);
}
function deliver_(x) {
  var r = x.r, d = data_(r), url = props_().getProperty('MAIL_SEND_URL'), token = props_().getProperty('MAIL_QUEUE_TOKEN');
  if (!url || !token) { r[QC.status] = QS.error; r[QC.error] = 'MAIL_SEND_URL／MAIL_QUEUE_TOKEN未設定'; return qsave_(x.row, r); }
  d.attempts = (d.attempts || 0) + 1; setData_(r, d); qsave_(x.row, r);
  var res;
  try {
    res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + token }, payload: JSON.stringify(payload_(r, d.key)), muteHttpExceptions: true, followRedirects: false });
  } catch (err) { r[QC.error] = '送信要求が完了しませんでした（再試行します）: ' + String(err); return qsave_(x.row, r); } // stays 送信中
  var code = res.getResponseCode(), body = {}; try { body = JSON.parse(res.getContentText()); } catch (e) {}
  if (code >= 200 && code < 300 && body.ok && body.id) {
    r[QC.status] = QS.sent; r[QC.sentAt] = new Date(); r[QC.resendId] = body.id; r[QC.messageId] = body.messageId || '';
    r[QC.opened] = String(r[QC.html] || '').trim() ? OPEN_NONE : OPEN_NA; r[QC.error] = '';
    d.sentVia = 'worker'; d.copy = archiveCopy_(r); setData_(r, d); qsave_(x.row, r); linkLedger_(r); return;
  }
  if (code === 400) { r[QC.status] = QS.error; r[QC.error] = '送信先が内容を拒否: ' + (body.error || code); }
  else if (code === 401 || code === 503) { r[QC.status] = QS.error; r[QC.error] = 'Worker設定エラー（' + code + '）: トークン／RESEND_API_KEY／MAIL_QUEUE_TOKENを確認'; }
  else { r[QC.status] = QS.check; r[QC.error] = '送信結果不明（' + code + ' ' + (body.error || '') + '）。Resendで送信済みか確認してから対応。自動再送はしません'; }
  qsave_(x.row, r);
}
/** Latest message in the customer's thread for this case (the Gmail account running this script). */
/** Untracked copy of a sent mail to ARCHIVE_COPY_TO (a group address works): sent by GmailApp,
 *  so it carries no Resend pixel or redirect links and cannot pollute the customer's open/click. */
function archiveCopy_(r) {
  var to = String(props_().getProperty('ARCHIVE_COPY_TO') || '').trim();
  if (!to) return ''; if (!EMAIL_RE.test(to) || to.toLowerCase() === String(r[QC.to]).trim().toLowerCase()) return 'copy_skipped';
  var subject = '[控え ' + String(r[QC.caseId]).trim() + ' ' + r[QC.id] + '] ' + String(r[QC.subject]).trim();
  var head = ['送信控え（計測なし。お客様への送信は Resend 経由）', '宛先: ' + String(r[QC.to]).trim(), '件名: ' + String(r[QC.subject]).trim(), '種別: ' + String(r[QC.kind] || '').trim(), 'ResendメールID: ' + r[QC.resendId], 'Message-ID: ' + (r[QC.messageId] || '（未取得）'), '返信元: ' + (String(r[QC.inReplyTo] || '').trim() || 'なし'), '', '-----', ''].join('\n');
  try { GmailApp.sendEmail(to, subject, head + String(r[QC.text]), { name: 'KAMEHAME JAPAN 送信控え', noReply: true }); return 'copy_sent'; }
  catch (err) { console.error('archive copy: ' + String(err)); return 'copy_failed: ' + String(err).slice(0, 200); }
}
function gmailMessageId_(caseId, to) {
  var threads = GmailApp.search('{from:' + to + ' to:' + to + '}', 0, 20), best = null;
  threads.forEach(function (t) { t.getMessages().forEach(function (m) {
    if (m.isDraft()) return;
    var exact = m.getSubject().indexOf('[' + caseId + ']') >= 0 || (t.getFirstMessageSubject() || '').indexOf('[' + caseId + ']') >= 0;
    if (!best || (exact && !best.exact) || (exact === best.exact && m.getDate() > best.date)) best = { exact: exact, date: m.getDate(), id: m.getHeader('Message-ID') };
  }); });
  return best && MSGID_RE.test(String(best.id || '').trim()) ? String(best.id).trim() : '';
}

/** Delivery/open/click/bounce events for manual mails, forwarded (signature-verified) by the Worker. */
function mailEvent_(p) {
  var v = p.event, eventId = p.eventId; if (!eventId || !v || !v.data) throw new Error('イベント不正');
  var log = sheet_(LOG_SHEET, LOG_HEADERS), ids = log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, 1).getValues() : [];
  if (ids.some(function (r) { return r[0] === eventId; })) return { ok: true, duplicate: true };
  var data = v.data, tags = data.tags || {}, rows = qrows_();
  var x = rows.filter(function (x) { return x.r[QC.resendId] && x.r[QC.resendId] === data.email_id; })[0] || rows.filter(function (x) { return tags.mail && String(x.r[QC.id]) === String(tags.mail); })[0];
  // The webhook can overtake the queue's own write of the Resend ID: ask the provider to retry, up to two days.
  if (!x) return Date.now() - Date.parse(v.created_at || 0) > 2 * 86400000 ? { ok: true, ignored: true } : { ok: false, error: 'unmatched_event' };
  var r = x.r, at = v.created_at || new Date().toISOString(), note = '', caseId = String(r[QC.caseId]).trim();
  if (v.type === 'email.delivered') r[QC.delivered] = earliest_(r[QC.delivered], at);
  else if (v.type === 'email.opened') { if (String(r[QC.html] || '').trim()) r[QC.opened] = earliest_(r[QC.opened], at); else note = 'テキストのみのメールに開封イベント（参考記録のみ）'; }
  else if (v.type === 'email.clicked') {
    var link = data.click && data.click.link, when = (data.click && data.click.timestamp) || at;
    if (isPaymentLink_(link, caseLinks_(caseId))) r[QC.payClick] = earliest_(r[QC.payClick], when); else r[QC.otherClick] = earliest_(r[QC.otherClick], when);
    note = 'リンク: ' + String(link || '').slice(0, 120);
  } else if (['email.bounced', 'email.failed', 'email.suppressed', 'email.complained'].indexOf(v.type) >= 0) {
    r[QC.bounce] = v.type.replace('email.', '') + ' ' + String(at).slice(0, 19); note = '配達エラー。宛先確認／別手段の連絡を検討';
    teamNote_('【配達エラー】' + caseId + ' ' + r[QC.id], v.type + '\n宛先: ' + r[QC.to] + '\n件名: ' + r[QC.subject] + '\n台帳: ' + book_().getUrl());
  } else if (v.type === 'email.delivery_delayed') note = '一時的な配達遅延';
  var d = data_(r); d.events = (d.events || []).concat([v.type + '@' + at]).slice(-40); setData_(r, d);
  qsave_(x.row, r); linkLedger_(r);
  log.appendRow([eventId, caseId, data.email_id || '', 'manual:' + r[QC.id], v.type, at, '', note].map(literal_));
  return { ok: true };
}
function caseLinks_(caseId) {
  var out = [], s = book_().getSheetByName('決済・連絡管理'); if (!s || s.getLastRow() < 2) return out;
  var h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0], ids = s.getRange(2, 1, s.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === caseId) { ['決済案内メールURL', '次回案内用決済URL（ID付・自動）'].forEach(function (k) { var c = h.indexOf(k); if (c >= 0) out.push(String(s.getRange(i + 2, c + 1).getValue())); }); break; }
  var d = book_().getSheetByName('手配・体験詳細'); if (d && d.getLastRow() > 1) { var dh = d.getRange(1, 1, 1, d.getLastColumn()).getValues()[0], c2 = dh.indexOf('決済リンク'), dids = d.getRange(2, 1, d.getLastRow() - 1, 1).getValues(); for (var j = 0; j < dids.length; j++) if (String(dids[j][0]).trim() === caseId && c2 >= 0) { out.push(String(d.getRange(j + 2, c2 + 1).getValue())); break; } }
  return out.filter(Boolean);
}
/** Per-case summary in 決済・連絡管理 (Z:AD) and 最終連絡日 in 予約一覧 — only for rows that already exist. */
function linkLedger_(r) {
  try {
    var caseId = String(r[QC.caseId]).trim(), mine = qrows_().filter(function (x) { return String(x.r[QC.caseId]).trim() === caseId && String(x.r[QC.status]) === QS.sent; });
    var latest = mine.sort(function (a, b) { return new Date(b.r[QC.sentAt]) - new Date(a.r[QC.sentAt]); })[0];
    var opened = mine.map(function (x) { return x.r[QC.opened]; }).filter(function (v) { return v instanceof Date; }).sort(function (a, b) { return b - a; })[0];
    var clicked = mine.map(function (x) { return x.r[QC.payClick]; }).filter(function (v) { return v instanceof Date; }).sort(function (a, b) { return b - a; })[0];
    var s = book_().getSheetByName('決済・連絡管理');
    if (s && s.getLastRow() > 1) {
      var h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0], ids = s.getRange(2, 1, s.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === caseId) {
        var set = function (key, val) { var c = h.indexOf(LINK_HEADERS[key]); if (c >= 0) s.getRange(i + 2, c + 1).setValue(val === undefined ? '' : val); };
        set('sentAt', latest ? latest.r[QC.sentAt] : ''); set('subject', latest ? latest.r[QC.subject] : ''); set('opened', opened || ''); set('payClick', clicked || ''); set('count', mine.length);
        break;
      }
    }
    var m = book_().getSheetByName('予約一覧');
    if (m && latest && m.getLastRow() > 1) {
      var mh = m.getRange(1, 1, 1, m.getLastColumn()).getValues()[0], c = mh.indexOf('最終連絡日'), mids = m.getRange(2, 1, m.getLastRow() - 1, 1).getValues();
      for (var j = 0; j < mids.length && c >= 0; j++) if (String(mids[j][0]).trim() === caseId) { var cell = m.getRange(j + 2, c + 1), cur = cell.getValue(), sent = new Date(latest.r[QC.sentAt]); if (!(cur instanceof Date) || cur < sent) cell.setValue(new Date(sent.getFullYear(), sent.getMonth(), sent.getDate())); break; }
    }
  } catch (err) { console.error('linkLedger_: ' + String(err)); }
}
function teamNote_(subject, body) { try { var team = props_().getProperty('TEAM_EMAIL'); if (team) GmailApp.sendEmail(team, subject, body); } catch (err) { console.error(String(err)); } }

/** Hourly: mails sent 2h+ ago with no delivery/bounce event are checked against the provider (missed webhooks). */
function reconcileMailQueue() {
  var url = props_().getProperty('MAIL_STATUS_URL'), token = props_().getProperty('MAIL_QUEUE_TOKEN'); if (!url || !token) return;
  var now = Date.now();
  qrows_().forEach(function (x) {
    var r = x.r; if (String(r[QC.status]) !== QS.sent || !r[QC.resendId]) return;
    // Two reasons to ask the provider: no delivery event after 2 hours, or a Message-ID the
    // provider had not assigned yet when the send was acknowledged (it is needed to thread replies).
    var pending = !r[QC.delivered] && !r[QC.bounce], needId = !String(r[QC.messageId] || '').trim();
    var sent = new Date(r[QC.sentAt]).getTime(), age = now - sent; if (!(sent > 0) || age > 7 * 86400000) return;
    if (!(pending && age >= 2 * 3600000) && !(needId && age >= 120000)) return;
    try {
      var res = UrlFetchApp.fetch(url + '?id=' + encodeURIComponent(r[QC.resendId]), { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true, followRedirects: false });
      var d0 = data_(r); d0.reconcileAt = new Date().toISOString(); d0.reconcileHttp = res.getResponseCode(); delete d0.reconcileBody; delete d0.reconcileError; setData_(r, d0);
      if (res.getResponseCode() !== 200) { d0.reconcileBody = String(res.getContentText()).slice(0, 200); setData_(r, d0); qsave_(x.row, r); return; }
      var body = JSON.parse(res.getContentText()), ev = String(body.lastEvent || '');
      if (pending && age >= 2 * 3600000) {
        if (['delivered', 'opened', 'clicked'].indexOf(ev) >= 0) r[QC.delivered] = DELIVERED_RECONCILED;
        else if (['bounced', 'failed', 'suppressed', 'complained'].indexOf(ev) >= 0) { r[QC.bounce] = ev + '（照合）'; teamNote_('【配達エラー（照合）】' + r[QC.caseId] + ' ' + r[QC.id], ev + '\n宛先: ' + r[QC.to]); }
        else if (age > 24 * 3600000) r[QC.error] = '送信から24時間以上、配達イベントなし（最終イベント: ' + (ev || '不明') + '）';
      }
      if (needId && MSGID_RE.test(String(body.messageId || '').trim())) r[QC.messageId] = String(body.messageId).trim();
      var d = data_(r); d.reconciledAt = new Date().toISOString(); d.lastEvent = ev; setData_(r, d); qsave_(x.row, r);
    } catch (err) { console.error('reconcile: ' + String(err)); try { var d1 = data_(r); d1.reconcileAt = new Date().toISOString(); d1.reconcileError = String(err).slice(0, 200); setData_(r, d1); qsave_(x.row, r); } catch (e2) {} }
  });
  props_().setProperty('LAST_RECONCILE_RUN', new Date().toISOString());
}

/** Run once after the properties are set. Creates the triggers; does not switch sending on. */
function installMailQueue() {
  ['SPREADSHEET_ID', 'MAIL_QUEUE_TOKEN', 'MAIL_SEND_URL', 'MAIL_STATUS_URL', 'TEAM_EMAIL'].forEach(function (k) { if (!props_().getProperty(k)) throw new Error(k + 'が未設定'); });
  if (String(props_().getProperty('MAIL_QUEUE_TOKEN')).length < 24) throw new Error('MAIL_QUEUE_TOKENは24文字以上');
  queue_(); sheet_(LOG_SHEET, LOG_HEADERS); GmailApp.getAliases();
  var have = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (have.indexOf('processMailQueue') < 0) ScriptApp.newTrigger('processMailQueue').timeBased().everyMinutes(1).create();
  if (have.indexOf('reconcileMailQueue') < 0) ScriptApp.newTrigger('reconcileMailQueue').timeBased().everyHours(1).create();
  if (have.indexOf('onQueueEdit') < 0) ScriptApp.newTrigger('onQueueEdit').forSpreadsheet(props_().getProperty('SPREADSHEET_ID')).onEdit().create();
}
