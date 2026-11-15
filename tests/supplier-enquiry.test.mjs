import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { handleSupplierSubmission: handle, parseSupplierSubmission: parse, supplierNotification, supplierAcknowledgement } = await vite.ssrLoadModule("/lib/supplier-enquiry.ts");
const { SUPPLIER_POLICY_VERSION } = await vite.ssrLoadModule("/lib/supplier-policy.ts");
const good = { kind: "consult", company: "体験工房", name: "山田", email: "test@example.com", title: "茶道体験", phone: "03-1234-5678", message: "茶道体験の掲載について相談したいです。", websiteUrl: "https://example.com/experience", consent: true, requestId: "11111111-2222-4333-8444-555555555555" };
const photo = { filename: "tea.png", content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5bFZkAAAAASUVORK5CYII=" };
const env = { CONTACT_TO: "ops@example.com", RESEND_API_KEY: "test-key" };
const req = (body, headers = {}) => new Request("https://kamehame-japan.com/api/supplier", { method: "POST", headers: { "content-type": "application/json", origin: "https://kamehame-japan.com", ...headers }, body: JSON.stringify(body) });

test("consultations require company, contact, consent and a valid URL without confusing it with the honeypot", () => {
  assert.ok(parse(good));
  assert.ok(parse({ ...good, phone: "" }), "phone is optional");
  for (const [key, value] of [["company", " "], ["title", ""], ["title", "x".repeat(161)], ["phone", "x".repeat(61)], ["email", "a\r\nBcc: other@example.com"], ["consent", false], ["name", "山田\nBCC"], ["message", ""], ["requestId", "bad"], ["websiteUrl", "javascript:alert(1)"], ["websiteUrl", "https://user:pass@example.com"], ["message", "x".repeat(3001)]]) assert.equal(parse({ ...good, [key]: value }), null, key);
});

test("consultations notify operations and send a thank-you receipt without the registration link", async () => {
  const calls = [];
  const res = await handle(req(good), env, async (url, init) => { calls.push({ url, init }); return Response.json({ data: [{ id: "team-test" }, { id: "ack-test" }] }); });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).reference, `KHS-${good.requestId}`);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/emails/batch");
  const [mail, ack] = JSON.parse(calls[0].init.body);
  assert.deepEqual(mail.to, [env.CONTACT_TO]);
  assert.equal(mail.reply_to, good.email);
  assert.match(mail.text, /https:\/\/example.com\/experience/);
  assert.match(mail.text, /https:\/\/kamehame-japan.com\/partners-lp\/register\//);
  assert.equal(calls[0].init.headers["Idempotency-Key"], `supplier/consult-v2/${good.requestId}`);
  assert.match(mail.text, /電話番号: 03-1234-5678/);
  assert.match(mail.text, /体験名: 茶道体験/);
  assert.deepEqual(ack.to, [good.email]);
  assert.equal(ack.reply_to, "hello@kamehame-japan.com");
  assert.match(ack.text, /掲載のご相談をいただき、ありがとうございます/);
  assert.match(ack.text, /担当者が内容を確認/);
  assert.doesNotMatch(ack.text + ack.html, /partners-lp\/register|相談内容:|ご相談内容:/);
  assert.match(ack.html, /<html lang="ja">/);
});

test("a retry keeps the identical provider idempotency key and mail body", async () => {
  const calls = [];
  const send = async (_, init) => { calls.push(init); return Response.json({ data: [{ id: "team-test" }, { id: "ack-test" }] }); };
  await handle(req(good), env, send); await handle(req(good), env, send);
  assert.equal(calls[0].headers["Idempotency-Key"], calls[1].headers["Idempotency-Key"]);
  assert.equal(calls[0].body, calls[1].body);
});

test("invalid, cross-origin, honeypot, oversized and unconfigured requests never send", async () => {
  let sent = 0; const send = async () => { sent++; return Response.json({ data: [{ id: "team-test" }, { id: "ack-test" }] }); };
  assert.equal((await handle(req(null), env, send)).status, 400);
  assert.equal((await handle(req({ ...good, consent: false }), env, send)).status, 400);
  assert.equal((await handle(req(good, { origin: "https://other.example" }), env, send)).status, 403);
  assert.equal((await handle(req(good, { "content-type": "text/plain" }), env, send)).status, 415);
  assert.equal((await handle(req({ ...good, website: "spam" }), env, send)).status, 200);
  assert.equal((await handle(req({ ...good, message: "x".repeat(96001) }), env, send)).status, 413);
  assert.equal((await handle(req(good), {}, send)).status, 503);
  assert.equal((await handle(req(good), { ...env, KH_ENV: "staging" }, send)).status, 503);
  assert.equal((await handle(req(good), { ...env, KH_ENV: "staging", NOTIFY_ALLOWLIST: env.CONTACT_TO }, send)).status, 503, "visitor acknowledgement is also allowlisted in staging");
  assert.equal(sent, 0);
});

test("mail-provider errors and timeouts never show a successful receipt", async () => {
  for (const send of [async () => new Response("error", { status: 500 }), async () => { throw new Error("timeout"); }, async () => Response.json({}), async () => Response.json({ data: [{ id: "team-only" }] }), async () => Response.json({ data: [{ id: "team" }, {}] })]) {
    const res = await handle(req(good), env, send);
    assert.equal(res.status, 502); assert.equal((await res.json()).ok, false);
  }
});

test("detailed registrations require all details, integer prices and the current policy; all prices stay in the team notification", async () => {
  const apply = { ...good, kind: "apply", policyVersion: SUPPLIER_POLICY_VERSION, location: "東京都", category: "茶道", title: "茶道体験", description: "茶道の体験です", duration: "90分", capacity: "2〜8名", availability: "毎日", languages: "日本語", meetingPoint: "茶室", meetingMapUrl: "https://maps.google.com/?q=Tokyo", snsUrl: "https://instagram.com/tea", photos: [photo], photoPromotionConsent: false, included: "お茶", cancellation: "3日前まで無料", priceUnit: "1名", retailPrice: "10000", wholesalePrice: "7500" };
  assert.ok(parse(apply));
  assert.equal(parse({ ...apply, photos: [] }), null, "a shared drive link cannot replace a directly uploaded photo");
  assert.equal(parse({ ...apply, photos: [{ ...photo, filename: "tea.pdf" }] }), null);
  assert.equal(parse({ ...apply, photoPromotionConsent: "true" }), null);
  assert.equal(parse({ ...apply, meetingMapUrl: "javascript:alert(1)" }), null);
  assert.equal(parse({ ...apply, snsUrl: "https://user:pass@example.com" }), null);
  for (const [key, value] of [["title", ""], ["languages", ""], ["retailPrice", "0"], ["wholesalePrice", "1.1"], ["policyVersion", "outdated"]]) assert.equal(parse({ ...apply, [key]: value }), null);
  const note = supplierNotification(parse(apply));
  assert.match(note.text, /審査と掲載条件の合意が必要/);
  assert.match(note.text, /5〜10％/);
  assert.match(note.text, /希望卸価格（税込・円）: 7500/);
  assert.match(note.text, /SNS等での写真利用許可：許可なし/);
  assert.match(note.text, /予約確定後に共有/);
  const requests = [];
  const res = await handle(req(apply), env, async (_, init) => { requests.push(JSON.parse(init.body)); return Response.json({ id: "application-test" }); });
  assert.deepEqual(requests[0].attachments, [photo]);
  const receipt = await res.json();
  assert.equal(receipt.ok, true); assert.equal(JSON.stringify(receipt).includes("7500"), false);
});

test("cross-origin requests do not consume a shared network's quota", async () => {
  const ip = "192.0.2.233", send = async () => Response.json({ data: [{ id: "team" }, { id: "ack" }] });
  for (let i = 0; i < 12; i++) {
    const hostile = req(good, { "cf-connecting-ip": ip, origin: "https://hostile.example", "content-type": "text/plain" });
    Object.defineProperty(hostile, "body", { get() { throw new Error("origin rejection must not read body"); } });
    assert.equal((await handle(hostile, env, send)).status, 403);
  }
  assert.equal((await handle(req(good, { "cf-connecting-ip": ip }), env, send)).status, 200);
});

test("the per-IP burst limit stops repeated submissions", async () => {
  let sends = 0;
  const send = async () => { sends++; return Response.json({ data: [{ id: "team-test" }, { id: "ack-test" }] }); };
  for (let i = 0; i < 10; i++) assert.equal((await handle(req(good, { "cf-connecting-ip": "192.0.2.1" }), env, send)).status, 200);
  assert.equal((await handle(req(good, { "cf-connecting-ip": "192.0.2.1" }), env, send)).status, 429);
  assert.equal(sends, 10);
});

test("invalid and oversized requests consume quota before the body is read", async () => {
  const ip = "192.0.2.231";
  let sends = 0;
  const send = async () => { sends++; return Response.json({ data: [{ id: "team" }, { id: "ack" }] }); };
  // Previously these were rejected before the guard and never counted.
  for (let i = 0; i < 4; i++) {
    const invalid = req({ ...good, attachments: [{ filename: "rates.pdf", content: "bad" }] }, { "cf-connecting-ip": ip });
    assert.equal((await handle(invalid, env, send)).status, 400);
  }
  for (let i = 0; i < 6; i++) {
    const oversized = req(good, { "cf-connecting-ip": ip, "content-length": String(13 * 1024 * 1024) });
    assert.equal((await handle(oversized, env, send)).status, 413);
  }
  const blocked = req(good, { "cf-connecting-ip": ip });
  Object.defineProperty(blocked, "body", { get() { throw new Error("rate limit must not touch the body"); } });
  assert.equal((await handle(blocked, env, send)).status, 429);
  assert.equal(sends, 0);
  assert.equal((await handle(req(good, { "cf-connecting-ip": "192.0.2.232" }), env, send)).status, 200, "other IPs keep their own quota");
});


test("receipt HTML escapes company and name, and never reflects the arbitrary message", () => {
  const ack = supplierAcknowledgement(parse({ ...good, company: '<img src="bad" onerror="alert(1)">', name: '<script>bad()</script>', message: 'https://untrusted.example/offer' }));
  assert.doesNotMatch(ack.html, /<img|<script|onerror="|untrusted\.example/);
  assert.match(ack.html, /&lt;img/);
  assert.match(ack.text, /このメールにそのままご返信/);
});
