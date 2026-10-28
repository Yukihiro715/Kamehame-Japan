/** The portal API: one entry point, routed by path, every handler scoped on
 *  the server. Mounted at /api/portal/<path> (app/api/portal/[...path]/route.ts).
 *
 *  Rules for every request (要件 12):
 *  - nothing works without the ledger database;
 *  - state changes need a same-origin Origin header and the x-kh-portal header
 *    (no cross-site form or fetch can add it);
 *  - the signed-in user comes from the session cookie and their memberships,
 *    read fresh each time; hotel users only ever see their own hotels. */
import { d1Db, isD1Like, type SqlDb } from "@/lib/referral/db";
import { canSeeHotel, hotelIdsOf, inviteMember, opsRole, principalFromRequest, requestLoginCode, revokeMembership, disableUser, sessionCookie, signOut, verifyLoginCode, HOTEL_ROLES, OPS_ROLES, type Principal, type Role } from "./auth";
import { createLink, linksOfHotel, materialLinks, publicLinkUrl, setLinkStatus, MEDIUMS, type Medium } from "./links-admin";
import { experienceTerms, hotelDashboard, hotelReservations } from "./metrics";
import * as ops from "./ops";
import { qrPng, qrSvg } from "./qr";
import { ApiError, bad, forbidden, int, isoDate, json, notFound, presetPeriod, readJson, str } from "./util";
import type { PortalMailEnv } from "./mail";

export type PortalEnv = PortalMailEnv & { DB?: unknown };
const PUBLIC_ORIGIN = "https://kamehame-japan.com";

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
async function publicOrigin(ctx: Ctx): Promise<string> {
  const row = await ctx.db.first<{ value: string }>(`SELECT value FROM portal_settings WHERE key = 'public_origin'`);
  if (row?.value && /^https:\/\/[a-z0-9.-]+$/i.test(row.value)) return row.value;
  return ctx.env.KH_ENV === "staging" ? ctx.origin : PUBLIC_ORIGIN;
}

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

async function hotel(ctx: Ctx, path: string[]): Promise<Response> {
  const p = await requireHotelUser(ctx);
  const [head, sub] = path;
  if (head === "me" && ctx.method === "GET") {
    const ids = hotelIdsOf(p);
    const hotels = ids.length ? await ctx.db.all<{ id: string; name: string; public_id: string; status: string; brochure_url: string | null }>(`SELECT id, name, public_id, status, brochure_url FROM hotels WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY name`, ids) : [];
    return json({ ok: true, user: { email: p.email, name: p.name }, memberships: p.memberships, hotels });
  }
  if (head === "dashboard" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    return json({ ok: true, hotel: hotelId, ...(await hotelDashboard(ctx.db, hotelId, period(ctx))) });
  }
  if (head === "experiences" && ctx.method === "GET") {
    hotelScope(ctx, p);
    return json({ ok: true, experiences: await experienceTerms(ctx.db) });
  }
  if (head === "reservations" && ctx.method === "GET") {
    const hotelId = hotelScope(ctx, p);
    const f = { from: isoDate(q(ctx, "from")) ?? undefined, to: isoDate(q(ctx, "to")) ?? undefined, experienceFrom: isoDate(q(ctx, "experienceFrom")) ?? undefined, experienceTo: isoDate(q(ctx, "experienceTo")) ?? undefined, experience: q(ctx, "experience"), status: q(ctx, "status"), ref: q(ctx, "ref"), limit: int(q(ctx, "limit")) ?? undefined, offset: int(q(ctx, "offset")) ?? undefined };
    return json({ ok: true, hotel: hotelId, ...(await hotelReservations(ctx.db, hotelId, f)) });
  }
  if (head === "materials") {
    const body = ctx.method === "POST" ? await readJson(ctx.request) : {};
    const hotelId = hotelScope(ctx, p, body);
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
    const dash = await hotelDashboard(ctx.db, hotelId, presetPeriod("this_quarter")!);
    const profile = await ctx.db.first<{ id: string; name: string; min_payout_jpy: number; bank_details_masked: string | null }>(
      `SELECT p.id, p.name, p.min_payout_jpy, p.bank_details_masked FROM settlement_profile_hotels ph JOIN settlement_profiles p ON p.id = ph.profile_id WHERE ph.hotel_id = ? AND (ph.valid_to IS NULL OR ph.valid_to > ?) ORDER BY ph.valid_from DESC LIMIT 1`, [hotelId, new Date().toISOString().slice(0, 10)]);
    return json({ ok: true, hotel: hotelId, balance: dash.balance, profile, statements: [], note: "精算書は四半期締め後にここに表示されます（段階4）。" });
  }
  void sub;
  throw notFound();
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
  if (head === "legal-entities" && post) { const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request); return json({ ok: true, ...(await ops.createLegalEntity(ctx.db, { name: b.name, address: b.address, registrationNumber: b.registrationNumber, by: p.email })) }); }
  if (head === "profiles" && post) { const p = await requireOps(ctx, ...FINANCE); const b = await readJson(ctx.request); return json({ ok: true, ...(await ops.createProfile(ctx.db, { legalEntityId: b.legalEntityId, name: b.name, hotelIds: b.hotelIds, validFrom: b.validFrom, by: p.email })) }); }
  if (head === "hotels") {
    if (!id && post) { const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request); return json({ ok: true, ...(await ops.createHotel(ctx.db, { legalEntityId: b.legalEntityId, name: b.name, publicId: b.publicId, withProfile: b.withProfile !== false, by: p.email })) }); }
    if (id && !action && get) { await requireOps(ctx); const d = await ops.hotelDetail(ctx.db, id); const origin = await publicOrigin(ctx); return json({ ok: true, ...d, links: d.links.map((l) => ({ ...l, url: publicLinkUrl(origin, l.token) })) }); }
    if (id && !action && post) { const p = await requireOps(ctx, ...BOOKING); const b = await readJson(ctx.request); await ops.updateHotel(ctx.db, id, { status: b.status, brochureUrl: b.brochureUrl, notes: b.notes, name: b.name, reason: b.reason, by: p.email }); return json({ ok: true }); }
    if (id && action === "members" && post) {
      const p = await requireOps(ctx, ...ADMIN);
      const b = await readJson(ctx.request);
      const role = str(b.role, 20) as Role;
      if (!HOTEL_ROLES.includes(role)) throw bad("bad_role");
      const h = await ctx.db.first<{ name: string }>(`SELECT name FROM hotels WHERE id = ?`, [id]);
      if (!h) throw notFound();
      const r = await inviteMember(ctx.db, ctx.env, { email: b.email, name: b.name, role, scopeType: "hotel", scopeId: id, by: p.email, loginOrigin: await publicOrigin(ctx), scopeLabel: h.name });
      return json({ ok: true, ...r });
    }
    if (id && action === "links" && post) {
      const p = await requireOps(ctx, ...BOOKING);
      const b = await readJson(ctx.request);
      const medium = str(b.medium, 20) as Medium;
      if (!MEDIUMS.includes(medium)) throw bad("bad_medium");
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
