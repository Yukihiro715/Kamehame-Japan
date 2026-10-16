import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHash, createHmac } from "node:crypto";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const mq = await vite.ssrLoadModule("/lib/mail-queue.ts");
const { handleSend } = await vite.ssrLoadModule("/app/api/mail/send/route.ts");
const { handleStatus } = await vite.ssrLoadModule("/app/api/mail/status/route.ts");
const { receiveWebhook, resendTarget } = await vite.ssrLoadModule("/lib/payment-webhooks.ts");

const TOKEN = "test-token-0123456789-abcdefghijklmnop";
const env = { MAIL_QUEUE_TOKEN: TOKEN, RESEND_API_KEY: "re_test_only" };
const good = { mailId: "KJ-261019-01-M01", caseId: "KJ-261019-01", to: "guest@example.com", subject: "[KJ-261019-01] Your quote", text: "Hello", html: "<p>Hello</p>", inReplyTo: "<abc@mail.gmail.com>", idempotencyKey: "manual/KJ-261019-01-M01/0123456789abcdef" };
const req = (body, auth = `Bearer ${TOKEN}`) => new Request("https://kamehame-japan.com/api/mail/send", { method: "POST", headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify(body) });

test("the send payload is validated field by field", () => {
  assert.equal(mq.parseSendRequest(good).ok, true);
  for (const [k, v] of [["caseId", "ABC-1"], ["mailId", "a b"], ["to", "not-an-email"], ["subject", "line\nbreak"], ["text", ""], ["html", "plain text only"], ["inReplyTo", "abc@mail"], ["idempotencyKey", "short"]]) {
    const r = mq.parseSendRequest({ ...good, [k]: v });
    assert.equal(r.ok, false, k); assert.equal(r.error, k);
  }
  assert.equal(mq.parseSendRequest({ ...good, caseId: "KJ-INQ-261015-02" }).ok, true, "enquiry ids without a date");
  assert.equal(mq.parseSendRequest({ ...good, caseId: "KJ-261018-G11111111" }).ok, true, "golf automation ids");
});

test("the bearer token is required and compared exactly", async () => {
  const h = (v) => new Headers(v ? { authorization: `Bearer ${v}` } : {});
  assert.equal(await mq.authorized(h(TOKEN), TOKEN), true);
  assert.equal(await mq.authorized(h(TOKEN + "x"), TOKEN), false);
  assert.equal(await mq.authorized(h(""), TOKEN), false);
  assert.equal(await mq.authorized(h("short"), "short"), false, "a short token is never accepted");
});

test("an approved mail goes to Resend once, with its idempotency key, tags and threading headers", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (init?.method === "POST") return Response.json({ id: "re-id-1" });
    return Response.json({ id: "re-id-1", message_id: "<re-id-1@kamehame-japan.com>", last_event: "delivered" });
  };
  const res = await handleSend(req(good), env, fetchImpl);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, id: "re-id-1", messageId: "<re-id-1@kamehame-japan.com>" });
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(calls[0].init.headers["Idempotency-Key"], good.idempotencyKey);
  assert.equal(sent.from, "Yukihiro, KAMEHAME JAPAN <hello@kamehame-japan.com>");
  assert.equal(sent.reply_to, "hello@kamehame-japan.com");
  assert.deepEqual(sent.to, [good.to]);
  assert.deepEqual(sent.tags, [{ name: "kind", value: "manual" }, { name: "booking", value: "KJ-261019-01" }, { name: "mail", value: "KJ-261019-01-M01" }]);
  assert.equal(sent.headers["In-Reply-To"], good.inReplyTo); assert.equal(sent.headers["References"], good.inReplyTo);
  assert.equal(sent.headers["X-KJ-Reference"], "KJ-261019-01");
  assert.equal(sent.text, "Hello"); assert.equal(sent.html, "<p>Hello</p>");
  assert.equal(calls.length, 2, "one send plus one Message-ID lookup");
});

test("unconfigured, unauthorized, invalid and provider failures never send", async () => {
  let sends = 0; const fetchImpl = async () => { sends++; return new Response("Unprocessable", { status: 422 }); };
  assert.equal((await handleSend(req(good), {}, fetchImpl)).status, 503);
  assert.equal((await handleSend(req(good, "Bearer wrong"), env, fetchImpl)).status, 401);
  assert.equal((await handleSend(req(good, null), env, fetchImpl)).status, 401);
  assert.equal((await handleSend(req({ ...good, to: "nobody" }), env, fetchImpl)).status, 400);
  assert.equal(sends, 0);
  const failed = await handleSend(req(good), env, fetchImpl);
  assert.equal(failed.status, 502); assert.equal((await failed.json()).error, "send_failed"); assert.equal(sends, 1);
});

test("the status lookup returns the provider's last event for the queue's reconciliation", async () => {
  const id = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
  const fetchImpl = async (url) => url.endsWith(`/emails/${id}`) ? Response.json({ last_event: "bounced", message_id: "<x@y>", created_at: "2026-10-16 01:00:00+00" }) : new Response("", { status: 404 });
  const ok = await handleStatus(new Request(`https://kamehame-japan.com/api/mail/status?id=${id}`, { headers: { authorization: `Bearer ${TOKEN}` } }), env, fetchImpl);
  assert.deepEqual(await ok.json(), { ok: true, id, lastEvent: "bounced", messageId: "<x@y>", createdAt: "2026-10-16 01:00:00+00" });
  assert.equal((await handleStatus(new Request(`https://kamehame-japan.com/api/mail/status?id=${id}`), env, fetchImpl)).status, 401);
  assert.equal((await handleStatus(new Request("https://kamehame-japan.com/api/mail/status?id=unknown-id-xyz", { headers: { authorization: `Bearer ${TOKEN}` } }), env, fetchImpl)).status, 404);
});

test("Resend events are routed by kind: manual mails to their own queue, golf mails to the golf queue, the rest ignored", () => {
  const gas = "https://script.google.com/macros/s/AKfy/exec";
  const both = { MAIL_QUEUE_URL: gas, MAIL_QUEUE_TOKEN: TOKEN, GOLF_AUTOMATION_URL: gas + "2", GOLF_AUTOMATION_TOKEN: "golf-token" };
  assert.deepEqual(resendTarget(both, { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M01" }), { url: gas, token: TOKEN, action: "mail_event" });
  assert.deepEqual(resendTarget(both, { kind: "payment", booking: "KJ-261018-G11111111" }), { url: gas + "2", token: "golf-token", action: "event" });
  assert.equal(resendTarget({ GOLF_AUTOMATION_URL: gas, GOLF_AUTOMATION_TOKEN: "x" }, { kind: "manual", booking: "KJ-261019-01", mail: "M1x" }), "unconfigured", "manual queue off while golf is on");
  assert.equal(resendTarget({ MAIL_QUEUE_URL: gas, MAIL_QUEUE_TOKEN: TOKEN }, { kind: "payment", booking: "KJ-1" }), "unconfigured", "golf queue off while manual is on");
  assert.equal(resendTarget(both, { kind: "follow-up", booking: "KJ-1" }), "ignore");
  assert.equal(resendTarget(both, { kind: "manual", booking: "other", mail: "M1x" }), "ignore");
  assert.equal(resendTarget(both, { kind: "manual", booking: "KJ-1" }), "ignore", "a manual tag without a mail id is not ours");
});

function svix(raw, secret, id = "msg_1") {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${ts}.${raw}`).digest("base64");
  return { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}`, "content-type": "application/json" };
}
test("a signed click event on a manual mail is forwarded as mail_event with only the fields the ledger needs", async () => {
  const secret = "whsec_" + Buffer.from("test-secret").toString("base64");
  const gas = "https://script.google.com/macros/s/AKfy/exec";
  const whEnv = { RESEND_WEBHOOK_SECRET: secret, MAIL_QUEUE_URL: gas, MAIL_QUEUE_TOKEN: TOKEN };
  const event = { type: "email.clicked", created_at: "2026-10-16T01:00:00.000Z", data: { email_id: "re-id-1", to: ["guest@example.com"], subject: "secret subject", tags: { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M01" }, click: { link: "https://book.stripe.com/abc", ipAddress: "1.2.3.4", userAgent: "UA", timestamp: "2026-10-16T00:59:59.000Z" } } };
  const raw = JSON.stringify(event);
  const original = globalThis.fetch; let forwarded, forwardedTo;
  globalThis.fetch = async (url, init) => { forwardedTo = url; forwarded = JSON.parse(init.body); return Response.json({ ok: true }); };
  try {
    const res = await receiveWebhook("resend", new Request("https://kamehame-japan.com/api/webhooks/resend", { method: "POST", headers: svix(raw, secret), body: raw }), whEnv);
    assert.equal(res.status, 200);
    assert.equal(forwardedTo, gas);
    assert.equal(forwarded.action, "mail_event"); assert.equal(forwarded.token, TOKEN); assert.equal(forwarded.eventId, "resend:msg_1");
    assert.deepEqual(forwarded.event.data, { email_id: "re-id-1", tags: { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M01" }, click: { link: "https://book.stripe.com/abc", timestamp: "2026-10-16T00:59:59.000Z" } });
    assert.equal(JSON.stringify(forwarded).includes("1.2.3.4"), false); assert.equal(JSON.stringify(forwarded).includes("secret subject"), false);
    // The same event for a golf mail while the golf queue is not configured: 503 so the provider retries later.
    const golf = JSON.stringify({ ...event, data: { ...event.data, tags: { kind: "payment", booking: "KJ-261018-G11111111" } } });
    assert.equal((await receiveWebhook("resend", new Request("https://kamehame-japan.com/api/webhooks/resend", { method: "POST", headers: svix(golf, secret, "msg_2"), body: golf }), whEnv)).status, 503);
    // A tampered body fails the signature.
    assert.equal((await receiveWebhook("resend", new Request("https://kamehame-japan.com/api/webhooks/resend", { method: "POST", headers: svix(raw, secret, "msg_3"), body: raw.replace("abc", "abd") }), whEnv)).status, 400);
  } finally { globalThis.fetch = original; }
});

// ---- Apps Script (docs/mail-queue.gs), run in a sandbox with the sheet, properties and HTTP stubbed.
const gasSource = readFileSync(new URL("../docs/payment-automation.gs", import.meta.url), "utf8") + "\n" + readFileSync(new URL("../docs/mail-queue.gs", import.meta.url), "utf8");
const headersOf = (c) => c.QUEUE_HEADERS;
function gasRuntime({ rows = [], props = {}, caseRow = null, fetch: fetchImpl, now } = {}) {
  const c = vm.createContext({ console, Date, Number, String, JSON, Math, RegExp, Array, Object, encodeURIComponent, isFinite, parseInt });
  const log = []; const team = []; const fetches = [];
  c.Utilities = { DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" }, computeDigest: (_a, s) => Array.from(createHash("sha256").update(s, "utf8").digest()).map((b) => (b > 127 ? b - 256 : b)) };
  c.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) };
  c.LockService = { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, hasLock: () => true, releaseLock() {} }) };
  c.UrlFetchApp = { fetch: (url, init) => { fetches.push({ url, init, body: init.payload ? JSON.parse(init.payload) : null }); const r = fetchImpl ? fetchImpl(url, init) : { code: 200, body: { ok: true, id: "re-id-1", messageId: "<re-id-1@kamehame-japan.com>" } }; return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(r.body) }; } };
  c.GmailApp = { sendEmail: (to, subject, body) => team.push({ to, subject, body }), getAliases: () => [], search: () => [] };
  c.SpreadsheetApp = { flush() {} };
  vm.runInContext(gasSource, c);
  if (now) { class Clock extends Date { static now() { return now; } constructor(...a) { super(...(a.length ? a : [now])); } } c.Date = Clock; }
  const H = headersOf(c);
  const state = rows.map((r) => H.map((_, i) => r[i] ?? ""));
  c.qrows_ = () => state.map((r, i) => ({ r, row: i + 2 })).filter((x) => String(x.r[1] || x.r[3] || x.r[4]).trim() !== "");
  c.qsave_ = (row, r) => { state[row - 2] = r.slice(); };
  c.sheet_ = (name) => name === c.LOG_SHEET ? { getLastRow: () => log.length + 1, getRange: () => ({ getValues: () => log.map((l) => [l[0]]) }), appendRow: (v) => log.push(v) } : { getLastRow: () => state.length + 1 };
  c.book_ = () => ({ getUrl: () => "https://sheet" });
  c.caseRow_ = () => caseRow;
  c.caseLinks_ = () => ["https://book.stripe.com/5kQ00j7vX3EL7mL2sG3Je0e?client_reference_id=KJ-261019-01"];
  c.linkLedger_ = () => {};
  return { c, state, log, team, fetches, props, Q: c.QC, S: c.QS };
}
const draft = (over = {}) => { const r = []; r[0] = ""; r[1] = "KJ-261019-01"; r[2] = "返信"; r[3] = "guest@example.com"; r[4] = "[KJ-261019-01] Your tee time"; r[5] = "Hello Ricardo"; r[6] = ""; r[7] = "こんにちは"; r[8] = ""; r[9] = false; r[13] = "下書き"; Object.assign(r, over); return r; };
const approve = (rt, row = 2) => rt.c.onQueueEdit({ range: { getSheet: () => ({ getName: () => rt.c.QUEUE_SHEET, getRange: (rr, cc, n, m) => ({ getValues: () => [rt.state[rr - 2].slice(0, m)], setValue: (v) => { rt.state[rr - 2][cc - 1] = v; } }) }), getRow: () => row, getColumn: () => rt.Q.approved + 1 }, user: { getEmail: () => "owner@example.com" } });
const editCell = (rt, col, value, row = 2) => { rt.state[row - 2][col] = value; rt.c.onQueueEdit({ range: { getSheet: () => ({ getName: () => rt.c.QUEUE_SHEET, getRange: (rr, cc, n, m) => ({ getValues: () => [rt.state[rr - 2].slice(0, m)], setValue: (v) => { rt.state[rr - 2][cc - 1] = v; } }) }), getRow: () => row, getColumn: () => col + 1 }, user: { getEmail: () => "owner@example.com" } }); };
const live = { MANUAL_SEND_ENABLED: "true", MAIL_SEND_URL: "https://kamehame-japan.com/api/mail/send", MAIL_QUEUE_TOKEN: TOKEN, TEAM_EMAIL: "team@example.com" };
const ledgerCase = { row: 2, email: "guest@example.com" };

test("GAS: approving binds a hash to the exact content; editing the content voids the approval", () => {
  const rt = gasRuntime({ rows: [draft()], props: live, caseRow: ledgerCase });
  rt.state[0][rt.Q.approved] = true; approve(rt);
  const r = rt.state[0];
  assert.equal(r[rt.Q.status], "承認済み"); assert.equal(r[rt.Q.id], "KJ-261019-01-M01"); assert.equal(r[rt.Q.approver], "owner@example.com");
  assert.match(r[rt.Q.hash], /^[0-9a-f]{64}$/);
  const hash = r[rt.Q.hash];
  assert.equal(rt.c.approvalHash_(r), hash, "hash is deterministic");
  editCell(rt, rt.Q.subject, "[KJ-261019-01] Your tee time (updated)");
  assert.equal(rt.state[0][rt.Q.approved], false); assert.equal(rt.state[0][rt.Q.status], "下書き"); assert.equal(rt.state[0][rt.Q.hash], "");
  assert.match(rt.state[0][rt.Q.error], /承認を解除/);
  // A sent row cannot be re-approved for a second send.
  const rt2 = gasRuntime({ rows: [draft({ 13: "送信済み" })], props: live, caseRow: ledgerCase });
  rt2.state[0][rt2.Q.approved] = true; approve(rt2);
  assert.equal(rt2.state[0][rt2.Q.approved], false); assert.match(rt2.state[0][rt2.Q.error], /承認できません/);
  // Invalid content is refused at approval time.
  const rt3 = gasRuntime({ rows: [draft({ 3: "nobody" })], props: live, caseRow: ledgerCase });
  rt3.state[0][rt3.Q.approved] = true; approve(rt3);
  assert.equal(rt3.state[0][rt3.Q.status], "要確認"); assert.match(rt3.state[0][rt3.Q.error], /宛先/);
});

test("GAS: an approved row is sent exactly once with the bound idempotency key; later runs and drafts send nothing", () => {
  const rt = gasRuntime({ rows: [draft(), draft({ 4: "[KJ-261019-01] Draft, not approved" })], props: live, caseRow: ledgerCase });
  rt.state[0][rt.Q.approved] = true; approve(rt);
  rt.c.processMailQueue();
  assert.equal(rt.fetches.length, 1);
  const call = rt.fetches[0];
  assert.equal(call.init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(call.body.idempotencyKey, "manual/KJ-261019-01-M01/" + rt.state[0][rt.Q.hash].slice(0, 16));
  assert.equal(call.body.to, "guest@example.com"); assert.equal(call.body.html, undefined, "text-only mail carries no html");
  const r = rt.state[0];
  assert.equal(r[rt.Q.status], "送信済み"); assert.equal(r[rt.Q.resendId], "re-id-1"); assert.equal(r[rt.Q.messageId], "<re-id-1@kamehame-japan.com>");
  assert.equal(r[rt.Q.opened], "計測対象外（テキストのみ）");
  assert.equal(rt.state[1][rt.Q.status], "下書き", "the unapproved draft is untouched");
  rt.c.processMailQueue(); rt.c.processMailQueue();
  assert.equal(rt.fetches.length, 1, "no second send");
});

test("GAS: after a successful send an untracked copy goes to ARCHIVE_COPY_TO through Gmail, never through Resend", () => {
  const rt = gasRuntime({ rows: [draft()], props: { ...live, ARCHIVE_COPY_TO: "hello@kamehame-japan.com" }, caseRow: ledgerCase });
  rt.state[0][rt.Q.approved] = true; approve(rt);
  rt.c.processMailQueue();
  assert.equal(rt.fetches.length, 1); assert.equal(rt.fetches[0].body.bcc, undefined, "the copy is not a Resend BCC");
  assert.equal(rt.team.length, 1);
  assert.equal(rt.team[0].to, "hello@kamehame-japan.com");
  assert.equal(rt.team[0].subject, "[控え KJ-261019-01 KJ-261019-01-M01] [KJ-261019-01] Your tee time");
  assert.match(rt.team[0].body, /宛先: guest@example.com[\s\S]*ResendメールID: re-id-1[\s\S]*Hello Ricardo$/);
  assert.equal(rt.state[0][rt.Q.status], "送信済み");
  assert.equal(JSON.parse(rt.state[0][rt.Q.data]).copy, "copy_sent");
  const quiet = gasRuntime({ rows: [draft()], props: live, caseRow: ledgerCase });
  quiet.state[0][quiet.Q.approved] = true; approve(quiet); quiet.c.processMailQueue();
  assert.equal(quiet.team.length, 0, "no copy without ARCHIVE_COPY_TO");
  const failing = gasRuntime({ rows: [draft()], props: { ...live, ARCHIVE_COPY_TO: "hello@kamehame-japan.com" }, caseRow: ledgerCase });
  failing.c.GmailApp.sendEmail = () => { throw new Error("quota"); };
  failing.state[0][failing.Q.approved] = true; approve(failing); failing.c.processMailQueue();
  assert.equal(failing.state[0][failing.Q.status], "送信済み", "a failed copy never changes the send result");
  assert.match(JSON.parse(failing.state[0][failing.Q.data]).copy, /^copy_failed/);
});

test("GAS: sending is held when the switch is off, the hash no longer matches, the case is unknown or the recipient differs from the ledger", () => {
  const off = gasRuntime({ rows: [draft()], props: { ...live, MANUAL_SEND_ENABLED: "false" }, caseRow: ledgerCase });
  off.state[0][off.Q.approved] = true; approve(off); off.c.processMailQueue();
  assert.equal(off.fetches.length, 0); assert.equal(off.state[0][off.Q.status], "承認済み", "waits, not cancelled");
  const tampered = gasRuntime({ rows: [draft()], props: live, caseRow: ledgerCase });
  tampered.state[0][tampered.Q.approved] = true; approve(tampered);
  tampered.state[0][tampered.Q.text] = "Hello Ricardo — changed through the API without an edit event";
  tampered.c.processMailQueue();
  assert.equal(tampered.fetches.length, 0); assert.equal(tampered.state[0][tampered.Q.approved], false); assert.equal(tampered.state[0][tampered.Q.status], "下書き");
  const unknown = gasRuntime({ rows: [draft()], props: live, caseRow: null });
  unknown.state[0][unknown.Q.approved] = true; approve(unknown); unknown.c.processMailQueue();
  assert.equal(unknown.fetches.length, 0); assert.equal(unknown.state[0][unknown.Q.status], "要確認"); assert.match(unknown.state[0][unknown.Q.error], /予約一覧にありません/);
  const other = gasRuntime({ rows: [draft()], props: live, caseRow: { row: 2, email: "someone-else@example.com" } });
  other.state[0][other.Q.approved] = true; approve(other); other.c.processMailQueue();
  assert.equal(other.fetches.length, 0); assert.match(other.state[0][other.Q.error], /一致しません/);
});

test("GAS: an interrupted send resumes with the same key within an hour and stops for a human after that", () => {
  const now = Date.parse("2026-10-16T02:00:00Z");
  const mk = (startedAgoMin) => gasRuntime({ rows: [draft({ 0: "KJ-261019-01-M01", 9: true, 12: "h".repeat(64), 13: "送信中", 25: JSON.stringify({ key: "manual/KJ-261019-01-M01/hhhhhhhhhhhhhhhh", startedAt: new Date(now - startedAgoMin * 60000).toISOString(), attempts: 1 }) })], props: live, caseRow: ledgerCase, now });
  const fresh = mk(10); fresh.state[0][fresh.Q.hash] = fresh.c.approvalHash_(fresh.state[0]);
  fresh.c.processMailQueue();
  assert.equal(fresh.fetches.length, 1); assert.equal(fresh.fetches[0].body.idempotencyKey, "manual/KJ-261019-01-M01/hhhhhhhhhhhhhhhh"); assert.equal(fresh.state[0][fresh.Q.status], "送信済み");
  const stale = mk(90); stale.state[0][stale.Q.hash] = stale.c.approvalHash_(stale.state[0]);
  stale.c.processMailQueue();
  assert.equal(stale.fetches.length, 0); assert.equal(stale.state[0][stale.Q.status], "要確認");
  // An unknown Worker answer never retries automatically.
  const unclear = gasRuntime({ rows: [draft()], props: live, caseRow: ledgerCase, fetch: () => ({ code: 502, body: { ok: false, error: "send_errored" } }) });
  unclear.state[0][unclear.Q.approved] = true; approve(unclear); unclear.c.processMailQueue(); unclear.c.processMailQueue();
  assert.equal(unclear.fetches.length, 1); assert.equal(unclear.state[0][unclear.Q.status], "要確認"); assert.match(unclear.state[0][unclear.Q.error], /自動再送はしません/);
});

test("GAS: events land on the right mail, deduplicate, keep the earliest stamp, and separate payment clicks from other links", () => {
  const sentRow = draft({ 0: "KJ-261019-01-M01", 6: "<p>Hello</p>", 13: "送信済み", 15: "re-id-1", 18: "未検知" });
  const otherMail = draft({ 0: "KJ-261019-01-M02", 13: "送信済み", 15: "re-id-2", 18: "計測対象外（テキストのみ）" });
  const rt = gasRuntime({ rows: [sentRow, otherMail], props: live, caseRow: ledgerCase });
  const ev = (id, type, at, data = {}) => rt.c.mailEvent_({ eventId: id, event: { type, created_at: at, data: { email_id: "re-id-1", tags: { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M01" }, ...data } } });
  // results come from the sandbox realm, so compare their JSON
  assert.equal(JSON.stringify(ev("e1", "email.delivered", "2026-10-16T01:00:10.000Z")), '{"ok":true}');
  assert.equal(JSON.stringify(ev("e1", "email.delivered", "2026-10-16T01:00:10.000Z")), '{"ok":true,"duplicate":true}');
  assert.equal(rt.log.length, 1);
  ev("e2", "email.delivered", "2026-10-16T01:00:05.000Z"); // arrived later, happened earlier
  assert.equal(rt.state[0][rt.Q.delivered].toISOString(), "2026-10-16T01:00:05.000Z");
  ev("e3", "email.clicked", "2026-10-16T01:05:00.000Z", { click: { link: "https://kamehame-japan.com/en/", timestamp: "2026-10-16T01:05:00.000Z" } });
  assert.equal(rt.state[0][rt.Q.payClick], "", "a site link is not a payment click");
  assert.equal(rt.state[0][rt.Q.otherClick].toISOString(), "2026-10-16T01:05:00.000Z");
  ev("e4", "email.clicked", "2026-10-16T01:06:00.000Z", { click: { link: "https://book.stripe.com/5kQ00j7vX3EL7mL2sG3Je0e?client_reference_id=KJ-261019-01", timestamp: "2026-10-16T01:06:00.000Z" } });
  assert.equal(rt.state[0][rt.Q.payClick].toISOString(), "2026-10-16T01:06:00.000Z");
  ev("e5", "email.opened", "2026-10-16T01:02:00.000Z");
  assert.equal(rt.state[0][rt.Q.opened].toISOString(), "2026-10-16T01:02:00.000Z");
  assert.equal(rt.state[1][rt.Q.delivered], "", "the other mail of the same case is untouched");
  // A text-only mail keeps its "not measured" marker even if an open event arrives.
  rt.c.mailEvent_({ eventId: "e6", event: { type: "email.opened", created_at: "2026-10-16T01:02:00.000Z", data: { email_id: "re-id-2", tags: { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M02" } } } });
  assert.equal(rt.state[1][rt.Q.opened], "計測対象外（テキストのみ）");
  // Bounces are recorded and the team is told; unmatched events are left for the provider to retry.
  rt.c.mailEvent_({ eventId: "e7", event: { type: "email.bounced", created_at: "2026-10-16T01:07:00.000Z", data: { email_id: "re-id-2", tags: { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M02" } } } });
  assert.match(rt.state[1][rt.Q.bounce], /^bounced/); assert.equal(rt.team.length, 1);
  assert.equal(JSON.stringify(rt.c.mailEvent_({ eventId: "e8", event: { type: "email.delivered", created_at: new Date().toISOString(), data: { email_id: "re-id-9", tags: { kind: "manual", booking: "KJ-261019-01", mail: "KJ-261019-01-M09" } } } })), '{"ok":false,"error":"unmatched_event"}');
  assert.equal(rt.log.length, 7);
});
