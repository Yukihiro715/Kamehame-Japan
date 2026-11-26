ALTER TABLE hotels ADD COLUMN auto_guest_guide INTEGER NOT NULL DEFAULT 0 CHECK (auto_guest_guide IN (0,1));
CREATE TABLE case_guest_guides (
  case_id TEXT PRIMARY KEY REFERENCES partner_cases(id),
  send_mode TEXT NOT NULL DEFAULT 'default' CHECK (send_mode IN ('default','auto','manual')),
  instructions TEXT,
  file_key TEXT,
  token TEXT UNIQUE,
  send_status TEXT,
  sent_at TEXT,
  attempt_at TEXT
);
