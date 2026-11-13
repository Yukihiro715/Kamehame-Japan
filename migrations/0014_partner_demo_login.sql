-- Isolated shared demo; existing internal data and memberships stay private.
CREATE TABLE demo_credentials (user_id TEXT PRIMARY KEY REFERENCES users(id), salt_hex TEXT NOT NULL, password_hash TEXT NOT NULL, iterations INTEGER NOT NULL);
CREATE TABLE demo_login_limits (bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at TEXT NOT NULL);
INSERT INTO partner_legal_entities (id, name, registration_status, partner_type, entity_kind, created_at, updated_at)
VALUES ('le-partner-public-demo', 'KAMEHAME デモ用', 'unverified', 'other', 'company', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
INSERT INTO hotels (id, legal_entity_id, public_id, name, status, site_kind, features_json, created_at, updated_at)
VALUES ('site-partner-public-demo', 'le-partner-public-demo', 'HP-DEMO-PUBLIC', 'デモ用', 'active', 'other', '{"refer":true,"cases":true,"settlement":true,"members":false}', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
INSERT INTO users (id, email, name, status, lang, created_at, created_by)
VALUES ('u-partner-public-demo', 'demo@kamemane-japan.com', 'デモユーザー', 'active', 'ja', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'migration');
INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at, created_by)
VALUES ('m-public-demo-manager', 'u-partner-public-demo', 'partner_manager', 'hotel', 'site-partner-public-demo', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'migration');
INSERT INTO demo_credentials (user_id, salt_hex, password_hash, iterations)
VALUES ('u-partner-public-demo', '3f3a2eeb32e3f61c59f3eaf00a2ce746', '66a216df71924358da58b8e66e601f1d540dd319f75b3c563cc5c6c583f188bb', 100000);
UPDATE hotels SET name = 'デモ用（社内確認）' WHERE id = 'site-prosent-demo';
