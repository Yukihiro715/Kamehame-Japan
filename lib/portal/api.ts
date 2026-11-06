/** The portal API: one entry point, routed by path, every handler scoped on
 *  the server. Mounted at /api/portal/<path> (app/api/portal/[...path]/route.ts).
 *
 *  Rules for every request (要件 12):
 *  - nothing works without the ledger database;
 *  - state changes need a same-origin Origin header and the x-kh-portal header
 *    (no cross-site form or fetch can add it);
 *  - the signed-in user comes from the session cookie and their memberships,
 *    read fresh each time; hotel users only ever see their own hotels. */
import { popularOverview, savePopularSetting } from "@/lib/popular";
import { isBucket, listReviewSubmissions, serveMedia } from "@/lib/review-media";
import { parseFeatures, requireFeature } from "./partner";
import * as cases from "./cases";
import { notifyCase } from "./case-notify";
import * as settle from "./settlement";
import { disputeResolvedMail, payoutPaidMail, sendPortalMail, statementIssuedMail } from "./mail";
import { d1Db, isD1Like, jstDate, type SqlDb } from "@/lib/referral/db";
import { CASE_ROLES, canSeeHotel, canSeeProfile, hasSiteRole, hotelIdsOf, inviteMember, opsRole, principalFromRequest, requestLoginCode, revokeMembership, disableUser, sessionCookie, signOut, verifyLoginCode, HOTEL_ROLES, OPS_ROLES, type Principal, type Role } from "./auth";
import { createLink, linksOfHotel, materialLinks, publicLinkUrl, setLinkStatus, MEDIUMS, type Medium } from "./links-admin";
import { experienceTerms, hotelDashboard, hotelReservations } from "./metrics";
import * as ops from "./ops";
import { busEnquiryDetail, busEnquiryList, busEnquiryResendPartner, busEnquirySetNote, busEnquirySetStatus } from "@/lib/golfpaq-ops";
import type { GolfpaqEnquiryEnv } from "@/lib/golfpaq-enquiry";
import { readGolfpaqSnapshot } from "@/lib/golfpaq";
import { courseList, loadAutoNames, saveCourse } from "@/lib/golf-courses-db";
import { qrPng, qrSvg } from "./qr";
import { ApiError, bad, forbidden, int, isoDate, json, notFound, presetPeriod, readJson, resolvePublicOrigin, str } from "./util";
import type { PortalMailEnv } from "./mail";

export type PortalEnv = PortalMailEnv & GolfpaqEnquiryEnv & cases.StripeEnv & { DB?: unknown; MEDIA?: unknown };

export async function handlePortalApi(request: Request, env: PortalEnv, path: string[]): Promise<Response> {
  try {
    if (!isD1Like(env.DB)) throw new ApiError(503, "ledger_unavailable");
    const db = d1Db(env.DB);
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (method !== "GET") {
      if (request.headers.get("origin") !== url.origin || request.headers.get("x-kh-portal") !== "1") throw forbidden();
    }
    const ctx: Ctx = { db, env, request, url, path, method, secure: url.protocol === "https:", origin: url.origin };
    const [head, ...rest] = path;
    // `return await`: a rejection from the handler must land in the catch below.
    if (head === "auth") return await auth(ctx, rest);
    if (head === "hotel") return await hotel(ctx, rest);
    if (head === "ops") return await opsApi(ctx, rest);
    throw notFound();
  } catch (err) {
    if (err instanceof ApiError) return json({ ok: false, error: err.code, message: err.message !== err.code ? err.message : undefined }, err.status);
    console.error("portal api", err instanceof Error ? err.message : err);
    return json({ ok: false, error: "internal" }, 500);
  }
}

interface Ctx { db: SqlDb; env: PortalEnv; request: Request; url: URL; path: string[]; method: string; secure: boolean; origin: string }

const q = (ctx: Ctx, name: string) => ctx.url.searchParams.get(name) ?? undefined;
function period(ctx: Ctx) {
  const preset = presetPeriod(q(ctx, "period") ?? "this_month");
  const from = isoDate(q(ctx, "from")), to = isoDate(q(ctx, "to"));
  if (from && to && from <= to) return { from, to };
  return preset ?? presetPeriod("this_month")!;
}
const publicOrigin = (ctx: Ctx) => resolvePublicOrigin(ctx.db, ctx.env, ctx.origin);

// ---- auth -------------------------------------------------------------------

async function auth(ctx: Ctx, path: string[]): Promise<Response> {
  const kind = (b: Record<string, unknown>) => (b.kind === "ops" ? "ops" : "hotel");
  if (ctx.method !== "POST") throw notFound();
  const body = await readJson(ctx.request);
  if (path[0] === "request-code") {
    const r = await requestLoginCode(ctx.db, ctx.env, { email: body.email, kind: kind(body) });
    return json({ ok: true, sent: r.sent, mail: r.mail, ...(r.devCode ? { devCode: r.devCode } : {}) });
  }
  if (path[0] === "verify") {
    const k = kind(body);
    const r = await verifyLoginCode(ctx.db, { email: body.email, code: body.code, kind: k });
    if (!r.ok || !r.token) return json({ ok: false, error: r.error }, 401);
    return json({ ok: true, expiresAt: r.expiresAt }, 200, { "set-cookie": sessionCookie(k, r.token, ctx.secure) });
  }
  if (path[0] === "signout") {
    const k = kind(body);
    await signOut(ctx.db, ctx.request, k);
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(k, "", ctx.secure) });
  }
  throw notFound();
}

// ---- hotel portal -----------------------------------------------------------

async function requireHotelUser(ctx: Ctx): Promise<Principal> {
  const p = await principalFromRequest(ctx.db, ctx.request, "hotel");
  if (!p) throw new ApiError(401, "unauthenticated");
  return p;
}
function hotelScope(ctx: Ctx, p: Principal, body?: Record<string, unknown>): string {
  const ids = hotelIdsOf(p);
  const want = q(ctx, "hotel") ?? (body && typeof body.hotel === "string" ? body.hotel : undefined);
  if (want) { if (!canSeeHotel(p, want)) throw forbidden(); return want; }
  if (!ids.length) throw forbidden();
  return ids[0];
}

/** Billing contacts of every site a settlement profile covers, for statement notices. */
async function billingRecipients(ctx: Ctx, profileId: string): Promise<{ emails: string[]; entityName: string }> {
  const rows = await ctx.db.all<{ email: string }>(
    `SELECT DISTINCT u.email FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.role = 'hotel_billing' AND m.scope_type = 'hotel' AND m.revoked_at IS NULL AND u.status != 'disabled'
        AND m.scope_id IN (SELECT hotel_id FROM settlement_profile_hotels WHERE profile_id = ? AND (valid_to IS NULL OR valid_to > ?))`, [profileId, jstDate()]);
  const le = await ctx.db.first<{ name: string; contact_email: string | null }>(`SELECT le.name, le.contact_email FROM settlement_profiles p JOIN partner_legal_entities le ON le.id = p.legal_entity_id WHERE p.id = ?`, [profileId]);
  const emails = rows.map((r) => r.email);
  if (!emails.length && le?.contact_email) emails.push(le.contact_email);
  return { emails, entityName: le?.name ?? "" };
}
const csvResponse = (csv: string, name: string) => new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" } });
/** Sites of a statement's profile the user may see at all. */
async function statementVisible(ctx: Ctx, p: Principal, statementId: string): Promise<{ s: settle.StatementRow; billing: boolean }> {
  const s = await settle.getStatement(ctx.db, statementId);
  if (s.status === "draft") throw notFound();
  const sites = await ctx.db.all<{ hotel_id: string }>(`SELECT hotel_id FROM settlement_profile_hotels WHERE profile_id = ?`, [s.profile_id]);
  if (!sites.some((h) => canSeeHotel(p, h.hotel_id))) throw notFound();
  for (const h of sites) if (canSeeHotel(p, h.hotel_id)) await requireFeature(ctx.db, h.hotel_id, "settlement");
  return { s, billing: await canSeeProfile(ctx.db, p, s.profile_id) };
}

async function hotel(ctx: Ctx, path: string[]): Promise<Response> {
  const p = await requireHotelUser(ctx);
  const [head, sub] = path;
  if (head === "me" && ctx.method === "GET") {
    const ids = hotelIdsOf(p);
    const hotels = ids.length ? await ctx.db.all<{ id: string; name: string; public_id: string; status: string; brochure_url: string | null; site_kind: string; features_json: string | null }>(`SELECT id, name, public_id, status, brochure_url, site_kind, features_json FROM hotels WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY name`, ids) : [];
    return json({ ok: true, user: { email: p.email, name: p.name }, memberships: p.memberships, hotels: hotels.map(({ features_json, ...h }) => ({ ...h, features: parseFeatures(features_json) })) });
  }
  if (head === "dashboard" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    return json({ ok: true, hotel: hotelId, ...(await hotelDashboard(ctx.db, hotelId, period(ctx))) });
  }
  if (head === "experiences" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    const options = new Map(cases.experienceOptions().map((o) => [o.slug, o]));
    const features = parseFeatures((await ctx.db.first<{ features_json: string | null }>(`SELECT features_json FROM hotels WHERE id = ?`, [hotelId]))?.features_json);
    const relay = features.cases && hasSiteRole(p, hotelId, ...CASE_ROLES);
    const experiences = (await experienceTerms(ctx.db)).map((e) => { const o = options.get(e.slug); const mode = o?.bookingMode ?? "request"; return { ...e, bookingMode: mode, bookingModeJa: cases.BOOKING_MODE_JA[mode] }; });
    return json({ ok: true, experiences, relay, busGolf: options.get(cases.BUS_GOLF_SLUG) ?? null });
  }
  if (head === "reservations" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    const f = { from: isoDate(q(ctx, "from")) ?? undefined, to: isoDate(q(ctx, "to")) ?? undefined, experienceFrom: isoDate(q(ctx, "experienceFrom")) ?? undefined, experienceTo: isoDate(q(ctx, "experienceTo")) ?? undefined, experience: q(ctx, "experience"), status: q(ctx, "status"), ref: q(ctx, "ref"), limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined };
    return json({ ok: true, hotel: hotelId, ...(await hotelReservations(ctx.db, hotelId, f)) });
  }
  if (head === "materials") {
    const body = ctx.method === "POST" ? await readJson(ctx.request) : {};
    const hotelId = hotelScope(ctx, p, body);
    await requireFeature(ctx.db, hotelId, "refer");
    const origin = await publicOrigin(ctx);
    if (ctx.method === "POST") {
      // Create (or fetch) the pair of links for one target.
      const slug = str(body.experience, 80) || null;
      const pair = await materialLinks(ctx.db, hotelId, slug, p.email);
      return json({ ok: true, qr: { id: pair.qr.id, url: publicLinkUrl(origin, pair.qr.token) }, url: { id: pair.url.id, url: publicLinkUrl(origin, pair.url.token) } });
    }
    const h = await ctx.db.first<{ brochure_url: string | null; name: string }>(`SELECT brochure_url, name FROM hotels WHERE id = ?`, [hotelId]);
    const links = (await linksOfHotel(ctx.db, hotelId)).filter((l) => l.status === "active").map((l) => ({ id: l.id, experience: l.experience_slug, medium: l.medium, kind: l.kind, label: l.label, url: publicLinkUrl(origin, l.token), createdAt: l.created_at }));
    return json({ ok: true, hotel: hotelId, hotelName: h?.name, brochureUrl: h?.brochure_url ?? null, links });
  }
  if (head === "qr" && ctx.method === "GET") {
    const link = await ctx.db.first<{ id: string; token: string; hotel_id: string | null }>(`SELECT id, token, hotel_id FROM referral_links WHERE id = ?`, [q(ctx, "link") ?? ""]);
    if (!link || !link.hotel_id || !canSeeHotel(p, link.hotel_id)) throw notFound();
    return qrResponse(publicLinkUrl(await publicOrigin(ctx), link.token), q(ctx, "format"), `kamehame-${link.id}`);
  }
  if (head === "settlement" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    await requireFeature(ctx.db, hotelId, "settlement");
    const dash = await hotelDashboard(ctx.db, hotelId, presetPeriod("this_quarter")!);
    const profile = await ctx.db.first<{ id: string; name: string; min_payout_jpy: number; bank_details_masked: string | null; dispute_days: number; fee_borne_by: string; bank_fee_jpy: number }>(
      `SELECT p.id, p.name, p.min_payout_jpy, p.bank_details_masked, p.dispute_days, p.fee_borne_by, p.bank_fee_jpy FROM settlement_profile_hotels ph JOIN settlement_profiles p ON p.id = ph.profile_id WHERE ph.hotel_id = ? AND (ph.valid_to IS NULL OR ph.valid_to > ?) ORDER BY ph.valid_from DESC LIMIT 1`, [hotelId, jstDate()]);
    const statements = profile ? await settle.statementsOfProfiles(ctx.db, [profile.id]) : [];
    return json({ ok: true, hotel: hotelId, balance: dash.balance, profile, billing: profile ? await canSeeProfile(ctx.db, p, profile.id) : false, statements });
  }
  if (head === "statements" && sub) {
    const [, id, action] = path;
    const { s, billing } = await statementVisible(ctx, p, id);
    if (!action && ctx.method === "GET") { const d = await settle.statementDetail(ctx.db, id); return json({ ok: true, ...d, billing }); }
    if (action === "csv" && ctx.method === "GET") return csvResponse(settle.statementCsv(await settle.statementDetail(ctx.db, id)), `kamehame-statement-${s.period}.csv`);
    if (!billing) throw forbidden();
    if (action === "acknowledge" && ctx.method === "POST") { await settle.acknowledgeStatement(ctx.db, id, p.email); return json({ ok: true }); }
    if (action === "dispute" && ctx.method === "POST") { const b = await readJson(ctx.request); return json({ ok: true, ...(await settle.raiseDispute(ctx.db, id, { reason: b.reason, itemId: b.itemId, by: p.email })) }); }
  }
  if (head === "case-options" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    await requireCaseRole(ctx, p, hotelId);
    const members = await ctx.db.all<{ userId: string; email: string; name: string | null; role: string }>(`SELECT u.id AS userId, u.email, u.name, m.role FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.scope_type = 'hotel' AND m.scope_id = ? AND m.revoked_at IS NULL AND m.role IN ('partner_agent','partner_manager') AND u.status != 'disabled' ORDER BY u.email`, [hotelId]);
    return json({ ok: true, hotel: hotelId, experiences: cases.experienceOptions(), members, me: p.userId });
  }
  if (head === "cases" && !sub) {
    if (ctx.method === "GET") {
      const hotelId = hotelScope(ctx, p);
      await requireCaseRole(ctx, p, hotelId);
      const own = !hasSiteRole(p, hotelId, "partner_manager");
      return json({ ok: true, hotel: hotelId, manager: !own, ...(await cases.listCases(ctx.db, { siteIds: [hotelId], userId: own ? p.userId : undefined, status: q(ctx, "status"), q: q(ctx, "q"), open: q(ctx, "open") === "1", limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined })) });
    }
    if (ctx.method === "POST") {
      const b = await readJson(ctx.request);
      const hotelId = hotelScope(ctx, p, b);
      await requireCaseRole(ctx, p, hotelId);
      const r = await cases.createCase(ctx.db, { ...(b as unknown as cases.NewCaseInput), siteId: hotelId, userId: p.userId, by: p.email });
      const mails = await notifyCase(ctx.db, ctx.env, r.id, await publicOrigin(ctx), { kind: "created" });
      return json({ ok: true, ...r, mails });
    }
  }
  if (head === "cases" && sub) {
    const [, id, action] = path;
    const c = await cases.caseForPartner(ctx.db, p, id);
    await requireFeature(ctx.db, c.site_id, "cases");
    const origin = await publicOrigin(ctx);
    if (!action && ctx.method === "GET") return json({ ok: true, ...(await cases.caseDetail(ctx.db, id, "partner", origin)) });
    if (ctx.method !== "POST") throw notFound();
    const b = await readJson(ctx.request);
    if (action === "update") { await cases.updateCase(ctx.db, id, { ...(b as Partial<cases.NewCaseInput>), by: p.email, actor: "partner" }); return json({ ok: true, ...(await cases.caseDetail(ctx.db, id, "partner", origin)) }); }
    if (action === "cancel") { await cases.setCaseStatus(ctx.db, id, { status: "cancelled", reason: b.reason, by: p.email, actor: "partner" }); return json({ ok: true, ...(await cases.caseDetail(ctx.db, id, "partner", origin)) }); }
    if (action === "message") {
      const attachment = b.attachment && typeof b.attachment === "object" ? b.attachment as { key: string; name: string; type: string; size: number } : null;
      await cases.addMessage(ctx.db, id, { visibility: b.visibility ?? "partner", authorKind: "partner", authorEmail: p.email, body: b.body, attachment });
      const mails = await notifyCase(ctx.db, ctx.env, id, origin, { kind: "message", from: "partner", excerpt: str(b.body, 300), attachmentName: attachment?.name ?? null });
      return json({ ok: true, mails, ...(await cases.caseDetail(ctx.db, id, "partner", origin)) });
    }
    if (action === "upload") return json({ ok: true, file: await cases.putCaseFile(isBucket(ctx.env.MEDIA) ? ctx.env.MEDIA : null, id, ctx.request) });
    throw notFound();
  }
  if (head === "case-file" && ctx.method === "GET") {
    // An attachment: the key names its case, and the message that carries it must be visible to a partner.
    const key = q(ctx, "key") ?? "";
    const m = await ctx.db.first<{ case_id: string; visibility: string }>(`SELECT case_id, visibility FROM case_messages WHERE attachment_key = ?`, [key]);
    if (!m || m.visibility === "internal" || !cases.isCaseFileKeyFor(key, m.case_id)) throw notFound();
    await cases.caseForPartner(ctx.db, p, m.case_id);
    const bucket = isBucket(ctx.env.MEDIA) ? ctx.env.MEDIA : null;
    if (!bucket) throw new ApiError(503, "media_unavailable");
    return await serveMedia(bucket, key, q(ctx, "download") === "1", cases.CASE_FILE_PREFIX);
  }
  void sub;
  throw notFound();
}

/** The booking relay needs the site's `cases` feature and one of the two relay roles (docs/PARTNER_PLATFORM_STAGE1.md 4.2). */
async function requireCaseRole(ctx: Ctx, p: Principal, hotelId: string) {
  await requireFeature(ctx.db, hotelId, "cases");
  if (!hasSiteRole(p, hotelId, ...CASE_ROLES)) throw forbidden();
}

async function qrResponse(text: string, format: string | undefined, name: string): Promise<Response> {
  const headers = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" };
  if (format === "png") {
    const png = await qrPng(text, { scale: 12, margin: 4 });
    return new Response(png as BodyInit, { headers: { ...headers, "content-type": "image/png", "content-disposition": `attachment; filename="${name}.png"` } });
  }
  return new Response(qrSvg(text, { size: 1024 }), { headers: { ...headers, "content-type": "image/svg+xml; charset=utf-8", "content-disposition": format === "download" ? `attachment; filename="${name}.svg"` : "inline" } });
}

// ---- operations portal ------------------------------------------------------

async function requireOps(ctx: Ctx, ...roles: Role[]): Promise<Principal> {
  const p = await principalFromRequest(ctx.db, ctx.request, "ops");
  if (!p) throw new ApiError(401, "unauthenticated");
  if (!opsRole(p, ...roles)) throw forbidden();
  return p;
}
const ADMIN: Role[] = ["ops_admin"];
const BOOKING: Role[] = ["ops_admin", "ops_booking"];
const FINANCE: Role[] = ["ops_admin", "ops_finance"];

async function opsApi(ctx: Ctx, path: string[]): Promise<Response> {
  const [head, id, action] = path;
  const get = ctx.method === "GET", post = ctx.method === "POST";
  if (head === "me" && get) { const p = await requireOps(ctx); return json({ ok: true, user: { email: p.email, name: p.name }, roles: p.memberships.map((m) => m.role) }); }
  if (head === "golf-courses") {
    // Display names for the courses on the shared-bus schedule (docs/GOLFPAQ_BUS_TOURS.md).
    if (get) {
      await requireOps(ctx);
      const snapshot = await readGolfpaqSnapshot(ctx.env.READY_STATE);
      const counts = new Map<string, number>();
      for (const t of snapshot?.tours ?? []) counts.set(t.course, (counts.get(t.course) ?? 0) + 1);
      return json({ ok: true, courses: await courseList(ctx.db, [...counts].map(([name, tours]) => ({ name, tours })), await loadAutoNames(ctx.env.READY_STATE)), updatedAt: snapshot?.updatedAt ?? null });
    }
    if (post) {
      const p = await requireOps(ctx, ...BOOKING);
      const b = await readJson(ctx.request);
      try { await saveCourse(ctx.db, { name: b.name, name_en: b.name_en, name_ja: b.name_ja, name_es: b.name_es, name_fr: b.name_fr, name_zh_tw: b.name_zh_tw, area: b.area, note: b.note, by: p.email }); }
      catch (e) { throw bad(e instanceof Error ? e.message : "bad_request"); }
      return json({ ok: true });
    }
  }
  if (head === "reviews" && get) {
    // Guest reviews with photos and videos, as kept beside the files in the MEDIA bucket (lib/review-media.ts).
    await requireOps(ctx);
    const bucket = isBucket(ctx.env.MEDIA) ? ctx.env.MEDIA : null;
    return json({ ok: true, configured: !!bucket, rows: bucket ? await listReviewSubmissions(bucket) : [] });
  }
  if (head === "media" && get) {
    await requireOps(ctx);
    const bucket = isBucket(ctx.env.MEDIA) ? ctx.env.MEDIA : null;
    if (!bucket) throw new ApiError(503, "media_unavailable");
    return await serveMedia(bucket, q(ctx, "key") ?? "", q(ctx, "download") === "1");
  }
  if (head === "settlement") {
    // Stage 4 (lib/portal/settlement.ts): the quarter close and the statements.
    if (get) { await requireOps(ctx); return json({ ok: true, ...(await settle.opsSettlementOverview(ctx.db)) }); }
    if (id === "close" && post) { const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request); return json({ ok: true, ...(await settle.closeQuarter(ctx.db, { period: b.period, by: p.email })) }); }
  }
  if (head === "statements" && id) {
    if (!action && get) { await requireOps(ctx); return json({ ok: true, ...(await settle.statementDetail(ctx.db, id)) }); }
    if (action === "csv" && get) { await requireOps(ctx); const d = await settle.statementDetail(ctx.db, id); return csvResponse(settle.statementCsv(d), `kamehame-statement-${d.statement.period}-v${d.statement.version}.csv`); }
    if (action === "issue" && post) {
      const p = await requireOps(ctx, ...FINANCE);
      const s = await settle.issueStatement(ctx.db, id, p.email);
      const { emails, entityName } = await billingRecipients(ctx, s.profile_id);
      const origin = await publicOrigin(ctx);
      const mails = await Promise.all(emails.map((to) => sendPortalMail(ctx.env, { to, ...statementIssuedMail({ entityName, period: s.period, grossJpy: s.gross_jpy, transferJpy: s.transfer_jpy, carriedOutJpy: s.carried_out_jpy, payDate: s.pay_date_jst, deadline: s.dispute_deadline_jst, url: `${origin}/hotel/settlement/${s.id}/` }) })));
      return json({ ok: true, statement: s, notified: emails.length, mails });
    }
    if (action === "void" && post) { const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request); await settle.voidStatement(ctx.db, id, { reason: b.reason, by: p.email }); return json({ ok: true }); }
  }
  if (head === "disputes" && id && action === "resolve" && post) {
    const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request);
    const d = await ctx.db.first<{ statement_id: string }>(`SELECT statement_id FROM statement_disputes WHERE id = ?`, [id]);
    if (!d) throw notFound();
    await settle.resolveDispute(ctx.db, id, { outcome: b.outcome, resolution: b.resolution, by: p.email });
    const s = await settle.getStatement(ctx.db, d.statement_id);
    const { emails, entityName } = await billingRecipients(ctx, s.profile_id);
    const origin = await publicOrigin(ctx);
    const mails = await Promise.all(emails.map((to) => sendPortalMail(ctx.env, { to, ...disputeResolvedMail({ entityName, period: s.period, outcome: b.outcome === "upheld" ? "upheld" : "rejected", resolution: str(b.resolution, 1000), url: `${origin}/hotel/settlement/${s.id}/` }) })));
    return json({ ok: true, mails });
  }
  if (head === "payouts") {
    if (!id && get) { await requireOps(ctx, ...FINANCE); return json({ ok: true, batches: await settle.payoutBatches(ctx.db) }); }
    if (!id && post) { const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request); return json({ ok: true, ...(await settle.createPayoutBatch(ctx.db, { payDate: b.payDate, by: p.email })) }); }
    if (id && !action && get) { await requireOps(ctx, ...FINANCE); return json({ ok: true, ...(await settle.payoutBatchDetail(ctx.db, id)) }); }
    if (id && action === "csv" && get) { const p = await requireOps(ctx, ...FINANCE); return csvResponse(await settle.payoutCsv(ctx.db, id, p.email), `kamehame-payouts-${id}.csv`); }
  }
  if (head === "payout-items" && id && action === "record" && post) {
    const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request);
    await settle.recordPayout(ctx.db, id, { status: b.status, reference: b.reference, paidAt: b.paidAt, note: b.note, by: p.email });
    let mails: string[] = [];
    if (b.status === "paid") {
      const po = await ctx.db.first<{ profile_id: string; statement_ids_json: string; transfer_jpy: number; paid_at: string | null; reference: string | null }>(`SELECT profile_id, statement_ids_json, transfer_jpy, paid_at, reference FROM payouts WHERE id = ?`, [id]);
      if (po) {
        const ids = JSON.parse(po.statement_ids_json) as string[];
        const periods = (await ctx.db.all<{ period: string }>(`SELECT period FROM statements WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY period`, ids)).map((r) => r.period);
        const { emails, entityName } = await billingRecipients(ctx, po.profile_id);
        const origin = await publicOrigin(ctx);
        mails = await Promise.all(emails.map((to) => sendPortalMail(ctx.env, { to, ...payoutPaidMail({ entityName, periods, transferJpy: po.transfer_jpy, paidAt: po.paid_at ?? jstDate(), reference: po.reference, url: `${origin}/hotel/settlement/` }) })));
      }
    }
    return json({ ok: true, mails });
  }
  if (head === "case-options" && get) { await requireOps(ctx); return json({ ok: true, experiences: cases.experienceOptions(), statuses: cases.MANUAL_CASE_STATUSES.map((s) => ({ value: s, label: cases.CASE_STATUS_JA[s] })) }); }
  if (head === "cases") {
    // The booking relay (lib/portal/cases.ts): every partner's cases, the quotes and the customer's page.
    if (!id && get) { await requireOps(ctx); return json({ ok: true, counts: await cases.opsCaseCounts(ctx.db), ...(await cases.listCases(ctx.db, { siteIds: q(ctx, "site") ? [q(ctx, "site")!] : undefined, status: q(ctx, "status"), q: q(ctx, "q"), open: q(ctx, "open") === "1", limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined })) }); }
    if (id && !action && get) { await requireOps(ctx); const origin = await publicOrigin(ctx); return json({ ok: true, ...(await cases.caseDetail(ctx.db, id, "ops", origin)) }); }
    if (id && action && post) {
      // Money is a finance action; everything else on a case is booking operations.
      const p = await requireOps(ctx, ...(action === "payment" ? FINANCE : BOOKING));
      const origin = await publicOrigin(ctx);
      const detail = () => cases.caseDetail(ctx.db, id, "ops", origin);
      if (action === "upload") return json({ ok: true, file: await cases.putCaseFile(isBucket(ctx.env.MEDIA) ? ctx.env.MEDIA : null, id, ctx.request) });
      const b = await readJson(ctx.request);
      switch (action) {
        case "update": await cases.updateCase(ctx.db, id, { ...(b as Partial<cases.NewCaseInput>), assignedOps: b.assignedOps, by: p.email, actor: "ops" }); return json({ ok: true, ...(await detail()) });
        case "status": await cases.setCaseStatus(ctx.db, id, { status: b.status, reason: b.reason, by: p.email, actor: "ops" }); return json({ ok: true, ...(await detail()) });
        case "quote": { const r = await cases.createQuote(ctx.db, id, { ...(b as unknown as cases.QuoteInput), by: p.email }); return json({ ok: true, ...r, ...(await detail()) }); }
        case "message": {
          const attachment = b.attachment && typeof b.attachment === "object" ? b.attachment as { key: string; name: string; type: string; size: number } : null;
          await cases.addMessage(ctx.db, id, { visibility: b.visibility ?? "partner", authorKind: "ops", authorEmail: p.email, body: b.body, attachment });
          const mails = str(b.visibility, 10) === "internal" ? [] : await notifyCase(ctx.db, ctx.env, id, origin, { kind: "message", from: "ops", excerpt: str(b.body, 300), attachmentName: attachment?.name ?? null });
          return json({ ok: true, mails, ...(await detail()) });
        }
        case "payment": { const r = await cases.recordExternalPayment(ctx.db, id, { amountJpy: b.amountJpy, occurredAt: b.occurredAt, reference: b.reference, reason: b.reason, by: p.email }); const d = await detail(); const q0 = d.quotes.find((x) => x.id === r?.quoteId); const mails = r ? await notifyCase(ctx.db, ctx.env, id, origin, { kind: "paid", totalJpy: q0?.totalJpy ?? 0 }) : []; return json({ ok: true, mails, ...d }); }
        case "confirm": { await cases.confirmCase(ctx.db, id, { note: b.note, by: p.email }); const mails = await notifyCase(ctx.db, ctx.env, id, origin, { kind: "confirmed" }); return json({ ok: true, mails, ...(await detail()) }); }
      }
    }
  }
  if (head === "quotes" && id && action && post) {
    const p = await requireOps(ctx, ...BOOKING);
    const b = await readJson(ctx.request);
    const q0 = await cases.getQuote(ctx.db, id);
    const origin = await publicOrigin(ctx);
    if (action === "share") {
      const r = await cases.shareQuote(ctx.db, ctx.env, id, { by: p.email });
      const d = await cases.caseDetail(ctx.db, q0.case_id, "ops", origin);
      const shared = d.quotes.find((x) => x.id === id)!;
      const mails = await notifyCase(ctx.db, ctx.env, q0.case_id, origin, { kind: "quote_shared", totalJpy: shared.totalJpy, validUntil: shared.validUntil, paymentModeJa: shared.paymentModeJa, shareUrl: shared.shareUrl ?? "", toCustomer: b.notifyCustomer === true });
      return json({ ok: true, ...r, shareUrl: shared.shareUrl, mails, ...d });
    }
    if (action === "void") { const r = await cases.voidQuote(ctx.db, ctx.env, id, { reason: b.reason, by: p.email }); return json({ ok: true, ...r, ...(await cases.caseDetail(ctx.db, q0.case_id, "ops", origin)) }); }
  }
  if (head === "case-file" && get) {
    await requireOps(ctx);
    const key = q(ctx, "key") ?? "";
    const m = await ctx.db.first<{ case_id: string }>(`SELECT case_id FROM case_messages WHERE attachment_key = ?`, [key]);
    if (!m || !cases.isCaseFileKeyFor(key, m.case_id)) throw notFound();
    const bucket = isBucket(ctx.env.MEDIA) ? ctx.env.MEDIA : null;
    if (!bucket) throw new ApiError(503, "media_unavailable");
    return await serveMedia(bucket, key, q(ctx, "download") === "1", cases.CASE_FILE_PREFIX);
  }
  if (head === "popular") {
    // The home page's "Popular right now" order (lib/popular.ts).
    if (get) { await requireOps(ctx); return json({ ok: true, ...(await popularOverview(ctx.db)) }); }
    if (post) {
      const p = await requireOps(ctx, ...BOOKING);
      const b = await readJson(ctx.request);
      try { await savePopularSetting(ctx.db, { mode: b.mode, slugs: b.slugs, by: p.email }); } catch (e) { throw bad(e instanceof Error ? e.message : "bad_request"); }
      return json({ ok: true, ...(await popularOverview(ctx.db)) });
    }
  }
  if (head === "bus-tours") {
    // Shared-bus golf tour enquiries (docs/GOLFPAQ_BUS_TOURS.md): list, detail, status, note, partner re-send.
    if (!id && get) { await requireOps(ctx); return json({ ok: true, ...(await busEnquiryList(ctx.db, { status: q(ctx, "status"), q: q(ctx, "q"), limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined })) }); }
    if (id && !action && get) { await requireOps(ctx); return json({ ok: true, ...(await busEnquiryDetail(ctx.db, id)) }); }
    if (id && action && post) {
      const p = await requireOps(ctx, ...BOOKING);
      const b = await readJson(ctx.request);
      if (action === "status") await busEnquirySetStatus(ctx.db, id, { status: b.status, reason: b.reason, by: p.email });
      else if (action === "note") await busEnquirySetNote(ctx.db, id, { note: b.note, by: p.email });
      else if (action === "resend-partner") await busEnquiryResendPartner(ctx.db, ctx.env, id, p.email);
      else throw notFound();
      return json({ ok: true, ...(await busEnquiryDetail(ctx.db, id)) });
    }
  }
  if (head === "overview" && get) { await requireOps(ctx); return json({ ok: true, ...(await ops.overview(ctx.db)) }); }
  if (head === "exceptions" && get) { await requireOps(ctx); return json({ ok: true, ...(await ops.exceptions(ctx.db)) }); }
  if (head === "audit" && get) { await requireOps(ctx); return json({ ok: true, rows: await ops.auditList(ctx.db, { limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined, targetType: q(ctx, "type"), q: q(ctx, "q") }) }); }
  if (head === "export.csv" && get) {
    await requireOps(ctx, ...FINANCE);
    const from = isoDate(q(ctx, "from")), to = isoDate(q(ctx, "to"));
    if (!from || !to || from > to) throw bad("bad_period");
    const csv = await ops.exportCsv(ctx.db, { from, to, basis: q(ctx, "basis") });
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="kamehame-referrals-${from}-${to}.csv"`, "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" } });
  }
  if (head === "settings") {
    if (get) { await requireOps(ctx); return json({ ok: true, settings: await ops.settingsGet(ctx.db) }); }
    if (post) { const p = await requireOps(ctx, ...ADMIN); await ops.settingsSet(ctx.db, { values: (await readJson(ctx.request)).values, by: p.email }); return json({ ok: true, settings: await ops.settingsGet(ctx.db) }); }
  }
  if (head === "partners" && get) { await requireOps(ctx); return json({ ok: true, ...(await ops.partnerList(ctx.db)) }); }
  if (head === "legal-entities" && post) {
    const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request);
    if (id) { await ops.updateLegalEntity(ctx.db, id, { name: b.name, address: b.address, partnerType: b.partnerType, entityKind: b.entityKind, contactEmail: b.contactEmail, registrationStatus: b.registrationStatus, registrationNumber: b.registrationNumber, by: p.email }); return json({ ok: true }); }
    return json({ ok: true, ...(await ops.createLegalEntity(ctx.db, { name: b.name, address: b.address, registrationNumber: b.registrationNumber, partnerType: b.partnerType, entityKind: b.entityKind, contactEmail: b.contactEmail, withSite: b.withSite === true, features: b.features, by: p.email })) });
  }
  if (head === "profiles" && post) { const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request); return json({ ok: true, ...(await ops.createProfile(ctx.db, { legalEntityId: b.legalEntityId, name: b.name, hotelIds: b.hotelIds, validFrom: b.validFrom, by: p.email })) }); }
  if (head === "hotels") {
    if (!id && post) { const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request); return json({ ok: true, ...(await ops.createHotel(ctx.db, { legalEntityId: b.legalEntityId, name: b.name, publicId: b.publicId, siteKind: b.siteKind, features: b.features, withProfile: b.withProfile !== false, by: p.email })) }); }
    if (id && !action && get) { await requireOps(ctx); const d = await ops.hotelDetail(ctx.db, id); const origin = await publicOrigin(ctx); return json({ ok: true, ...d, links: d.links.map((l) => ({ ...l, url: publicLinkUrl(origin, l.token) })) }); }
    if (id && !action && post) { const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request); await ops.updateHotel(ctx.db, id, { status: b.status, brochureUrl: b.brochureUrl, notes: b.notes, name: b.name, siteKind: b.siteKind, features: b.features, reason: b.reason, by: p.email }); return json({ ok: true }); }
    if (id && action === "members" && post) {
      const p = await requireOps(ctx, ...ADMIN);
      const b = await readJson(ctx.request);
      const role = str(b.role, 20) as Role;
      if (!HOTEL_ROLES.includes(role)) throw bad("bad_role");
      const h = await ctx.db.first<{ name: string }>(`SELECT name FROM hotels WHERE id = ?`, [id]);
      if (!h) throw notFound();
      if (CASE_ROLES.includes(role)) await requireFeature(ctx.db, id, "cases");
      const r = await inviteMember(ctx.db, ctx.env, { email: b.email, name: b.name, role, scopeType: "hotel", scopeId: id, by: p.email, loginOrigin: await publicOrigin(ctx), scopeLabel: h.name });
      return json({ ok: true, ...r });
    }
    if (id && action === "links" && post) {
      const p = await requireOps(ctx, ...BOOKING);
      const b = await readJson(ctx.request);
      const medium = str(b.medium, 20) as Medium;
      if (!MEDIUMS.includes(medium)) throw bad("bad_medium");
      await requireFeature(ctx.db, id, "refer");
      const link = await createLink(ctx.db, { hotelId: id, experienceSlug: str(b.experience, 80) || null, medium, kind: b.kind === "url" ? "url" : "qr", label: str(b.label, 120) || null, by: p.email });
      return json({ ok: true, link: { ...link, url: publicLinkUrl(await publicOrigin(ctx), link.token) } });
    }
  }
  if (head === "members" && id && action === "revoke" && post) { const p = await requireOps(ctx, ...ADMIN); const ok = await revokeMembership(ctx.db, id, p.email); return json({ ok }); }
  if (head === "users" && id && action === "disable" && post) { const p = await requireOps(ctx, ...ADMIN); await disableUser(ctx.db, id, p.email); return json({ ok: true }); }
  if (head === "ops-members") {
    if (get) { await requireOps(ctx, ...ADMIN); return json({ ok: true, members: await ctx.db.all(`SELECT m.id AS membership_id, u.id AS user_id, u.email, u.name, m.role, u.status, u.last_login_at FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.scope_type = 'ops' AND m.revoked_at IS NULL ORDER BY u.email`) }); }
    if (post) {
      const p = await requireOps(ctx, ...ADMIN);
      const b = await readJson(ctx.request);
      const role = str(b.role, 20) as Role;
      if (!OPS_ROLES.includes(role)) throw bad("bad_role");
      const r = await inviteMember(ctx.db, ctx.env, { email: b.email, name: b.name, role, scopeType: "ops", scopeId: null, by: p.email, loginOrigin: await publicOrigin(ctx), scopeLabel: "運営" });
      return json({ ok: true, ...r });
    }
  }
  if (head === "links" && id && post) { const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request); const s = str(b.status, 10); if (!["active", "paused", "retired"].includes(s)) throw bad("bad_status"); return json({ ok: await setLinkStatus(ctx.db, id, s as "active" | "paused" | "retired", p.email) }); }
  if (head === "qr" && get) {
    await requireOps(ctx);
    const link = await ctx.db.first<{ id: string; token: string }>(`SELECT id, token FROM referral_links WHERE id = ?`, [q(ctx, "link") ?? ""]);
    if (!link) throw notFound();
    return qrResponse(publicLinkUrl(await publicOrigin(ctx), link.token), q(ctx, "format"), `kamehame-${link.id}`);
  }
  if (head === "policies") {
    if (get) { await requireOps(ctx); return json({ ok: true, ...(await ops.policyList(ctx.db)) }); }
    if (post) { const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request); return json({ ok: true, ...(await ops.createPolicy(ctx.db, { experienceSlug: b.experienceSlug, rateBp: b.rateBp, taxRateBp: b.taxRateBp, unitPriceExclTax: b.unitPriceExclTax, referenceAvg: b.referenceAvg, referenceNote: b.referenceNote, enabled: b.enabled, validFrom: b.validFrom, by: p.email })) }); }
  }
  if (head === "reservations") {
    if (!id && get) { await requireOps(ctx); return json({ ok: true, rows: await ops.reservationList(ctx.db, { from: isoDate(q(ctx, "from")) ?? undefined, to: isoDate(q(ctx, "to")) ?? undefined, hotel: q(ctx, "hotel"), status: q(ctx, "status"), q: q(ctx, "q"), limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined }) }); }
    if (id && !action && get) { await requireOps(ctx); return json({ ok: true, ...(await ops.reservationDetail(ctx.db, id)) }); }
    if (id && post) {
      const b = await readJson(ctx.request);
      switch (action) {
        case "attendance": { const p = await requireOps(ctx, ...BOOKING); await ops.markAttendance(ctx.db, id, { performedAt: b.performedAt, note: b.note, by: p.email }); return json({ ok: true, ...(await ops.reservationDetail(ctx.db, id)) }); }
        case "outcome": { const p = await requireOps(ctx, ...BOOKING); await ops.setOutcome(ctx.db, id, { outcome: b.outcome, reason: b.reason, by: p.email }); return json({ ok: true, ...(await ops.reservationDetail(ctx.db, id)) }); }
        case "referral": { const p = await requireOps(ctx, ...BOOKING); return json({ ok: true, ...(await ops.correctReferral(ctx.db, id, { hotelId: b.hotelId, reason: b.reason, by: p.email })) }); }
        case "lines": { const p = await requireOps(ctx, ...FINANCE); return json({ ok: true, ...(await ops.setLines(ctx.db, id, { lines: b.lines, reason: b.reason, by: p.email })) }); }
        case "payment": { const p = await requireOps(ctx, ...FINANCE); return json({ ok: true, ...(await ops.recordManualPayment(ctx.db, id, { amountJpy: b.amountJpy, occurredAt: b.occurredAt, reference: b.reference, reason: b.reason, by: p.email })) }); }
        case "refund-allocation": { const p = await requireOps(ctx, ...FINANCE); return json({ ok: true, ...(await ops.allocateRefundManually(ctx.db, id, { refundId: b.refundId, allocations: b.allocations, reason: b.reason, by: p.email })) }); }
      }
    }
  }
  throw notFound();
}
