/** Stage 4: quarterly settlement (docs/PARTNER_PLATFORM_STAGE1.md 4.4).
 *
 *  Close: for every settlement profile, the confirmed ledger entries not yet
 *  on a statement (with no hold) and the adjustments to entries already
 *  stated become a draft statement for the quarter. Tax is rounded once on
 *  the total; the previous statement's carry-over comes in; below the
 *  minimum payout (judged tax-inclusive, before the bank fee) the balance
 *  carries out and nothing is transferred; a negative balance carries too.
 *  A draft can be closed again (it is rebuilt); an issued statement is never
 *  rewritten: a revision voids it and a new version is closed. Issue starts
 *  the dispute window; past it, silence counts as acknowledgement. Payouts
 *  are batched per pay date, exported as CSV and their result recorded by
 *  hand; the bank is never called. */
import { jstDate, randomId, type SqlDb, type SqlStatement } from "@/lib/referral/db";
import { reachesMinimumPayout, taxOnTotal, transferAmount } from "@/lib/referral/money";
import { bad, notFound, str, toCsv } from "./util";

export const PERIOD = /^(\d{4})-Q([1-4])$/;
const pad = (n: number) => String(n).padStart(2, "0");
const now_ = (now?: number) => new Date(now ?? Date.now()).toISOString();
const audit = (actor: string, action: string, targetType: string, targetId: string, reason: string | null, after?: unknown, at = now_()): SqlStatement => ({
  sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason, after_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  params: [randomId(), at, actor, action, targetType, targetId, reason, after === undefined ? null : JSON.stringify(after)],
});

// ---- calendar ----------------------------------------------------------------

export const quarterOf = (jstDay: string) => `${jstDay.slice(0, 4)}-Q${Math.floor((Number(jstDay.slice(5, 7)) - 1) / 3) + 1}`;
export function quarterBounds(period: string): { from: string; to: string } {
  const m = PERIOD.exec(period);
  if (!m) throw bad("bad_period");
  const y = Number(m[1]), q = Number(m[2]);
  const lastDay = new Date(Date.UTC(y, q * 3, 0)).getUTCDate();
  return { from: `${y}-${pad((q - 1) * 3 + 1)}-01`, to: `${y}-${pad(q * 3)}-${pad(lastDay)}` };
}
export const previousPeriod = (period: string) => { const m = PERIOD.exec(period)!; const y = Number(m[1]), q = Number(m[2]); return q === 1 ? `${y - 1}-Q4` : `${y}-Q${q - 1}`; };
/** The last closed quarter as of a JST day: the one before the quarter the day falls in. */
export const lastClosedQuarter = (jstDay: string) => previousPeriod(quarterOf(jstDay));
/** Pay date: the last day of the month after the quarter, moved to the previous weekday when it falls on a weekend. */
export function payDateFor(period: string): string {
  const { to } = quarterBounds(period);
  const y = Number(to.slice(0, 4)), m = Number(to.slice(5, 7));
  const [yy, mm] = m === 12 ? [y + 1, 1] : [y, m + 1];
  let d = new Date(Date.UTC(yy, mm, 0));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() - 86400000);
  return d.toISOString().slice(0, 10);
}
export const addDays = (jstDay: string, n: number) => new Date(Date.parse(`${jstDay}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// ---- close ---------------------------------------------------------------------

interface ProfileRow { id: string; legal_entity_id: string; name: string; min_payout_jpy: number; fee_borne_by: string; bank_fee_jpy: number; dispute_days: number }
interface EntryRow { id: string; reservation_id: string; hotel_id: string | null; settlement_profile_id: string; rate_bp: number | null; base_net_jpy: number; commission_net_jpy: number; performed_on_jst: string | null; experience_slug: string; hotel_ref: string | null }
interface AdjRow { id: string; entry_id: string; delta_net_jpy: number; reason: string; reservation_id: string; hotel_id: string | null; settlement_profile_id: string; performed_on_jst: string | null; experience_slug: string; hotel_ref: string | null; rate_bp: number | null; base_net_jpy: number }

export interface CloseResult { period: string; statements: { id: string; profileId: string; netJpy: number; transferJpy: number; carriedOutJpy: number; items: number; rebuilt: boolean }[]; skipped: string[] }

/** Build or rebuild the draft statements of a quarter. Idempotent: issued statements and their items are left alone. */
export async function closeQuarter(db: SqlDb, input: { period: unknown; by: string }, now = Date.now()): Promise<CloseResult> {
  const period = str(input.period, 8);
  if (!PERIOD.test(period)) throw bad("bad_period");
  const { to } = quarterBounds(period);
  if (to >= jstDate(now)) throw bad("period_open", "四半期が終わってから締めてください");
  const at = now_(now);
  // Entries that can be stated: confirmed, unheld, performed on or before the quarter's end, not on a statement (or on this quarter's draft, which is rebuilt).
  const entries = await db.all<EntryRow>(
    `SELECT e.id, e.reservation_id, e.hotel_id, e.settlement_profile_id, e.rate_bp, e.base_net_jpy, e.commission_net_jpy, e.performed_on_jst, r.experience_slug, r.hotel_ref
       FROM commission_entries e JOIN reservations r ON r.id = e.reservation_id
      WHERE e.status IN ('confirmed','adjusted') AND e.hold_reason IS NULL AND e.settlement_profile_id IS NOT NULL AND e.performed_on_jst IS NOT NULL AND e.performed_on_jst <= ?
        AND (e.statement_id IS NULL OR e.statement_id IN (SELECT id FROM statements WHERE period = ? AND status = 'draft'))
      ORDER BY e.performed_on_jst, r.hotel_ref`, [to, period]);
  // Corrections: adjustments not yet stated whose entry is already on an issued statement.
  const adjustments = await db.all<AdjRow>(
    `SELECT a.id, a.entry_id, a.delta_net_jpy, a.reason, e.reservation_id, e.hotel_id, e.settlement_profile_id, e.performed_on_jst, e.rate_bp, e.base_net_jpy, r.experience_slug, r.hotel_ref
       FROM commission_adjustments a JOIN commission_entries e ON e.id = a.entry_id JOIN reservations r ON r.id = e.reservation_id
      WHERE (a.statement_id IS NULL OR a.statement_id IN (SELECT id FROM statements WHERE period = ? AND status = 'draft'))
        AND e.statement_id IS NOT NULL AND e.statement_id NOT IN (SELECT id FROM statements WHERE period = ? AND status = 'draft')
        AND e.settlement_profile_id IS NOT NULL AND a.created_at <= ?
      ORDER BY a.created_at`, [period, period, at]);
  const profileIds = [...new Set([...entries.map((e) => e.settlement_profile_id), ...adjustments.map((a) => a.settlement_profile_id)])];
  const result: CloseResult = { period, statements: [], skipped: [] };
  for (const profileId of profileIds) {
    const profile = await db.first<ProfileRow>(`SELECT id, legal_entity_id, name, min_payout_jpy, fee_borne_by, bank_fee_jpy, dispute_days FROM settlement_profiles WHERE id = ?`, [profileId]);
    if (!profile) continue;
    const live = await db.first<{ id: string; status: string; version: number }>(`SELECT id, status, version FROM statements WHERE profile_id = ? AND period = ? AND status != 'void' ORDER BY version DESC LIMIT 1`, [profileId, period]);
    if (live && live.status !== "draft") { result.skipped.push(profileId); continue; }
    const voided = await db.first<{ version: number }>(`SELECT MAX(version) AS version FROM statements WHERE profile_id = ? AND period = ?`, [profileId, period]);
    const statements: SqlStatement[] = [];
    let id: string;
    if (live) {
      // Rebuild the draft: release what it held, then fill it again.
      id = live.id;
      statements.push(
        { sql: `UPDATE commission_entries SET statement_id = NULL WHERE statement_id = ?`, params: [id] },
        { sql: `UPDATE commission_adjustments SET statement_id = NULL WHERE statement_id = ?`, params: [id] },
        { sql: `DELETE FROM statement_items WHERE statement_id = ?`, params: [id] },
      );
    } else {
      id = randomId();
      statements.push({ sql: `INSERT INTO statements (id, profile_id, period, version, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'draft', ?, ?)`, params: [id, profileId, period, (voided?.version ?? 0) + 1, at, at] });
    }
    // Items. An unstated entry's amount already includes its adjustments: those are marked as covered, not listed.
    let net = 0, count = 0;
    const mine = entries.filter((e) => e.settlement_profile_id === profileId);
    for (const e of mine) {
      net += e.commission_net_jpy; count++;
      statements.push({ sql: `INSERT INTO statement_items (id, statement_id, kind, entry_id, reservation_id, hotel_id, performed_on_jst, experience_slug, hotel_ref, base_net_jpy, rate_bp, amount_net_jpy) VALUES (?, ?, 'entry', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [randomId(), id, e.id, e.reservation_id, e.hotel_id, e.performed_on_jst, e.experience_slug, e.hotel_ref, e.base_net_jpy, e.rate_bp, e.commission_net_jpy] });
      statements.push({ sql: `UPDATE commission_entries SET statement_id = ? WHERE id = ?`, params: [id, e.id] });
      statements.push({ sql: `UPDATE commission_adjustments SET statement_id = ? WHERE entry_id = ? AND statement_id IS NULL`, params: [id, e.id] });
    }
    for (const a of adjustments.filter((x) => x.settlement_profile_id === profileId)) {
      net += a.delta_net_jpy; count++;
      statements.push({ sql: `INSERT INTO statement_items (id, statement_id, kind, entry_id, adjustment_id, reservation_id, hotel_id, performed_on_jst, experience_slug, hotel_ref, base_net_jpy, rate_bp, amount_net_jpy, note) VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [randomId(), id, a.entry_id, a.id, a.reservation_id, a.hotel_id, a.performed_on_jst, a.experience_slug, a.hotel_ref, a.base_net_jpy, a.rate_bp, a.delta_net_jpy, `前期訂正: ${a.reason}`] });
      statements.push({ sql: `UPDATE commission_adjustments SET statement_id = ? WHERE id = ?`, params: [id, a.id] });
    }
    // Totals: tax once on the total (T09), carry-in from the latest earlier statement that is not void or draft.
    const prev = await db.first<{ carried_out_jpy: number }>(`SELECT carried_out_jpy FROM statements WHERE profile_id = ? AND period < ? AND status IN ('issued','acknowledged','disputed','settled') ORDER BY period DESC, version DESC LIMIT 1`, [profileId, period]);
    const tax = taxOnTotal(net, 1000), gross = net + tax, carriedIn = prev?.carried_out_jpy ?? 0, payable = gross + carriedIn;
    const pays = reachesMinimumPayout(payable, profile.min_payout_jpy);
    const fee = pays && profile.fee_borne_by === "hotel" ? profile.bank_fee_jpy : 0;
    const transfer = pays ? transferAmount(payable, fee) : 0;
    const carriedOut = pays ? 0 : payable;
    statements.push({
      sql: `UPDATE statements SET net_jpy = ?, tax_jpy = ?, gross_jpy = ?, carried_in_jpy = ?, payable_jpy = ?, carried_out_jpy = ?, bank_fee_jpy = ?, transfer_jpy = ?, min_payout_jpy = ?, pay_date_jst = ?, updated_at = ? WHERE id = ?`,
      params: [net, tax, gross, carriedIn, payable, carriedOut, fee, transfer, profile.min_payout_jpy, payDateFor(period), at, id],
    });
    statements.push(audit(input.by, live ? "statement.rebuild" : "statement.close", "statement", id, null, { period, profileId, net, items: count, transfer, carriedOut }, at));
    await db.batch(statements);
    result.statements.push({ id, profileId, netJpy: net, transferJpy: transfer, carriedOutJpy: carriedOut, items: count, rebuilt: !!live });
  }
  return result;
}

// ---- lifecycle ------------------------------------------------------------------

export interface StatementRow { id: string; profile_id: string; period: string; version: number; status: string; net_jpy: number; tax_jpy: number; gross_jpy: number; carried_in_jpy: number; payable_jpy: number; carried_out_jpy: number; bank_fee_jpy: number; transfer_jpy: number; min_payout_jpy: number; pay_date_jst: string | null; dispute_deadline_jst: string | null; issued_at: string | null; acknowledged_at: string | null; acknowledged_by: string | null; settled_at: string | null; voided_at: string | null; void_reason: string | null; supersedes_id: string | null; created_at: string; updated_at: string }

export async function getStatement(db: SqlDb, id: string): Promise<StatementRow> {
  const s = await db.first<StatementRow>(`SELECT * FROM statements WHERE id = ?`, [id]);
  if (!s) throw notFound();
  return s;
}

/** draft → issued: the dispute window opens; the partner is told by the caller. */
export async function issueStatement(db: SqlDb, id: string, by: string, now = Date.now()): Promise<StatementRow> {
  const s = await getStatement(db, id);
  if (s.status !== "draft") throw bad("not_draft");
  const profile = await db.first<{ dispute_days: number }>(`SELECT dispute_days FROM settlement_profiles WHERE id = ?`, [s.profile_id]);
  const at = now_(now), deadline = addDays(jstDate(now), profile?.dispute_days ?? 14);
  await db.batch([
    { sql: `UPDATE statements SET status = 'issued', issued_at = ?, issued_by = ?, dispute_deadline_jst = ?, updated_at = ? WHERE id = ?`, params: [at, by, deadline, at, id] },
    audit(by, "statement.issue", "statement", id, null, { deadline }, at),
  ]);
  return getStatement(db, id);
}

/** The partner's confirmation (a billing user), or the system's once the window has passed. */
export async function acknowledgeStatement(db: SqlDb, id: string, by: string, now = Date.now()): Promise<StatementRow> {
  const s = await getStatement(db, id);
  if (s.status !== "issued") throw bad("not_issued");
  const at = now_(now);
  await db.batch([
    { sql: `UPDATE statements SET status = 'acknowledged', acknowledged_at = ?, acknowledged_by = ?, updated_at = ? WHERE id = ?`, params: [at, by, at, id] },
    audit(by, "statement.acknowledge", "statement", id, null, undefined, at),
  ]);
  return getStatement(db, id);
}

/** Issued statements whose dispute window closed without a word become acknowledged (E-1 default). */
export async function autoAcknowledge(db: SqlDb, now = Date.now()): Promise<number> {
  const today = jstDate(now);
  const due = await db.all<{ id: string }>(`SELECT id FROM statements WHERE status = 'issued' AND dispute_deadline_jst IS NOT NULL AND dispute_deadline_jst < ?`, [today]);
  for (const s of due) await acknowledgeStatement(db, s.id, "system:deadline", now);
  return due.length;
}

export async function raiseDispute(db: SqlDb, id: string, input: { reason: unknown; itemId?: unknown; by: string }, now = Date.now()): Promise<{ disputeId: string }> {
  const s = await getStatement(db, id);
  if (s.status !== "issued" && s.status !== "acknowledged") throw bad("not_disputable");
  if (s.dispute_deadline_jst && jstDate(now) > s.dispute_deadline_jst) throw bad("deadline_passed", "異議申立ての期限を過ぎています");
  const reason = str(input.reason, 1000);
  if (!reason) throw bad("reason_required");
  const itemId = str(input.itemId, 64) || null;
  if (itemId) { const it = await db.first<{ id: string }>(`SELECT id FROM statement_items WHERE id = ? AND statement_id = ?`, [itemId, id]); if (!it) throw bad("bad_item"); }
  const did = randomId(), at = now_(now);
  await db.batch([
    { sql: `INSERT INTO statement_disputes (id, statement_id, item_id, raised_by, raised_at, reason) VALUES (?, ?, ?, ?, ?, ?)`, params: [did, id, itemId, input.by, at, reason] },
    { sql: `UPDATE statements SET status = 'disputed', updated_at = ? WHERE id = ?`, params: [at, id] },
    audit(input.by, "statement.dispute", "statement", id, reason, { disputeId: did, itemId }, at),
  ]);
  return { disputeId: did };
}

/** Operations answers a dispute. Upheld: the figures are corrected through the ledger (adjustments, attendance, lines) and the
 *  statement is revised with `voidStatement` + a new close; rejected: the statement goes back to issued, window unchanged. */
export async function resolveDispute(db: SqlDb, disputeId: string, input: { outcome: unknown; resolution: unknown; by: string }, now = Date.now()) {
  const d = await db.first<{ id: string; statement_id: string; status: string }>(`SELECT id, statement_id, status FROM statement_disputes WHERE id = ?`, [disputeId]);
  if (!d) throw notFound();
  if (d.status !== "open") throw bad("already_resolved");
  const outcome = str(input.outcome, 10);
  if (outcome !== "upheld" && outcome !== "rejected") throw bad("bad_outcome");
  const resolution = str(input.resolution, 1000);
  if (!resolution) throw bad("resolution_required");
  const at = now_(now);
  const open = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM statement_disputes WHERE statement_id = ? AND status = 'open' AND id != ?`, [d.statement_id, d.id]);
  await db.batch([
    { sql: `UPDATE statement_disputes SET status = ?, resolution = ?, resolved_by = ?, resolved_at = ? WHERE id = ?`, params: [outcome, resolution, input.by, at, d.id] },
    ...(Number(open?.n ?? 0) === 0 && outcome === "rejected" ? [{ sql: `UPDATE statements SET status = 'issued', updated_at = ? WHERE id = ? AND status = 'disputed'`, params: [at, d.statement_id] }] : []),
    audit(input.by, "dispute.resolve", "statement", d.statement_id, resolution, { disputeId: d.id, outcome }, at),
  ]);
}

/** Void a statement that was not settled, releasing its entries and adjustments for the next close (a revision). */
export async function voidStatement(db: SqlDb, id: string, input: { reason: unknown; by: string }, now = Date.now()) {
  const s = await getStatement(db, id);
  if (s.status === "settled" || s.status === "void") throw bad("not_voidable");
  const paid = await db.first<{ id: string }>(`SELECT p.id FROM payouts p WHERE p.status != 'failed' AND p.statement_ids_json LIKE ?`, [`%"${id}"%`]);
  if (paid) throw bad("in_payout", "支払バッチに含まれています。先に支払を失敗または保留にしてください");
  const reason = str(input.reason, 500);
  if (!reason) throw bad("reason_required");
  const at = now_(now);
  await db.batch([
    { sql: `UPDATE commission_entries SET statement_id = NULL WHERE statement_id = ?`, params: [id] },
    { sql: `UPDATE commission_adjustments SET statement_id = NULL WHERE statement_id = ?`, params: [id] },
    { sql: `UPDATE statements SET status = 'void', voided_at = ?, voided_by = ?, void_reason = ?, updated_at = ? WHERE id = ?`, params: [at, input.by, reason, at, id] },
    audit(input.by, "statement.void", "statement", id, reason, undefined, at),
  ]);
}

// ---- reading -------------------------------------------------------------------

export interface StatementItemRow { id: string; kind: string; entry_id: string; adjustment_id: string | null; reservation_id: string; hotel_id: string | null; hotel_name?: string | null; performed_on_jst: string | null; experience_slug: string | null; hotel_ref: string | null; base_net_jpy: number; rate_bp: number | null; amount_net_jpy: number; note: string | null }

export async function statementDetail(db: SqlDb, id: string) {
  const statement = await getStatement(db, id);
  const [profile, entity, items, disputes, payout] = await Promise.all([
    db.first<{ id: string; name: string; payee_name: string | null; payee_address: string | null; bank_details_masked: string | null; min_payout_jpy: number; fee_borne_by: string; dispute_days: number }>(`SELECT id, name, payee_name, payee_address, bank_details_masked, min_payout_jpy, fee_borne_by, dispute_days FROM settlement_profiles WHERE id = ?`, [statement.profile_id]),
    db.first<{ name: string; registration_number: string | null; registration_status: string; address: string | null; partner_type: string }>(`SELECT le.name, le.registration_number, le.registration_status, le.address, le.partner_type FROM settlement_profiles p JOIN partner_legal_entities le ON le.id = p.legal_entity_id WHERE p.id = ?`, [statement.profile_id]),
    db.all<StatementItemRow>(`SELECT i.*, h.name AS hotel_name FROM statement_items i LEFT JOIN hotels h ON h.id = i.hotel_id WHERE i.statement_id = ? ORDER BY i.performed_on_jst, i.hotel_ref, i.kind`, [id]),
    db.all<{ id: string; item_id: string | null; raised_by: string; raised_at: string; reason: string; status: string; resolution: string | null; resolved_at: string | null }>(`SELECT id, item_id, raised_by, raised_at, reason, status, resolution, resolved_at FROM statement_disputes WHERE statement_id = ? ORDER BY raised_at`, [id]),
    db.first<{ id: string; status: string; paid_at: string | null; reference: string | null; batch_id: string; pay_date_jst: string }>(`SELECT p.id, p.status, p.paid_at, p.reference, p.batch_id, b.pay_date_jst FROM payouts p JOIN payout_batches b ON b.id = p.batch_id WHERE p.statement_ids_json LIKE ? AND p.status != 'failed' ORDER BY b.created_at DESC LIMIT 1`, [`%"${id}"%`]),
  ]);
  return { statement, profile, entity, items, disputes, payout, periodBounds: quarterBounds(statement.period) };
}

export async function statementsOfProfiles(db: SqlDb, profileIds: string[]): Promise<StatementRow[]> {
  if (!profileIds.length) return [];
  return db.all<StatementRow>(`SELECT * FROM statements WHERE profile_id IN (${profileIds.map(() => "?").join(",")}) AND status != 'draft' ORDER BY period DESC, version DESC`, profileIds);
}

export async function opsSettlementOverview(db: SqlDb, now = Date.now()) {
  const [statements, profiles, unstated, openDisputes] = await Promise.all([
    db.all<StatementRow & { profile_name: string; entity_name: string }>(`SELECT s.*, p.name AS profile_name, le.name AS entity_name FROM statements s JOIN settlement_profiles p ON p.id = s.profile_id JOIN partner_legal_entities le ON le.id = p.legal_entity_id ORDER BY s.period DESC, le.name, s.version DESC`),
    db.all<{ id: string; name: string }>(`SELECT id, name FROM settlement_profiles`),
    db.first<{ n: number; net: number | null }>(`SELECT COUNT(*) AS n, SUM(commission_net_jpy) AS net FROM commission_entries WHERE status IN ('confirmed','adjusted') AND hold_reason IS NULL AND statement_id IS NULL`),
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM statement_disputes WHERE status = 'open'`),
  ]);
  const today = jstDate(now);
  return { today, suggestedPeriod: lastClosedQuarter(today), statements, profiles: profiles.length, unstated: { count: Number(unstated?.n ?? 0), netJpy: Number(unstated?.net ?? 0) }, openDisputes: Number(openDisputes?.n ?? 0) };
}

export function statementCsv(d: Awaited<ReturnType<typeof statementDetail>>): string {
  const rows = d.items.map((i) => [i.kind === "entry" ? "紹介料" : "前期訂正", i.performed_on_jst ?? "", i.hotel_ref ?? "", i.experience_slug ?? "", i.hotel_name ?? "", i.base_net_jpy, i.rate_bp === null ? "" : (i.rate_bp / 100).toFixed(2) + "%", i.amount_net_jpy, i.note ?? ""]);
  const s = d.statement;
  rows.push([], ["税抜合計", "", "", "", "", "", "", s.net_jpy, ""], ["消費税", "", "", "", "", "", "", s.tax_jpy, ""], ["税込合計", "", "", "", "", "", "", s.gross_jpy, ""], ["繰越（前期から）", "", "", "", "", "", "", s.carried_in_jpy, ""], ["支払対象額", "", "", "", "", "", "", s.payable_jpy, ""], ["次回繰越", "", "", "", "", "", "", s.carried_out_jpy, ""], ["振込手数料", "", "", "", "", "", "", s.bank_fee_jpy, ""], ["振込額", "", "", "", "", "", "", s.transfer_jpy, ""]);
  return toCsv(["区分", "実施日", "照合番号", "体験", "紹介元", "対象額（税抜）", "料率", "金額（税抜）", "備考"], rows);
}

// ---- payouts --------------------------------------------------------------------

export async function createPayoutBatch(db: SqlDb, input: { payDate: unknown; by: string }, now = Date.now()) {
  const payDate = str(input.payDate, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payDate)) throw bad("bad_date");
  // Statements that are due and not already in a live payout.
  const due = await db.all<{ id: string; profile_id: string; gross_jpy: number; bank_fee_jpy: number; transfer_jpy: number; payable_jpy: number }>(
    `SELECT s.id, s.profile_id, s.gross_jpy, s.bank_fee_jpy, s.transfer_jpy, s.payable_jpy FROM statements s
      WHERE s.status IN ('issued','acknowledged') AND s.transfer_jpy > 0 AND s.pay_date_jst <= ?
        AND NOT EXISTS (SELECT 1 FROM payouts p WHERE p.status IN ('pending','paid','held') AND p.statement_ids_json LIKE '%"' || s.id || '"%')
      ORDER BY s.profile_id, s.period`, [payDate]);
  if (!due.length) throw bad("nothing_due", "支払対象の精算書がありません");
  const id = randomId(), at = now_(now);
  const statements: SqlStatement[] = [{ sql: `INSERT INTO payout_batches (id, pay_date_jst, status, created_by, created_at) VALUES (?, ?, 'prepared', ?, ?)`, params: [id, payDate, input.by, at] }];
  const byProfile = new Map<string, typeof due>();
  for (const s of due) byProfile.set(s.profile_id, [...(byProfile.get(s.profile_id) ?? []), s]);
  let count = 0, total = 0;
  for (const [profileId, list] of byProfile) {
    const payable = list.reduce((a, s) => a + s.payable_jpy, 0), fee = list.reduce((a, s) => a + s.bank_fee_jpy, 0), transfer = list.reduce((a, s) => a + s.transfer_jpy, 0);
    statements.push({ sql: `INSERT INTO payouts (id, batch_id, profile_id, statement_ids_json, gross_jpy, bank_fee_jpy, transfer_jpy, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`, params: [randomId(), id, profileId, JSON.stringify(list.map((s) => s.id)), payable, fee, transfer] });
    count++; total += transfer;
  }
  statements.push(audit(input.by, "payout_batch.create", "payout_batch", id, null, { payDate, payouts: count, total }, at));
  await db.batch(statements);
  return { id, payouts: count, totalJpy: total };
}

export async function payoutBatchDetail(db: SqlDb, id: string) {
  const batch = await db.first<{ id: string; pay_date_jst: string; status: string; created_by: string; created_at: string; exported_at: string | null; recorded_at: string | null }>(`SELECT * FROM payout_batches WHERE id = ?`, [id]);
  if (!batch) throw notFound();
  const payouts = await db.all<{ id: string; profile_id: string; profile_name: string; entity_name: string; payee_name: string | null; bank_details_masked: string | null; statement_ids_json: string; gross_jpy: number; bank_fee_jpy: number; transfer_jpy: number; status: string; paid_at: string | null; reference: string | null; note: string | null }>(
    `SELECT p.*, sp.name AS profile_name, sp.payee_name, sp.bank_details_masked, le.name AS entity_name FROM payouts p JOIN settlement_profiles sp ON sp.id = p.profile_id JOIN partner_legal_entities le ON le.id = sp.legal_entity_id WHERE p.batch_id = ? ORDER BY le.name`, [id]);
  return { batch, payouts: payouts.map((p) => ({ ...p, statementIds: JSON.parse(p.statement_ids_json) as string[] })) };
}

export async function payoutBatches(db: SqlDb) {
  return db.all<{ id: string; pay_date_jst: string; status: string; created_at: string; payouts: number; total_jpy: number | null; paid: number }>(
    `SELECT b.*, COUNT(p.id) AS payouts, SUM(p.transfer_jpy) AS total_jpy, SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) AS paid FROM payout_batches b LEFT JOIN payouts p ON p.batch_id = b.id GROUP BY b.id ORDER BY b.created_at DESC`);
}

/** The transfer list for the bank's own tool: payee, masked account, amount. No bank is called. */
export async function payoutCsv(db: SqlDb, id: string, by: string, now = Date.now()): Promise<string> {
  const d = await payoutBatchDetail(db, id);
  const at = now_(now);
  await db.batch([
    { sql: `UPDATE payout_batches SET status = CASE WHEN status = 'prepared' THEN 'exported' ELSE status END, exported_at = COALESCE(exported_at, ?) WHERE id = ?`, params: [at, id] },
    audit(by, "payout_batch.export", "payout_batch", id, null, undefined, at),
  ]);
  return toCsv(["支払日", "契約先", "精算設定", "振込先名義", "口座（マスク）", "精算書数", "支払対象額（税込）", "振込手数料", "振込額", "状態", "参照番号"],
    d.payouts.map((p) => [d.batch.pay_date_jst, p.entity_name, p.profile_name, p.payee_name ?? "", p.bank_details_masked ?? "", p.statementIds.length, p.gross_jpy, p.bank_fee_jpy, p.transfer_jpy, p.status, p.reference ?? ""]));
}

/** What the bank said: paid (the statements settle), failed (they return to the next batch) or held. */
export async function recordPayout(db: SqlDb, payoutId: string, input: { status: unknown; reference?: unknown; paidAt?: unknown; note?: unknown; by: string }, now = Date.now()) {
  const p = await db.first<{ id: string; batch_id: string; statement_ids_json: string; status: string }>(`SELECT id, batch_id, statement_ids_json, status FROM payouts WHERE id = ?`, [payoutId]);
  if (!p) throw notFound();
  const status = str(input.status, 10);
  if (!["paid", "failed", "held"].includes(status)) throw bad("bad_status");
  if (p.status === "paid") throw bad("already_paid");
  const at = now_(now), paidAt = str(input.paidAt, 10) || jstDate(now);
  const ids = JSON.parse(p.statement_ids_json) as string[];
  const statements: SqlStatement[] = [
    { sql: `UPDATE payouts SET status = ?, reference = ?, note = ?, paid_at = ?, recorded_by = ? WHERE id = ?`, params: [status, str(input.reference, 100) || null, str(input.note, 500) || null, status === "paid" ? paidAt : null, input.by, payoutId] },
  ];
  if (status === "paid") for (const sid of ids) statements.push({ sql: `UPDATE statements SET status = 'settled', settled_at = ?, updated_at = ? WHERE id = ? AND status IN ('issued','acknowledged','disputed')`, params: [at, at, sid] });
  statements.push(audit(input.by, "payout.record", "payout", payoutId, str(input.note, 500) || null, { status, statements: ids }, at));
  const left = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM payouts WHERE batch_id = ? AND status = 'pending' AND id != ?`, [p.batch_id, payoutId]);
  if (Number(left?.n ?? 0) === 0) statements.push({ sql: `UPDATE payout_batches SET status = 'recorded', recorded_at = ? WHERE id = ?`, params: [at, p.batch_id] });
  await db.batch(statements);
}

/** Paid-out total for the partner's balance line. */
export async function paidTotalForHotel(db: SqlDb, hotelId: string): Promise<number> {
  const r = await db.first<{ n: number | null }>(
    `SELECT SUM(s.gross_jpy) AS n FROM statements s WHERE s.status = 'settled' AND s.profile_id IN (SELECT profile_id FROM settlement_profile_hotels WHERE hotel_id = ?)`, [hotelId]);
  return Number(r?.n ?? 0);
}
