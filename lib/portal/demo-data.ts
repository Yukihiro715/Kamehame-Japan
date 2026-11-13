import { quarterOf, previousPeriod, payDateFor } from "./settlement";
/** Fictional, read-only samples. Never inserted into reservations or financial ledgers. */
import { jstDate } from "@/lib/referral/db";
import { DEMO_SITE_ID, DEMO_USER_ID } from "./demo-config";
import { reservationSort } from "./metrics";
import { popularityRanks } from "./experience-sort";
import type { HotelReservationRow, HotelDashboard, Period, ReservationFilters } from "./metrics";
import { RESERVATION_STATUS_JA, PAYMENT_STATUS_JA, ENTRY_STATUS_JA } from "./util";
const month = () => jstDate().slice(0, 7);
const date = (day: number) => `${month()}-${String(day).padStart(2, "0")}`;
const experiences = [
  { slug: "kanji-name-calligraphy", title: "漢字の名前・書道体験", search: "Calligraphy" },
  { slug: "shibuya-ramen-class", title: "渋谷のラーメン作り体験", search: "Ramen" },
  { slug: "nerima-herbal-bath-private-spa", title: "練馬で薬草入浴剤作りと貸切温泉スパ", search: "Herbal bath private spa" },
];
export function demoRows(): HotelReservationRow[] {
  const today = jstDate(), elapsedDays = Number(today.slice(8, 10));
  return Array.from({ length: 60 }, (_, i) => {
    const status = i < 30 ? "completed" : i < 48 ? "confirmed" : i < 56 ? "provisional" : i < 58 ? "arranging" : "cancelled";
    const baseNet = [60000, 40000, 80000, 30000, 50000, 20000][i % 6], commissionNet = status === "cancelled" ? 0 : baseNet * .05;
    const entryStatus = status === "completed" ? "confirmed" : status === "cancelled" ? "voided" : "estimated", paymentStatus = i < 48 ? "paid" : "unpaid";
    const bookedDay = 1 + Math.floor(i * elapsedDays / 60), experience = experiences[i % experiences.length];
    // Completed samples never occur in the future, including on the first of a month.
    const experienceDate = status === "completed" ? date(Math.min(elapsedDays, bookedDay + 2)) : new Date(`${today}T12:00:00+09:00`);
    if (experienceDate instanceof Date) experienceDate.setUTCDate(experienceDate.getUTCDate() + 1 + i % 21);
    const experienceOn = typeof experienceDate === "string" ? experienceDate : experienceDate.toISOString().slice(0, 10);
    return { hotelRef: `R-DEMO${String(i + 1).padStart(2, "0")}`, createdAt: `${date(bookedDay)}T00:${String(i % 60).padStart(2, "0")}:00Z`, experience: `${experience.title}（サンプル）`, experienceSlug: experience.slug, experienceDate: experienceOn, guests: i % 3 + 2, status, statusJa: RESERVATION_STATUS_JA[status] ?? status, paymentStatus, paymentJa: PAYMENT_STATUS_JA[paymentStatus] ?? paymentStatus, bookingGross: Math.round(baseNet * 1.1), baseNet, rateBp: 500, commissionNet, commissionGrossRef: Math.round(commissionNet * 1.1), entryStatus, entryJa: ENTRY_STATUS_JA[entryStatus] ?? entryStatus, hold: null, holdCodes: [], performedOn: status === "completed" ? experienceOn : null };
  });
}
export function demoReservations(f: ReservationFilters = {}) {
  const query = f.q?.trim().slice(0,100).toLowerCase();
  const rows = demoRows().filter(r => (!f.from || r.createdAt.slice(0,10) >= f.from) && (!f.to || r.createdAt.slice(0,10) <= f.to) && (!f.experienceFrom || r.experienceDate! >= f.experienceFrom) && (!f.experienceTo || r.experienceDate! <= f.experienceTo) && (!f.status || r.status === f.status) && (!f.ref || r.hotelRef === f.ref.toUpperCase()) && (!f.experience || r.experienceSlug === f.experience) && (!query || `${r.hotelRef} ${r.experience} ${r.experienceSlug} ${experiences.find(e => e.slug === r.experienceSlug)?.search ?? ""}`.toLowerCase().includes(query)));
  const sort = reservationSort(f.sort), direction = f.direction === "asc" ? 1 : -1;
  const value = (r: HotelReservationRow): string | number | null => sort === "created" ? r.createdAt : sort === "date" ? r.experienceDate : sort === "amount" ? r.bookingGross : sort === "rate" ? r.rateBp : sort === "commission" ? r.commissionNet : sort === "status" ? ["provisional","arranging","confirmed","completed","cancelled","no_show"].indexOf(r.status) : r.entryStatus ? ["estimated","pending","confirmed","adjusted","voided"].indexOf(r.entryStatus) : null;
  rows.sort((a,b) => { const x=value(a), y=value(b); return x===null && y!==null ? 1 : y===null && x!==null ? -1 : x!==null && y!==null && x!==y ? (x<y?-1:1)*direction : a.hotelRef.localeCompare(b.hotelRef); });
  const summary = { estimatedNet: 0, pendingNet: 0, confirmedNet: 0, unknownCount: 0 };
  for (const r of rows) { if(r.rateBp===null || r.commissionNet===null) { summary.unknownCount++; continue; } if(r.entryStatus==="estimated") summary.estimatedNet+=r.commissionNet??0; if(r.entryStatus==="pending") summary.pendingNet+=r.commissionNet??0; if(r.entryStatus==="confirmed"||r.entryStatus==="adjusted") summary.confirmedNet+=r.commissionNet??0; }
  const offset = Math.max(0, f.offset ?? 0), limit = Math.min(500, Math.max(1, f.limit ?? 25));
  return { rows: rows.slice(offset, offset + limit), total: rows.length, summary };
}
export function demoPopularity() {
  const counts = new Map<string, number>();
  for (const row of demoRows()) {
    if (["confirmed", "completed"].includes(row.status)) counts.set(row.experienceSlug, (counts.get(row.experienceSlug) ?? 0) + 1);
  }
  return popularityRanks([...counts].map(([slug, count]) => ({ slug, count })));
}
const unpaidNet = demoRows().filter(r => r.entryStatus === "confirmed").reduce((sum, r) => sum + r.commissionNet!, 0);
export const demoBalance = { unpaidNet, unpaidTaxRef: unpaidNet / 10, paid: 154000 };
export function demoDashboard(period: Period): HotelDashboard {
  const rows = demoReservations({ ...period, limit: 500 }).rows, done = demoRows().filter(r => r.performedOn && r.performedOn >= period.from && r.performedOn <= period.to);
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
    {period:current,status:"accruing",gross:demoBalance.unpaidNet + demoBalance.unpaidTaxRef,transfer:null,carried:0,payDate:payDateFor(current),paidAt:null,statementId:null},
    {period:previous,status:"paid",gross:88000,transfer:88000,carried:0,payDate:payDateFor(previous),paidAt:payDateFor(previous),statementId:null},
    {period:older,status:"paid",gross:66000,transfer:66000,carried:0,payDate:payDateFor(older),paidAt:payDateFor(older),statementId:null},
  ];
}
