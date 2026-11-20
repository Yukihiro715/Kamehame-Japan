CREATE TABLE ops_passwords (user_id TEXT PRIMARY KEY REFERENCES users(id), salt TEXT NOT NULL, password_hash TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE ops_password_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL, consumed_by TEXT);
CREATE INDEX ops_password_tokens_user ON ops_password_tokens(user_id);
