-- Partner platform, step 2 (docs/PARTNER_PLATFORM_STAGE1.md): hotels become
-- one kind of partner site. Existing rows read as "hotel, company, link
-- referral + settlement on" and nothing about links, attribution or the
-- ledger changes.
ALTER TABLE partner_legal_entities ADD COLUMN partner_type TEXT NOT NULL DEFAULT 'hotel';   -- hotel | agency | guide | other
ALTER TABLE partner_legal_entities ADD COLUMN entity_kind TEXT NOT NULL DEFAULT 'company';  -- company | individual
ALTER TABLE partner_legal_entities ADD COLUMN contact_email TEXT;
ALTER TABLE hotels ADD COLUMN site_kind TEXT NOT NULL DEFAULT 'hotel';                      -- hotel | branch | guide | other
-- Which features the site may use: refer (links/QR), cases (booking relay), settlement (statements), members (invite its own users).
ALTER TABLE hotels ADD COLUMN features_json TEXT NOT NULL DEFAULT '{"refer":true,"cases":false,"settlement":true,"members":false}';

-- Two partner roles for the booking relay. SQLite cannot widen a CHECK, so the
-- table is rebuilt; nothing references memberships by foreign key.
CREATE TABLE memberships_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('ops_admin','ops_booking','ops_finance','hotel_viewer','hotel_billing','partner_agent','partner_manager')),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('ops','hotel')),
  scope_id TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT,
  revoked_at TEXT,
  revoked_by TEXT
);
INSERT INTO memberships_v2 (id, user_id, role, scope_type, scope_id, created_at, created_by, revoked_at, revoked_by)
  SELECT id, user_id, role, scope_type, scope_id, created_at, created_by, revoked_at, revoked_by FROM memberships;
DROP TABLE memberships;
ALTER TABLE memberships_v2 RENAME TO memberships;
CREATE INDEX memberships_user ON memberships(user_id);
CREATE INDEX memberships_scope ON memberships(scope_type, scope_id);
