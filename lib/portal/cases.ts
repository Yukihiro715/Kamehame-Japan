import { partnerExperienceOrder } from "./experience-sort";
/** The booking relay (docs/PARTNER_PLATFORM_STAGE1.md 4.5): a partner's case,
 *  the quotes operations make for it, the customer's shared page and the
 *  reservation that carries the case's attribution.
 *
 *  Four states are kept apart and never merged into one column: the case's
 *  progress (partner_cases.status), each quote version (case_quotes.status),
 *  the reservation (reservations.status / payment_status) and the commission
 *  entry. What a partner sees is derived from all four (`displayStatus`).
 *
 *  The reservation is created the moment a quote is first shared, with
 *  basis 'case': the attribution is fixed by the case, not by a cookie, so a
 *  customer paying on another device changes nothing (要件 5-2). */
import { catalogFor, type Experience } from "@/lib/catalog";
import { isLang, type Lang } from "@/lib/i18n";
import { jstDate, randomId, type SqlDb, type SqlStatement } from "@/lib/referral/db";
import { commissionNet, netFromGross } from "@/lib/referral/money";
import { createReservation, policyFor, recomputeCommission, applyPayment, type LineKind, type NewLine } from "@/lib/referral/reservations";
import type { R2Like } from "@/lib/review-media";
import type { Principal } from "./auth";
import { hasSiteRole } from "./auth";
import { bad, forbidden, int, isoDate, notFound, str, ApiError, PAYMENT_STATUS_JA, RESERVATION_STATUS_JA, ENTRY_STATUS_JA, HOLD_JA } from "./util";

// ---- vocabulary ------------------------------------------------------------

export type CaseStatus = "received" | "checking" | "proposed" | "awaiting_customer" | "awaiting_payment" | "paid" | "confirmed" | "performed" | "cancelled" | "unavailable";
export const CASE_STATUSES: CaseStatus[] = ["received", "checking", "proposed", "awaiting_customer", "awaiting_payment", "paid", "confirmed", "performed", "cancelled", "unavailable"];
/** Statuses operations may set by hand; the rest follow from quotes, payments and the reservation. */
export const MANUAL_CASE_STATUSES: CaseStatus[] = ["received", "checking", "proposed", "awaiting_customer", "awaiting_payment", "cancelled", "unavailable"];
export const CASE_STATUS_JA: Record<CaseStatus, string> = {
  received: "受付済み", checking: "空き・条件確認中", proposed: "提案済み", awaiting_customer: "お客様の回答待ち", awaiting_payment: "支払い待ち",
  paid: "決済済み・予約確定待ち", confirmed: "予約確定", performed: "実施済み", cancelled: "キャンセル", unavailable: "手配不可",
};
export const CLOSED_CASE_STATUSES: CaseStatus[] = ["performed", "cancelled", "unavailable"];
export type QuoteStatus = "draft" | "shared" | "paid" | "superseded" | "expired" | "void";
export const QUOTE_STATUS_JA: Record<QuoteStatus, string> = { draft: "下書き", shared: "共有中", paid: "決済済み", superseded: "旧版", expired: "期限切れ", void: "取消" };
export type PaymentMode = "stripe" | "external" | "none";
export const PAYMENT_MODE_EN: Record<PaymentMode, string> = { stripe: "Online card payment", external: "Paid to the partner operator (recorded by KAMEHAME)", none: "No online payment (paid on the day)" };
export const PAYMENT_MODE_JA: Record<PaymentMode, string> = { stripe: "オンライン決済（カード）", external: "提携先への支払い（運営が決済済みを登録）", none: "決済なし（現地払いのみ）" };
export type Visibility = "internal" | "partner" | "customer";
export const VISIBILITY_JA: Record<Visibility, string> = { internal: "運営内部", partner: "パートナーと運営", customer: "お客様にも表示" };

/** The shared-bus golf day is sold by the travel partner, not from the catalog; it still gets a case and a commission. */
export const BUS_GOLF_SLUG = "golf-bus";
const BUS_GOLF_TITLE: Record<Lang, string> = { en: "Shared-bus golf day from Tokyo", ja: "乗合バスゴルフ（東京発）", es: "Día de golf en autobús compartido desde Tokio", fr: "Journée de golf en bus partagé depuis Tokyo", "zh-tw": "東京出發共乘巴士高爾夫" };
const GOLF_SLUGS = ["mt-fuji-golf-day", BUS_GOLF_SLUG];

/** Product-specific fields (要件 5-1). Keys are stored in extra_json; labels are for the forms. */
export interface ExtraField { key: string; label: string; type: "text" | "select" | "bool"; options?: { value: string; label: string }[] }
export const GOLF_EXTRA_FIELDS: ExtraField[] = [
  { key: "area", label: "希望エリア・コース", type: "text" },
  { key: "transfer", label: "送迎の要否", type: "select", options: [{ value: "needed", label: "必要" }, { value: "not_needed", label: "不要" }, { value: "undecided", label: "未定" }] },
  { key: "pickup", label: "出発地（ホテル名など）", type: "text" },
  { key: "rental_clubs", label: "レンタルクラブ", type: "select", options: [{ value: "none", label: "不要" }, { value: "some", label: "一部" }, { value: "all", label: "全員" }] },
  { key: "rental_shoes", label: "レンタルシューズ", type: "select", options: [{ value: "none", label: "不要" }, { value: "some", label: "一部" }, { value: "all", label: "全員" }] },
  { key: "handed_sizes", label: "左右・クラブの希望・シューズサイズ", type: "text" },
  { key: "caddie", label: "キャディの要否", type: "select", options: [{ value: "needed", label: "必要" }, { value: "not_needed", label: "不要" }, { value: "undecided", label: "未定" }] },
  { key: "budget", label: "予算（1人あたり・総額など）", type: "text" },
  { key: "join_others", label: "他のプレーヤーとの組合せ", type: "select", options: [{ value: "ok", label: "可" }, { value: "no", label: "不可（貸切希望）" }, { value: "undecided", label: "未定" }] },
];
export const extraFieldsFor = (slug: string | null | undefined): ExtraField[] => (slug && GOLF_SLUGS.includes(slug) ? GOLF_EXTRA_FIELDS : []);

/** How a partner books an experience (要件 8): straight away, on request, or by asking for a quote. */
export type BookingMode = "instant" | "request" | "quote";
export const BOOKING_MODE_JA: Record<BookingMode, string> = { instant: "予約する", request: "空きを確認する", quote: "見積もりを依頼する" };
export function bookingModeOf(x: Experience): BookingMode {
  if (x.pricePending || x.variants?.length) return "quote";
  return x.bookingType === "instant" ? "instant" : "request";
}
export interface ExperienceOption { slug: string; title: string; titleEn: string; city: string | null; area: string | null; duration: string | null; group: string | null; price: string | null; bookingMode: BookingMode; extraFields: ExtraField[] }
/** What a partner may open a case for: the live catalog (in Japanese, for the portal) plus the shared-bus golf day. */
export function experienceOptions(lang: Lang = "ja"): ExperienceOption[] {
  const live: ExperienceOption[] = catalogFor(lang).experiences.filter((x) => x.status === "live").map((x) => ({
    slug: x.slug, title: x.title, titleEn: experienceTitle(x.slug, "en"), city: x.city, area: x.area, duration: x.duration, group: x.group, price: x.pricePending ? null : x.price, bookingMode: bookingModeOf(x), extraFields: extraFieldsFor(x.slug),
  }));
  live.push({ slug: BUS_GOLF_SLUG, title: BUS_GOLF_TITLE[lang], titleEn: BUS_GOLF_TITLE.en, city: "tokyo", area: "Tokyo → Mt. Fuji area", duration: null, group: null, price: null, bookingMode: "request", extraFields: GOLF_EXTRA_FIELDS });
  return partnerExperienceOrder(live);
}
export function experienceTitle(slug: string | null, lang: Lang = "ja"): string {
  if (!slug) return "自由相談";
  if (slug === BUS_GOLF_SLUG) return BUS_GOLF_TITLE[lang];
  return catalogFor(lang).experiences.find((x) => x.slug === slug)?.title ?? catalogFor("en").experiences.find((x) => x.slug === slug)?.title ?? slug;
}

// ---- rows ------------------------------------------------------------------

export interface CaseRow {
  id: string; public_ref: string; legal_entity_id: string; site_id: string; created_by_user_id: string; assignee_user_id: string | null; partner_ref: string | null;
  kind: "experience" | "free"; experience_slug: string | null; preferred_date: string | null; alt_dates_json: string | null; time_pref: string | null; guests: number | null; lang: string | null; requirements: string | null;
  customer_name: string; customer_email: string | null; customer_phone: string | null; customer_country: string | null; extra_json: string | null;
  status: CaseStatus; status_reason: string | null; reservation_id: string | null; assigned_ops: string | null; created_at: string; updated_at: string;
}
export interface QuoteLine { kind: LineKind; description: string; quantity: number; unitJpy: number; grossJpy: number; taxRateBp: number; commissionable: boolean }
export interface QuoteRow {
  id: string; case_id: string; version: number; status: QuoteStatus; title: string; lines_json: string; total_jpy: number; onsite_jpy: number;
  includes: string | null; excludes: string | null; onsite_note: string | null; cancel_terms: string | null; confirmation_note: string | null; valid_until: string | null;
  payment_mode: PaymentMode; share_token: string | null; stripe_session_id: string | null; stripe_session_created_at: string | null; checkout_url: string | null;
  created_by: string; created_at: string; shared_at: string | null; paid_at: string | null; superseded_at: string | null; expired_at: string | null;
}
export interface MessageRow { id: string; case_id: string; visibility: Visibility; author_kind: "ops" | "partner" | "system"; author_email: string | null; body: string; attachment_key: string | null; attachment_name: string | null; attachment_type: string | null; attachment_size: number | null; created_at: string }

const now_ = (now?: number) => new Date(now ?? Date.now()).toISOString();
const audit = (actor: string, action: string, targetId: string, reason: string | null, after?: unknown, at = now_()): SqlStatement => ({
  sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason, after_json) VALUES (?, ?, ?, ?, 'case', ?, ?, ?)`,
  params: [randomId(), at, actor, action, targetId, reason, after === undefined ? null : JSON.stringify(after)],
});
export const parseLines = (json: string): QuoteLine[] => { try { const v = JSON.parse(json); return Array.isArray(v) ? v as QuoteLine[] : []; } catch { return []; } };
const parseJson = <T>(json: string | null, fallback: T): T => { if (!json) return fallback; try { return JSON.parse(json) as T; } catch { return fallback; } };

export async function getCase(db: SqlDb, id: string): Promise<CaseRow> {
  const c = await db.first<CaseRow>(`SELECT * FROM partner_cases WHERE id = ?`, [id]);
  if (!c) throw notFound();
  return c;
}
export async function getQuote(db: SqlDb, id: string): Promise<QuoteRow> {
  const q = await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE id = ?`, [id]);
  if (!q) throw notFound();
  return q;
}

/** "KC-261106-03": the day's running number, for the partner and operations only (E-3). */
async function nextPublicRef(db: SqlDb, now: number): Promise<string> {
  const day = jstDate(now).slice(2).replace(/-/g, "");
  const row = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM partner_cases WHERE public_ref LIKE ?`, [`KC-${day}-%`]);
  return `KC-${day}-${String((row?.n ?? 0) + 1).padStart(2, "0")}`;
}

// ---- access ----------------------------------------------------------------

/** Which cases of a site a partner user may see: a manager every case, an agent their own (E-6). */
export function canSeeCase(p: Principal, c: Pick<CaseRow, "site_id" | "created_by_user_id" | "assignee_user_id">): boolean {
  if (hasSiteRole(p, c.site_id, "partner_manager")) return true;
  if (hasSiteRole(p, c.site_id, "partner_agent")) return c.created_by_user_id === p.userId || c.assignee_user_id === p.userId;
  return false;
}
export async function caseForPartner(db: SqlDb, p: Principal, id: string): Promise<CaseRow> {
  const c = await getCase(db, id);
  if (!canSeeCase(p, c)) throw notFound();
  return c;
}

// ---- create / update -------------------------------------------------------

export interface NewCaseInput {
  kind: unknown; experience?: unknown; preferredDate?: unknown; altDates?: unknown; timePref?: unknown; guests?: unknown; lang?: unknown; requirements?: unknown;
  customerName: unknown; customerEmail?: unknown; customerPhone?: unknown; customerCountry?: unknown; partnerRef?: unknown; extra?: unknown; assigneeUserId?: unknown;
}
const email = (v: unknown) => { const e = str(v, 200).toLowerCase(); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw bad("bad_email"); return e || null; };
function extraOf(slug: string | null, v: unknown): string | null {
  const fields = extraFieldsFor(slug);
  if (!fields.length || !v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const f of fields) {
    const s = str(o[f.key], 300);
    if (!s) continue;
    if (f.type === "select" && !f.options?.some((x) => x.value === s)) continue;
    out[f.key] = s;
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}
function altDatesOf(v: unknown): string | null {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,\s]+/) : [];
  const dates = arr.map((d) => isoDate(d)).filter((d): d is string => !!d).slice(0, 5);
  return dates.length ? JSON.stringify(dates) : null;
}

/** A partner registers a case (要件 5-1). Only the customer's name is required at this stage. */
export async function createCase(db: SqlDb, input: NewCaseInput & { siteId: string; userId: string; by: string }, now = Date.now()) {
  const site = await db.first<{ id: string; legal_entity_id: string; status: string }>(`SELECT id, legal_entity_id, status FROM hotels WHERE id = ?`, [input.siteId]);
  if (!site) throw notFound();
  if (site.status !== "active") throw bad("site_inactive");
  const kind = input.kind === "free" ? "free" : "experience";
  const slug = kind === "experience" ? str(input.experience, 80) : "";
  if (kind === "experience" && !experienceOptions().some((x) => x.slug === slug)) throw bad("unknown_experience");
  const customerName = str(input.customerName, 120);
  if (!customerName) throw bad("customer_name_required");
  const guests = int(input.guests);
  if (guests !== null && (guests < 1 || guests > 99)) throw bad("bad_guests");
  const lang = str(input.lang, 8);
  const assignee = str(input.assigneeUserId, 64) || input.userId;
  if (assignee !== input.userId) {
    const m = await db.first(`SELECT 1 FROM memberships WHERE user_id = ? AND scope_type = 'hotel' AND scope_id = ? AND revoked_at IS NULL AND role IN ('partner_agent','partner_manager')`, [assignee, site.id]);
    if (!m) throw bad("bad_assignee");
  }
  const id = randomId(), at = now_(now), ref = await nextPublicRef(db, now);
  await db.batch([
    { sql: `INSERT INTO partner_cases (id, public_ref, legal_entity_id, site_id, created_by_user_id, assignee_user_id, partner_ref, kind, experience_slug, preferred_date, alt_dates_json, time_pref, guests, lang, requirements, customer_name, customer_email, customer_phone, customer_country, extra_json, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)`,
      params: [id, ref, site.legal_entity_id, site.id, input.userId, assignee, str(input.partnerRef, 60) || null, kind, slug || null, isoDate(input.preferredDate), altDatesOf(input.altDates), str(input.timePref, 120) || null, guests, lang && isLang(lang) ? lang : null, str(input.requirements, 4000) || null,
        customerName, email(input.customerEmail), str(input.customerPhone, 40) || null, str(input.customerCountry, 60) || null, extraOf(slug || null, input.extra), at, at] },
    audit(input.by, "case.create", id, null, { ref, kind, slug: slug || null, site: site.id }, at),
  ]);
  return { id, publicRef: ref };
}

/** Fields a partner may change while the case is open and unpaid; operations may change more (the experience, the date, the ops assignee). */
export async function updateCase(db: SqlDb, id: string, input: Partial<NewCaseInput> & { assignedOps?: unknown; by: string; actor: "ops" | "partner" }, now = Date.now()) {
  const c = await getCase(db, id);
  if (CLOSED_CASE_STATUSES.includes(c.status)) throw bad("case_closed");
  if (input.actor === "partner" && ["paid", "confirmed"].includes(c.status)) throw bad("case_locked", "決済後の変更は運営へご連絡ください");
  const sets: string[] = [], params: unknown[] = [];
  const set = (col: string, v: unknown) => { sets.push(`${col} = ?`); params.push(v); };
  if ("customerName" in input) { const n = str(input.customerName, 120); if (!n) throw bad("customer_name_required"); set("customer_name", n); }
  if ("customerEmail" in input) set("customer_email", email(input.customerEmail));
  if ("customerPhone" in input) set("customer_phone", str(input.customerPhone, 40) || null);
  if ("customerCountry" in input) set("customer_country", str(input.customerCountry, 60) || null);
  if ("requirements" in input) set("requirements", str(input.requirements, 4000) || null);
  if ("partnerRef" in input) set("partner_ref", str(input.partnerRef, 60) || null);
  if ("preferredDate" in input) set("preferred_date", isoDate(input.preferredDate));
  if ("altDates" in input) set("alt_dates_json", altDatesOf(input.altDates));
  if ("timePref" in input) set("time_pref", str(input.timePref, 120) || null);
  if ("guests" in input) { const g = int(input.guests); if (g !== null && (g < 1 || g > 99)) throw bad("bad_guests"); set("guests", g); }
  if ("lang" in input) { const l = str(input.lang, 8); set("lang", l && isLang(l) ? l : null); }
  let slug = c.experience_slug;
  if ("experience" in input) {
    if (input.actor !== "ops" && c.kind !== "free") throw forbidden();
    const s = str(input.experience, 80);
    if (s && !experienceOptions().some((x) => x.slug === s)) throw bad("unknown_experience");
    slug = s || null; set("experience_slug", slug);
    if (c.kind === "free" && slug) set("kind", "experience");
  }
  if ("extra" in input) set("extra_json", extraOf(slug, input.extra));
  if ("assigneeUserId" in input) {
    const a = str(input.assigneeUserId, 64);
    if (a) { const m = await db.first(`SELECT 1 FROM memberships WHERE user_id = ? AND scope_type = 'hotel' AND scope_id = ? AND revoked_at IS NULL AND role IN ('partner_agent','partner_manager')`, [a, c.site_id]); if (!m) throw bad("bad_assignee"); }
    set("assignee_user_id", a || null);
  }
  if ("assignedOps" in input && input.actor === "ops") set("assigned_ops", str(input.assignedOps, 120) || null);
  if (!sets.length) return;
  const at = now_(now);
  set("updated_at", at);
  await db.batch([{ sql: `UPDATE partner_cases SET ${sets.join(", ")} WHERE id = ?`, params: [...params, id] }, audit(input.by, "case.update", id, null, Object.keys(input).filter((k) => !["by", "actor"].includes(k)), at)]);
  // A reservation already opened for the case follows the date and party.
  if (c.reservation_id && ("preferredDate" in input || "guests" in input || "experience" in input)) {
    const fresh = await getCase(db, id);
    await db.run(`UPDATE reservations SET experience_date = ?, guests = ?, experience_slug = ?, updated_at = ? WHERE id = ?`, [fresh.preferred_date, fresh.guests, fresh.experience_slug ?? "free", at, c.reservation_id]);
  }
}

/** Operations move the case along by hand where no event does it; cancellation and "unavailable" need a reason. */
export async function setCaseStatus(db: SqlDb, id: string, input: { status: unknown; reason?: unknown; by: string; actor: "ops" | "partner" }, now = Date.now()) {
  const c = await getCase(db, id);
  const status = str(input.status, 30) as CaseStatus;
  const reason = str(input.reason, 500) || null;
  if (!MANUAL_CASE_STATUSES.includes(status)) throw bad("bad_status");
  if (input.actor === "partner") {
    // A partner may only withdraw an unpaid case.
    if (status !== "cancelled") throw forbidden();
    if (["paid", "confirmed", "performed"].includes(c.status)) throw bad("case_locked", "決済後のキャンセルは運営へご連絡ください");
  }
  if (["cancelled", "unavailable"].includes(status) && !reason) throw bad("reason_required");
  if (c.status === "performed") throw bad("case_closed");
  const at = now_(now);
  const statements: SqlStatement[] = [
    { sql: `UPDATE partner_cases SET status = ?, status_reason = ?, updated_at = ? WHERE id = ?`, params: [status, reason, at, id] },
    audit(input.by, `case.status.${status}`, id, reason, { from: c.status }, at),
  ];
  await db.batch(statements);
  if (["cancelled", "unavailable"].includes(status)) {
    // Open quotes close with the case; a reservation already opened is cancelled with no commission (要件 3.5).
    for (const q of await db.all<QuoteRow>(`SELECT * FROM case_quotes WHERE case_id = ? AND status IN ('draft','shared')`, [id])) {
      await db.run(`UPDATE case_quotes SET status = 'void', expired_at = ? WHERE id = ?`, [at, q.id]);
    }
    if (c.reservation_id) {
      await db.run(`UPDATE reservations SET status = CASE WHEN status IN ('completed') THEN status ELSE 'cancelled' END, updated_at = ? WHERE id = ?`, [at, c.reservation_id]);
      await recomputeCommission(db, c.reservation_id, input.by, now);
    }
  }
}

// ---- messages and files ----------------------------------------------------

export const CASE_FILE_PREFIX = "cases/";
const FILE_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "text/plain": "txt" };
export const MAX_CASE_FILE_BYTES = 15 * 1024 * 1024;
const safe = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
export const isCaseFileKeyFor = (key: string, caseId: string) => key.startsWith(`${CASE_FILE_PREFIX}${caseId}/`) && !key.includes("..") && /^[A-Za-z0-9/._-]+$/.test(key);

/** Store one attachment under the case; the message that references it is written separately. */
export async function putCaseFile(bucket: R2Like | null, caseId: string, request: Request, now = new Date()): Promise<{ key: string; name: string; type: string; size: number }> {
  if (!bucket) throw new ApiError(503, "media_unavailable");
  const url = new URL(request.url);
  const name = url.searchParams.get("name") ?? "file";
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!FILE_TYPES[type]) throw bad("bad_type", "PDF・画像・テキストのみ添付できます");
  const size = Number(request.headers.get("content-length"));
  if (!Number.isFinite(size) || size <= 0 || size > MAX_CASE_FILE_BYTES) throw new ApiError(413, "too_large");
  if (!request.body) throw bad("invalid");
  const base = safe(name).replace(/\.[^.]+$/, "");
  const key = `${CASE_FILE_PREFIX}${caseId}/${now.toISOString().slice(0, 10)}-${randomId().slice(0, 8)}-${base}.${FILE_TYPES[type]}`;
  await bucket.put(key, request.body, { httpMetadata: { contentType: type }, customMetadata: { name: safe(name), caseId, at: now.toISOString() } });
  return { key, name: safe(name), type, size };
}

export async function addMessage(db: SqlDb, caseId: string, input: { visibility: unknown; authorKind: "ops" | "partner" | "system"; authorEmail: string | null; body: unknown; attachment?: { key: string; name: string; type: string; size: number } | null }, now = Date.now()) {
  const visibility = str(input.visibility, 10) as Visibility;
  if (!["internal", "partner", "customer"].includes(visibility)) throw bad("bad_visibility");
  if (input.authorKind === "partner" && visibility === "internal") throw forbidden();
  const body = str(input.body, 4000);
  if (!body && !input.attachment) throw bad("body_required");
  if (input.attachment && !isCaseFileKeyFor(input.attachment.key, caseId)) throw bad("bad_attachment");
  const id = randomId(), at = now_(now);
  await db.batch([
    { sql: `INSERT INTO case_messages (id, case_id, visibility, author_kind, author_email, body, attachment_key, attachment_name, attachment_type, attachment_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [id, caseId, visibility, input.authorKind, input.authorEmail, body, input.attachment?.key ?? null, input.attachment?.name ?? null, input.attachment?.type ?? null, input.attachment?.size ?? null, at] },
    { sql: `UPDATE partner_cases SET updated_at = ? WHERE id = ?`, params: [at, caseId] },
  ]);
  return { id };
}

// ---- quotes ----------------------------------------------------------------

export interface QuoteInput { title?: unknown; lines: unknown; includes?: unknown; excludes?: unknown; onsiteNote?: unknown; cancelTerms?: unknown; confirmationNote?: unknown; validUntil?: unknown; paymentMode?: unknown; experience?: unknown }
const LINE_KINDS: LineKind[] = ["base", "addon", "arrangement", "onsite"];
export function parseQuoteLines(v: unknown): QuoteLine[] {
  const raw = Array.isArray(v) ? v : [];
  const lines = raw.map((l): QuoteLine => {
    const o = (l && typeof l === "object" ? l : {}) as Record<string, unknown>;
    const kind = str(o.kind, 20) as LineKind, unit = int(o.unitJpy), qty = int(o.quantity) ?? 1, tax = int(o.taxRateBp) ?? 1000;
    if (!LINE_KINDS.includes(kind) || unit === null || unit < 0 || qty < 1 || qty > 99 || tax < 0 || tax > 3000) throw bad("bad_line");
    const description = str(o.description, 200);
    if (!description) throw bad("bad_line", "明細の内容を入力してください");
    return { kind, description, quantity: qty, unitJpy: unit, grossJpy: unit * qty, taxRateBp: tax, commissionable: o.commissionable === true && kind !== "onsite" };
  });
  if (!lines.length) throw bad("lines_required");
  return lines;
}
const chargedTotal = (lines: QuoteLine[]) => lines.filter((l) => l.kind !== "onsite").reduce((s, l) => s + l.grossJpy, 0);
const onsiteTotal = (lines: QuoteLine[]) => lines.filter((l) => l.kind === "onsite").reduce((s, l) => s + l.grossJpy, 0);
export const DEFAULT_QUOTE_DAYS = 7;

/** A new draft version. Sharing it is a separate, deliberate step. */
export async function createQuote(db: SqlDb, caseId: string, input: QuoteInput & { by: string }, now = Date.now()) {
  const c = await getCase(db, caseId);
  if (CLOSED_CASE_STATUSES.includes(c.status) || c.status === "confirmed") throw bad("case_closed");
  if (c.status === "paid") throw bad("already_paid", "決済済みの案件に新しい見積もりは作れません。返金・差額は予約台帳で処理してください");
  const slug = str(input.experience, 80) || c.experience_slug;
  if (!slug || !experienceOptions().some((x) => x.slug === slug)) throw bad("experience_required", "見積もりには対象の体験が必要です");
  const lines = parseQuoteLines(input.lines);
  const mode = str(input.paymentMode, 10) as PaymentMode;
  const paymentMode: PaymentMode = ["stripe", "external", "none"].includes(mode) ? mode : chargedTotal(lines) > 0 ? "stripe" : "none";
  if (paymentMode === "stripe" && chargedTotal(lines) <= 0) throw bad("bad_total", "オンライン決済には決済対象の金額が必要です");
  const validUntil = isoDate(input.validUntil) ?? jstDate(now + DEFAULT_QUOTE_DAYS * 86400000);
  if (validUntil < jstDate(now)) throw bad("bad_valid_until");
  const last = await db.first<{ v: number | null }>(`SELECT MAX(version) AS v FROM case_quotes WHERE case_id = ?`, [caseId]);
  const id = randomId(), at = now_(now), version = (last?.v ?? 0) + 1;
  const statements: SqlStatement[] = [
    { sql: `INSERT INTO case_quotes (id, case_id, version, status, title, lines_json, total_jpy, onsite_jpy, includes, excludes, onsite_note, cancel_terms, confirmation_note, valid_until, payment_mode, created_by, created_at)
            VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [id, caseId, version, str(input.title, 200) || experienceTitle(slug, c.lang && isLang(c.lang) ? c.lang : "en"), JSON.stringify(lines), chargedTotal(lines), onsiteTotal(lines), str(input.includes, 2000) || null, str(input.excludes, 2000) || null, str(input.onsiteNote, 1000) || null, str(input.cancelTerms, 2000) || null, str(input.confirmationNote, 1000) || null, validUntil, paymentMode, input.by, at] },
    audit(input.by, "quote.create", caseId, null, { quote: id, version, total: chargedTotal(lines) }, at),
  ];
  if (slug !== c.experience_slug) statements.push({ sql: `UPDATE partner_cases SET experience_slug = ?, kind = 'experience', extra_json = CASE WHEN ? THEN extra_json ELSE NULL END, updated_at = ? WHERE id = ?`, params: [slug, extraFieldsFor(slug).length > 0 ? 1 : 0, at, caseId] });
  await db.batch(statements);
  return { id, version };
}

export interface StripeEnv { STRIPE_CHECKOUT_KEY?: string; STRIPE_READ_KEY?: string; KH_ENV?: string }
const STRIPE_VERSION = "2026-08-26.dahlia";
const stripeConfigured = (env: StripeEnv) => !!env.STRIPE_CHECKOUT_KEY;

/** Ask Stripe to close a Checkout session so an old quote cannot be paid (要件 6). Best effort: a session that is already gone is fine. */
export async function expireStripeSession(env: StripeEnv, sessionId: string | null, fetchImpl: typeof fetch = fetch): Promise<"expired" | "skipped" | "failed"> {
  if (!sessionId || !stripeConfigured(env)) return "skipped";
  try {
    const r = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${sessionId}/expire`, { method: "POST", headers: { authorization: `Bearer ${env.STRIPE_CHECKOUT_KEY}`, "Stripe-Version": STRIPE_VERSION }, signal: AbortSignal.timeout(15000) });
    if (r.ok) return "expired";
    const body = await r.json().catch(() => ({})) as { error?: { code?: string } };
    // Already complete or expired: nothing left to close.
    return r.status === 400 && body.error?.code === "checkout_session_not_open" ? "expired" : "failed";
  } catch { return "failed"; }
}

/** The settlement profile that currently covers the site, for the ledger entry. */
async function profileOfSite(db: SqlDb, siteId: string, now: number): Promise<string | null> {
  const today = jstDate(now);
  const p = await db.first<{ profile_id: string }>(`SELECT ph.profile_id FROM settlement_profile_hotels ph JOIN settlement_profiles p ON p.id = ph.profile_id WHERE ph.hotel_id = ? AND ph.valid_from <= ? AND (ph.valid_to IS NULL OR ph.valid_to > ?) AND p.valid_from <= ? AND (p.valid_to IS NULL OR p.valid_to > ?) ORDER BY ph.valid_from DESC LIMIT 1`, [siteId, today, today, today, today]);
  return p?.profile_id ?? null;
}
export const quoteReference = (quoteId: string) => `KJ-C-${quoteId}`;
export const isQuoteReference = (v: unknown): v is string => typeof v === "string" && /^KJ-C-[A-Za-z0-9_-]{16,32}$/.test(v);
const toNewLines = (lines: QuoteLine[]): NewLine[] => lines.map((l) => ({ kind: l.kind, description: l.description, commissionable: l.commissionable, taxRateBp: l.taxRateBp, quantity: l.quantity, grossJpy: l.grossJpy }));

/** Share a draft with the customer: the previous shared version is superseded
 *  and its Checkout session closed; the reservation is created (or its lines
 *  replaced) with the case's attribution; a share token is issued. */
export async function shareQuote(db: SqlDb, env: StripeEnv, quoteId: string, input: { by: string }, now = Date.now(), fetchImpl: typeof fetch = fetch) {
  const q = await getQuote(db, quoteId);
  if (q.status !== "draft") throw bad("not_draft");
  const c = await getCase(db, q.case_id);
  if (CLOSED_CASE_STATUSES.includes(c.status) || ["paid", "confirmed"].includes(c.status)) throw bad("case_closed");
  if (!c.experience_slug) throw bad("experience_required");
  if (q.valid_until && q.valid_until < jstDate(now)) throw bad("bad_valid_until", "有効期限が過ぎています。新しい版を作成してください");
  const at = now_(now);
  const lines = parseLines(q.lines_json);
  // Close the version that was shared before, and its payment session, before the new one goes out.
  const prev = await db.all<QuoteRow>(`SELECT * FROM case_quotes WHERE case_id = ? AND status = 'shared'`, [q.case_id]);
  let expire: "expired" | "skipped" | "failed" = "skipped";
  for (const p of prev) {
    const r = await expireStripeSession(env, p.stripe_session_id, fetchImpl);
    if (r === "failed") expire = "failed"; else if (r === "expired" && expire !== "failed") expire = "expired";
    await db.batch([
      { sql: `UPDATE case_quotes SET status = 'superseded', superseded_at = ?, checkout_url = NULL WHERE id = ?`, params: [at, p.id] },
      audit(input.by, "quote.supersede", q.case_id, null, { quote: p.id, version: p.version, stripeSession: p.stripe_session_id, expire: r }, at),
    ]);
  }
  // The reservation: one per case, attributed to the case's site from the start.
  let reservationId = c.reservation_id;
  const ref = quoteReference(q.id);
  if (!reservationId) {
    const r = await createReservation(db, {
      requestId: `case:${c.id}`, externalRef: ref, flow: GOLF_SLUGS.includes(c.experience_slug) ? "golf" : "experience", experienceSlug: c.experience_slug,
      experienceDate: c.preferred_date ?? undefined, guests: c.guests ?? undefined, lang: c.lang ?? undefined, lines: toNewLines(lines), amountPending: q.payment_mode === "none" && chargedTotal(lines) === 0,
    }, { basis: "case", caseId: c.id, hotelId: c.site_id, chainProfileId: await profileOfSite(db, c.site_id, now) }, now);
    reservationId = r.id;
    await db.run(`UPDATE partner_cases SET reservation_id = ? WHERE id = ?`, [reservationId, c.id]);
  } else {
    const res = await db.first<{ payment_status: string }>(`SELECT payment_status FROM reservations WHERE id = ?`, [reservationId]);
    if (res && res.payment_status !== "unpaid") throw bad("already_paid");
    const policy = await policyFor(db, c.experience_slug, now, c.site_id);
    const statements: SqlStatement[] = [{ sql: `DELETE FROM reservation_lines WHERE reservation_id = ?`, params: [reservationId] }];
    lines.forEach((l, i) => statements.push({
      sql: `INSERT INTO reservation_lines (id, reservation_id, position, kind, description, commissionable, tax_rate_bp, quantity, gross_jpy, discount_jpy, refunded_gross_jpy, net_jpy, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'manual')`,
      params: [randomId(), reservationId, i, l.kind, l.description, l.commissionable ? 1 : 0, l.taxRateBp ?? policy?.tax_rate_bp ?? 1000, l.quantity, l.grossJpy, netFromGross(l.grossJpy, l.taxRateBp ?? policy?.tax_rate_bp ?? 1000)],
    }));
    statements.push({ sql: `UPDATE reservations SET external_ref = ?, experience_slug = ?, experience_date = ?, guests = ?, amount_status = ?, updated_at = ? WHERE id = ?`, params: [ref, c.experience_slug, c.preferred_date, c.guests, chargedTotal(lines) > 0 || q.payment_mode !== "none" ? "known" : "pending", at, reservationId] });
    await db.batch(statements);
    await recomputeCommission(db, reservationId, input.by, now);
  }
  const token = randomId() + randomId().slice(0, 10);
  const status: CaseStatus = q.payment_mode === "stripe" ? "awaiting_payment" : "proposed";
  await db.batch([
    { sql: `UPDATE case_quotes SET status = 'shared', share_token = ?, shared_at = ? WHERE id = ?`, params: [token, at, q.id] },
    { sql: `UPDATE partner_cases SET status = ?, status_reason = NULL, updated_at = ? WHERE id = ?`, params: [status, at, c.id] },
    audit(input.by, "quote.share", c.id, null, { quote: q.id, version: q.version, total: q.total_jpy, paymentMode: q.payment_mode }, at),
  ]);
  return { token, reservationId, expire, superseded: prev.length };
}

/** Drop a draft or withdraw a shared version (its payment session closes). */
export async function voidQuote(db: SqlDb, env: StripeEnv, quoteId: string, input: { reason?: unknown; by: string }, now = Date.now(), fetchImpl: typeof fetch = fetch) {
  const q = await getQuote(db, quoteId);
  if (!["draft", "shared"].includes(q.status)) throw bad("not_open");
  const at = now_(now);
  const r = await expireStripeSession(env, q.stripe_session_id, fetchImpl);
  await db.batch([
    { sql: `UPDATE case_quotes SET status = 'void', expired_at = ?, checkout_url = NULL WHERE id = ?`, params: [at, q.id] },
    audit(input.by, "quote.void", q.case_id, str(input.reason, 500) || null, { quote: q.id, version: q.version, expire: r }, at),
  ]);
  if (q.status === "shared") await db.run(`UPDATE partner_cases SET status = 'checking', updated_at = ? WHERE id = ? AND status IN ('proposed','awaiting_payment','awaiting_customer')`, [at, q.case_id]);
  return { expire: r };
}

/** Shared quotes past their date close every night; the customer page says so and operations issue a new version. */
export async function expireQuotes(db: SqlDb, env: StripeEnv, now = Date.now(), fetchImpl: typeof fetch = fetch): Promise<number> {
  const rows = await db.all<QuoteRow>(`SELECT * FROM case_quotes WHERE status = 'shared' AND valid_until IS NOT NULL AND valid_until < ?`, [jstDate(now)]);
  const at = now_(now);
  for (const q of rows) {
    const r = await expireStripeSession(env, q.stripe_session_id, fetchImpl);
    await db.batch([
      { sql: `UPDATE case_quotes SET status = 'expired', expired_at = ?, checkout_url = NULL WHERE id = ? AND status = 'shared'`, params: [at, q.id] },
      audit("system", "quote.expire", q.case_id, null, { quote: q.id, version: q.version, expire: r }, at),
    ]);
  }
  return rows.length;
}

// ---- the customer's page and payment --------------------------------------

export interface CustomerQuoteView {
  state: "open" | "paid" | "expired" | "superseded" | "void";
  lang: Lang; title: string; experienceTitle: string; experienceSlug: string; date: string | null; guests: number | null;
  lines: { description: string; quantity: number; unitJpy: number; grossJpy: number; onsite: boolean }[]; totalJpy: number; onsiteJpy: number;
  includes: string | null; excludes: string | null; onsiteNote: string | null; cancelTerms: string | null; confirmationNote: string | null; validUntil: string | null;
  paymentMode: PaymentMode; canPay: boolean; customerName: string; version: number;
  /** When a newer version exists for the same case, its token, so the old link leads on. */
  newerToken: string | null;
}
/** What the customer sees (要件 6): never the commission, the partner, internal notes or the case reference (T-N05/T-N07). */
export async function quoteByToken(db: SqlDb, token: string, now = Date.now()): Promise<CustomerQuoteView | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const q = await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE share_token = ?`, [token]);
  if (!q) return null;
  const c = await getCase(db, q.case_id);
  const lang: Lang = c.lang && isLang(c.lang) ? c.lang : "en";
  const lines = parseLines(q.lines_json);
  const expired = q.status === "expired" || (q.status === "shared" && !!q.valid_until && q.valid_until < jstDate(now));
  const res = c.reservation_id ? await db.first<{ payment_status: string }>(`SELECT payment_status FROM reservations WHERE id = ?`, [c.reservation_id]) : null;
  const paid = q.status === "paid" || (q.status === "shared" && !!res && ["paid", "partially_refunded", "refunded", "disputed"].includes(res.payment_status));
  const state: CustomerQuoteView["state"] = paid ? "paid" : q.status === "superseded" ? "superseded" : q.status === "void" || CLOSED_CASE_STATUSES.includes(c.status) ? "void" : expired ? "expired" : "open";
  const newer = q.status === "superseded" ? await db.first<{ share_token: string }>(`SELECT share_token FROM case_quotes WHERE case_id = ? AND status IN ('shared','paid') AND version > ? ORDER BY version DESC LIMIT 1`, [c.id, q.version]) : null;
  return {
    state, lang, title: q.title, experienceTitle: experienceTitle(c.experience_slug, lang), experienceSlug: c.experience_slug ?? "", date: c.preferred_date, guests: c.guests,
    lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unitJpy: l.unitJpy, grossJpy: l.grossJpy, onsite: l.kind === "onsite" })), totalJpy: q.total_jpy, onsiteJpy: q.onsite_jpy,
    includes: q.includes, excludes: q.excludes, onsiteNote: q.onsite_note, cancelTerms: q.cancel_terms, confirmationNote: q.confirmation_note, validUntil: q.valid_until,
    paymentMode: q.payment_mode, canPay: state === "open" && q.payment_mode === "stripe" && q.total_jpy > 0, customerName: c.customer_name, version: q.version, newerToken: newer?.share_token ?? null,
  };
}

/** The customer presses "pay": a Checkout session for this version, reused while it is still open (Stripe closes them after 24 hours). */
export async function openQuoteCheckout(db: SqlDb, env: StripeEnv, token: string, origin: string, now = Date.now(), fetchImpl: typeof fetch = fetch): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const view = await quoteByToken(db, token, now);
  if (!view) return { ok: false, error: "not_found" };
  if (!view.canPay) return { ok: false, error: view.state === "open" ? "not_payable" : view.state };
  if (!stripeConfigured(env)) return { ok: false, error: "checkout_unavailable" };
  const q = (await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE share_token = ?`, [token]))!;
  const c = await getCase(db, q.case_id);
  if (q.checkout_url && q.stripe_session_created_at && now - Date.parse(q.stripe_session_created_at) < 23 * 3600000) return { ok: true, url: q.checkout_url };
  const lines = parseLines(q.lines_json).filter((l) => l.kind !== "onsite" && l.grossJpy > 0);
  const params = new URLSearchParams({
    mode: "payment", client_reference_id: quoteReference(q.id),
    success_url: `${origin}/${view.lang}/quote/${token}/?paid=1`, cancel_url: `${origin}/${view.lang}/quote/${token}/`,
    // Never past the quote's own date; Stripe allows at most 24 hours.
    expires_at: String(Math.min(Math.floor(now / 1000) + 24 * 3600 - 60, Math.floor(new Date(`${q.valid_until}T23:59:59+09:00`).getTime() / 1000))),
    "metadata[booking_flow]": "partner_case", "metadata[case_id]": c.id, "metadata[quote_id]": q.id, "metadata[quote_version]": String(q.version), "metadata[reservation_id]": c.reservation_id ?? "", "metadata[experience_slug]": c.experience_slug ?? "",
    "payment_intent_data[metadata][booking_flow]": "partner_case", "payment_intent_data[metadata][booking_reference]": quoteReference(q.id),
    "adaptive_pricing[enabled]": "false",
    ...(c.customer_email ? { customer_email: c.customer_email } : {}),
  });
  lines.forEach((l, i) => {
    params.set(`line_items[${i}][price_data][currency]`, "jpy");
    params.set(`line_items[${i}][price_data][unit_amount]`, String(l.unitJpy));
    params.set(`line_items[${i}][price_data][product_data][name]`, l.description.slice(0, 120));
    params.set(`line_items[${i}][quantity]`, String(l.quantity));
  });
  // A short-lived session must not be re-created under the same key once Stripe has closed it: the key carries the hour.
  const seq = Math.floor(now / (23 * 3600000));
  let s: { id?: string; url?: string | null; status?: string; livemode?: boolean; amount_total?: number; currency?: string };
  try {
    const r = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", { method: "POST", signal: AbortSignal.timeout(20000),
      headers: { authorization: `Bearer ${env.STRIPE_CHECKOUT_KEY}`, "content-type": "application/x-www-form-urlencoded", "Stripe-Version": STRIPE_VERSION, "Idempotency-Key": `case-quote-${q.id}-${seq}` }, body: params });
    if (!r.ok) return { ok: false, error: "checkout_unavailable" };
    s = await r.json();
  } catch { return { ok: false, error: "checkout_unavailable" }; }
  if (s.status !== "open" || !s.url || !s.id) return { ok: false, error: "checkout_unavailable" };
  const url = new URL(s.url);
  const liveExpected = env.KH_ENV !== "staging";
  if (s.livemode !== liveExpected || s.amount_total !== q.total_jpy || s.currency !== "jpy" || url.protocol !== "https:" || !["checkout.stripe.com", "book.stripe.com"].includes(url.hostname)) return { ok: false, error: "checkout_mismatch" };
  await db.run(`UPDATE case_quotes SET stripe_session_id = ?, stripe_session_created_at = ?, checkout_url = ? WHERE id = ?`, [s.id, now_(now), s.url, q.id]);
  return { ok: true, url: s.url };
}

/** After a payment landed on the reservation (lib/referral/stripe-events.ts or a manual entry): the quote and the case follow. */
export async function markCasePaid(db: SqlDb, input: { quoteId?: string | null; sessionId?: string | null; reservationId?: string | null }, now = Date.now()): Promise<{ caseId: string; quoteId: string } | null> {
  let q: QuoteRow | null = null;
  if (input.quoteId) q = await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE id = ?`, [input.quoteId]);
  if (!q && input.sessionId) q = await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE stripe_session_id = ?`, [input.sessionId]);
  if (!q && input.reservationId) {
    const c = await db.first<{ id: string }>(`SELECT id FROM partner_cases WHERE reservation_id = ?`, [input.reservationId]);
    if (c) q = await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE case_id = ? AND status IN ('shared','paid') ORDER BY version DESC LIMIT 1`, [c.id]);
  }
  if (!q) return null;
  const at = now_(now);
  await db.batch([
    { sql: `UPDATE case_quotes SET status = 'paid', paid_at = COALESCE(paid_at, ?) WHERE id = ? AND status IN ('shared','superseded','expired')`, params: [at, q.id] },
    { sql: `UPDATE partner_cases SET status = 'paid', status_reason = NULL, updated_at = ? WHERE id = ? AND status NOT IN ('confirmed','performed','cancelled','unavailable')`, params: [at, q.case_id] },
    audit("system", "case.paid", q.case_id, null, { quote: q.id, version: q.version, session: input.sessionId ?? null }, at),
  ]);
  return { caseId: q.case_id, quoteId: q.id };
}

/** Payment that did not go through Stripe (the shared-bus golf day is paid to the travel partner): operations record it against the shared quote. */
export async function recordExternalPayment(db: SqlDb, caseId: string, input: { amountJpy?: unknown; occurredAt?: unknown; reference?: unknown; reason: unknown; by: string }, now = Date.now()) {
  const c = await getCase(db, caseId);
  const q = await db.first<QuoteRow>(`SELECT * FROM case_quotes WHERE case_id = ? AND status = 'shared' ORDER BY version DESC LIMIT 1`, [caseId]);
  if (!q || !c.reservation_id) throw bad("no_shared_quote", "共有中の見積もりがありません");
  if (q.payment_mode === "stripe") throw bad("online_quote", "オンライン決済の見積もりは Stripe の通知で決済済みになります");
  const reason = str(input.reason, 500);
  if (!reason) throw bad("reason_required");
  const amount = int(input.amountJpy) ?? q.total_jpy;
  const occurredAt = typeof input.occurredAt === "string" && !Number.isNaN(Date.parse(input.occurredAt)) ? new Date(input.occurredAt).toISOString() : now_(now);
  if (amount > 0) await applyPayment(db, c.reservation_id, { eventId: `manual:${randomId()}`, clientReferenceId: str(input.reference, 120) || null, amountTotal: amount, amountSubtotal: amount, paymentStatus: "paid", livemode: true, occurredAt }, now);
  else await db.run(`UPDATE reservations SET payment_status = 'paid', amount_status = 'known', updated_at = ? WHERE id = ?`, [now_(now), c.reservation_id]);
  await db.run(audit(input.by, "case.payment.external", caseId, reason, { amount, reference: str(input.reference, 120) || null, occurredAt }).sql, audit(input.by, "case.payment.external", caseId, reason, {}).params as unknown[]);
  return markCasePaid(db, { quoteId: q.id }, now);
}

/** Operations confirm the booking once the venue holds the slot (要件 4: paid and confirmed are different facts). */
export async function confirmCase(db: SqlDb, caseId: string, input: { note?: unknown; by: string }, now = Date.now()) {
  const c = await getCase(db, caseId);
  if (!c.reservation_id) throw bad("no_reservation", "見積もりの共有前に予約確定はできません");
  if (CLOSED_CASE_STATUSES.includes(c.status)) throw bad("case_closed");
  const at = now_(now);
  await db.batch([
    { sql: `UPDATE reservations SET status = CASE WHEN status IN ('provisional','arranging') THEN 'confirmed' ELSE status END, updated_at = ? WHERE id = ?`, params: [at, c.reservation_id] },
    { sql: `UPDATE partner_cases SET status = 'confirmed', status_reason = ?, updated_at = ? WHERE id = ?`, params: [str(input.note, 500) || null, at, caseId] },
    audit(input.by, "case.confirm", caseId, str(input.note, 500) || null, { reservation: c.reservation_id }, at),
  ]);
}

// ---- views -----------------------------------------------------------------

interface ReservationSummary { id: string; hotel_ref: string | null; status: string; payment_status: string; amount_status: string; experience_date: string | null }
interface EntrySummary { base_net_jpy: number; rate_bp: number | null; commission_net_jpy: number; status: string; hold_reason: string | null }

/** The one status a partner reads, derived from the four axes (要件 5-3). */
export function displayStatus(c: Pick<CaseRow, "status">, res: ReservationSummary | null, quote: Pick<QuoteRow, "status" | "payment_mode"> | null): CaseStatus {
  if (["cancelled", "unavailable"].includes(c.status)) return c.status;
  if (res) {
    if (["cancelled", "no_show"].includes(res.status)) return "cancelled";
    if (res.status === "completed") return "performed";
    if (res.status === "confirmed") return "confirmed";
    if (["paid", "partially_refunded", "disputed"].includes(res.payment_status) || quote?.status === "paid") return "paid";
  }
  if (c.status === "paid" || c.status === "confirmed" || c.status === "performed") return c.status;
  if (quote?.status === "shared") return c.status === "awaiting_customer" ? c.status : quote.payment_mode === "stripe" ? "awaiting_payment" : "proposed";
  return c.status;
}

export interface CaseListRow { id: string; publicRef: string; partnerRef: string | null; siteId: string; siteName: string; kind: string; experienceSlug: string | null; experienceTitle: string; experienceTitleEn: string; preferredDate: string | null; guests: number | null; customerName: string; status: CaseStatus; statusJa: string; assignee: string | null; assignedOps: string | null; createdAt: string; updatedAt: string; quoteVersion: number | null; totalJpy: number | null }

export async function listCases(db: SqlDb, f: { siteIds?: string[]; userId?: string; status?: string; q?: string; open?: boolean; limit?: number; offset?: number }): Promise<{ rows: CaseListRow[]; total: number }> {
  const where: string[] = [], params: unknown[] = [];
  if (f.siteIds) { if (!f.siteIds.length) return { rows: [], total: 0 }; where.push(`c.site_id IN (${f.siteIds.map(() => "?").join(",")})`); params.push(...f.siteIds); }
  if (f.userId) { where.push(`(c.created_by_user_id = ? OR c.assignee_user_id = ?)`); params.push(f.userId, f.userId); }
  if (f.status && CASE_STATUSES.includes(f.status as CaseStatus)) { where.push(`c.status = ?`); params.push(f.status); }
  else if (f.open) where.push(`c.status NOT IN ('performed','cancelled','unavailable')`);
  if (f.q) { where.push(`(c.public_ref LIKE ? OR c.customer_name LIKE ? OR c.partner_ref LIKE ? OR c.customer_email LIKE ?)`); params.push(...Array(4).fill(`%${f.q.slice(0, 60)}%`)); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 200), offset = Math.max(f.offset ?? 0, 0);
  const [rows, total] = await Promise.all([
    db.all<CaseRow & { site_name: string; assignee_email: string | null; r_status: string | null; r_payment: string | null; r_amount: string | null; r_ref: string | null; q_status: QuoteStatus | null; q_mode: PaymentMode | null; q_version: number | null; q_total: number | null }>(
      `SELECT c.*, h.name AS site_name, u.email AS assignee_email, r.status AS r_status, r.payment_status AS r_payment, r.amount_status AS r_amount, r.hotel_ref AS r_ref,
              q.status AS q_status, q.payment_mode AS q_mode, q.version AS q_version, q.total_jpy AS q_total
         FROM partner_cases c JOIN hotels h ON h.id = c.site_id LEFT JOIN users u ON u.id = c.assignee_user_id LEFT JOIN reservations r ON r.id = c.reservation_id
         LEFT JOIN case_quotes q ON q.id = (SELECT id FROM case_quotes x WHERE x.case_id = c.id AND x.status IN ('shared','paid') ORDER BY x.version DESC LIMIT 1)
         ${w} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM partner_cases c ${w}`, params),
  ]);
  return {
    total: total?.n ?? 0,
    rows: rows.map((c) => {
      const st = displayStatus(c, c.r_status ? { id: c.reservation_id!, hotel_ref: c.r_ref, status: c.r_status, payment_status: c.r_payment!, amount_status: c.r_amount!, experience_date: null } : null, c.q_status ? { status: c.q_status, payment_mode: c.q_mode! } : null);
      return { id: c.id, publicRef: c.public_ref, partnerRef: c.partner_ref, siteId: c.site_id, siteName: c.site_name, kind: c.kind, experienceSlug: c.experience_slug, experienceTitle: experienceTitle(c.experience_slug), experienceTitleEn: experienceTitle(c.experience_slug, "en"), preferredDate: c.preferred_date, guests: c.guests, customerName: c.customer_name, status: st, statusJa: CASE_STATUS_JA[st], assignee: c.assignee_email, assignedOps: c.assigned_ops, createdAt: c.created_at, updatedAt: c.updated_at, quoteVersion: c.q_version, totalJpy: c.q_total };
    }),
  };
}

export interface QuoteView {
  id: string; version: number; status: QuoteStatus; statusJa: string; title: string; lines: QuoteLine[]; totalJpy: number; onsiteJpy: number;
  includes: string | null; excludes: string | null; onsiteNote: string | null; cancelTerms: string | null; confirmationNote: string | null; validUntil: string | null; paymentMode: PaymentMode; paymentModeJa: string;
  shareUrl: string | null; createdBy: string; createdAt: string; sharedAt: string | null; paidAt: string | null; stripeSessionId: string | null;
  /** Partner-only figures (要件 6): the commissionable base, the rate and the estimate. Never on the customer page. */
  commission: { baseNetJpy: number; rateBp: number | null; estimateNetJpy: number | null; policyMissing: boolean };
}
export interface CaseDetail {
  case: CaseRow & { siteName: string; sitePublicId: string; entityName: string; createdBy: string | null; assignee: string | null; experienceTitle: string; experienceTitleEn: string; altDates: string[]; extra: Record<string, string>; extraFields: ExtraField[]; statusJa: string; displayStatus: CaseStatus; displayStatusJa: string };
  quotes: QuoteView[];
  messages: (MessageRow & { visibilityJa: string })[];
  reservation: (ReservationSummary & { statusJa: string; paymentJa: string }) | null;
  entry: (EntrySummary & { statusJa: string; holdJa: string }) | null;
  members: { userId: string; email: string; name: string | null; role: string }[];
}

/** The case as a partner or operations see it. `viewer` decides which messages, and whether internal notes, come along. */
export async function caseDetail(db: SqlDb, id: string, viewer: "ops" | "partner", origin: string, now = Date.now()): Promise<CaseDetail> {
  const c = await db.first<CaseRow & { site_name: string; site_public_id: string; entity_name: string; created_by: string | null; assignee: string | null }>(
    `SELECT c.*, h.name AS site_name, h.public_id AS site_public_id, le.name AS entity_name, cu.email AS created_by, au.email AS assignee
       FROM partner_cases c JOIN hotels h ON h.id = c.site_id JOIN partner_legal_entities le ON le.id = c.legal_entity_id LEFT JOIN users cu ON cu.id = c.created_by_user_id LEFT JOIN users au ON au.id = c.assignee_user_id WHERE c.id = ?`, [id]);
  if (!c) throw notFound();
  const [quotes, messages, res, entry, members, policy] = await Promise.all([
    db.all<QuoteRow>(`SELECT * FROM case_quotes WHERE case_id = ? ORDER BY version DESC`, [id]),
    db.all<MessageRow>(viewer === "ops" ? `SELECT * FROM case_messages WHERE case_id = ? ORDER BY created_at` : `SELECT * FROM case_messages WHERE case_id = ? AND visibility != 'internal' ORDER BY created_at`, [id]),
    c.reservation_id ? db.first<ReservationSummary>(`SELECT id, hotel_ref, status, payment_status, amount_status, experience_date FROM reservations WHERE id = ?`, [c.reservation_id]) : Promise.resolve(null),
    c.reservation_id ? db.first<EntrySummary>(`SELECT base_net_jpy, rate_bp, commission_net_jpy, status, hold_reason FROM commission_entries WHERE reservation_id = ?`, [c.reservation_id]) : Promise.resolve(null),
    db.all<{ userId: string; email: string; name: string | null; role: string }>(`SELECT u.id AS userId, u.email, u.name, m.role FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.scope_type = 'hotel' AND m.scope_id = ? AND m.revoked_at IS NULL AND m.role IN ('partner_agent','partner_manager') AND u.status != 'disabled' ORDER BY u.email`, [c.site_id]),
    c.experience_slug ? policyFor(db, c.experience_slug, now, c.site_id) : Promise.resolve(null),
  ]);
  // Partners see what was shared with them; drafts, and drafts dropped before a share, stay with operations.
  const visible = viewer === "ops" ? quotes : quotes.filter((q) => q.status !== "draft" && !(q.status === "void" && !q.shared_at));
  const current = quotes.find((q) => ["shared", "paid"].includes(q.status)) ?? null;
  const st = displayStatus(c, res, current);
  const { site_name, site_public_id, entity_name, created_by, assignee, ...row } = c;
  return {
    case: { ...row, siteName: site_name, sitePublicId: site_public_id, entityName: entity_name, createdBy: created_by, assignee, experienceTitle: experienceTitle(c.experience_slug), experienceTitleEn: experienceTitle(c.experience_slug, "en"), altDates: parseJson<string[]>(c.alt_dates_json, []), extra: parseJson<Record<string, string>>(c.extra_json, {}), extraFields: extraFieldsFor(c.experience_slug), statusJa: CASE_STATUS_JA[c.status], displayStatus: st, displayStatusJa: CASE_STATUS_JA[st] },
    quotes: visible.map((q) => {
      const lines = parseLines(q.lines_json);
      const base = lines.filter((l) => l.commissionable).reduce((s, l) => s + netFromGross(l.grossJpy, l.taxRateBp), 0);
      return {
        id: q.id, version: q.version, status: q.status, statusJa: QUOTE_STATUS_JA[q.status], title: q.title, lines, totalJpy: q.total_jpy, onsiteJpy: q.onsite_jpy,
        includes: q.includes, excludes: q.excludes, onsiteNote: q.onsite_note, cancelTerms: q.cancel_terms, confirmationNote: q.confirmation_note, validUntil: q.valid_until, paymentMode: q.payment_mode, paymentModeJa: PAYMENT_MODE_JA[q.payment_mode],
        shareUrl: q.share_token && ["shared", "paid"].includes(q.status) ? `${origin}/${c.lang && isLang(c.lang) ? c.lang : "en"}/quote/${q.share_token}/` : null,
        createdBy: q.created_by, createdAt: q.created_at, sharedAt: q.shared_at, paidAt: q.paid_at, stripeSessionId: viewer === "ops" ? q.stripe_session_id : null,
        commission: { baseNetJpy: base, rateBp: policy?.rate_bp ?? null, estimateNetJpy: policy ? commissionNet([{ netJpy: base, rateBp: policy.rate_bp }]) : null, policyMissing: !policy },
      };
    }),
    messages: messages.map((m) => ({ ...m, visibilityJa: VISIBILITY_JA[m.visibility] })),
    reservation: res ? { ...res, statusJa: RESERVATION_STATUS_JA[res.status] ?? res.status, paymentJa: PAYMENT_STATUS_JA[res.payment_status] ?? res.payment_status } : null,
    entry: entry ? { ...entry, statusJa: ENTRY_STATUS_JA[entry.status] ?? entry.status, holdJa: entry.hold_reason ? entry.hold_reason.split(",").map((h) => HOLD_JA[h] ?? h).join("、") : "" } : null,
    members,
  };
}

/** Customer-visible attachments for the shared page, by token. */
export async function customerFiles(db: SqlDb, token: string): Promise<{ key: string; name: string; type: string; size: number | null; at: string }[]> {
  const q = await db.first<{ case_id: string }>(`SELECT case_id FROM case_quotes WHERE share_token = ?`, [token]);
  if (!q) return [];
  const rows = await db.all<MessageRow>(`SELECT * FROM case_messages WHERE case_id = ? AND visibility = 'customer' AND attachment_key IS NOT NULL ORDER BY created_at`, [q.case_id]);
  return rows.map((m) => ({ key: m.attachment_key!, name: m.attachment_name ?? "file", type: m.attachment_type ?? "application/octet-stream", size: m.attachment_size, at: m.created_at }));
}

/** Operations' overview counts for the cases page. */
export async function opsCaseCounts(db: SqlDb): Promise<Record<string, number>> {
  const rows = await db.all<{ status: string; n: number }>(`SELECT status, COUNT(*) AS n FROM partner_cases GROUP BY status`);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
