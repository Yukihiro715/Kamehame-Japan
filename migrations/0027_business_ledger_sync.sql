CREATE TABLE business_ledger_links (
  source_key TEXT PRIMARY KEY,
  record_key TEXT NOT NULL,
  baseline_json TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  conflicts_json TEXT NOT NULL DEFAULT '[]',
  pending_json TEXT,
  last_seen_at TEXT NOT NULL
);
CREATE TABLE business_ledger_sync_state (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL DEFAULT '{}',
  lease_token TEXT,
  lease_until TEXT
);
INSERT INTO business_ledger_sync_state (id) VALUES ('ledger');
