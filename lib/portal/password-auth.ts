import { randomId, type SqlDb } from "@/lib/referral/db";
import { normalizeEmail, validEmail, sha256Hex, SESSION_TTL_MS, type VerifyResult } from "./auth";
import { DEMO_EMAIL } from "./demo-config";
import { sendPortalMail, type PortalMailEnv } from "./mail";

const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
// Match the Workers WebCrypto PBKDF2 iteration ceiling; online attempts are limited below.
export async function passwordHash(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations: 100000, salt: new TextEncoder().encode(salt) }, key, 256)));
}
async function eligible(db: SqlDb, email: string) {
  if (!validEmail(email) || email === DEMO_EMAIL) return null;
  return db.first<{ id: string; lang: string }>(`SELECT id, lang FROM users u WHERE email = ? AND status != 'disabled' AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id=u.id AND m.scope_type='hotel' AND m.revoked_at IS NULL)`, [email]);
}
async function allowed(db: SqlDb, purpose: string, key: string, max: number, now: number) {
  const window = Math.floor(now / 900000), bucket = `${purpose}:${window}:${await sha256Hex(key)}`;
  await db.run(`DELETE FROM partner_auth_limits WHERE expires_at <= ?`, [new Date(now).toISOString()]);
  await db.run(`INSERT INTO partner_auth_limits VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1`, [bucket, new Date((window + 1) * 900000).toISOString()]);
  const r = await db.first<{ attempts: number }>(`SELECT attempts FROM partner_auth_limits WHERE bucket=?`, [bucket]);
  return !!r && r.attempts <= max;
}
export async function requestPassword(db: SqlDb, env: PortalMailEnv, input: { email: unknown; ip: string; origin: string }, now = Date.now()) {
  const email = normalizeEmail(input.email);
  if (!await allowed(db, "reset-ip", input.ip, 20, now) || !await allowed(db, "reset-email", email, 3, now)) return { ok: true };
  const user = await eligible(db, email);
  if (!user) return { ok: true };
  const token = randomId() + randomId(), at = new Date(now).toISOString();
  await db.run(`INSERT INTO partner_password_tokens VALUES (?,?,?,?,NULL)`, [await sha256Hex(token), user.id, new Date(now + 30 * 60000).toISOString(), at]);
  const url = `${input.origin}/hotel/login/#password-token=${token}`;
  const en = user.lang === "en";
  await sendPortalMail(env, { to: email, subject: en ? "[KAMEHAME JAPAN] Set your password" : "【KAMEHAME JAPAN】パスワードの初回設定・再設定", text: en ? `Set your password using the link below (valid for 30 minutes, one use).\n${url}\nIf you did not request this, ignore this email.` : `以下のリンクからパスワードを設定してください（30分間有効・1回限り）。\n${url}\n心当たりがない場合は、このメールを破棄してください。` });
  return { ok: true };
}
export async function setPassword(db: SqlDb, input: { token: unknown; password: unknown; ip: string }, now = Date.now()) {
  if (!await allowed(db, "set", input.ip, 10, now)) return false;
  if (typeof input.token !== "string" || !/^[A-Za-z0-9_-]{44}$/.test(input.token) || typeof input.password !== "string" || input.password.length < 12 || input.password.length > 128) return false;
  const hash = await sha256Hex(input.token), at = new Date(now).toISOString();
  const row = await db.first<{ user_id: string; email: string }>(`SELECT t.user_id,u.email FROM partner_password_tokens t JOIN users u ON u.id=t.user_id WHERE token_hash=? AND consumed_by IS NULL AND expires_at>?`, [hash, at]);
  if (!row || !await eligible(db, row.email)) return false;
  const salt = hex(crypto.getRandomValues(new Uint8Array(32))), verifier = await passwordHash(input.password, salt), claim = randomId();
  // The batch is atomic. A concurrent or replayed token cannot change credentials or revoke sessions.
  const valid = `SELECT user_id FROM partner_password_tokens WHERE token_hash=? AND consumed_by IS NULL AND expires_at>?`;
  await db.batch([
    { sql: `INSERT INTO partner_passwords SELECT user_id,?,?,? FROM partner_password_tokens WHERE token_hash=? AND consumed_by IS NULL AND expires_at>? ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash,updated_at=excluded.updated_at`, params: [salt, verifier, at, hash, at] },
    { sql: `UPDATE sessions SET revoked_at=? WHERE kind='hotel' AND user_id IN (${valid})`, params: [at, hash, at] },
    { sql: `UPDATE users SET status='active' WHERE id IN (${valid}) AND status!='disabled'`, params: [hash, at] },
    { sql: `UPDATE partner_password_tokens SET consumed_by=? WHERE user_id IN (${valid}) AND consumed_by IS NULL`, params: [claim, hash, at] },
  ]);
  return (await db.first<{ consumed_by: string }>(`SELECT consumed_by FROM partner_password_tokens WHERE token_hash=?`, [hash]))?.consumed_by === claim;
}
export async function passwordLogin(db: SqlDb, input: { email: unknown; password: unknown; ip: string }, now = Date.now()): Promise<VerifyResult> {
  const email = normalizeEmail(input.email);
  if (!await allowed(db, "login-ip", input.ip, 30, now) || !await allowed(db, "login-email", email, 10, now)) return { ok: false, error: "locked" };
  if (typeof input.password !== "string" || !input.password || input.password.length > 128) return { ok: false, error: "invalid" };
  const user = await eligible(db, email);
  const c = user ? await db.first<{ salt: string; password_hash: string }>(`SELECT salt,password_hash FROM partner_passwords WHERE user_id=?`, [user.id]) : null;
  const candidate = await passwordHash(input.password, c?.salt ?? "missing-account-salt");
  let difference = 0;
  const expected = c?.password_hash ?? "0".repeat(64);
  for (let i = 0; i < 64; i++) difference |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  if (!user || !c || difference) return { ok: false, error: "invalid" };
  const token = randomId() + randomId(), at = new Date(now).toISOString(), expiresAt = new Date(now + SESSION_TTL_MS.hotel).toISOString();
  const session = await db.run(`INSERT INTO sessions (id,user_id,kind,created_at,expires_at,last_seen_at) SELECT ?,u.id,'hotel',?,?,? FROM users u JOIN partner_passwords c ON c.user_id=u.id WHERE u.id=? AND u.status!='disabled' AND c.password_hash=?`, [await sha256Hex(token), at, expiresAt, at, user.id, c.password_hash]);
  return session.changes === 1 ? { ok: true, token, expiresAt } : { ok: false, error: "invalid" };
}
