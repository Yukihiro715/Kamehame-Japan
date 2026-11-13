-- Rates are versioned separately from experience eligibility/tax terms.
CREATE TABLE partner_commission_rates (
  id TEXT PRIMARY KEY,
  legal_entity_id TEXT REFERENCES partner_legal_entities(id),
  rate_bp INTEGER CHECK (rate_bp IS NULL OR (rate_bp >= 0 AND rate_bp <= 10000)),
  valid_from TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);
CREATE UNIQUE INDEX partner_rate_effective ON partner_commission_rates(COALESCE(legal_entity_id, ''), valid_from);
ALTER TABLE reservation_referrals ADD COLUMN rate_setting_id TEXT REFERENCES partner_commission_rates(id);
-- Reuse the existing demo partner and its memberships; do not create duplicates.
UPDATE hotels SET name = 'デモ用', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 'site-prosent-demo';
