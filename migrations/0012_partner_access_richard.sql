-- A second tester on the owner's demo site, in English: site manager and
-- billing contact of 'KAMEHAME JAPAN デモ拠点' (migration 0011).
INSERT INTO users (id, email, name, status, lang, created_at, created_by)
  SELECT 'u-richard', 'richardborg91@gmail.com', 'Richard', 'active', 'en', '2026-11-06T10:00:00Z', 'migration'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'richardborg91@gmail.com');
INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by)
  SELECT 'm-richard-demo-mgr', u.id, 'partner_manager', 'hotel', 'site-prosent-demo', '2026-11-06T10:00:00Z', 'migration' FROM users u WHERE u.email = 'richardborg91@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.role = 'partner_manager' AND m.scope_id = 'site-prosent-demo' AND m.revoked_at IS NULL);
INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by)
  SELECT 'm-richard-demo-bill', u.id, 'hotel_billing', 'hotel', 'site-prosent-demo', '2026-11-06T10:00:00Z', 'migration' FROM users u WHERE u.email = 'richardborg91@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.role = 'hotel_billing' AND m.scope_id = 'site-prosent-demo' AND m.revoked_at IS NULL);
