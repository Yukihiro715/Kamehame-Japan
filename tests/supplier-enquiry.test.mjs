import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { handleSupplierSubmission: handle, parseSupplierSubmission: parse, supplierNotification } = await vite.ssrLoadModule("/lib/supplier-enquiry.ts");
const { SUPPLIER_POLICY_VERSION } = await vite.ssrLoadModule("/lib/supplier-policy.ts");
const good = { kind: "consult", company: "体験工房", name: "山田", email: "test@example.com", message: "茶道体験の掲載について相談したいです。", websiteUrl: "https://example.com/experience", consent: true, requestId: "11111111-2222-4333-8444-555555555555" };
const env = { CONTACT_TO: "ops@example.com", RESEND_API_KEY: "test-key" };
const req = (body, headers = {}) => new Request("https://kamehame-japan.com/api/supplier", { method: "POST", headers: { "content-type": "application/json", origin: "https://kamehame-japan.com", ...headers }, body: JSON.stringify(body) });

test("consultations require company, contact, consent and a valid URL without confusing it with the honeypot", () => {
  assert.ok(parse(good));
  for (const [key, value] of [["company", " "], ["email", "a\r\nBcc: other@example.com"], ["consent", false], ["name", "山田\nBCC"], ["message", ""], ["requestId", "bad"], ["websiteUrl", "javascript:alert(1)"], ["websiteUrl", "https://user:pass@example.com"], ["message", "x".repeat(3001)]]) assert.equal(parse({ ...good, [key]: value }), null, key);
});

test("operations receive consultation details and the registration URL, with no mail automatically sent to the supplier", async () => {
  const calls = [];
  const res = await handle(req(good), env, async (url, init) => { calls.push({ url, init }); return Response.json({ id: "mail-test-1" }); });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).reference, `KHS-${good.requestId}`);
  assert.equal(calls.length, 1);
  const mail = JSON.parse(calls[0].init.body);
  assert.deepEqual(mail.to, [env.CONTACT_TO]);
  assert.equal(mail.reply_to, good.email);
  assert.match(mail.text, /https:\/\/example.com\/experience/);
  assert.match(mail.text, /https:\/\/kamehame-japan.com\/partners-lp\/register\//);
  assert.equal(calls[0].init.headers["Idempotency-Key"], `supplier/consult/${good.requestId}`);
});

test("a retry keeps the identical provider idempotency key and mail body", async () => {
  const calls = [];
  const send = async (_, init) => { calls.push(init); return Response.json({ id: "mail-test-2" }); };
  await handle(req(good), env, send); await handle(req(good), env, send);
  assert.equal(calls[0].headers["Idempotency-Key"], calls[1].headers["Idempotency-Key"]);
  assert.equal(calls[0].body, calls[1].body);
});

test("invalid, cross-origin, honeypot, oversized and unconfigured requests never send", async () => {
  let sent = 0; const send = async () => { sent++; return Response.json({ id: "mail" }); };
  assert.equal((await handle(req(null), env, send)).status, 400);
  assert.equal((await handle(req({ ...good, consent: false }), env, send)).status, 400);
  assert.equal((await handle(req(good, { origin: "https://other.example" }), env, send)).status, 403);
  assert.equal((await handle(req(good, { "content-type": "text/plain" }), env, send)).status, 415);
  assert.equal((await handle(req({ ...good, website: "spam" }), env, send)).status, 200);
  assert.equal((await handle(req({ ...good, message: "x".repeat(96001) }), env, send)).status, 413);
  assert.equal((await handle(req(good), {}, send)).status, 503);
  assert.equal((await handle(req(good), { ...env, KH_ENV: "staging" }, send)).status, 503);
  assert.equal(sent, 0);
});

test("mail-provider errors and timeouts never show a successful receipt", async () => {
  for (const send of [async () => new Response("error", { status: 500 }), async () => { throw new Error("timeout"); }, async () => Response.json({})]) {
    const res = await handle(req(good), env, send);
    assert.equal(res.status, 502); assert.equal((await res.json()).ok, false);
  }
});

test("detailed registrations require all details, integer prices and the current policy; all prices stay in the team notification", async () => {
  const apply = { ...good, kind: "apply", policyVersion: SUPPLIER_POLICY_VERSION, location: "東京都", category: "茶道", title: "茶道体験", description: "茶道の体験です", duration: "90分", capacity: "2〜8名", availability: "毎日", languages: "日本語", meetingPoint: "茶室", included: "お茶", cancellation: "3日前まで無料", priceUnit: "1名", retailPrice: "10000", wholesalePrice: "7500" };
  assert.ok(parse(apply));
  for (const [key, value] of [["title", ""], ["languages", ""], ["retailPrice", "0"], ["wholesalePrice", "1.1"], ["policyVersion", "outdated"]]) assert.equal(parse({ ...apply, [key]: value }), null);
  const note = supplierNotification(parse(apply));
  assert.match(note.text, /審査と掲載条件の合意が必要/);
  assert.match(note.text, /5〜10％/);
  assert.match(note.text, /希望卸価格（税込・円）: 7500/);
  const res = await handle(req(apply), env, async () => Response.json({ id: "application-test" }));
  const receipt = await res.json();
  assert.equal(receipt.ok, true); assert.equal(JSON.stringify(receipt).includes("7500"), false);
});

test("the per-IP burst limit stops repeated submissions", async () => {
  let sends = 0;
  const send = async () => { sends++; return Response.json({ id: "mail" }); };
  for (let i = 0; i < 10; i++) assert.equal((await handle(req(good, { "cf-connecting-ip": "192.0.2.1" }), env, send)).status, 200);
  assert.equal((await handle(req(good, { "cf-connecting-ip": "192.0.2.1" }), env, send)).status, 429);
  assert.equal(sends, 10);
});
