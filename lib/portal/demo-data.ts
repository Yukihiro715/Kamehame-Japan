import { quarterOf, previousPeriod, payDateFor } from "./settlement";
/** Fictional, read-only samples. Never inserted into reservations or financial ledgers. */
import { jstDate } from "@/lib/referral/db";
import { DEMO_SITE_ID, DEMO_USER_ID } from "./demo-config";
import type { HotelReservationRow, HotelDashboard, Period, ReservationFilters } from "./metrics";
import { RESERVATION_STATUS_JA, PAYMENT_STATUS_JA, ENTRY_STATUS_JA } from "./util";
const month = () => jstDate().slice(0, 7);
const date = (day: number) => `${month()}-${String(day).padStart(2, "0")}`;
export function demoRows(): HotelReservationRow[] {
  return ["completed", "completed", "confirmed", "confirmed", "provisional", "cancelled"].map((status, i) => {
    const baseNet = [60000, 40000, 80000, 30000, 50000, 20000][i], commissionNet = status === "cancelled" ? 0 : baseNet * .05;
    const entryStatus = i < 2 ? "confirmed" : status === "cancelled" ? "cancelled" : "estimated", paymentStatus = i < 4 ? "paid" : "unpaid";
    return { hotelRef: `R-DEMO0${i + 1}`, createdAt: `${date(i + 1)}T03:00:00Z`, experience: "漢字の名前・書道体験（サンプル）", experienceSlug: "kanji-name-calligraphy", experienceDate: date(8 + i * 3), guests: i % 3 + 2, status, statusJa: RESERVATION_STATUS_JA[status] ?? status, paymentStatus, paymentJa: PAYMENT_STATUS_JA[paymentStatus] ?? paymentStatus, baseNet, rateBp: 500, commissionNet, commissionGrossRef: commissionNet * 1.1, entryStatus, entryJa: ENTRY_STATUS_JA[entryStatus] ?? entryStatus, hold: null, holdCodes: [], performedOn: i < 2 ? date(8 + i * 3) : null };
  });
}
export function demoReservations(f: ReservationFilters = {}) {
  const rows = demoRows().filter(r => (!f.from || r.createdAt.slice(0,10) >= f.from) && (!f.to || r.createdAt.slice(0,10) <= f.to) && (!f.experienceFrom || r.experienceDate! >= f.experienceFrom) && (!f.experienceTo || r.experienceDate! <= f.experienceTo) && (!f.status || r.status === f.status) && (!f.ref || r.hotelRef === f.ref.toUpperCase()) && (!f.experience || r.experienceSlug === f.experience)).reverse();
  const offset = Math.max(0, f.offset ?? 0), limit = Math.min(500, Math.max(1, f.limit ?? 25));
  return { rows: rows.slice(offset, offset + limit), total: rows.length };
}
export const demoBalance = { unpaidNet: 5000, unpaidTaxRef: 500, paid: 13200 };
export function demoDashboard(period: Period): HotelDashboard {
  const rows = demoReservations(period).rows, done = demoRows().filter(r => r.performedOn && r.performedOn >= period.from && r.performedOn <= period.to);
  const net = done.reduce((n,r) => n + r.commissionNet!,0);
  return { period, visitorCountPartial: false, updatedAt: new Date().toISOString(), funnel: { accesses: rows.length * 40, visits: rows.length * 27, provisional: rows.filter(r => ["provisional","arranging"].includes(r.status)).length, confirmed: rows.filter(r => ["completed","confirmed"].includes(r.status)).length, paid: rows.filter(r => r.paymentStatus === "paid").length, fullyRefunded: 0, cancelled: rows.filter(r => r.status === "cancelled").length, estimatedCommissionNet: rows.filter(r => r.entryStatus === "estimated" && !r.performedOn && ["provisional","arranging","confirmed"].includes(r.status)).reduce((n,r) => n + r.commissionNet!,0) }, confirmed: { count: done.length, baseNet: done.reduce((n,r) => n+r.baseNet!,0), commissionNet: net, commissionTaxRef: net*.1 }, balance: demoBalance };
}
export function demoCases(params: URLSearchParams) {
  let rows = ["checking", "awaiting_customer", "confirmed"].map((status,i) => ({ id: `demo-case-${i+1}`, publicRef: `C-DEMO0${i+1}`, partnerRef: `SAMPLE-${i+1}`, kind: "experience", experienceTitle: "書道体験のご相談（サンプル）", experienceTitleEn: "Calligraphy request (sample)", preferredDate: date(18+i), guests: i+2, customerName: `サンプルのお客様 ${i+1}`, status, assignee: "デモ担当者", updatedAt: `${date(i+1)}T03:00:00Z`, quoteVersion: i ? 1 : null, totalJpy: i ? 44000 : null }));
  if (params.get("open") === "1") rows = rows.filter(r => r.status !== "confirmed");
  if (params.get("status")) rows = rows.filter(r => r.status === params.get("status"));
  const q = (params.get("q") ?? "").toLowerCase();
  rows = rows.filter(r => `${r.publicRef} ${r.partnerRef} ${r.customerName}`.toLowerCase().includes(q));
  const offset = Math.max(0, Number(params.get("offset")) || 0), limit = Math.min(100,Math.max(1, Number(params.get("limit")) || 20));
  return { manager: true, rows: rows.slice(offset,offset+limit), total: rows.length };
}
export function demoCase(id: string) {
  const row = demoCases(new URLSearchParams()).rows.find(r => r.id === id);
  if (!row) return null;
  return { case: { id, public_ref: row.publicRef, partner_ref: row.partnerRef, site_id: DEMO_SITE_ID, siteName: "デモ用", sitePublicId: "HP-DEMO-PUBLIC", entityName: "KAMEHAME デモ用", kind: "experience", experience_slug: "kanji-name-calligraphy", experienceTitle: row.experienceTitle, experienceTitleEn: row.experienceTitleEn, customer_name: row.customerName, customer_email: "sample@example.invalid", customer_phone: null, customer_country: "Japan", preferred_date: row.preferredDate, guests: row.guests, requirements: "英語での案内を希望（架空のサンプル）", lang: "ja", status: row.status, displayStatus: row.status, statusJa: row.status, displayStatusJa: row.status, created_at: row.updatedAt, updated_at: row.updatedAt, createdBy: "デモ担当者", created_by_user_id: DEMO_USER_ID, assignee: "デモ担当者", altDates: [], extra: {}, extraFields: [] }, quotes: row.quoteVersion ? [{ id: `${id}-quote`, version: 1, status: "shared", title: "書道体験（サンプル見積もり）", lines: [{ kind: "base", description: "体験料金", quantity: 1, unitJpy: 44000, grossJpy: 44000, taxRateBp: 1000, commissionable: true }], totalJpy: 44000, onsiteJpy: 0, paymentMode: "stripe", shareUrl: null, createdAt: row.updatedAt, commission: { baseNetJpy: 40000, rateBp: 500, estimateNetJpy: 2000, policyMissing: false } }] : [], messages: [], reservation: null, entry: null, members: [] };
}

export function demoQuarters() {
  const current = quarterOf(jstDate()), previous = previousPeriod(current), older = previousPeriod(previous);
  return [
    {period:current,status:"accruing",gross:5500,transfer:null,carried:0,payDate:payDateFor(current),paidAt:null,statementId:null},
    {period:previous,status:"paid",gross:8800,transfer:8800,carried:0,payDate:payDateFor(previous),paidAt:payDateFor(previous),statementId:null},
    {period:older,status:"paid",gross:4400,transfer:4400,carried:0,payDate:payDateFor(older),paidAt:payDateFor(older),statementId:null},
  ];
}
