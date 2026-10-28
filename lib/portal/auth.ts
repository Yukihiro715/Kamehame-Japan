/** Sign-in and access for the hotel and operations portals.
 *
 *  Passwordless: the user types their e-mail, receives a six-digit code
 *  (ten minutes, five attempts) and gets a session cookie. Who may sign in,
 *  and to what, is decided from `memberships` on the server for every
 *  request; the cookie only identifies the session. Invitations create the
 *  user and the membership up front and mail the sign-in steps, so there is
 *  no invitation token to leak (要件 12). */
import { randomId, type SqlDb } from "@/lib/referral/db";
import { readCookie } from "@/lib/referral/links";
import { inviteMail, loginCodeMail, sendPortalMail, type PortalMailEnv } from "./mail";

export type PortalKind = "hotel" | "ops";
export type Role = "ops_admin" | "ops_booking" | "ops_finance" | "hotel_viewer" | "hotel_billing";
export const OPS_ROLES: Role[] = ["ops_admin", "ops_booking", "ops_finance"];
export const HOTEL_ROLES: Role[] = ["hotel_viewer", "hotel_billing"];
export const ROLE_LABEL: Record<Role, string> = { ops_admin: "管理者", ops_booking: "予約運営", ops_finance: "経理", hotel_viewer: "閲覧担当者", hotel_billing: "請求担当者" };

export const SESSION_COOKIE: Record<PortalKind, string> = { hotel: "kh_sess_hotel", ops: "kh_sess_ops" };
export const SESSION_TTL_MS: Record<PortalKind, number> = { hotel: 30 * 86400000, ops: 12 * 3600000 };
const CODE_TTL_MS = 10 * 60000;
const CODE_MAX_ATTEMPTS = 5;
const CODES_PER_HOUR = 5;

export interface Membership { id: string; role: Role; scopeType: "ops" | "hotel"; scopeId: string | null }
export interface Principal { userId: string; email: string; name: string | null; kind: PortalKind; sessionId: string; memberships: Membership[] }

export const normalizeEmail = (s: unknown) => (typeof s === "string" ? s.trim().toLowerCase() : "");
export const validEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const sixDigits = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");

/** Memberships that let this e-mail into the portal of `kind`. */
async function eligibleUser(db: SqlDb, email: string, kind: PortalKind) {
  return db.first<{ id: string; status: string }>(
    `SELECT u.id, u.status FROM users u WHERE u.email = ? AND u.status != 'disabled'
       AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.revoked_at IS NULL AND m.scope_type = ?)`,
    [email, kind === "ops" ? "ops" : "hotel"]);
}

export interface RequestCodeResult { ok: true; sent: boolean; mail?: string; devCode?: string }

/** The very first operator. While no operator membership exists, the address
 *  in PORTAL_BOOTSTRAP_ADMIN (a Worker secret set by the owner) becomes
 *  ops_admin on its first sign-in request; after that the variable is inert. */
async function bootstrapAdmin(db: SqlDb, env: PortalMailEnv, email: string, now: number) {
  const target = normalizeEmail(env.PORTAL_BOOTSTRAP_ADMIN);
  if (!target || target !== email) return;
  const any = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM memberships WHERE scope_type = 'ops' AND revoked_at IS NULL`);
  if ((any?.n ?? 0) > 0) return;
  const at = new Date(now).toISOString();
  let user = await db.first<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [email]);
  if (!user) { user = { id: randomId() }; await db.run(`INSERT INTO users (id, email, name, status, created_at, created_by) VALUES (?, ?, NULL, 'invited', ?, 'bootstrap')`, [user.id, email, at]); }
  await db.batch([
    { sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by) VALUES (?, ?, 'ops_admin', 'ops', NULL, ?, 'bootstrap')`, params: [randomId(), user.id, at] },
    { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, after_json) VALUES (?, ?, 'bootstrap', 'membership.bootstrap', 'user', ?, ?)`, params: [randomId(), at, user.id, JSON.stringify({ email, role: "ops_admin" })] },
  ]);
}

/** Step one: mail a code. The answer never says whether the address is known. */
export async function requestLoginCode(db: SqlDb, env: PortalMailEnv, input: { email: unknown; kind: PortalKind }, now = Date.now()): Promise<RequestCodeResult> {
  const email = normalizeEmail(input.email);
  if (!validEmail(email)) return { ok: true, sent: false };
  if (input.kind === "ops") await bootstrapAdmin(db, env, email, now);
  const user = await eligibleUser(db, email, input.kind);
  if (!user) return { ok: true, sent: false };
  const recent = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM login_codes WHERE email = ? AND kind = ? AND created_at > ?`, [email, input.kind, new Date(now - 3600000).toISOString()]);
  if ((recent?.n ?? 0) >= CODES_PER_HOUR) return { ok: true, sent: false };
  const code = sixDigits();
  await db.run(`INSERT INTO login_codes (id, email, kind, code_hash, expires_at, attempts, consumed_at, created_at) VALUES (?, ?, ?, ?, ?, 0, NULL, ?)`,
    [randomId(), email, input.kind, await sha256Hex(`${email}:${input.kind}:${code}`), new Date(now + CODE_TTL_MS).toISOString(), new Date(now).toISOString()]);
  const outcome = await sendPortalMail(env, { to: email, ...loginCodeMail(code, input.kind) });
  // Staging without a mail route: show the code on the page (the Worker is behind Basic auth).
  const devCode = env.KH_ENV === "staging" && outcome !== "sent" ? code : undefined;
  return { ok: true, sent: outcome === "sent", mail: outcome, ...(devCode ? { devCode } : {}) };
}

export interface VerifyResult { ok: boolean; error?: "invalid" | "expired" | "locked"; token?: string; expiresAt?: string }

/** Step two: the code for a session. Wrong codes count against the latest code; after five it is dead. */
export async function verifyLoginCode(db: SqlDb, input: { email: unknown; code: unknown; kind: PortalKind }, now = Date.now()): Promise<VerifyResult> {
  const email = normalizeEmail(input.email);
  const code = typeof input.code === "string" ? input.code.replace(/\D/g, "") : "";
  if (!validEmail(email) || code.length !== 6) return { ok: false, error: "invalid" };
  const row = await db.first<{ id: string; code_hash: string; expires_at: string; attempts: number }>(
    `SELECT id, code_hash, expires_at, attempts FROM login_codes WHERE email = ? AND kind = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`, [email, input.kind]);
  if (!row) return { ok: false, error: "invalid" };
  if (Date.parse(row.expires_at) <= now) return { ok: false, error: "expired" };
  if (row.attempts >= CODE_MAX_ATTEMPTS) return { ok: false, error: "locked" };
  if (!sameString(row.code_hash, await sha256Hex(`${email}:${input.kind}:${code}`))) {
    await db.run(`UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?`, [row.id]);
    return { ok: false, error: row.attempts + 1 >= CODE_MAX_ATTEMPTS ? "locked" : "invalid" };
  }
  const user = await eligibleUser(db, email, input.kind);
  if (!user) return { ok: false, error: "invalid" };
  const at = new Date(now).toISOString();
  const token = `${randomId()}${randomId()}`;
  const expiresAt = new Date(now + SESSION_TTL_MS[input.kind]).toISOString();
  await db.batch([
    { sql: `UPDATE login_codes SET consumed_at = ? WHERE id = ?`, params: [at, row.id] },
    { sql: `INSERT INTO sessions (id, user_id, kind, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)`, params: [await sha256Hex(token), user.id, input.kind, at, expiresAt, at] },
    { sql: `UPDATE users SET status = 'active', last_login_at = ? WHERE id = ?`, params: [at, user.id] },
  ]);
  return { ok: true, token, expiresAt };
}

export function sessionCookie(kind: PortalKind, token: string, secure = true, maxAgeSec = SESSION_TTL_MS[kind] / 1000): string {
  const attrs = ["Path=/", "HttpOnly", "SameSite=Lax", secure ? "Secure" : ""].filter(Boolean).join("; ");
  return token ? `${SESSION_COOKIE[kind]}=${token}; Max-Age=${Math.floor(maxAgeSec)}; ${attrs}` : `${SESSION_COOKIE[kind]}=; Max-Age=0; ${attrs}`;
}

/** The signed-in user behind a request, or null. Memberships are read fresh every time. */
export async function principalFromRequest(db: SqlDb, request: Request, kind: PortalKind, now = Date.now()): Promise<Principal | null> {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE[kind]);
  if (!token || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const id = await sha256Hex(token);
  const s = await db.first<{ id: string; user_id: string; expires_at: string; last_seen_at: string; email: string; name: string | null; status: string }>(
    `SELECT s.id, s.user_id, s.expires_at, s.last_seen_at, u.email, u.name, u.status FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.kind = ? AND s.revoked_at IS NULL`, [id, kind]);
  if (!s || Date.parse(s.expires_at) <= now || s.status === "disabled") return null;
  const rows = await db.all<{ id: string; role: Role; scope_type: "ops" | "hotel"; scope_id: string | null }>(
    `SELECT id, role, scope_type, scope_id FROM memberships WHERE user_id = ? AND revoked_at IS NULL AND scope_type = ?`, [s.user_id, kind === "ops" ? "ops" : "hotel"]);
  if (!rows.length) return null;
  if (now - Date.parse(s.last_seen_at) > 5 * 60000) await db.run(`UPDATE sessions SET last_seen_at = ? WHERE id = ?`, [new Date(now).toISOString(), s.id]);
  return { userId: s.user_id, email: s.email, name: s.name, kind, sessionId: s.id, memberships: rows.map((r) => ({ id: r.id, role: r.role, scopeType: r.scope_type, scopeId: r.scope_id })) };
}

export async function signOut(db: SqlDb, request: Request, kind: PortalKind) {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE[kind]);
  if (token) await db.run(`UPDATE sessions SET revoked_at = ? WHERE id = ?`, [new Date().toISOString(), await sha256Hex(token)]);
}

// ---- authorization helpers ------------------------------------------------

export const hotelIdsOf = (p: Principal) => p.memberships.filter((m) => m.scopeType === "hotel" && m.scopeId).map((m) => m.scopeId!);
export const canSeeHotel = (p: Principal, hotelId: string) => hotelIdsOf(p).includes(hotelId);
export const hasBillingFor = (p: Principal, hotelId: string) => p.memberships.some((m) => m.scopeType === "hotel" && m.scopeId === hotelId && m.role === "hotel_billing");
export const opsRole = (p: Principal, ...roles: Role[]) => p.memberships.some((m) => m.scopeType === "ops" && (roles.length === 0 || roles.includes(m.role)));

/** Whether this hotel user may see a settlement profile: billing rights on every hotel it covers (要件 3.6). */
export async function canSeeProfile(db: SqlDb, p: Principal, profileId: string): Promise<boolean> {
  const hotels = await db.all<{ hotel_id: string }>(`SELECT hotel_id FROM settlement_profile_hotels WHERE profile_id = ? AND (valid_to IS NULL OR valid_to > ?)`, [profileId, new Date().toISOString().slice(0, 10)]);
  return hotels.length > 0 && hotels.every((h) => hasBillingFor(p, h.hotel_id));
}

// ---- invitations and membership management --------------------------------

export interface InviteInput { email: unknown; name?: unknown; role: Role; scopeType: "ops" | "hotel"; scopeId: string | null; by: string; loginOrigin: string; scopeLabel: string }

/** Create (or reuse) the user, add the membership and mail the sign-in steps. */
export async function inviteMember(db: SqlDb, env: PortalMailEnv, input: InviteInput, now = Date.now()): Promise<{ userId: string; membershipId: string; mail: string }> {
  const email = normalizeEmail(input.email);
  if (!validEmail(email)) throw new Error("invalid_email");
  if ((input.scopeType === "ops") !== OPS_ROLES.includes(input.role)) throw new Error("role_scope_mismatch");
  if (input.scopeType === "hotel" && !input.scopeId) throw new Error("hotel_required");
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 120) || null : null;
  const at = new Date(now).toISOString();
  let user = await db.first<{ id: string; status: string }>(`SELECT id, status FROM users WHERE email = ?`, [email]);
  if (!user) {
    const id = randomId();
    await db.run(`INSERT INTO users (id, email, name, status, created_at, created_by) VALUES (?, ?, ?, 'invited', ?, ?)`, [id, email, name, at, input.by]);
    user = { id, status: "invited" };
  } else if (user.status === "disabled") {
    await db.run(`UPDATE users SET status = 'invited' WHERE id = ?`, [user.id]);
  }
  const existing = await db.first<{ id: string }>(`SELECT id FROM memberships WHERE user_id = ? AND role = ? AND scope_type = ? AND scope_id IS ? AND revoked_at IS NULL`, [user.id, input.role, input.scopeType, input.scopeId]);
  const membershipId = existing?.id ?? randomId();
  if (!existing) {
    await db.batch([
      { sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`, params: [membershipId, user.id, input.role, input.scopeType, input.scopeId, at, input.by] },
      { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, after_json) VALUES (?, ?, ?, 'membership.invite', 'user', ?, ?)`, params: [randomId(), at, input.by, user.id, JSON.stringify({ email, role: input.role, scopeType: input.scopeType, scopeId: input.scopeId })] },
    ]);
  }
  const loginUrl = `${input.loginOrigin}/${input.scopeType === "ops" ? "ops" : "hotel"}/login/`;
  const mail = await sendPortalMail(env, { to: email, ...inviteMail({ name, loginUrl, scopeLabel: input.scopeLabel, roleLabel: ROLE_LABEL[input.role] }) });
  return { userId: user.id, membershipId, mail };
}

/** End a membership; sessions of a user with nothing left in that portal are revoked too. */
export async function revokeMembership(db: SqlDb, membershipId: string, by: string, now = Date.now()): Promise<boolean> {
  const at = new Date(now).toISOString();
  const m = await db.first<{ id: string; user_id: string; scope_type: string }>(`SELECT id, user_id, scope_type FROM memberships WHERE id = ? AND revoked_at IS NULL`, [membershipId]);
  if (!m) return false;
  await db.batch([
    { sql: `UPDATE memberships SET revoked_at = ?, revoked_by = ? WHERE id = ?`, params: [at, by, m.id] },
    { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id) VALUES (?, ?, ?, 'membership.revoke', 'membership', ?)`, params: [randomId(), at, by, m.id] },
  ]);
  const left = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM memberships WHERE user_id = ? AND scope_type = ? AND revoked_at IS NULL`, [m.user_id, m.scope_type]);
  if ((left?.n ?? 0) === 0) await db.run(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND kind = ? AND revoked_at IS NULL`, [at, m.user_id, m.scope_type === "ops" ? "ops" : "hotel"]);
  return true;
}

/** Stop a user everywhere (sign-in and sessions), keeping the memberships as history. */
export async function disableUser(db: SqlDb, userId: string, by: string, now = Date.now()) {
  const at = new Date(now).toISOString();
  await db.batch([
    { sql: `UPDATE users SET status = 'disabled' WHERE id = ?`, params: [userId] },
    { sql: `UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`, params: [at, userId] },
    { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id) VALUES (?, ?, ?, 'user.disable', 'user', ?)`, params: [randomId(), at, by, userId] },
  ]);
}
