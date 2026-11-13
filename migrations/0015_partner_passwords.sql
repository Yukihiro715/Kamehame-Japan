CREATE TABLE partner_passwords (
 user_id TEXT PRIMARY KEY REFERENCES users(id), salt TEXT NOT NULL, password_hash TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE partner_password_tokens (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL, consumed_by TEXT
);
CREATE INDEX partner_password_tokens_user ON partner_password_tokens(user_id);
CREATE TABLE partner_auth_limits (bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at TEXT NOT NULL);
INSERT INTO partner_commission_rates (id,legal_entity_id,rate_bp,valid_from,created_at,created_by)
VALUES ('common-rate-five-percent',NULL,500,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),'migration:0015');
INSERT INTO audit_logs (id,at,actor,action,target_type,target_id,after_json)
VALUES ('audit-common-rate-five-percent',strftime('%Y-%m-%dT%H:%M:%fZ','now'),'migration:0015','commission_rate.create','commission_rate','common-rate-five-percent','{"legalEntityId":null,"rateBp":500}');
