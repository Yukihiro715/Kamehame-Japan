-- The partner portal is used abroad: each user carries the language their
-- screens and mails use (ja | en for now). Also the owner's own access: an
-- operator membership, and a demo site of Prosent Inc. with every feature on,
-- so the partner screens can be tried end to end from the owner's address.
ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'ja';

INSERT INTO users (id, email, name, status, created_at, created_by)
  SELECT 'u-owner-prosent', 'yukihiro_ito@prosent.co.jp', '伊藤 ゆきひろ', 'active', '2026-11-06T07:00:00Z', 'migration'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'yukihiro_ito@prosent.co.jp');
INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by)
  SELECT 'm-owner-ops', u.id, 'ops_admin', 'ops', NULL, '2026-11-06T07:00:00Z', 'migration' FROM users u WHERE u.email = 'yukihiro_ito@prosent.co.jp'
  AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.role = 'ops_admin' AND m.scope_type = 'ops' AND m.revoked_at IS NULL);

INSERT INTO partner_legal_entities (id, name, address, registration_status, partner_type, entity_kind, contact_email, created_at, updated_at)
  SELECT 'le-prosent', '株式会社プロセント（デモ）', NULL, 'unverified', 'other', 'company', NULL, '2026-11-06T07:00:00Z', '2026-11-06T07:00:00Z'
  WHERE NOT EXISTS (SELECT 1 FROM partner_legal_entities WHERE id = 'le-prosent');
INSERT INTO hotels (id, legal_entity_id, public_id, name, status, site_kind, features_json, created_at, updated_at)
  SELECT 'site-prosent-demo', 'le-prosent', 'HP-DEMO', 'KAMEHAME JAPAN デモ拠点', 'active', 'other', '{"refer":true,"cases":true,"settlement":true,"members":true}', '2026-11-06T07:00:00Z', '2026-11-06T07:00:00Z'
  WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE id = 'site-prosent-demo');
INSERT INTO settlement_profiles (id, legal_entity_id, name, payee_name, min_payout_jpy, fee_borne_by, valid_from, created_at, updated_at)
  SELECT 'sp-prosent-demo', 'le-prosent', 'デモ精算', 'PROSENT INC.', 3000, 'hotel', '2026-01-01', '2026-11-06T07:00:00Z', '2026-11-06T07:00:00Z'
  WHERE NOT EXISTS (SELECT 1 FROM settlement_profiles WHERE id = 'sp-prosent-demo');
INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from)
  SELECT 'sp-prosent-demo', 'site-prosent-demo', '2026-01-01'
  WHERE NOT EXISTS (SELECT 1 FROM settlement_profile_hotels WHERE profile_id = 'sp-prosent-demo' AND hotel_id = 'site-prosent-demo');
INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by)
  SELECT 'm-owner-demo-mgr', u.id, 'partner_manager', 'hotel', 'site-prosent-demo', '2026-11-06T07:00:00Z', 'migration' FROM users u WHERE u.email = 'yukihiro_ito@prosent.co.jp'
  AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.role = 'partner_manager' AND m.scope_id = 'site-prosent-demo' AND m.revoked_at IS NULL);
INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by)
  SELECT 'm-owner-demo-bill', u.id, 'hotel_billing', 'hotel', 'site-prosent-demo', '2026-11-06T07:00:00Z', 'migration' FROM users u WHERE u.email = 'yukihiro_ito@prosent.co.jp'
  AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.role = 'hotel_billing' AND m.scope_id = 'site-prosent-demo' AND m.revoked_at IS NULL);
