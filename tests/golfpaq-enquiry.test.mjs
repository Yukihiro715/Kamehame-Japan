// The shared-bus enquiry: priced from the fresh feed, kept in the ledger,
// mailed as totals only to the customer and with the breakdown to staff and
// the partner; nothing paid, nothing reserved.
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const g = await vite.ssrLoadModule("/lib/golfpaq.ts");
const { handleGolfpaqEnquiry } = await vite.ssrLoadModule("/lib/golfpaq-enquiry.ts");
const M = await vite.ssrLoadModule("/lib/golfpaq-mail.ts");
const fx = (name) => readFileSync(new URL(`./fixtures/golfpaq/${name}`, import.meta.url), "utf8");

const NOW = new Date("2026-11-02T03:00:00Z");
const ORIGIN = "https://staging.example";
function feed(now = NOW) {
  const tours = g.parseGolfpaqListing(fx("month-2026-11.html"), g.firstPublicDay(now), "2027-01-31");
  tours[0].details = g.parseGolfpaqDetail(fx("detail-30821.html"), now);
  const snapshot = { updatedAt: new Date(now.getTime() - 600000).toISOString(), first: g.firstPublicDay(now), through: "2027-01-31", tours, months: ["2026-11"], fetchedMonths: 1, failedMonths: 0, detailsPending: 0 };
  const store = new Map([[g.GOLFPAQ_SNAPSHOT_KEY, JSON.stringify(snapshot)]]);
  return { tours, kv: { get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null), put: async (k, v) => { store.set(k, v); } } };
}
function mailMock() {
  const sent = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith("https://api.resend.com/")) { sent.push(JSON.parse(init.body)); return new Response(JSON.stringify({ id: "m" + sent.length }), { status: 200, headers: { "content-type": "application/json" } }); }
    if (String(url).startsWith("https://hooks.slack.com/")) { sent.push({ slack: JSON.parse(init.body).text }); return new Response("ok"); }
    throw new Error("unexpected fetch " + url);
  };
  return { sent, restore: () => { globalThis.fetch = real; } };
}
const uuid = (n) => `11111111-2222-4333-8444-${String(n).padStart(12, "0")}`;
const post = (body, env, opts = {}) => handleGolfpaqEnquiry(new Request(`${ORIGIN}/api/golfpaq/enquiry`, { method: "POST", headers: { "content-type": "application/json", ...(opts.noOrigin ? {} : { origin: opts.origin ?? ORIGIN }) }, body: JSON.stringify(body) }), env, NOW);

test("a valid enquiry: 409/400 guards, server pricing, ledger row, three mails with the right contents", async () => {
  const { tours, kv } = feed();
  const db = openTestDb();
  const mock = mailMock();
  try {
    const env = { READY_STATE: kv, DB: db.d1, RESEND_API_KEY: "re_test", CONTACT_TO: "team@example.com", GOLFPAQ_PARTNER_TO: "partner@example.com", SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/x" };
    const t = tours.find((x) => !x.closed && x.seats >= 3 && x.seats <= 7 && x.date >= g.plusDays(g.firstPublicDay(NOW), 8));
    assert.ok(t, "an open tour with a few seats beyond the first week");
    const near = tours.find((x) => !x.closed && x.seats >= 3 && x.date <= g.plusDays(g.firstPublicDay(NOW), 3));
    const closed = tours.find((x) => x.closed && x.date >= g.plusDays(g.firstPublicDay(NOW), 8));
    assert.ok(near && closed, "a near tour and a closed tour");
    const base = { id: t.id, date: t.date, people: 2, rental: true, renters: 1, name: "Test Guest", email: "guest@example.com", phone: "+81 90 0000 0000", note: "Right-handed", lang: "en", consent: true, request_id: uuid(1) };
    // guards
    assert.equal((await post(base, env, { origin: "https://evil.example" })).status, 403);
    assert.equal((await post({ ...base, consent: false }, env)).status, 400);
    assert.equal((await post({ ...base, people: 9 }, env)).status, 400);
    assert.equal((await post({ ...base, renters: 3 }, env)).status, 400, "more renters than golfers");
    assert.equal((await post({ ...base, id: "9-9-9" }, env)).status, 409, "a tour not in the feed");
    assert.equal((await post({ ...base, people: t.seats + 1, renters: 0, rental: false }, env)).status, 409, "more golfers than seats shown");
    assert.equal((await post({ ...base, id: near.id, date: near.date, renters: 0, rental: false, people: 1 }, env)).status, 409, "within three days: sold out whatever the partner shows");
    assert.equal((await post({ ...base, id: closed.id, date: closed.date, renters: 0, rental: false, people: 1 }, env)).status, 409, "closed by the partner: sold out");
    assert.equal((await post(base, { ...env, READY_STATE: { get: async () => null, put: async () => {} } })).status, 503, "no fresh feed, no enquiry");
    // the real one
    const res = await post(base, env);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.reference, /^GP-[2-9A-Z]{6}$/);
    assert.equal(body.total, t.perPersonYen * 2 + 5500);
    const row = await db.first(`SELECT * FROM bus_tour_enquiries WHERE reference = ?`, [body.reference]);
    assert.equal(row.source_yen, t.sourceYen); assert.equal(row.fee_yen, 15000); assert.equal(row.per_person_yen, t.sourceYen + 15000);
    assert.equal(row.total_yen, body.total); assert.equal(row.renters, 1); assert.equal(row.status, "handed_over"); assert.equal(row.partner_mail, "sent");
    // mails: customer gets totals only; staff and partner get the breakdown
    const customer = mock.sent.find((m) => m.to?.[0] === "guest@example.com");
    const staff = mock.sent.find((m) => m.to?.[0] === "team@example.com");
    const partner = mock.sent.find((m) => m.to?.[0] === "partner@example.com");
    assert.ok(customer && staff && partner);
    assert.match(customer.text, /Your booking is not yet confirmed, and no payment has been taken/);
    assert.match(customer.text, new RegExp(`¥${(t.sourceYen + 15000).toLocaleString("en-US")} /person × 2`));
    assert.match(customer.text, /Rental clubs: ¥5,500 \/person × 1/);
    assert.match(customer.text, new RegExp(`Total \\(tax included\\): ¥${body.total.toLocaleString("en-US")}`));
    assert.ok(!customer.text.includes(String(t.sourceYen)) && !/15,000|GOLFPAQ|golfpaq\.net/.test(customer.text), "no partner price, no fee, no partner name or link to the customer");
    assert.match(staff.text, /GOLFPAQ価格/); assert.match(partner.text, /追加分: ¥15,000/);
    assert.ok(mock.sent.some((m) => m.slack && m.slack.includes(body.reference)));
    // the same request id again is the same enquiry
    const again = await (await post(base, env)).json();
    assert.equal(again.reference, body.reference); assert.equal(again.duplicate, true);
    assert.equal((await db.first(`SELECT COUNT(*) AS n FROM bus_tour_enquiries`)).n, 1);
  } finally { mock.restore(); }
});

test("staging: mail to addresses outside the allowlist is blocked and recorded; without a database the enquiry still goes out", async () => {
  const { tours, kv } = feed();
  const db = openTestDb();
  const mock = mailMock();
  try {
    const env = { KH_ENV: "staging", NOTIFY_ALLOWLIST: "team@example.com", READY_STATE: kv, DB: db.d1, RESEND_API_KEY: "re_test", CONTACT_TO: "team@example.com", GOLFPAQ_PARTNER_TO: "partner@example.com" };
    const t = tours.find((x) => !x.closed && x.seats >= 2 && x.date >= g.plusDays(g.firstPublicDay(NOW), 8));
    const res = await post({ id: t.id, date: t.date, people: 1, rental: false, name: "A", email: "someone@hotel.example", lang: "ja", consent: true, request_id: uuid(2) }, env);
    const body = await res.json();
    assert.equal(res.status, 200); assert.equal(body.customerMail, "blocked");
    const row = await db.first(`SELECT customer_mail, staff_mail, partner_mail, status, renters, total_yen FROM bus_tour_enquiries WHERE reference = ?`, [body.reference]);
    assert.deepEqual(row, { customer_mail: "blocked", staff_mail: "sent", partner_mail: "blocked", status: "received", renters: 0, total_yen: t.perPersonYen });
    assert.equal(mock.sent.filter((m) => m.to).length, 1, "only the staff mail left");
    const noDb = await post({ id: t.id, date: t.date, people: 1, rental: false, name: "B", email: "team@example.com", lang: "en", consent: true, request_id: uuid(3) }, { ...env, DB: undefined });
    assert.equal(noDb.status, 200);
  } finally { mock.restore(); }
});

test("mail copy: Japanese acknowledgement adds the Japanese notice; the purchase-guidance draft never shows the breakdown", () => {
  const f = { reference: "GP-TEST01", tour: { course: "Sample GC", date: "2026-11-20", pickup: "新宿発着プラン", departure: { area: "Shinjuku (Tokyo)", time: "06:40", lunch: "not_included", throughPlay: false } }, people: 2, renters: 2, perPersonYen: 30400, toursYen: 60800, rentalsYen: 11000, totalYen: 71800, name: "Taro", email: "t@example.com", lang: "ja" };
  const c = M.customerConfirmation(f);
  assert.match(c.text, /当サイトでのお支払いは不要です。お問い合わせのみでは予約は確定しません。/);
  assert.match(c.text, /合計（税込）: ¥71,800/);
  const d = M.purchaseGuidanceDraft(f);
  assert.match(d.text, /¥30,400 \/person × 2 = ¥60,800/);
  assert.ok(!/15,?000|15,400|GOLFPAQ/.test(d.text));
});
