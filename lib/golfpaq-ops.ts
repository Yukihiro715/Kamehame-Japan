/** Operations view of shared-bus golf tour enquiries (/ops/bus-tours/):
 *  listing, the internal breakdown, status transitions, notes, re-sending
 *  the partner hand-over and copying a purchase-guidance draft. Every
 *  change is logged in audit_logs; nothing is deleted. */
import { randomId, type SqlDb } from "@/lib/referral/db";
import { bad, notFound, str } from "@/lib/portal/util";
import { describePickup, GOLFPAQ_FEE_JPY } from "./golfpaq";
import { sendGolfpaqMail, type GolfpaqEnquiryEnv } from "./golfpaq-enquiry";
import { partnerHandover, purchaseGuidanceDraft, type Golfer, type InternalFacts } from "./golfpaq-mail";
import { courseNameEn } from "./golf-course-images";
import { loadCourseNames, displayCourseName } from "./golf-courses-db";

export const BUS_STATUSES = ["received", "handed_over", "guidance_sent", "purchased", "confirmed", "cancelled", "unavailable"] as const;
export type BusStatus = (typeof BUS_STATUSES)[number];
export const BUS_STATUS_JA: Record<BusStatus, string> = { received: "受付", handed_over: "提携先へ引き継ぎ済み", guidance_sent: "購入案内送付済み", purchased: "購入済み", confirmed: "予約確定", cancelled: "キャンセル", unavailable: "手配不可" };
/** Forward moves plus the two closing states; closed enquiries stay closed. */
const NEXT: Record<BusStatus, BusStatus[]> = {
  received: ["handed_over", "guidance_sent", "cancelled", "unavailable"],
  handed_over: ["guidance_sent", "purchased", "cancelled", "unavailable"],
  guidance_sent: ["purchased", "confirmed", "cancelled", "unavailable"],
  purchased: ["confirmed", "cancelled", "unavailable"],
  confirmed: ["cancelled"],
  cancelled: [], unavailable: [],
};
export const nextStatuses = (s: string): BusStatus[] => NEXT[s as BusStatus] ?? [];

export interface BusEnquiryRow {
  id: string; reference: string; request_id: string; tour_id: string; tour_date: string; course: string; pickup: string; departure_area: string | null; departure_time: string | null;
  people: number; renters: number; source_yen: number; fee_yen: number; per_person_yen: number; tours_yen: number; rentals_yen: number; shoe_renters?: number; shoes_yen?: number; total_yen: number; seats_shown: number | null; snapshot_updated_at: string | null;
  name: string; email: string; phone: string | null; note: string | null; lang: string; golfers_json?: string | null; status: string; customer_mail: string | null; staff_mail: string | null; partner_mail: string | null; internal_note: string | null; created_at: string; updated_at: string;
}
const nowIso = () => new Date().toISOString();
const audit = (db: SqlDb, actor: string, action: string, id: string, reason: string | null, after?: unknown) =>
  db.run(`INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason, after_json) VALUES (?, ?, ?, ?, 'bus_tour_enquiry', ?, ?, ?)`, [randomId(), nowIso(), actor, action, id, reason, after === undefined ? null : JSON.stringify(after)]);

export async function busEnquiryList(db: SqlDb, f: { status?: string; q?: string; limit?: number; offset?: number }) {
  const where: string[] = ["1=1"], params: unknown[] = [];
  if (f.status && (BUS_STATUSES as readonly string[]).includes(f.status)) { where.push("status = ?"); params.push(f.status); }
  else if (f.status === "open") where.push("status NOT IN ('confirmed','cancelled','unavailable')");
  if (f.q) { const like = `%${f.q.trim()}%`; where.push("(reference LIKE ? OR name LIKE ? OR email LIKE ? OR course LIKE ?)"); params.push(like, like, like, like); }
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500), offset = Math.max(f.offset ?? 0, 0);
  const rows = await db.all<BusEnquiryRow>(`SELECT * FROM bus_tour_enquiries WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const counts = await db.all<{ status: string; n: number }>(`SELECT status, COUNT(*) AS n FROM bus_tour_enquiries GROUP BY status`);
  return { rows: rows.map(withLabels), counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number> };
}

export function golfersOf(r: { golfers_json?: string | null }): Golfer[] { try { const g = r.golfers_json ? JSON.parse(r.golfers_json) : null; return Array.isArray(g) ? g : []; } catch { return []; } }
const withLabels = (r: BusEnquiryRow) => ({ ...r, golfers: golfersOf(r), statusJa: BUS_STATUS_JA[r.status as BusStatus] ?? r.status, marginYen: r.fee_yen * r.people, next: nextStatuses(r.status) });

export async function busEnquiryGet(db: SqlDb, id: string): Promise<BusEnquiryRow> {
  const row = await db.first<BusEnquiryRow>(`SELECT * FROM bus_tour_enquiries WHERE id = ? OR reference = ?`, [id, id]);
  if (!row) throw notFound();
  return row;
}
export async function busEnquiryDetail(db: SqlDb, id: string) {
  const row = await busEnquiryGet(db, id);
  const logs = await db.all(`SELECT at, actor, action, reason, after_json FROM audit_logs WHERE target_type = 'bus_tour_enquiry' AND target_id = ? ORDER BY at DESC`, [row.id]);
  const facts = toFacts(row);
  facts.tour.courseEn = displayCourseName(row.course, "en", await loadCourseNames(db));
  const draft = purchaseGuidanceDraft(facts);
  return { enquiry: withLabels(row), logs, draft };
}

export function toFacts(r: BusEnquiryRow): InternalFacts {
  const departure = describePickup(r.pickup);
  if (r.departure_time) departure.time = r.departure_time;
  return {
    reference: r.reference, tour: { course: r.course, courseEn: courseNameEn(r.course), date: r.tour_date, pickup: r.pickup, departure }, people: r.people, renters: r.renters, shoeRenters: r.shoe_renters ?? 0, golfers: golfersOf(r),
    perPersonYen: r.per_person_yen, toursYen: r.tours_yen, rentalsYen: r.rentals_yen, shoesYen: r.shoes_yen ?? 0, totalYen: r.total_yen, name: r.name, email: r.email, phone: r.phone ?? undefined, note: r.note ?? undefined, lang: r.lang,
    sourceYen: r.source_yen, feeYen: r.fee_yen || GOLFPAQ_FEE_JPY, seatsShown: r.seats_shown, snapshotUpdatedAt: r.snapshot_updated_at, tourId: r.tour_id,
  };
}

export async function busEnquirySetStatus(db: SqlDb, id: string, input: { status: unknown; reason?: unknown; by: string }) {
  const row = await busEnquiryGet(db, id);
  const status = str(input.status, 20) as BusStatus;
  if (!nextStatuses(row.status).includes(status)) throw bad("bad_transition", `${row.status} → ${status}`);
  const reason = str(input.reason, 500) || null;
  if ((status === "cancelled" || status === "unavailable") && !reason) throw bad("reason_required");
  await db.run(`UPDATE bus_tour_enquiries SET status = ?, updated_at = ? WHERE id = ?`, [status, nowIso(), row.id]);
  await audit(db, input.by, "bus_tour.status", row.id, reason, { from: row.status, to: status });
}

export async function busEnquirySetNote(db: SqlDb, id: string, input: { note: unknown; by: string }) {
  const row = await busEnquiryGet(db, id);
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 4000) : "";
  await db.run(`UPDATE bus_tour_enquiries SET internal_note = ?, updated_at = ? WHERE id = ?`, [note || null, nowIso(), row.id]);
  await audit(db, input.by, "bus_tour.note", row.id, null, { length: note.length });
}

/** Re-send the hand-over to the travel partner (after a failed or blocked first attempt, or when the address was set later). */
export async function busEnquiryResendPartner(db: SqlDb, env: GolfpaqEnquiryEnv, id: string, by: string) {
  const row = await busEnquiryGet(db, id);
  if (!env.GOLFPAQ_PARTNER_TO) throw bad("partner_address_missing", "GOLFPAQ_PARTNER_TO is not set");
  const outcome = await sendGolfpaqMail(env, { from: "KAMEHAME JAPAN <hello@kamehame-japan.com>", to: env.GOLFPAQ_PARTNER_TO, replyTo: "hello@kamehame-japan.com", ...partnerHandover(toFacts(row)) });
  const status = outcome === "sent" && row.status === "received" ? "handed_over" : row.status;
  await db.run(`UPDATE bus_tour_enquiries SET partner_mail = ?, status = ?, updated_at = ? WHERE id = ?`, [outcome, status, nowIso(), row.id]);
  await audit(db, by, "bus_tour.partner_mail", row.id, null, { outcome, status });
  return { outcome, status };
}
