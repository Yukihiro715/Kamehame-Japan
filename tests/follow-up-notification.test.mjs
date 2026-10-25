import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const makeServer = (followUpOn) => createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  plugins: [{
    name: "mock-mail-bindings",
    enforce: "pre",
    transform(code, id) {
      if (id.endsWith("/lib/golf-prices.ts")) return code.replace(/GOLF_MODE: GolfMode = "(arrangement|package)"/, 'GOLF_MODE: GolfMode = "arrangement"');
      // The follow-up tests cover the scheduling path even while the switch is off in production.
      if (id.endsWith("/lib/contact.ts") && followUpOn) return code.replace(/FOLLOW_UP_ENABLED = (true|false)/, "FOLLOW_UP_ENABLED = true");
    },
    resolveId(id) {
      if (id === "cloudflare:workers" || id === "cloudflare:email") return `\0test:${id}`;
    },
    load(id) {
      if (id === "\0test:cloudflare:workers") return 'export const env = { CONTACT_TO: "team@example.com", RESEND_API_KEY: "test-only-not-a-key", GOLF_AUTOMATION_URL: "https://script.google.com/macros/s/test/exec", GOLF_AUTOMATION_TOKEN: "test-only" };';
      if (id === "\0test:cloudflare:email") return "export class EmailMessage {}";
    },
  }],
  server: { middlewareMode: true },
});
const vite = await makeServer(true);
const asShipped = await makeServer(false);
after(async () => { await vite.close(); await asShipped.close(); });

const { POST } = await vite.ssrLoadModule("/app/api/contact/route.ts");
const { notificationBody } = await vite.ssrLoadModule("/lib/notification.ts");
const enquiry = {
  kind: "guest", name: "Example Guest", email: "guest@example.com", lang: "en",
  dates: "2026-11-18 07:00", party: "4", message: "Please arrange this experience.",
};
const emailId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
const adminUrl = `https://resend.com/emails/${emailId}`;

async function submit(t, overrides = {}, scheduleFails = false) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    if (url === "https://api.resend.com/emails") {
      return scheduleFails ? new Response("Scheduling unavailable", { status: 503 }) : Response.json({ id: emailId });
    }
    assert.equal(url, "https://api.resend.com/emails/batch");
    return Response.json({ data: [{ id: "internal" }, { id: "ack" }] });
  });
  t.mock.method(console, "error", () => {});
  const response = await POST(new Request("https://kamehame-japan.com/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...enquiry, ...overrides }),
  }));
  assert.equal(response.status, 200);
  return calls;
}

test("the internal stop link addresses exactly the scheduled follow-up; customer copy has none", async (t) => {
  const calls = await submit(t);
  assert.equal(calls.length, 2);
  const scheduled = calls[0].body;
  const [internal, ack] = calls[1].body;
  assert.deepEqual(scheduled.to, [enquiry.email]);
  assert.deepEqual(internal.to, ["team@example.com"]);
  assert.ok(internal.text.includes(adminUrl));
  assert.ok(internal.text.includes(`対象: ${enquiry.name} <${enquiry.email}> / ${enquiry.dates}`));
  const jst = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(new Date(scheduled.scheduled_at));
  assert.ok(internal.text.includes(`${jst}（日本時間）`));
  assert.match(internal.text, /Cancel schedule/);
  assert.match(internal.text, /Gmailで返信しても自動停止しません/);
  assert.doesNotMatch(ack.text, /resend\.com|フォローアップ管理ID|Cancel schedule/);
  assert.doesNotMatch(scheduled.text, /resend\.com|フォローアップ管理ID|Cancel schedule/);
});

test("failed scheduling keeps the acknowledgement but does not offer a stop link", async (t) => {
  const calls = await submit(t, {}, true);
  const [internal] = calls[1].body;
  assert.match(internal.text, /自動送信できていません/);
  assert.doesNotMatch(internal.text, /停止・状況確認|フォローアップ管理ID/);
});

test("trade enquiries do not schedule a guest follow-up or show its controls", async (t) => {
  const calls = await submit(t, { kind: "trade" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/emails/batch");
  assert.doesNotMatch(calls[0].body[0].text, /停止・状況確認|フォローアップ管理ID/);
});

test("experience requests accept optional blank notes and retain booking details", async (t) => {
  const calls = await submit(t, { experience: "osaka-kendo-experience-tour", message: "", party: "2", dates: "2026-11-10 10:00" });
  const internal = calls.at(-1).body[0];
  assert.match(internal.text, /2026-11-10 10:00/);
  assert.match(internal.text, /大阪/);
});

test("blank notes do not bypass required general/trade messages or missing booking details", async (t) => {
  t.mock.method(globalThis, "fetch", () => { throw Error("invalid requests must not send mail"); });
  for (const patch of [{}, { experience: "not-a-product" }, { experience: "osaka-kendo-experience-tour", dates: "" }, { experience: "osaka-kendo-experience-tour", party: "0" }, { experience: "osaka-kendo-experience-tour", kind: "trade" }]) {
    const response = await POST(new Request("https://kamehame-japan.com/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...enquiry, message: "", ...patch }),
    }));
    assert.equal(response.status, 400);
  }
});

test("malformed provider IDs and missing schedules do not create management links", () => {
  for (const followUp of [
    null,
    { text: "follow-up", scheduled: false, delayMinutes: 15, emailId },
    { text: "follow-up", scheduled: true, delayMinutes: 15, emailId: "../other?email=guest@example.com" },
  ]) {
    const text = notificationBody(enquiry, undefined, { followUp });
    assert.doesNotMatch(text, /停止・状況確認|フォローアップ管理ID/);
  }
});


test("arrangement enquiries send new HTML through Resend even when package automation is configured", async (t) => {
  const calls = await submit(t, { experience: "mt-fuji-golf-day", area: "Mt. Fuji", area_id: "fuji", course_mode: "recommended", party: "2", assistant: "required", caddie: "none", estimate: "¥270,000", rental_keys: "own,own" });
  assert.equal(calls.length, 2);
  const follow = calls[0].body, [internal, ack] = calls[1].body;
  assert.match(ack.text, /20,000/);
  assert.doesNotMatch(ack.text, /270,000/);
  assert.match(ack.html, /paid directly to the club/);
  assert.match(follow.html, /fuji-oyama.jpg/);
  assert.match(internal.text, /arrangement-2026-10-24/);
  assert.doesNotMatch(follow.text, /Thank you for booking/);
  assert.doesNotMatch(ack.html + follow.html, /book\.stripe\.com|Proceed to payment/);
});

test("as shipped, the follow-up is paused: no scheduling call, and the team notification says so", async (t) => {
  const { POST: postShipped } = await asShipped.ssrLoadModule("/app/api/contact/route.ts");
  const { FOLLOW_UP_ENABLED } = await asShipped.ssrLoadModule("/lib/contact.ts");
  assert.equal(FOLLOW_UP_ENABLED, false, "the switch is off while the wording is reworked");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    assert.equal(url, "https://api.resend.com/emails/batch", "only the acknowledgement batch goes out");
    return Response.json({ data: [{ id: "internal" }, { id: "ack" }] });
  });
  t.mock.method(console, "error", () => {});
  const response = await postShipped(new Request("https://kamehame-japan.com/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...enquiry, experience: "mt-fuji-golf-day", area: "Mt. Fuji", area_id: "fuji", course_mode: "recommended", party: "2", rental_keys: "own,own" }),
  }));
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  const [internal, ack] = calls[0].body;
  assert.match(internal.text, /フォローアップ: 一時停止中/);
  assert.doesNotMatch(internal.text, /自動送信できていません|停止・状況確認/);
  assert.match(ack.text, /20,000/, "the acknowledgement still goes out");
});

const { ledgerRecord } = await vite.ssrLoadModule("/lib/ledger.ts");
test("internal mail and legacy ledger retain the same inquiry and source", () => {
  const touch={landing:"https://example.com/golf",referrer:"",at:Date.now(),utm_source:"meta",utm_medium:"paid_social"};
  const e={...enquiry,requestId:"12345678-1234-1234-1234-123456789abc",attribution:{version:1,first:touch,last:touch}};
  const mail=notificationBody(e,"Golf",{});
  assert.ok(mail.includes(e.requestId));assert.ok(mail.includes("meta / paid_social"));
  const record=ledgerRecord(e,{}, {ackSent:false,followUpScheduled:false});
  assert.equal(record.requestId,e.requestId);assert.ok(record.message.includes(e.requestId));assert.ok(record.message.includes("meta / paid_social"));
});
