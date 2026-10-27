// The referral ledger end to end on node:sqlite with the real migrations:
// arrival → cookie → reservation → payment → refund → attendance → commission.
// Covers the stage-2 part of the acceptance tests (T04–T08, T10, T13–T17, T25, T26).
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const links = await vite.ssrLoadModule("/lib/referral/links.ts");
const R = await vite.ssrLoadModule("/lib/referral/reservations.ts");
const S = await vite.ssrLoadModule("/lib/referral/stripe-events.ts");

const T0 = Date.parse("2026-11-01T00:00:00Z");
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString();
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
let seq = 0;
const uuid = () => `11111111-2222-4333-8444-${String(++seq).padStart(12, "0")}`;

/** A legal entity, a hotel, a settlement profile and one QR link; returns ids and the token. */
async function seedHotel(db, name, { linkStatus = "active", chain = false } = {}) {
  const le = `le-${name}`, hotel = `h-${name}`, profile = `sp-${name}`, link = `l-${name}`, token = `tok_${name}_0123456789abcdef`;
  await db.batch([
    { sql: `INSERT INTO partner_legal_entities (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, params: [le, `${name} Co.`, iso(T0), iso(T0)] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, params: [hotel, le, `HP-${name}`, `Hotel ${name}`, iso(T0), iso(T0)] },
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, params: [profile, le, `${name} payout`, "2026-01-01", iso(T0), iso(T0)] },
    { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES (?, ?, ?)`, params: [profile, hotel, "2026-01-01"] },
    { sql: `INSERT INTO referral_links (id, token, hotel_id, chain_profile_id, medium, kind, target_path, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'brochure', 'qr', '/en/tokyo/kanji-name-calligraphy/', ?, ?, ?)`,
      params: [link, token, chain ? null : hotel, chain ? null : null, linkStatus, iso(T0), iso(T0)] },
  ]);
  return { hotel, profile, link, token };
}
async function setPolicy(db, slug, rateBp, validFrom, version = 1) {
  await db.run(`INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, valid_from, version, created_at) VALUES (?, ?, ?, 1000, ?, ?, ?)`,
    [`pol-${slug}-${version}`, slug, rateBp, validFrom, version, iso(T0)]);
}
/** Walk through the link as a browser would and return the cookie header to send back. */
async function arrive(db, token, now, ua = UA) {
  const r = await links.handleReferralArrival(db, { token, userAgent: ua, now });
  const cookie = r.setCookie ? r.setCookie.split(";")[0] : "";
  return { ...r, cookie };
}
const calligraphy = (requestId, extra = {}) => ({
  requestId, flow: "experience", experienceSlug: "kanji-name-calligraphy", experienceDate: "2026-12-10", guests: 2, lang: "en",
  lines: [{ kind: "base", description: "Kanji name calligraphy × 2", commissionable: true, quantity: 2, grossJpy: 39600 }], ...extra,
});
const paid = (id, reservationRef, { total = 39600, discount = 0, intent = "pi_1", created = T0 / 1000 + 60 } = {}) => ({
  id, type: "checkout.session.completed", created, livemode: true,
  data: { object: { id: `cs_${id}`, client_reference_id: reservationRef, payment_intent: intent, payment_status: "paid", currency: "jpy", amount_total: total, amount_subtotal: total + discount, total_details: { amount_discount: discount, amount_tax: 0 } } },
});
const refunded = (id, intent, amountRefunded, created = T0 / 1000 + 120) => ({
  id, type: "charge.refunded", created, livemode: true, data: { object: { id: `ch_${intent}`, payment_intent: intent, amount_refunded: amountRefunded } },
});
const entryOf = (db, reservationId) => db.first(`SELECT * FROM commission_entries WHERE reservation_id = ?`, [reservationId]);

test("arrival: a human gets a session cookie and a redirect to the link's page; bots and previews are counted but excluded", async () => {
  const db = openTestDb();
  const { token, hotel } = await seedHotel(db, "A");
  const human = await arrive(db, token, T0);
  assert.equal(human.redirect, "/en/tokyo/kanji-name-calligraphy/");
  assert.match(human.setCookie, /^kh_ref=[A-Za-z0-9_-]{22}; Max-Age=2592000; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
  const bot = await arrive(db, token, T0, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
  const preview = await arrive(db, token, T0, "facebookexternalhit/1.1");
  assert.equal(bot.setCookie, undefined); assert.equal(preview.setCookie, undefined);
  assert.equal(bot.redirect, human.redirect, "a bot is redirected too, never shown an error");
  const rows = await db.all(`SELECT ua_class, excluded FROM referral_events WHERE hotel_id = ? ORDER BY ua_class`, [hotel]);
  assert.deepEqual(rows, [{ ua_class: "bot", excluded: 1 }, { ua_class: "human", excluded: 0 }, { ua_class: "preview", excluded: 1 }]);
  const unknown = await links.handleReferralArrival(db, { token: "nope_0123456789abcdefgh", userAgent: UA, now: T0 });
  assert.deepEqual(unknown, { redirect: "/en/", recorded: false, uaClass: "human" });
  // the cookie resolves to the hotel; a forged id resolves to nothing
  const ctx = await links.activeReferral(db, human.cookie, T0 + 1000);
  assert.equal(ctx.hotelId, hotel);
  assert.equal(await links.activeReferral(db, "kh_ref=AAAAAAAAAAAAAAAAAAAAAA", T0), null);
});

test("T04: the last valid referral before the booking wins (A then B → B), with no code entered by the guest", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A"), B = await seedHotel(db, "B");
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  await arrive(db, A.token, T0);
  const b = await arrive(db, B.token, T0 + DAY);
  const ctx = await links.activeReferral(db, b.cookie, T0 + 2 * DAY);
  const rid = uuid();
  const r = await R.createReservation(db, calligraphy(rid), ctx, T0 + 2 * DAY);
  assert.equal(r.referral, "attributed");
  const ref = await db.first(`SELECT hotel_id, basis, rate_bp FROM reservation_referrals WHERE reservation_id = ?`, [r.id]);
  assert.deepEqual(ref, { hotel_id: B.hotel, basis: "cookie", rate_bp: 500 });
  // a retry of the same request creates nothing new; a different request id is a different reservation
  const again = await R.createReservation(db, calligraphy(rid), ctx, T0 + 2 * DAY);
  assert.equal(again.created, false); assert.equal(again.id, r.id);
  assert.equal((await db.all(`SELECT id FROM reservations`)).length, 1);
  assert.equal((await R.createReservation(db, calligraphy(uuid()), ctx, T0 + 2 * DAY)).created, true);
});

test("T05: a referral older than 30 days does not attach; one inside 30 days keeps its attribution however late the payment or the experience", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  const a = await arrive(db, A.token, T0);
  assert.equal(await links.activeReferral(db, a.cookie, T0 + 31 * DAY), null, "expired after 30 days");
  const ctx = await links.activeReferral(db, a.cookie, T0 + 29 * DAY);
  assert.ok(ctx);
  const r = await R.createReservation(db, calligraphy(uuid(), { experienceDate: "2027-09-15" }), ctx, T0 + 29 * DAY);
  await R.setExternalRef(db, (await db.first(`SELECT request_id FROM reservations WHERE id = ?`, [r.id])).request_id, "KJ-E-" + "a".repeat(32));
  // paid 200 days later, experience 300 days later: attribution is unchanged
  await S.recordStripeEvent(db, paid("evt_late", "KJ-E-" + "a".repeat(32), { created: (T0 + 200 * DAY) / 1000 }), T0 + 200 * DAY);
  assert.equal((await db.first(`SELECT hotel_id FROM reservation_referrals WHERE reservation_id = ?`, [r.id])).hotel_id, A.hotel);
  assert.equal((await entryOf(db, r.id)).status, "estimated");
});

test("T06: no cookie → the booking goes through with no referral and nothing to enter", async () => {
  const db = openTestDb();
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  const r = await R.createReservation(db, calligraphy(uuid()), null, T0);
  assert.equal(r.referral, undefined);
  assert.equal(await db.first(`SELECT * FROM reservation_referrals WHERE reservation_id = ?`, [r.id]), null);
  assert.equal(await entryOf(db, r.id), null);
});

test("T07/T08: commission is 5% of the tax-exclusive base; add-ons, arrangement costs and on-site charges add nothing", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "mt-fuji-golf-day", 500, "2026-01-01");
  const ctx = await links.activeReferral(db, (await arrive(db, A.token, T0)).cookie, T0);
  const r = await R.createReservation(db, {
    requestId: uuid(), flow: "golf", experienceSlug: "mt-fuji-golf-day", experienceDate: "2026-12-01", guests: 2, lang: "en",
    lines: [
      { kind: "arrangement", description: "Booking fee", commissionable: true, grossJpy: 11000 },
      { kind: "addon", description: "Club rental × 2", commissionable: false, grossJpy: 30000 },
      { kind: "onsite", description: "Green fees, paid at the club", commissionable: false, grossJpy: 0 },
    ],
  }, ctx, T0);
  const e = await entryOf(db, r.id);
  assert.equal(e.base_net_jpy, 10000);
  assert.equal(e.commission_net_jpy, 500);
  assert.equal(e.status, "estimated");
});

test("T13: an add-on-only refund keeps the commission; a partial base refund adjusts; a full cancel leaves nothing, tax included", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "mt-fuji-golf-day", 500, "2026-01-01");
  const ctx = await links.activeReferral(db, (await arrive(db, A.token, T0)).cookie, T0);
  const r = await R.createReservation(db, {
    requestId: uuid(), flow: "golf", experienceSlug: "mt-fuji-golf-day", experienceDate: "2026-11-20", guests: 2, lang: "en",
    lines: [{ kind: "arrangement", description: "Booking fee", commissionable: true, grossJpy: 22000 }, { kind: "addon", description: "Club rental", commissionable: false, grossJpy: 15000 }],
  }, ctx, T0);
  await db.run(`UPDATE reservations SET external_ref = 'KJ-X-1' WHERE id = ?`, [r.id]);
  await S.recordStripeEvent(db, paid("evt_p", "KJ-X-1", { total: 37000, intent: "pi_x" }), T0);
  assert.equal((await entryOf(db, r.id)).commission_net_jpy, 1000);
  // the experience took place; the entry is confirmed
  await R.confirmAttendance(db, r.id, { performedAt: iso(T0 + 19 * DAY), by: "ops@example.com" }, T0 + 20 * DAY);
  assert.equal((await entryOf(db, r.id)).status, "confirmed");
  // ¥15,000 back: two charged lines, so it waits for operations to say which line
  await S.recordStripeEvent(db, refunded("evt_r1", "pi_x", 15000), T0 + 21 * DAY);
  let e = await entryOf(db, r.id);
  assert.equal(e.status, "confirmed", "the confirmed amount stands");
  assert.equal(e.hold_reason, "refund_allocation", "but the payout is held until operations allocate the refund");
  // operations allocate it to the add-on: commission unchanged
  const refund = await db.first(`SELECT id FROM refunds WHERE reservation_id = ?`, [r.id]);
  const addon = await db.first(`SELECT id FROM reservation_lines WHERE reservation_id = ? AND kind = 'addon'`, [r.id]);
  await db.batch([
    { sql: `UPDATE reservation_lines SET refunded_gross_jpy = 15000 WHERE id = ?`, params: [addon.id] },
    { sql: `UPDATE refunds SET allocation_status = 'allocated', allocated_by = 'ops@example.com', allocated_at = ? WHERE id = ?`, params: [iso(T0 + 22 * DAY), refund.id] },
  ]);
  e = await R.recomputeCommission(db, r.id, "ops@example.com", T0 + 22 * DAY);
  assert.equal(e.commission_net_jpy, 1000);
  assert.equal(e.status, "confirmed"); assert.equal(e.hold_reason, null);
  // then everything else is refunded (cumulative 37,000): the base goes to 0 and an adjustment of −1,000 is written
  await S.recordStripeEvent(db, refunded("evt_r2", "pi_x", 37000), T0 + 23 * DAY);
  e = await entryOf(db, r.id);
  assert.equal(e.commission_net_jpy, 0);
  assert.equal(e.status, "adjusted");
  const adj = await db.all(`SELECT delta_net_jpy FROM commission_adjustments WHERE entry_id = ? ORDER BY created_at`, [e.id]);
  assert.deepEqual(adj.map((a) => a.delta_net_jpy), [-1000]);
  assert.equal(1000 + adj.reduce((s, a) => s + a.delta_net_jpy, 0), 0, "nothing left, no rounding residue");
});

test("T14: a rate change applies to new reservations only, and a missing rate is never defaulted to 5%", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  const ctx = await links.activeReferral(db, (await arrive(db, A.token, T0)).cookie, T0);
  const first = await R.createReservation(db, calligraphy(uuid()), ctx, T0);
  await setPolicy(db, "kanji-name-calligraphy", 700, iso(T0 + DAY), 2);
  const second = await R.createReservation(db, calligraphy(uuid()), ctx, T0 + 2 * DAY);
  assert.equal((await entryOf(db, first.id)).commission_net_jpy, 1800);  // 36,000 × 5%
  assert.equal((await entryOf(db, second.id)).commission_net_jpy, 2520); // 36,000 × 7%
  await R.recomputeCommission(db, first.id, "system", T0 + 3 * DAY);
  assert.equal((await entryOf(db, first.id)).commission_net_jpy, 1800, "recomputing keeps the saved rate");
  // an experience without a policy row
  const none = await R.createReservation(db, calligraphy(uuid(), { experienceSlug: "dotonbori-ramen-class" }), ctx, T0);
  assert.equal(none.referral, "rate_missing");
  const e = await entryOf(db, none.id);
  assert.equal(e.commission_net_jpy, 0); assert.equal(e.rate_bp, null); assert.equal(e.hold_reason, "rate_missing");
});

test("T15/T16: a re-sent payment counts once, and a refund that arrives before its payment is applied when the payment lands", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  const ctx = await links.activeReferral(db, (await arrive(db, A.token, T0)).cookie, T0);
  const r = await R.createReservation(db, calligraphy(uuid()), ctx, T0);
  await db.run(`UPDATE reservations SET external_ref = 'KJ-E-' || ? WHERE id = ?`, ["b".repeat(32), r.id]);
  const ref = "KJ-E-" + "b".repeat(32);
  assert.equal(await S.recordStripeEvent(db, refunded("evt_refund_first", "pi_o", 39600), T0 + 1000), "unmatched");
  assert.equal(await S.recordStripeEvent(db, paid("evt_pay", ref, { intent: "pi_o" }), T0 + 2000), "processed");
  assert.equal(await S.recordStripeEvent(db, paid("evt_pay", ref, { intent: "pi_o" }), T0 + 3000), "duplicate");
  assert.equal((await db.all(`SELECT id FROM payments`)).length, 1);
  const res = await db.first(`SELECT payment_status FROM reservations WHERE id = ?`, [r.id]);
  assert.equal(res.payment_status, "refunded", "the earlier refund was attached and applied");
  assert.equal((await entryOf(db, r.id)).commission_net_jpy, 0);
});

test("T17/T25/T26: a passed date never confirms; attendance confirms into the quarter it happened; postponement keeps it out", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  const ctx = await links.activeReferral(db, (await arrive(db, A.token, T0)).cookie, T0);
  const r = await R.createReservation(db, calligraphy(uuid(), { experienceDate: "2027-09-15" }), ctx, T0);
  await db.run(`UPDATE reservations SET external_ref = 'KJ-E-' || ? WHERE id = ?`, ["c".repeat(32), r.id]);
  await S.recordStripeEvent(db, paid("evt_pay", "KJ-E-" + "c".repeat(32)), T0 + 1000);
  // paid in 2026-11, experience 2027-09: nothing confirmed in between
  let e = await R.recomputeCommission(db, r.id, "system", Date.parse("2027-07-01T00:00:00Z"));
  assert.equal(e.status, "estimated");
  // the date passes with no attendance record: still not confirmed
  e = await R.recomputeCommission(db, r.id, "system", Date.parse("2027-09-20T00:00:00Z"));
  assert.equal(e.status, "estimated");
  // attendance recorded for a future time is held
  e = await R.confirmAttendance(db, r.id, { performedAt: "2027-10-02T01:00:00Z", by: "ops@example.com" }, Date.parse("2027-09-20T00:00:00Z"));
  assert.equal(e.status, "pending"); assert.match(e.hold_reason, /performed_in_future/);
  // confirmed in September: confirmed, with the JST day of the experience
  e = await R.confirmAttendance(db, r.id, { performedAt: "2027-09-15T01:00:00Z", by: "ops@example.com" }, Date.parse("2027-09-16T00:00:00Z"));
  assert.equal(e.status, "confirmed");
  assert.equal(e.performed_on_jst, "2027-09-15");
  assert.equal(e.settlement_profile_id, A.profile);
  assert.equal(e.commission_net_jpy, 1800);
  // a cancelled booking that never took place: zero
  const r2 = await R.createReservation(db, calligraphy(uuid()), ctx, T0);
  e = await R.setReservationOutcome(db, r2.id, "cancelled", "ops@example.com", "guest cancelled", T0 + DAY);
  assert.equal(e.status, "voided"); assert.equal(e.commission_net_jpy, 0);
});

test("a chain-wide link with no payee is held as payee_missing; a paused link or ended partnership gives no session", async () => {
  const db = openTestDb();
  const A = await seedHotel(db, "A");
  await setPolicy(db, "kanji-name-calligraphy", 500, "2026-01-01");
  await db.run(`INSERT INTO referral_links (id, token, hotel_id, chain_profile_id, medium, kind, target_path, status, created_at, updated_at) VALUES ('l-chain', 'tok_chain_0123456789abcdef', NULL, NULL, 'room_tv', 'qr', '/ja/', 'active', ?, ?)`, [iso(T0), iso(T0)]);
  const c = await arrive(db, "tok_chain_0123456789abcdef", T0);
  assert.equal(c.redirect, "/ja/");
  const ctx = await links.activeReferral(db, c.cookie, T0);
  const r = await R.createReservation(db, calligraphy(uuid()), ctx, T0);
  assert.equal(r.referral, "payee_missing");
  // T23: the partnership ends
  await db.run(`UPDATE hotels SET status = 'terminated' WHERE id = ?`, [A.hotel]);
  const ended = await arrive(db, A.token, T0);
  assert.equal(ended.setCookie, undefined); assert.equal(ended.redirect, "/en/tokyo/kanji-name-calligraphy/");
  assert.equal((await db.first(`SELECT excluded FROM referral_events WHERE link_id = ?`, [A.link])).excluded, 1);
});
