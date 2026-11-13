import { randomId, type SqlDb } from "@/lib/referral/db";
import { normalizeEmail, sha256Hex, type VerifyResult } from "./auth";
import { DEMO_EMAIL, DEMO_USER_ID, DEMO_SITE_ID, DEMO_SESSION_SECONDS } from "./demo-config";

/** Salted PBKDF2 verifier, bounded input and an atomic per-IP 15-minute attempt limit. */
export async function verifyDemoLogin(db: SqlDb, input: { email: unknown; password: unknown; kind: unknown; ip: string }, now = Date.now()): Promise<VerifyResult> {
  if (input.kind !== "hotel" || typeof input.password !== "string" || input.password.length > 128 || !input.password) return { ok: false, error: "invalid" };
  const at = new Date(now).toISOString();
  const bucket = `${Math.floor(now / 900000)}:${await sha256Hex(input.ip)}`;
  await db.run(`DELETE FROM demo_login_limits WHERE expires_at <= ?`, [at]);
  await db.run(`INSERT INTO demo_login_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1`, [bucket, new Date((Math.floor(now / 900000) + 1) * 900000).toISOString()]);
  const limit = await db.first<{ attempts: number }>(`SELECT attempts FROM demo_login_limits WHERE bucket = ?`, [bucket]);
  if (!limit || limit.attempts > 10) return { ok: false, error: "locked" };
  if (normalizeEmail(input.email) !== DEMO_EMAIL) return { ok: false, error: "invalid" };
  const credential = await db.first<{ salt_hex: string; password_hash: string; iterations: number }>(`SELECT c.salt_hex, c.password_hash, c.iterations FROM demo_credentials c JOIN users u ON u.id = c.user_id
    WHERE u.id = ? AND u.email = ? AND u.status = 'active' AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.scope_type = 'hotel' AND m.scope_id = ? AND m.revoked_at IS NULL)`, [DEMO_USER_ID, DEMO_EMAIL, DEMO_SITE_ID]);
  if (!credential) return { ok: false, error: "invalid" };
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(input.password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(credential.salt_hex.match(/../g) ?? [], h => parseInt(h, 16));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations: credential.iterations, salt }, key, 256);
  const hex = Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
  let diff = hex.length ^ credential.password_hash.length;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ credential.password_hash.charCodeAt(i);
  if (diff !== 0) return { ok: false, error: "invalid" };
  const token = `${randomId()}${randomId()}`, expiresAt = new Date(now + DEMO_SESSION_SECONDS * 1000).toISOString();
  await db.batch([
    { sql: `INSERT INTO sessions (id, user_id, kind, created_at, expires_at, last_seen_at) VALUES (?, ?, 'hotel', ?, ?, ?)`, params: [await sha256Hex(token), DEMO_USER_ID, at, expiresAt, at] },
    { sql: `UPDATE users SET last_login_at = ? WHERE id = ?`, params: [at, DEMO_USER_ID] },
  ]);
  return { ok: true, token, expiresAt };
}
