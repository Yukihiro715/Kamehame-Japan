-- Stage 4 (docs/PARTNER_PLATFORM_STAGE1.md 4.4): quarterly statements, the
-- partner's acknowledgement or dispute, payout batches and their results.
-- Terms that may differ per contract live on the settlement profile.
ALTER TABLE settlement_profiles ADD COLUMN dispute_days INTEGER NOT NULL DEFAULT 14;
ALTER TABLE settlement_profiles ADD COLUMN bank_fee_jpy INTEGER NOT NULL DEFAULT 0;

-- One statement per settlement profile and quarter; a revision is a new version
-- that supersedes the voided one. Money is integer JPY, net = tax-exclusive.
CREATE TABLE statements (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES settlement_profiles(id),
  period TEXT NOT NULL,                      -- 2026-Q4
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('draft','issued','acknowledged','disputed','settled','void')),
  net_jpy INTEGER NOT NULL DEFAULT 0,        -- commissions in the period, tax-exclusive (corrections of earlier periods included)
  tax_jpy INTEGER NOT NULL DEFAULT 0,        -- tax on the statement total, rounded once
  gross_jpy INTEGER NOT NULL DEFAULT 0,
  carried_in_jpy INTEGER NOT NULL DEFAULT 0, -- balance brought forward (tax-inclusive, may be negative)
  payable_jpy INTEGER NOT NULL DEFAULT 0,    -- gross + carried_in
  carried_out_jpy INTEGER NOT NULL DEFAULT 0,-- what moves to the next period (below the minimum, or negative)
  bank_fee_jpy INTEGER NOT NULL DEFAULT 0,
  transfer_jpy INTEGER NOT NULL DEFAULT 0,   -- payable less the fee, 0 when carried
  min_payout_jpy INTEGER NOT NULL DEFAULT 3000,
  pay_date_jst TEXT,
  dispute_deadline_jst TEXT,
  issued_at TEXT, issued_by TEXT,
  acknowledged_at TEXT, acknowledged_by TEXT,
  settled_at TEXT,
  voided_at TEXT, voided_by TEXT, void_reason TEXT,
  supersedes_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (profile_id, period, version)
);
CREATE INDEX statements_profile ON statements(profile_id, period);
CREATE INDEX statements_status ON statements(status, pay_date_jst);

-- One row per ledger entry (its commission as of the close) or per
-- adjustment to an entry already on an earlier statement (a correction).
CREATE TABLE statement_items (
  id TEXT PRIMARY KEY,
  statement_id TEXT NOT NULL REFERENCES statements(id),
  kind TEXT NOT NULL CHECK (kind IN ('entry','adjustment')),
  entry_id TEXT NOT NULL REFERENCES commission_entries(id),
  adjustment_id TEXT REFERENCES commission_adjustments(id),
  reservation_id TEXT NOT NULL,
  hotel_id TEXT,
  performed_on_jst TEXT,
  experience_slug TEXT,
  hotel_ref TEXT,
  base_net_jpy INTEGER NOT NULL DEFAULT 0,
  rate_bp INTEGER,
  amount_net_jpy INTEGER NOT NULL,
  note TEXT
);
CREATE INDEX statement_items_statement ON statement_items(statement_id);

CREATE TABLE statement_disputes (
  id TEXT PRIMARY KEY,
  statement_id TEXT NOT NULL REFERENCES statements(id),
  item_id TEXT REFERENCES statement_items(id),
  raised_by TEXT NOT NULL,
  raised_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','upheld','rejected','withdrawn')),
  resolution TEXT,
  resolved_by TEXT,
  resolved_at TEXT
);
CREATE INDEX statement_disputes_statement ON statement_disputes(statement_id);

CREATE TABLE payout_batches (
  id TEXT PRIMARY KEY,
  pay_date_jst TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared','exported','recorded')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  exported_at TEXT,
  recorded_at TEXT,
  note TEXT
);
-- One transfer per settlement profile in a batch; the statements it covers are listed.
CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES payout_batches(id),
  profile_id TEXT NOT NULL REFERENCES settlement_profiles(id),
  statement_ids_json TEXT NOT NULL,
  gross_jpy INTEGER NOT NULL,
  bank_fee_jpy INTEGER NOT NULL DEFAULT 0,
  transfer_jpy INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','held')),
  paid_at TEXT,
  reference TEXT,
  note TEXT,
  recorded_by TEXT
);
CREATE INDEX payouts_batch ON payouts(batch_id);
CREATE INDEX payouts_profile ON payouts(profile_id, status);
