/** Stripe events into the commission ledger.
 *
 *  Called from lib/payment-webhooks.ts after signature verification and before
 *  the existing forwarding, which it never changes. Every event is recorded
 *  once (integration_events); re-sent, out-of-order or unrelated events are
 *  harmless. Accounting truth stays in payments/refunds/reservations, not in a
 *  browser's success page (要件 11). */
import { type SqlDb } from "./db";
import { applyPayment, applyRefund, recomputeCommission } from "./reservations";

interface StripeEvent { id: string; type: string; created?: number; livemode?: boolean; data: { object: Record<string, unknown> } }
export type StripeOutcome = "processed" | "duplicate" | "ignored" | "unmatched";

const str = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function recordStripeEvent(db: SqlDb, event: StripeEvent, now = Date.now()): Promise<StripeOutcome> {
  const at = new Date(now).toISOString();
  const occurred = event.created ? new Date(event.created * 1000).toISOString() : at;
  const inserted = await db.run(
    `INSERT INTO integration_events (provider, event_id, event_type, occurred_at, received_at, status) VALUES ('stripe', ?, ?, ?, ?, 'processed') ON CONFLICT(provider, event_id) DO NOTHING`,
    [event.id, event.type, occurred, at]);
  if (inserted.changes === 0) return "duplicate";
  const note = (status: "ignored" | "processed" | "error", text?: string) =>
    db.run(`UPDATE integration_events SET status = ?, note = ? WHERE provider = 'stripe' AND event_id = ?`, [status, text ?? null, event.id]);
  const o = event.data?.object ?? {};
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (str(o.currency) && str(o.currency) !== "jpy") { await note("ignored", "currency"); return "ignored"; }
      const meta = (o.metadata && typeof o.metadata === "object" ? o.metadata : {}) as Record<string, unknown>;
      const reservation = await findReservation(db, str(meta.reservation_id), str(o.client_reference_id), str(meta.booking_reference));
      if (!reservation) { await note("ignored", "no reservation for session"); return "unmatched"; }
      const totals = (o.total_details && typeof o.total_details === "object" ? o.total_details : {}) as Record<string, unknown>;
      await applyPayment(db, reservation, {
        eventId: event.id, sessionId: str(o.id), paymentIntent: str(o.payment_intent), clientReferenceId: str(o.client_reference_id),
        amountTotal: num(o.amount_total) ?? 0, amountSubtotal: num(o.amount_subtotal), amountDiscount: num(totals.amount_discount) ?? 0, amountTax: num(totals.amount_tax) ?? 0,
        paymentStatus: str(o.payment_status) ?? "unknown", livemode: event.livemode !== false, occurredAt: occurred,
      }, now);
      return "processed";
    }
    if (event.type === "charge.refunded" || event.type === "charge.refund.updated") {
      const charge = event.type === "charge.refunded" ? o : null;
      const paymentIntent = str(charge ? charge.payment_intent : o.payment_intent);
      const chargeId = str(charge ? charge.id : o.charge);
      const total = charge ? num(charge.amount_refunded) : null;
      if (!charge || total === null) { await note("ignored", "refund without cumulative amount"); return "ignored"; }
      const reservation = paymentIntent ? await db.first<{ id: string }>(`SELECT id FROM reservations WHERE stripe_payment_intent = ?`, [paymentIntent]) : null;
      await applyRefund(db, reservation?.id ?? null, { eventId: event.id, chargeId, paymentIntent, amountRefundedTotal: total, occurredAt: occurred }, now);
      if (!reservation) { await note("processed", "refund kept for a payment not seen yet"); return "unmatched"; }
      return "processed";
    }
    if (event.type.startsWith("charge.dispute.")) {
      const paymentIntent = str(o.payment_intent), disputeId = str(o.id);
      if (!disputeId) { await note("ignored", "dispute without id"); return "ignored"; }
      const reservation = paymentIntent ? await db.first<{ id: string }>(`SELECT id FROM reservations WHERE stripe_payment_intent = ?`, [paymentIntent]) : null;
      const status = str(o.status) ?? "unknown";
      const closed = event.type === "charge.dispute.closed" || ["won", "lost", "warning_closed"].includes(status);
      await db.run(
        `INSERT INTO disputes (id, reservation_id, stripe_dispute_id, stripe_payment_intent, status, amount_jpy, opened_at, closed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(stripe_dispute_id) DO UPDATE SET status = excluded.status, closed_at = COALESCE(excluded.closed_at, disputes.closed_at), reservation_id = COALESCE(disputes.reservation_id, excluded.reservation_id), updated_at = excluded.updated_at`,
        [crypto.randomUUID(), reservation?.id ?? null, disputeId, paymentIntent, status, num(o.amount) ?? 0, occurred, closed ? occurred : null, at]);
      if (reservation) {
        if (!closed) await db.run(`UPDATE reservations SET payment_status = 'disputed', updated_at = ? WHERE id = ? AND payment_status != 'disputed'`, [at, reservation.id]);
        else if (status === "won") await db.run(`UPDATE reservations SET payment_status = 'paid', updated_at = ? WHERE id = ? AND payment_status = 'disputed'`, [at, reservation.id]);
        else if (status === "lost") {
          // The money went back to the cardholder: treat it as a refund awaiting allocation.
          await applyRefund(db, reservation.id, { eventId: `${event.id}:lost`, chargeId: str(o.charge), paymentIntent, amountRefundedTotal: num(o.amount) ?? 0, occurredAt: occurred }, now);
        }
        await recomputeCommission(db, reservation.id, "stripe", now);
        return "processed";
      }
      await note("processed", "dispute kept for a payment not seen yet");
      return "unmatched";
    }
    await note("ignored");
    return "ignored";
  } catch (err) {
    await note("error", err instanceof Error ? err.message.slice(0, 200) : "error");
    throw err;
  }
}

async function findReservation(db: SqlDb, reservationId: string | null, clientRef: string | null, bookingRef: string | null): Promise<string | null> {
  if (reservationId) { const r = await db.first<{ id: string }>(`SELECT id FROM reservations WHERE id = ?`, [reservationId]); if (r) return r.id; }
  for (const ref of [clientRef, bookingRef]) {
    if (!ref) continue;
    const r = await db.first<{ id: string }>(`SELECT id FROM reservations WHERE external_ref = ?`, [ref]);
    if (r) return r.id;
  }
  return null;
}
