-- Stage 3: the hotel and operations portals (docs/HOTEL_REFERRAL.md).
-- Sign-in is by e-mail code; a session is a random token whose hash is the
-- row id. Access is decided from memberships, never from the browser.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','disabled')),
  created_at TEXT NOT NULL,
  created_by TEXT,
  last_login_at TEXT
);

-- What a user may do and where. `scope_type` 'ops' has no scope_id; 'hotel'
-- names the hotel. A revoked membership stays as history.
CREATE TABLE memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('ops_admin','ops_booking','ops_finance','hotel_viewer','hotel_billing')),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('ops','hotel')),
  scope_id TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT,
  revoked_at TEXT,
  revoked_by TEXT
);
CREATE INDEX memberships_user ON memberships(user_id);
CREATE INDEX memberships_scope ON memberships(scope_type, scope_id);

CREATE TABLE login_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('hotel','ops')),
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX login_codes_email ON login_codes(email, kind, created_at);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('hotel','ops')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expires ON sessions(expires_at);

-- Operator-editable settings (the brochure link, the public site origin for QR codes, ...).
CREATE TABLE portal_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

-- The reference a hotel sees for a booking instead of any internal id.
ALTER TABLE reservations ADD COLUMN hotel_ref TEXT;
CREATE UNIQUE INDEX reservations_hotel_ref ON reservations(hotel_ref);

ALTER TABLE hotels ADD COLUMN brochure_url TEXT;
ALTER TABLE hotels ADD COLUMN notes TEXT;
