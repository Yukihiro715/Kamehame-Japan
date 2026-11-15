import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, server: { middlewareMode: true } });
after(() => vite.close());
const { emptyPricing, emptyPlan, validateSupplierPricing: validate, formatSupplierPricing: format } = await vite.ssrLoadModule("/lib/supplier-pricing.ts");
const { parseSupplierAttachments: attachments, supplierFileError, MAX_SUPPLIER_FILE_BYTES } = await vite.ssrLoadModule("/lib/supplier-attachments.ts");
const { handleSupplierSubmission: handle, parseSupplierSubmission: parse } = await vite.ssrLoadModule("/lib/supplier-enquiry.ts");
const { SUPPLIER_POLICY_VERSION } = await vite.ssrLoadModule("/lib/supplier-policy.ts");
const standard = () => ({ ...emptyPlan(), type: "per_person", minPeople: "1", maxPeople: "8", retail: "10000", wholesale: "7500" });
const prices = plan => ({ ...emptyPricing(), plans: [plan] });
const application = pricing => ({ kind: "apply", company: "サンプル工房", name: "確認担当", email: "test@example.com", consent: true, requestId: "11111111-2222-4333-8444-555555555555", policyVersion: SUPPLIER_POLICY_VERSION, location: "東京都", category: "茶道", title: "茶道体験", description: "茶道の体験です", duration: "90分", capacity: "1〜8名", availability: "毎日", languages: "日本語", meetingPoint: "茶室", included: "お茶", cancellation: "3日前まで無料", pricing });
const req = body => new Request("https://kamehame-japan.com/api/supplier", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://kamehame-japan.com" }, body: JSON.stringify(body) });
const env = { CONTACT_TO: "ops@example.com", ARCHIVE_TO: "archive@example.com", RESEND_API_KEY: "test-key" };
const pdf = { filename: "料金表.pdf", content: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF").toString("base64") };
const document = () => ({ ...emptyPricing(), mode: "document", document: { url: "", priceKind: "both", receiptNotes: "平日の料金", negotiable: false } });

test("all five models can coexist; private totals and excess-head charges retain their units", () => {
  const p = emptyPricing();
  p.plans = [standard(), { ...standard(), name: "貸切", type: "private", maxPeople: "6", retail: "60000", wholesale: "45000" }, { ...standard(), name: "追加あり", type: "base_plus", includedPeople: "6", retail: "60000", wholesale: "45000", extraRetail: "10000", extraWholesale: "7500" }, { ...emptyPlan("個別"), type: "quote", conditions: "人数と希望日による" }, { ...standard(), type: "tiered", tiers: [{ minPeople: "2", maxPeople: "4", retail: "10000", wholesale: "7500" }, { minPeople: "1", maxPeople: "1", retail: "12000", wholesale: "9000" }] }];
  const result = validate(p);
  assert.ok(result.data, result.error);
  const summary = format(result.data);
  assert.match(summary, /60,000円／組/);
  assert.match(summary, /7,500円／追加1名/);
  assert.match(summary, /超過人数分のみ加算/);
  assert.match(summary, /参加者全員/);
  assert.match(summary, /個別見積もり/);
  assert.equal(result.data.plans[4].tiers[0].minPeople, "1");
  assert.equal(p.plans[4].tiers[0].minPeople, "2", "validation must not mutate the draft");
});

test("overlapping/inverted ranges, missing amounts, fractions and oversized submissions fail", () => {
  const tier = { ...standard(), type: "tiered", tiers: [{ minPeople: "1", maxPeople: "3", retail: "10000", wholesale: "7500" }, { minPeople: "3", maxPeople: "8", retail: "9000", wholesale: "6750" }] };
  assert.match(validate(prices(tier)).error, /重複/);
  for (const patch of [{ minPeople: "9", maxPeople: "8" }, { minPeople: "1.5" }, { retail: "1.5" }, { wholesale: "" }, { wholesale: "100000001" }, { type: "" }, { type: "quote", conditions: "" }, { type: "base_plus", includedPeople: "9", extraRetail: "1000", extraWholesale: "750" }]) assert.ok(validate(prices({ ...standard(), ...patch })).error, JSON.stringify(patch));
  assert.ok(validate({ ...emptyPricing(), plans: Array.from({ length: 9 }, standard) }).error);
});

test("unpublished retail rates and negotiable costs are explicit; inactive rates are not delivered", () => {
  const p = prices({ ...standard(), retailUnavailable: true, negotiable: true, retail: "12345", wholesale: "98765", extraRetail: "111", tiers: [{ minPeople: "1", maxPeople: "1", retail: "222", wholesale: "333" }] });
  const checked = validate(p).data;
  assert.equal(checked.plans[0].retail, ""); assert.equal(checked.plans[0].wholesale, "");
  assert.deepEqual(checked.plans[0].tiers, []);
  assert.match(format(checked), /一般価格：設定なし ／ 希望受取額：相談して決めたい/);
  assert.doesNotMatch(format(checked), /12,345|98,765|111|222|333/);
  const zeroBase = validate(prices({ ...standard(), type: "base_plus", includedPeople: "0", extraRetail: "1000", extraWholesale: "0" }));
  assert.ok(zeroBase.data);
});

test("document submissions require either a real attachment or safe URL and clarify wholesale expectations", () => {
  const p = document();
  assert.match(validate(p).error, /添付/);
  assert.ok(validate(p, 1).data);
  p.document.url = "https://example.com/rates.pdf";
  assert.ok(validate(p).data);
  p.document.priceKind = "retail"; p.document.receiptNotes = "";
  assert.match(validate(p).error, /希望受取額/);
  p.document.negotiable = true;
  assert.ok(validate(p).data);
  for (const url of ["javascript:alert(1)", "https://user:pass@example.com", "file:///rates.pdf"]) { p.document.url = url; assert.ok(validate(p).error); }
  p.document.url = "https://example.com";
  assert.deepEqual(validate(p).data.plans, [], "hidden draft plans never reach operations");
});

test("attachments enforce type signatures, filenames, size and count without trusting client MIME", () => {
  assert.deepEqual(attachments([pdf]), [pdf]);
  for (const invalid of [{ ...pdf, filename: "料金表.exe" }, { ...pdf, filename: "../rates.pdf" }, { ...pdf, filename: "a\r\nb.pdf" }, { ...pdf, content: Buffer.from("not a pdf").toString("base64") }, { ...pdf, content: "$$$$" }, { ...pdf, content: "" }, { ...pdf, filename: "rates.png" }]) assert.equal(attachments([invalid]), null);
  assert.equal(attachments(Array(4).fill(pdf)), null);
  assert.equal(attachments([{ ...pdf, content: "A".repeat(Math.ceil(MAX_SUPPLIER_FILE_BYTES / 3) * 4 + 4) }]), null);
  assert.ok(supplierFileError([{ name: "a.pdf", size: 5 * 1024 * 1024 }, { name: "b.pdf", size: 4 * 1024 * 1024 }]));
});

test("application delivery includes all rate conditions and files only in the internal notification", async () => {
  const p = document(); p.extras.children = "6〜12歳は半額";
  const body = { ...application(p), attachments: [pdf] };
  assert.ok(parse(body));
  const calls = [];
  const send = async (url, init) => { calls.push({ url, init }); return Response.json({ id: "file-received" }); };
  const response = await handle(req(body), env, send);
  assert.equal(response.status, 200);
  const receipt = await response.json();
  assert.deepEqual(Object.keys(receipt).sort(), ["ok", "reference"]);
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  const mail = JSON.parse(calls[0].init.body);
  assert.deepEqual(mail.to, [env.CONTACT_TO, env.ARCHIVE_TO]);
  assert.deepEqual(mail.attachments, [pdf]);
  assert.match(mail.text, /6〜12歳は半額/);
  assert.match(mail.text, /料金表.pdf/);
  assert.doesNotMatch(mail.text, /基本プラン|undefined|NaN/);
  await handle(req(body), env, send);
  assert.equal(calls[0].init.body, calls[1].init.body);
  assert.equal(calls[0].init.headers["Idempotency-Key"], calls[1].init.headers["Idempotency-Key"]);
  assert.equal((await handle(req(body), env, async () => new Response("fail", { status: 500 }))).status, 502);
});

test("structured registrations cannot bypass validation with legacy amounts or lose attachments", async () => {
  const valid = application(prices(standard()));
  assert.ok(parse(valid));
  assert.equal(parse({ ...valid, pricing: {}, priceUnit: "1名", retailPrice: "10000", wholesalePrice: "7500" }), null);
  assert.equal(parse({ ...valid, attachments: [pdf] }), null, "files must belong to the selected document method");
  let sends = 0;
  const res = await handle(req({ ...application(document()), attachments: [{ ...pdf, filename: "test.exe" }] }), env, async () => { sends++; return Response.json({ id: "no" }); });
  assert.equal(res.status, 400); assert.equal(sends, 0);
  assert.match((await res.json()).message, /添付ファイル/);
});

test("streamed bodies without Content-Length still enforce the overall upload bound", async () => {
  const stream = new ReadableStream({ start(c) { for (let i = 0; i < 13; i++) c.enqueue(new Uint8Array(1024 * 1024)); c.close(); } });
  const request = new Request("https://kamehame-japan.com/api/supplier", { method: "POST", duplex: "half", headers: { "Content-Type": "application/json", Origin: "https://kamehame-japan.com" }, body: stream });
  const response = await handle(request, env, async () => { throw new Error("must not send"); });
  assert.equal(response.status, 413);
});
