-- Private business records live in D1, never in the public source bundle.
CREATE TABLE business_records (key TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('booking','master','snapshot')), payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
CREATE TABLE business_audit (id TEXT PRIMARY KEY, record_key TEXT NOT NULL, action TEXT NOT NULL, before_json TEXT, after_json TEXT, created_at TEXT NOT NULL, actor TEXT NOT NULL);
CREATE INDEX business_audit_at ON business_audit(created_at);
