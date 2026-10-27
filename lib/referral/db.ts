/** The commission ledger's database access.
 *
 *  Production runs on Cloudflare D1 (binding `DB`); tests run the same SQL on
 *  node:sqlite through tests/helpers/sqlite-db.mjs. Both sit behind `SqlDb`,
 *  which is deliberately small: parameterised statements and an atomic batch.
 *  Queries are written in plain SQL so the two engines behave identically. */

export interface SqlStatement { sql: string; params?: readonly unknown[] }

export interface SqlDb {
  all<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  first<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  run(sql: string, params?: readonly unknown[]): Promise<{ changes: number }>;
  /** All statements succeed or none do (D1 `batch`, a transaction elsewhere). */
  batch(statements: readonly SqlStatement[]): Promise<void>;
}

/** The subset of the D1 client the adapter uses (types/cloudflare.d.ts keeps `DB` loose). */
export interface D1Like {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      first<T>(): Promise<T | null>;
      run(): Promise<{ meta: { changes: number } }>;
    };
  };
  batch(statements: unknown[]): Promise<unknown>;
}

export function isD1Like(x: unknown): x is D1Like {
  return !!x && typeof x === "object" && typeof (x as D1Like).prepare === "function" && typeof (x as D1Like).batch === "function";
}

export function d1Db(d1: D1Like): SqlDb {
  const stmt = (sql: string, params: readonly unknown[] = []) => d1.prepare(sql).bind(...params.map(bindable));
  return {
    async all<T>(sql: string, params?: readonly unknown[]) { return (await stmt(sql, params).all<T>()).results; },
    async first<T>(sql: string, params?: readonly unknown[]) { return (await stmt(sql, params).first<T>()) ?? null; },
    async run(sql: string, params?: readonly unknown[]) { return { changes: (await stmt(sql, params).run()).meta.changes }; },
    async batch(statements) { if (statements.length) await d1.batch(statements.map((s) => stmt(s.sql, s.params))); },
  };
}

/** D1 binds null, numbers, strings and booleans (as 0/1); undefined becomes null. */
function bindable(v: unknown): unknown {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

export const nowIso = () => new Date().toISOString();

/** A JST calendar date (YYYY-MM-DD) for an instant. */
export function jstDate(at: Date | string | number = Date.now()): string {
  const t = typeof at === "number" ? at : new Date(at).getTime();
  return new Date(t + 9 * 3600000).toISOString().slice(0, 10);
}

/** 128 random bits as base64url (22 characters): ids, tokens and session cookies. */
export function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
