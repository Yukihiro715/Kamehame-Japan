-- Separate from password credentials so existing credentials and sessions remain compatible.
CREATE TABLE ops_password_changes (
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 expires_at TEXT NOT NULL
);
-- Ensure the designated owner has administrative access when already registered.
INSERT INTO memberships (id,user_id,role,scope_type,scope_id,created_at,created_by)
SELECT lower(hex(randomblob(16))),id,'ops_admin','ops',NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'master-migration'
FROM users u WHERE email='yukihiro_ito@prosent.co.jp'
AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id=u.id AND m.role='ops_admin' AND m.scope_type='ops' AND m.revoked_at IS NULL);
