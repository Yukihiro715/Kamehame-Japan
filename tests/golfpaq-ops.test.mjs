// The operations side of shared-bus enquiries: listing, the internal
// breakdown, status transitions with reasons, notes, partner re-send, and the
// purchase-guidance draft that never shows the breakdown.
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
const O = await vite.ssrLoadModule("/lib/golfpaq-ops.ts");
const { d1Db } = await vite.ssrLoadModule("/lib/referral/db.ts");
const fx = (name) => readFileSync(new URL(`./fixtures/golfpaq/${name}`, import.meta.url), "utf8");
const NOW = new Date("2026-11-02T03:00:00Z");
const ORIGIN = "https://staging.example";

test("ops: list, detail with breakdown, transitions, note, partner re-send, draft", async () => {
  const tours = g.parseGolfpaqListing(fx("month-2026-11.html"), g.firstPublicDay(NOW), "2027-01-31");
  const snapshot = { updatedAt: new Date(NOW.getTime() - 600000).toISOString(), first: g.firstPublicDay(NOW), through: "2027-01-31", tours, months: ["2026-11"], fetchedMonths: 1, failedMonths: 0, detailsPending: 0 };
  const kv = { get: async () => snapshot, put: async () => {} };
  const db = openTestDb();
  const sent = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url: String(url), body: JSON.parse(init.body) }); return new Response(JSON.stringify({ id: "m" }), { status: 200, headers: { "content-type": "application/json" } }); };
  try {
    const t = tours.find((x) => !x.closed && x.seats >= 2 && x.date >= g.plusDays(g.firstPublicDay(NOW), 8));
    // first without a partner address: status stays received
    const env = { READY_STATE: kv, DB: db.d1, RESEND_API_KEY: "re_test", CONTACT_TO: "team@example.com" };
    const res = await handleGolfpaqEnquiry(new Request(`${ORIGIN}/api/golfpaq/enquiry`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ id: t.id, date: t.date, people: 2, golfers: [{ name: "Ops Test", clubs: true, hand: "right", shoes: false }, { name: "Friend", clubs: true, hand: "left", shoes: true, shoeSize: "US 9" }], name: "Ops Test", email: "guest@example.com", lang: "en", consent: true, request_id: "11111111-2222-4333-8444-000000000009" }) }), env, NOW);
    const { reference } = await res.json();
    const sql = d1Db(db.d1);
    const list = await O.busEnquiryList(sql, { status: "open" });
    assert.equal(list.rows.length, 1); assert.equal(list.rows[0].status, "received"); assert.equal(list.rows[0].marginYen, 30000); assert.equal(list.counts.received, 1);
    const id = list.rows[0].id;
    const detail = await O.busEnquiryDetail(sql, id);
    assert.equal(detail.enquiry.golfers.length, 2); assert.equal(detail.enquiry.golfers[1].shoeSize, "US 9");
    assert.match(detail.draft.text, /2\. Friend · rental clubs \(left-handed\) · shoe rental size US 9/);
    assert.equal(detail.enquiry.source_yen, t.sourceYen); assert.equal(detail.enquiry.total_yen, (t.sourceYen + 15000) * 2 + 11000 + 2200, "two club rentals, one pair of shoes"); assert.equal(detail.enquiry.shoe_renters, 1);
    assert.deepEqual(detail.enquiry.next, ["handed_over", "guidance_sent", "cancelled", "unavailable"]);
    assert.match(detail.draft.text, /Total \(tax included\)/); assert.ok(!/15,000|GOLFPAQ/.test(detail.draft.text) && !detail.draft.text.includes(String(t.sourceYen)));
    // partner re-send once the address exists moves received → handed_over
    const r = await O.busEnquiryResendPartner(sql, { ...env, GOLFPAQ_PARTNER_TO: "partner@example.com" }, reference, "ops@example.com");
    assert.deepEqual(r, { outcome: "sent", status: "handed_over" });
    assert.ok(sent.some((m) => m.body.to?.[0] === "partner@example.com" && /追加分: ¥15,000/.test(m.body.text)));
    // transitions
    await assert.rejects(O.busEnquirySetStatus(sql, id, { status: "confirmed", by: "ops@example.com" }), (e) => e.code === "bad_transition");
    await assert.rejects(O.busEnquirySetStatus(sql, id, { status: "cancelled", by: "ops@example.com" }), (e) => e.code === "reason_required");
    await O.busEnquirySetStatus(sql, id, { status: "guidance_sent", by: "ops@example.com" });
    await O.busEnquirySetStatus(sql, id, { status: "purchased", by: "ops@example.com" });
    await O.busEnquirySetStatus(sql, id, { status: "confirmed", by: "ops@example.com" });
    await O.busEnquirySetNote(sql, id, { note: "電話で3席確保済み", by: "ops@example.com" });
    const d2 = await O.busEnquiryDetail(sql, id);
    assert.equal(d2.enquiry.status, "confirmed"); assert.equal(d2.enquiry.internal_note, "電話で3席確保済み"); assert.deepEqual(d2.enquiry.next, ["cancelled"]);
    assert.equal(d2.logs.length, 5, "re-send, three status changes, one note");
    assert.equal((await O.busEnquiryList(sql, { status: "open" })).rows.length, 0);
    assert.equal((await O.busEnquiryList(sql, { q: "Ops Test" })).rows.length, 1);
    await assert.rejects(O.busEnquiryDetail(sql, "nope"), (e) => e.code === "not_found");
  } finally { globalThis.fetch = real; }
});
