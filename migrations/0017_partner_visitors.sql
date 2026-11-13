-- Browser-based visitor estimates are independent of commission attribution.
-- One active seven-day window per browser and partner (or chain profile).
CREATE TABLE referral_visitor_windows (
  browser_id TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  window_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (browser_id, scope_id)
);
ALTER TABLE referral_events ADD COLUMN visitor_window_id TEXT;
-- Older events remain NULL: a 30-minute session cannot identify a person.
