// A SqlDb (lib/referral/db.ts) over node:sqlite for tests, with the real
// migrations applied, so the ledger code runs the same SQL it runs on D1.
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// node:sqlite returns null-prototype rows; D1 returns plain objects.
const plain = (row) => ({ ...row });
const migrationsDir = fileURLToPath(new URL("../../migrations/", import.meta.url));

export function openTestDb() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(migrationsDir + file, "utf8"));
  }
  const bind = (params = []) => params.map((v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v));
  const sqlDb = {
    async all(sql, params) { return db.prepare(sql).all(...bind(params)).map(plain); },
    async first(sql, params) { const r = db.prepare(sql).get(...bind(params)); return r ? plain(r) : null; },
    async run(sql, params) { const r = db.prepare(sql).run(...bind(params)); return { changes: Number(r.changes) }; },
    async batch(statements) {
      db.exec("BEGIN");
      try { for (const s of statements) db.prepare(s.sql).run(...bind(s.params)); db.exec("COMMIT"); }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    },
    raw: db,
  };
  // The same shape as a D1 binding, for code that receives `env.DB`.
  sqlDb.d1 = {
    prepare(sql) {
      return { bind(...params) {
        const p = bind(params);
        return {
          async all() { return { results: db.prepare(sql).all(...p).map(plain) }; },
          async first() { const r = db.prepare(sql).get(...p); return r ? plain(r) : null; },
          async run() { const r = db.prepare(sql).run(...p); return { meta: { changes: Number(r.changes) } }; },
          sql, p,
        };
      }, sql };
    },
    async batch(statements) {
      db.exec("BEGIN");
      try { for (const s of statements) db.prepare(s.sql).run(...s.p); db.exec("COMMIT"); }
      catch (e) { db.exec("ROLLBACK"); throw e; }
      return [];
    },
  };
  return sqlDb;
}
