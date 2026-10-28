/** Reservations, their lines, the fixed attribution and the commission entry.
 *
 *  A reservation is written here in the same batch as its referral, so the
 *  attribution can never drift from the booking it belongs to (要件 7). The
 *  commission entry is kept current from the lines (estimated → pending →
 *  confirmed); once confirmed, every change is a dated adjustment. */
import { jstDate, randomId, type SqlDb, type SqlStatement } from "./db";
import { type ReferralContext } from "./links";
import { allocateProportionally, commissionNet, netFromGross } from "./money";

export type LineKind = "base" | "addon" | "arrangement" | "onsite";
export interface NewLine { kind: LineKind; description: string; commissionable: boolean; taxRateBp?: number; quantity?: number; grossJpy: number; discountJpy?: number }
export interface NewReservation {
  requestId: string; externalRef?: string; flow: "contact" | "experience" | "golf"; experienceSlug: string;
  experienceDate?: string; guests?: number; lang?: string; lines: NewLine[];
  /** True when the site cannot state the chargeable amount yet (quotes, enquiries). */
  amountPending?: boolean;
}
export interface PolicyRow { id: string; rate_bp: number; tax_rate_bp: number; version: number; referral_enabled: number }
export type ReferralStatus = "attributed" | "rate_missing" | "payee_missing";

/** The commission terms in force for an experience at `now` (latest valid_from). */
export async function policyFor(db: SqlDb, slug: string, now = Date.now()): Promise<PolicyRow | null> {
  const row = await db.first<PolicyRow>(
    `SELECT id, rate_bp, tax_rate_bp, version, referral_enabled FROM experience_referral_policies
      WHERE experience_slug = ? AND valid_from <= ? ORDER BY valid_from DESC, version DESC LIMIT 1`,
    [slug, new Date(now).toISOString()]);
  return row && row.referral_enabled ? row : null;
}

export interface CreateResult { id: string; created: boolean; referral?: ReferralStatus }

/** "R-7KX4QM": what a hotel sees for a booking. No vowels or look-alikes, never an internal id. */
export function newHotelRef(): string {
  const alphabet = "23456789BCDFGHJKMNPQRSTVWXZ";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "R-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Create the reservation (idempotent on requestId) with its lines, and fix
 *  the referral it arrived with, all in one batch. */
export async function createReservation(db: SqlDb, r: NewReservation, ref: ReferralContext | null, now = Date.now()): Promise<CreateResult> {
  const existing = await db.first<{ id: string }>(`SELECT id FROM reservations WHERE request_id = ?`, [r.requestId]);
  if (existing) return { id: existing.id, created: false };
  const id = randomId(), at = new Date(now).toISOString();
  const policy = ref ? await policyFor(db, r.experienceSlug, now) : null;
  const statements: SqlStatement[] = [{
    sql: `INSERT INTO reservations (id, request_id, external_ref, flow, experience_slug, experience_date, guests, lang, status, payment_status, amount_status, created_at, updated_at, hotel_ref)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'provisional', 'unpaid', ?, ?, ?, ?)`,
    params: [id, r.requestId, r.externalRef ?? null, r.flow, r.experienceSlug, r.experienceDate ?? null, r.guests ?? null, r.lang ?? null, r.amountPending || r.lines.length === 0 ? "pending" : "known", at, at, newHotelRef()],
  }];
  r.lines.forEach((l, i) => {
    const tax = l.taxRateBp ?? policy?.tax_rate_bp ?? 1000;
    const discount = l.discountJpy ?? 0;
    statements.push({
      sql: `INSERT INTO reservation_lines (id, reservation_id, position, kind, description, commissionable, tax_rate_bp, quantity, gross_jpy, discount_jpy, refunded_gross_jpy, net_jpy, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'site')`,
      params: [randomId(), id, i, l.kind, l.description, l.commissionable ? 1 : 0, tax, l.quantity ?? 1, l.grossJpy, discount, netFromGross(l.grossJpy - discount, tax)],
    });
  });
  let referral: ReferralStatus | undefined;
  if (ref) {
    referral = !policy ? "rate_missing" : ref.hotelId === null && !ref.chainProfileId ? "payee_missing" : "attributed";
    statements.push({
      sql: `INSERT INTO reservation_referrals (reservation_id, hotel_id, link_id, session_id, medium, basis, fixed_at, policy_id, policy_version, rate_bp, status)
            VALUES (?, ?, ?, ?, ?, 'cookie', ?, ?, ?, ?, ?)`,
      params: [id, ref.hotelId, ref.linkId, ref.sessionId, ref.medium, at, policy?.id ?? null, policy?.version ?? null, policy?.rate_bp ?? null, referral],
    });
    const commissionable = r.lines.filter((l) => l.commissionable).map((l) => ({ netJpy: netFromGross(l.grossJpy - (l.discountJpy ?? 0), l.taxRateBp ?? policy?.tax_rate_bp ?? 1000), rateBp: policy?.rate_bp ?? 0 }));
    statements.push({
      sql: `INSERT INTO commission_entries (id, reservation_id, hotel_id, settlement_profile_id, rate_bp, base_net_jpy, commission_net_jpy, tax_rate_bp, status, hold_reason, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'estimated', ?, ?, ?)`,
      params: [randomId(), id, ref.hotelId, ref.chainProfileId, policy?.rate_bp ?? null,
        commissionable.reduce((s, l) => s + l.netJpy, 0), policy ? commissionNet(commissionable) : 0, policy?.tax_rate_bp ?? 1000,
        referral === "attributed" ? null : referral, at, at],
    });
  }
  await db.batch(statements);
  return { id, created: true, referral };
}

interface LineRow { id: string; kind: LineKind; commissionable: number; tax_rate_bp: number; gross_jpy: number; discount_jpy: number; refunded_gross_jpy: number; net_jpy: number }
interface ReservationRow { id: string; status: string; payment_status: string; amount_status: string; experience_date: string | null; stripe_payment_intent: string | null }
interface EntryRow { id: string; hotel_id: string | null; settlement_profile_id: string | null; rate_bp: number | null; base_net_jpy: number; commission_net_jpy: number; status: string; hold_reason: string | null; performed_on_jst: string | null }

/** Recompute the lines' net amounts and the commission entry from the current
 *  facts: discounts, refunds, payment, disputes, attendance and the settlement
 *  profile. The one place the entry's status is decided. */
export async function recomputeCommission(db: SqlDb, reservationId: string, actor = "system", now = Date.now()): Promise<EntryRow | null> {
  const [res, lines, ref, entry, attendance, openDispute, pendingRefund] = await Promise.all([
    db.first<ReservationRow>(`SELECT id, status, payment_status, amount_status, experience_date, stripe_payment_intent FROM reservations WHERE id = ?`, [reservationId]),
    db.all<LineRow>(`SELECT id, kind, commissionable, tax_rate_bp, gross_jpy, discount_jpy, refunded_gross_jpy, net_jpy FROM reservation_lines WHERE reservation_id = ? ORDER BY position`, [reservationId]),
    db.first<{ hotel_id: string | null; rate_bp: number | null; status: string }>(`SELECT hotel_id, rate_bp, status FROM reservation_referrals WHERE reservation_id = ?`, [reservationId]),
    db.first<EntryRow>(`SELECT id, hotel_id, settlement_profile_id, rate_bp, base_net_jpy, commission_net_jpy, status, hold_reason, performed_on_jst FROM commission_entries WHERE reservation_id = ?`, [reservationId]),
    db.first<{ performed_on_jst: string; performed_at: string }>(`SELECT performed_on_jst, performed_at FROM attendances WHERE reservation_id = ? AND revoked_at IS NULL`, [reservationId]),
    db.first<{ id: string }>(`SELECT id FROM disputes WHERE reservation_id = ? AND closed_at IS NULL`, [reservationId]),
    db.first<{ id: string }>(`SELECT id FROM refunds WHERE reservation_id = ? AND allocation_status = 'pending'`, [reservationId]),
  ]);
  if (!res || !entry || !ref) return entry;
  const at = new Date(now).toISOString();
  const statements: SqlStatement[] = [];
  // Lines: net after discount and refund, per line and its own tax rate.
  const nets = lines.map((l) => {
    const net = netFromGross(Math.max(0, l.gross_jpy - l.discount_jpy - l.refunded_gross_jpy), l.tax_rate_bp);
    if (net !== l.net_jpy) statements.push({ sql: `UPDATE reservation_lines SET net_jpy = ? WHERE id = ?`, params: [net, l.id] });
    return { ...l, net };
  });
  const rate = ref.rate_bp ?? 0;
  const commissionable = nets.filter((l) => l.commissionable);
  const baseNet = commissionable.reduce((s, l) => s + l.net, 0);
  const voided = ref.status === "removed" || res.status === "cancelled" || res.status === "no_show";
  const commission = voided || ref.rate_bp === null ? 0 : commissionNet(commissionable.map((l) => ({ netJpy: l.net, rateBp: rate })));

  // The settlement profile in force on the day the experience took place.
  let profileId = entry.settlement_profile_id, profileVersion: number | null = null;
  if (attendance && ref.hotel_id) {
    const p = await db.first<{ id: string; version: number }>(
      `SELECT p.id, p.version FROM settlement_profile_hotels ph JOIN settlement_profiles p ON p.id = ph.profile_id
        WHERE ph.hotel_id = ? AND ph.valid_from <= ? AND (ph.valid_to IS NULL OR ph.valid_to > ?) AND p.valid_from <= ? AND (p.valid_to IS NULL OR p.valid_to > ?)
        ORDER BY ph.valid_from DESC LIMIT 1`, [ref.hotel_id, attendance.performed_on_jst, attendance.performed_on_jst, attendance.performed_on_jst, attendance.performed_on_jst]);
    if (p) { profileId = p.id; profileVersion = p.version; }
  }

  // Status and hold reason (要件 9: 確定条件). A hold applies whatever the
  // status: a confirmed entry with an unallocated refund stays confirmed in
  // amount but is kept out of any payout until operations clear it.
  const reasons: string[] = [];
  if (ref.status !== "attributed" && ref.status !== "corrected") reasons.push(ref.status);
  if (openDispute) reasons.push("dispute_open");
  if (pendingRefund) reasons.push("refund_allocation");
  if (attendance) {
    if (Date.parse(attendance.performed_at) > now) reasons.push("performed_in_future");
    if (res.amount_status !== "known") reasons.push("amount_pending");
    if (!["paid", "partially_refunded", "refunded"].includes(res.payment_status)) reasons.push("payment_incomplete");
    if (!profileId) reasons.push("payee_missing");
  }
  const locked = entry.status === "confirmed" || entry.status === "adjusted";
  let status: string;
  if (voided) status = locked ? "adjusted" : "voided";
  else if (locked) status = commission !== entry.commission_net_jpy ? "adjusted" : entry.status;
  else if (!attendance) status = "estimated";
  else status = reasons.length ? "pending" : "confirmed";
  const hold = reasons.length ? reasons.join(",") : null;
  // Once confirmed, a change in the amount is an adjustment, never a silent rewrite.
  if (locked && commission !== entry.commission_net_jpy) {
    statements.push({
      sql: `INSERT INTO commission_adjustments (id, entry_id, delta_net_jpy, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      params: [randomId(), entry.id, commission - entry.commission_net_jpy, voided ? "voided" : "recomputed", actor, at],
    });
  }
  statements.push({
    sql: `UPDATE commission_entries SET base_net_jpy = ?, commission_net_jpy = ?, rate_bp = ?, status = ?, hold_reason = ?, settlement_profile_id = ?, settlement_profile_version = COALESCE(?, settlement_profile_version),
            performed_on_jst = ?, confirmed_at = CASE WHEN ? = 'confirmed' AND confirmed_at IS NULL THEN ? ELSE confirmed_at END, confirmed_by = CASE WHEN ? = 'confirmed' AND confirmed_by IS NULL THEN ? ELSE confirmed_by END, updated_at = ? WHERE id = ?`,
    params: [baseNet, commission, ref.rate_bp, status, hold, profileId, profileVersion, attendance?.performed_on_jst ?? null, status, at, status, actor, at, entry.id],
  });
  await db.batch(statements);
  return db.first<EntryRow>(`SELECT id, hotel_id, settlement_profile_id, rate_bp, base_net_jpy, commission_net_jpy, status, hold_reason, performed_on_jst FROM commission_entries WHERE id = ?`, [entry.id]);
}

export interface PaymentFacts { eventId: string; sessionId?: string | null; paymentIntent?: string | null; clientReferenceId?: string | null; amountTotal: number; amountSubtotal?: number | null; amountDiscount?: number; amountTax?: number; paymentStatus: string; livemode?: boolean; occurredAt: string }

/** A Stripe payment for the reservation: record it, spread a discount over
 *  the commissionable lines, check the total against the lines, and move the
 *  payment status forward (never backwards). */
export async function applyPayment(db: SqlDb, reservationId: string, p: PaymentFacts, now = Date.now()): Promise<void> {
  const at = new Date(now).toISOString();
  const [res, lines] = await Promise.all([
    db.first<ReservationRow>(`SELECT id, status, payment_status, amount_status, experience_date, stripe_payment_intent FROM reservations WHERE id = ?`, [reservationId]),
    db.all<LineRow>(`SELECT id, kind, commissionable, tax_rate_bp, gross_jpy, discount_jpy, refunded_gross_jpy, net_jpy FROM reservation_lines WHERE reservation_id = ? ORDER BY position`, [reservationId]),
  ]);
  if (!res) return;
  const statements: SqlStatement[] = [{
    sql: `INSERT INTO payments (id, reservation_id, stripe_event_id, stripe_session_id, stripe_payment_intent, client_reference_id, amount_total_jpy, amount_subtotal_jpy, amount_discount_jpy, amount_tax_jpy, payment_status, livemode, occurred_at, received_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(stripe_event_id) DO NOTHING`,
    params: [randomId(), reservationId, p.eventId, p.sessionId ?? null, p.paymentIntent ?? null, p.clientReferenceId ?? null, p.amountTotal, p.amountSubtotal ?? null, p.amountDiscount ?? 0, p.amountTax ?? 0, p.paymentStatus, p.livemode === false ? 0 : 1, p.occurredAt, at],
  }];
  if (p.paymentStatus === "paid") {
    // Discounts come from Stripe (promotion codes); spread them over the charged lines by gross weight.
    const charged = lines.filter((l) => l.kind !== "onsite");
    const discount = p.amountDiscount ?? 0;
    if (discount > 0 && charged.length) {
      const shares = allocateProportionally(discount, charged.map((l) => l.gross_jpy));
      charged.forEach((l, i) => { if (shares[i] !== l.discount_jpy) statements.push({ sql: `UPDATE reservation_lines SET discount_jpy = ?, source = 'stripe' WHERE id = ?`, params: [shares[i], l.id] }); });
    }
    const expected = charged.reduce((s, l) => s + l.gross_jpy, 0) - discount;
    // A total that is not the lines' total means the breakdown is unknown: hold, do not guess (要件 8.1).
    const amountStatus = charged.length && expected === p.amountTotal ? "known" : "pending";
    const paymentStatus = ["unpaid", "partial"].includes(res.payment_status) ? "paid" : res.payment_status;
    statements.push({
      sql: `UPDATE reservations SET payment_status = ?, amount_status = ?, stripe_session_id = COALESCE(?, stripe_session_id), stripe_payment_intent = COALESCE(?, stripe_payment_intent), updated_at = ? WHERE id = ?`,
      params: [paymentStatus, amountStatus, p.sessionId ?? null, p.paymentIntent ?? null, at, reservationId],
    });
  }
  await db.batch(statements);
  // A refund that arrived before its payment (order is not guaranteed) is attached now.
  if (p.paymentIntent) {
    const orphans = await db.all<{ id: string; amount_delta_jpy: number }>(`SELECT id, amount_delta_jpy FROM refunds WHERE reservation_id IS NULL AND stripe_payment_intent = ?`, [p.paymentIntent]);
    for (const o of orphans) {
      await db.run(`UPDATE refunds SET reservation_id = ? WHERE id = ?`, [reservationId, o.id]);
      await allocateRefund(db, reservationId, o.id, o.amount_delta_jpy, now);
    }
  }
  await recomputeCommission(db, reservationId, "stripe", now);
}

/** Spread a refund over the lines when that is unambiguous (one charged line);
 *  otherwise leave it for operations to allocate (要件 8.4). */
export async function allocateRefund(db: SqlDb, reservationId: string, refundId: string, deltaJpy: number, now = Date.now()): Promise<"allocated" | "pending"> {
  const at = new Date(now).toISOString();
  const lines = await db.all<LineRow>(`SELECT id, kind, commissionable, tax_rate_bp, gross_jpy, discount_jpy, refunded_gross_jpy, net_jpy FROM reservation_lines WHERE reservation_id = ? AND kind != 'onsite' ORDER BY position`, [reservationId]);
  const charged = lines.reduce((s, l) => s + l.gross_jpy - l.discount_jpy, 0);
  const refunded = lines.reduce((s, l) => s + l.refunded_gross_jpy, 0);
  const statements: SqlStatement[] = [];
  if (lines.length === 1 || (deltaJpy >= charged - refunded && charged > 0)) {
    // One line, or a refund of everything that is left: allocate in proportion to what each line still holds.
    const open = lines.map((l) => Math.max(0, l.gross_jpy - l.discount_jpy - l.refunded_gross_jpy));
    const shares = allocateProportionally(Math.min(deltaJpy, open.reduce((s, x) => s + x, 0)), open);
    lines.forEach((l, i) => statements.push({ sql: `UPDATE reservation_lines SET refunded_gross_jpy = refunded_gross_jpy + ? WHERE id = ?`, params: [shares[i], l.id] }));
    statements.push({ sql: `UPDATE refunds SET allocation_status = 'allocated', allocated_by = 'system', allocated_at = ? WHERE id = ?`, params: [at, refundId] });
    const total = refunded + deltaJpy;
    statements.push({ sql: `UPDATE reservations SET payment_status = ?, updated_at = ? WHERE id = ?`, params: [total >= charged ? "refunded" : "partially_refunded", at, reservationId] });
    await db.batch(statements);
    return "allocated";
  }
  await db.run(`UPDATE reservations SET payment_status = 'partially_refunded', updated_at = ? WHERE id = ?`, [at, reservationId]);
  return "pending";
}

export interface RefundFacts { eventId: string; chargeId?: string | null; paymentIntent?: string | null; amountRefundedTotal: number; occurredAt: string }

/** A Stripe refund: the event carries the cumulative refunded amount, so the
 *  delta is what is new since the last refund we saw for the same payment. */
export async function applyRefund(db: SqlDb, reservationId: string | null, r: RefundFacts, now = Date.now()): Promise<void> {
  const at = new Date(now).toISOString();
  const prev = await db.first<{ total: number | null }>(`SELECT MAX(amount_refunded_total_jpy) AS total FROM refunds WHERE stripe_payment_intent = ? OR (stripe_charge_id IS NOT NULL AND stripe_charge_id = ?)`, [r.paymentIntent ?? "", r.chargeId ?? ""]);
  const delta = r.amountRefundedTotal - (prev?.total ?? 0);
  if (delta <= 0) return; // a re-sent or out-of-order event with nothing new
  const id = randomId();
  await db.run(`INSERT INTO refunds (id, reservation_id, stripe_event_id, stripe_charge_id, stripe_payment_intent, amount_refunded_total_jpy, amount_delta_jpy, allocation_status, occurred_at, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) ON CONFLICT(stripe_event_id) DO NOTHING`,
    [id, reservationId, r.eventId, r.chargeId ?? null, r.paymentIntent ?? null, r.amountRefundedTotal, delta, r.occurredAt, at]);
  if (!reservationId) return;
  await allocateRefund(db, reservationId, id, delta, now);
  await recomputeCommission(db, reservationId, "stripe", now);
}

/** Operations confirm that the experience took place. Revoking is a separate,
 *  reasoned action; a confirmation is never overwritten in place. */
export async function confirmAttendance(db: SqlDb, reservationId: string, input: { performedAt: string; by: string; note?: string }, now = Date.now()) {
  const at = new Date(now).toISOString();
  await db.batch([
    { sql: `INSERT INTO attendances (reservation_id, performed_at, performed_on_jst, confirmed_by, confirmed_at, note) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(reservation_id) DO UPDATE SET performed_at = excluded.performed_at, performed_on_jst = excluded.performed_on_jst, confirmed_by = excluded.confirmed_by, confirmed_at = excluded.confirmed_at, note = excluded.note, revoked_at = NULL, revoked_reason = NULL`,
      params: [reservationId, input.performedAt, jstDate(input.performedAt), input.by, at, input.note ?? null] },
    { sql: `UPDATE reservations SET status = CASE WHEN status IN ('cancelled','no_show') THEN status ELSE 'completed' END, updated_at = ? WHERE id = ?`, params: [at, reservationId] },
    { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason) VALUES (?, ?, ?, 'attendance.confirm', 'reservation', ?, ?)`, params: [randomId(), at, input.by, reservationId, input.note ?? null] },
  ]);
  return recomputeCommission(db, reservationId, input.by, now);
}

/** Mark a reservation cancelled or no-show (no commission, 要件 3.5). */
export async function setReservationOutcome(db: SqlDb, reservationId: string, outcome: "cancelled" | "no_show", by: string, reason: string, now = Date.now()) {
  const at = new Date(now).toISOString();
  await db.batch([
    { sql: `UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?`, params: [outcome, at, reservationId] },
    { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, 'reservation', ?, ?)`, params: [randomId(), at, by, `reservation.${outcome}`, reservationId, reason] },
  ]);
  return recomputeCommission(db, reservationId, by, now);
}

/** Attach the external reference (the Sheets case id or the Stripe reference) once known. */
export async function setExternalRef(db: SqlDb, requestId: string, externalRef: string) {
  await db.run(`UPDATE reservations SET external_ref = COALESCE(external_ref, ?), updated_at = ? WHERE request_id = ?`, [externalRef, new Date().toISOString(), requestId]);
}
