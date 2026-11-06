// Stage 4 settlement (lib/portal/settlement.ts): the quarter close with carry-over
// and the minimum payout (T11/T12, T28), re-running a close (T27), issue →
// acknowledge / dispute → answer (T18–T20), payout batches and results (T21),
// corrections after issue (T30), and the CSV matching the API (T29).
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const S = await vite.ssrLoadModule("/lib/portal/settlement.ts");
const { handlePortalApi } = await vite.ssrLoadModule("/lib/portal/api.ts");

const T = Date.parse("2026-11-06T03:00:00Z"); // Q3 2026 is closed, Q4 is open
const iso = (t) => new Date(t).toISOString();
const ORIGIN = "https://staging.example";
let n = 0;

/** A confirmed commission entry on a profile: reservation + referral + attendance + entry, as the ledger would leave them. */
async function entry(db, { profile, hotel, performedOn, commission, base = commission * 20, status = "confirmed", hold = null }) {
  const id = `r${++n}`, at = iso(T - 30 * 86400000);
  await db.batch([
    { sql: `INSERT INTO reservations (id, request_id, flow, experience_slug, experience_date, status, payment_status, amount_status, hotel_ref, created_at, updated_at) VALUES (?, ?, 'experience', 'kanji-name-calligraphy', ?, 'completed', 'paid', 'known', ?, ?, ?)`, params: [id, `rq${n}`, performedOn, `KJ-${n}`, at, at] },
    { sql: `INSERT INTO reservation_referrals (reservation_id, hotel_id, basis, fixed_at, rate_bp, status) VALUES (?, ?, 'cookie', ?, 500, 'attributed')`, params: [id, hotel, at] },
    { sql: `INSERT INTO attendances (reservation_id, performed_at, performed_on_jst, confirmed_by, confirmed_at) VALUES (?, ?, ?, 'ops', ?)`, params: [id, `${performedOn}T03:00:00Z`, performedOn, at] },
    { sql: `INSERT INTO commission_entries (id, reservation_id, hotel_id, settlement_profile_id, rate_bp, base_net_jpy, commission_net_jpy, performed_on_jst, status, hold_reason, created_at, updated_at) VALUES (?, ?, ?, ?, 500, ?, ?, ?, ?, ?, ?, ?)`, params: [`e-${id}`, id, hotel, profile, base, commission, performedOn, status, hold, at, at] },
  ]);
  return `e-${id}`;
}
async function seed(db, { minPayout = 3000, fee = 0, feeBy = "hotel" } = {}) {
  const at = iso(T);
  await db.batch([
    { sql: `INSERT INTO users (id, email, name, status, created_at) VALUES ('u-fin', 'finance@example.com', 'Fin', 'active', ?)`, params: [at] },
    { sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at) VALUES ('m-fin', 'u-fin', 'ops_finance', 'ops', NULL, ?)`, params: [at] },
    { sql: `INSERT INTO partner_legal_entities (id, name, contact_email, created_at, updated_at) VALUES ('le1', 'Example Hotels Co.', 'office@hotel.example', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('hA', 'le1', 'HP-0001', 'Hotel A', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, payee_name, min_payout_jpy, fee_borne_by, bank_fee_jpy, valid_from, created_at, updated_at) VALUES ('spA', 'le1', 'A payout', 'EXAMPLE HOTELS', ?, ?, ?, '2026-01-01', ?, ?)`, params: [minPayout, feeBy, fee, at, at] },
    { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('spA', 'hA', '2026-01-01')` },
    { sql: `INSERT INTO users (id, email, name, status, created_at) VALUES ('u-bill', 'billing@hotel.example', 'Bill', 'active', ?)`, params: [at] },
    { sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at) VALUES ('m-bill', 'u-bill', 'hotel_billing', 'hotel', 'hA', ?)`, params: [at] },
  ]);
}
function client(db, jar = new Map(), mails = []) {
  const env = { DB: db.d1, KH_ENV: "staging", RESEND_API_KEY: "re_test", NOTIFY_ALLOWLIST: "@hotel.example,@example.com" };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { if (String(url).startsWith("https://api.resend.com/")) { mails.push(JSON.parse(init.body)); return new Response(JSON.stringify({ id: "m" }), { status: 200, headers: { "content-type": "application/json" } }); } return realFetch(url, init); };
  return {
    mails, restore: () => { globalThis.fetch = realFetch; },
    async call(method, path, body) {
      const headers = new Headers();
      if (method !== "GET") { headers.set("content-type", "application/json"); headers.set("origin", ORIGIN); headers.set("x-kh-portal", "1"); }
      if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
      const res = await handlePortalApi(new Request(`${ORIGIN}/api/portal/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, path.split("?")[0].split("/"));
      for (const sc of res.headers.getSetCookie?.() ?? []) { const [kv] = sc.split(";"); const [k, v] = kv.split("="); if (v) jar.set(k, v); else jar.delete(k); }
      const type = res.headers.get("content-type") ?? "";
      return { status: res.status, body: type.includes("json") ? await res.json() : type.startsWith("text/csv") ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer()) : null };
    },
  };
}
async function signIn(c, email, kind) {
  const r1 = await c.call("POST", "auth/request-code", { email, kind });
  // The code travels by (mocked) mail; staging shows it only when no mail could be sent.
  const code = r1.body.devCode ?? c.mails.filter((m) => m.to?.[0] === email).at(-1)?.text.match(/サインインコード: (\d{6})/)?.[1];
  const r2 = await c.call("POST", "auth/verify", { email, code, kind }); assert.equal(r2.status, 200, JSON.stringify(r2.body));
}

test("calendar: quarters, pay date on the last day of the next month moved off a weekend, the last closed quarter", () => {
  assert.equal(S.quarterOf("2026-08-15"), "2026-Q3"); assert.deepEqual(S.quarterBounds("2026-Q4"), { from: "2026-10-01", to: "2026-12-31" });
  assert.equal(S.payDateFor("2026-Q3"), "2026-10-30", "31 Oct 2026 is a Saturday → Friday 30th");
  assert.equal(S.payDateFor("2026-Q4"), "2027-01-29", "31 Jan 2027 is a Sunday → Friday 29th");
  assert.equal(S.lastClosedQuarter("2026-11-06"), "2026-Q3"); assert.equal(S.previousPeriod("2026-Q1"), "2025-Q4");
});

test("close: tax once on the total, carry-over below the minimum (T11/T12, T28), a re-run rebuilds the same draft without duplicates (T27), the open quarter is refused", async () => {
  const db = openTestDb(); await seed(db);
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-07-10", commission: 1000 });
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-09-20", commission: 1500 });
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-09-25", commission: 900, hold: "payment_incomplete" }); // held: not stated
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-10-02", commission: 5000 }); // next quarter
  await assert.rejects(S.closeQuarter(db, { period: "2026-Q4", by: "fin" }, T), (e) => e.code === "period_open");
  const r1 = await S.closeQuarter(db, { period: "2026-Q3", by: "fin" }, T);
  assert.equal(r1.statements.length, 1);
  let s = await S.getStatement(db, r1.statements[0].id);
  assert.deepEqual([s.net_jpy, s.tax_jpy, s.gross_jpy, s.carried_in_jpy, s.payable_jpy, s.carried_out_jpy, s.transfer_jpy, s.pay_date_jst], [2500, 250, 2750, 0, 2750, 2750, 0, "2026-10-30"], "¥2,750 is under ¥3,000: carried, nothing transferred");
  // Re-run: same statement, same items, nothing doubled.
  const r2 = await S.closeQuarter(db, { period: "2026-Q3", by: "fin" }, T);
  assert.equal(r2.statements[0].id, s.id); assert.equal(r2.statements[0].rebuilt, true);
  assert.equal((await db.first(`SELECT COUNT(*) AS n FROM statement_items WHERE statement_id = ?`, [s.id])).n, 2);
  assert.equal((await db.first(`SELECT COUNT(*) AS n FROM statements`)).n, 1);
  // Issue Q3, then Q4 after the quarter ends: the carry comes in and the total now clears the minimum.
  await S.issueStatement(db, s.id, "fin", T);
  const T2 = Date.parse("2027-01-05T03:00:00Z");
  const r3 = await S.closeQuarter(db, { period: "2026-Q4", by: "fin" }, T2);
  const s4 = await S.getStatement(db, r3.statements[0].id);
  assert.deepEqual([s4.net_jpy, s4.gross_jpy, s4.carried_in_jpy, s4.payable_jpy, s4.carried_out_jpy, s4.transfer_jpy], [5000, 5500, 2750, 8250, 0, 8250]);
  // The held entry, once released, lands in the next close that includes its date (late confirmations are never lost).
  await db.run(`UPDATE commission_entries SET hold_reason = NULL WHERE reservation_id = 'r3'`);
  const r4 = await S.closeQuarter(db, { period: "2026-Q4", by: "fin" }, T2);
  assert.equal((await S.getStatement(db, r4.statements[0].id)).net_jpy, 5900, "the September entry joins the Q4 draft");
});

test("bank fee comes off the transfer only (T12); a negative balance after a refund carries and offsets the next quarter (T28, T30)", async () => {
  const db = openTestDb(); await seed(db, { fee: 440 });
  const e1 = await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-08-01", commission: 4000 });
  const r1 = await S.closeQuarter(db, { period: "2026-Q3", by: "fin" }, T);
  let s = await S.getStatement(db, r1.statements[0].id);
  assert.deepEqual([s.gross_jpy, s.bank_fee_jpy, s.transfer_jpy], [4400, 440, 3960]);
  await S.issueStatement(db, s.id, "fin", T);
  // After issue the booking is refunded in full: the ledger records an adjustment of −4000.
  await db.run(`INSERT INTO commission_adjustments (id, entry_id, delta_net_jpy, reason, created_by, created_at) VALUES ('adj1', ?, -4000, 'refund', 'system', ?)`, [e1, iso(T + 86400000)]);
  const T2 = Date.parse("2027-01-05T03:00:00Z");
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-11-01", commission: 1000 });
  const r2 = await S.closeQuarter(db, { period: "2026-Q4", by: "fin" }, T2);
  const s4 = await S.statementDetail(db, r2.statements[0].id);
  assert.deepEqual(s4.items.map((i) => [i.kind, i.amount_net_jpy]).sort(), [["adjustment", -4000], ["entry", 1000]]);
  assert.deepEqual([s4.statement.net_jpy, s4.statement.gross_jpy, s4.statement.payable_jpy, s4.statement.carried_out_jpy, s4.statement.transfer_jpy], [-3000, -3300, -3300, -3300, 0], "negative: carried, nothing paid");
  await S.issueStatement(db, s4.statement.id, "fin", T2);
  const T3 = Date.parse("2027-04-05T03:00:00Z");
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2027-02-01", commission: 6000 });
  const r3 = await S.closeQuarter(db, { period: "2027-Q1", by: "fin" }, T3);
  const s1 = await S.getStatement(db, r3.statements[0].id);
  assert.deepEqual([s1.gross_jpy, s1.carried_in_jpy, s1.payable_jpy, s1.transfer_jpy], [6600, -3300, 3300, 2860], "the negative carry offsets, the fee comes off the rest");
});

test("lifecycle through the API: issue notifies billing, acknowledge / dispute within the window, answer, revision, payout batch, CSV and settled (T18–T21, T29, T30)", async () => {
  const db = openTestDb(); await seed(db);
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-08-01", commission: 4000 });
  const eB = await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-09-01", commission: 2000 });
  const ops = client(db); try {
    await signIn(ops, "finance@example.com", "ops");
    const closed = (await ops.call("POST", "ops/settlement/close", { period: "2026-Q3" })).body;
    const sid = closed.statements[0].id;
    const overview = (await ops.call("GET", "ops/settlement")).body;
    assert.equal(overview.statements[0].status, "draft"); assert.equal(overview.suggestedPeriod, "2026-Q3");
    // The partner cannot see a draft.
    const bill = client(db, new Map(), ops.mails); await signIn(bill, "billing@hotel.example", "hotel");
    assert.equal((await bill.call("GET", `hotel/statements/${sid}`)).status, 404);
    // Issue: mail to the billing contact with the totals and the deadline.
    const issued = (await ops.call("POST", `ops/statements/${sid}/issue`)).body;
    assert.equal(issued.statement.status, "issued"); assert.equal(issued.notified, 1);
    const mail = ops.mails.findLast((m) => m.to?.[0] === "billing@hotel.example" && /通知書/.test(m.subject));
    assert.match(mail.subject, /お支払い通知書/); assert.match(mail.text, /税込合計: 6,600円/); assert.match(mail.text, /お振込予定額: 6,600円/); assert.match(mail.text, /\/hotel\/settlement\//);
    // The partner sees it with items; the CSV carries the same figures (T29).
    const mine = (await bill.call("GET", "hotel/settlement?hotel=hA")).body;
    assert.equal(mine.statements.length, 1); assert.equal(mine.billing, true);
    const detail = (await bill.call("GET", `hotel/statements/${sid}`)).body;
    assert.equal(detail.items.length, 2); assert.equal(detail.statement.gross_jpy, 6600); assert.equal(detail.entity.name, "Example Hotels Co.");
    const csv = (await bill.call("GET", `hotel/statements/${sid}/csv`)).body;
    assert.match(csv, /税抜合計,,,,,,,6000,/); assert.match(csv, /振込額,,,,,,,6600,/); assert.match(csv, /KJ-\d+,kanji-name-calligraphy,Hotel A,80000,5.00%,4000/);
    // Dispute an item (T19), operations rejects it: back to issued; dispute again, upheld: fix the ledger, void and re-close (T20, T30).
    const dispute = (await bill.call("POST", `hotel/statements/${sid}/dispute`, { reason: "2件目は実施されていません", itemId: detail.items[1].id })).body;
    assert.equal((await ops.call("GET", `ops/statements/${sid}`)).body.statement.status, "disputed");
    assert.equal((await ops.call("POST", `ops/disputes/${dispute.disputeId}/resolve`, { outcome: "rejected", resolution: "実施記録を確認しました" })).status, 200);
    assert.equal((await ops.call("GET", `ops/statements/${sid}`)).body.statement.status, "issued");
    assert.match(ops.mails.at(-1).subject, /異議申立てへの回答/);
    const d2 = (await bill.call("POST", `hotel/statements/${sid}/dispute`, { reason: "金額が違います" })).body;
    assert.equal((await ops.call("POST", `ops/disputes/${d2.disputeId}/resolve`, { outcome: "upheld", resolution: "料率を訂正します" })).status, 200);
    await db.run(`INSERT INTO commission_adjustments (id, entry_id, delta_net_jpy, reason, created_by, created_at) VALUES ('adj-x', ?, -500, 'rate corrected', 'fin', ?)`, [eB, iso(T)]);
    await db.run(`UPDATE commission_entries SET commission_net_jpy = 1500, status = 'adjusted' WHERE id = ?`, [eB]);
    assert.equal((await ops.call("POST", `ops/statements/${sid}/void`, { reason: "異議を受けて訂正版を発行" })).status, 200);
    const re = (await ops.call("POST", "ops/settlement/close", { period: "2026-Q3" })).body;
    const sid2 = re.statements[0].id;
    const v2 = (await ops.call("GET", `ops/statements/${sid2}`)).body;
    assert.equal(v2.statement.version, 2); assert.equal(v2.statement.net_jpy, 5500, "the corrected amount, the adjustment folded in, nothing counted twice");
    assert.equal(v2.items.length, 2);
    assert.equal((await ops.call("POST", `ops/statements/${sid2}/issue`)).status, 200);
    assert.equal((await bill.call("POST", `hotel/statements/${sid2}/acknowledge`)).status, 200);
    assert.equal((await bill.call("GET", `hotel/statements/${sid2}`)).body.statement.status, "acknowledged");
    assert.equal((await bill.call("GET", `hotel/statements/${sid}`)).body.statement.status, "void", "the superseded version stays readable");
    // Payout batch: the due statement, CSV, result recorded → settled and the partner's paid total (T21).
    assert.equal((await ops.call("POST", "ops/payouts", { payDate: "2026-10-01" })).status, 400, "not due yet");
    const batch = (await ops.call("POST", "ops/payouts", { payDate: "2026-10-30" })).body;
    assert.equal(batch.payouts, 1); assert.equal(batch.totalJpy, 6050);
    assert.equal((await ops.call("POST", "ops/payouts", { payDate: "2026-10-30" })).status, 400, "already in a batch");
    const pcsv = (await ops.call("GET", `ops/payouts/${batch.id}/csv`)).body;
    assert.match(pcsv, /Example Hotels Co.,A payout,EXAMPLE HOTELS,,1,6050,0,6050,pending/);
    const bd = (await ops.call("GET", `ops/payouts/${batch.id}`)).body;
    assert.equal(bd.batch.status, "exported");
    assert.equal((await ops.call("POST", `ops/payout-items/${bd.payouts[0].id}/record`, { status: "paid", reference: "TR-1", paidAt: "2026-10-30" })).status, 200);
    assert.match(ops.mails.at(-1).subject, /お振込を完了/);
    assert.equal((await ops.call("GET", `ops/statements/${sid2}`)).body.statement.status, "settled");
    assert.equal((await bill.call("GET", "hotel/settlement?hotel=hA")).body.balance.paid, 6050);
    assert.equal((await ops.call("GET", "ops/payouts")).body.batches[0].status, "recorded");
    assert.equal((await ops.call("POST", `ops/statements/${sid2}/void`, { reason: "x" })).status, 400, "a paid statement cannot be voided");
  } finally { ops.restore(); }
});

test("silence past the dispute window counts as acknowledgement; a late dispute is refused (T18)", async () => {
  const db = openTestDb(); await seed(db);
  await entry(db, { profile: "spA", hotel: "hA", performedOn: "2026-08-01", commission: 4000 });
  const r = await S.closeQuarter(db, { period: "2026-Q3", by: "fin" }, T);
  await S.issueStatement(db, r.statements[0].id, "fin", T);
  assert.equal((await S.getStatement(db, r.statements[0].id)).dispute_deadline_jst, "2026-11-20");
  assert.equal(await S.autoAcknowledge(db, T + 10 * 86400000), 0);
  assert.equal(await S.autoAcknowledge(db, T + 16 * 86400000), 1);
  assert.equal((await S.getStatement(db, r.statements[0].id)).acknowledged_by, "system:deadline");
  await assert.rejects(S.raiseDispute(db, r.statements[0].id, { reason: "late", by: "bill" }, T + 16 * 86400000), (e) => e.code === "deadline_passed");
});
