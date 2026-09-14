BEGIN;
CREATE TABLE IF NOT EXISTS platform_users (
 id UUID PRIMARY KEY,
 email TEXT NOT NULL UNIQUE CHECK (email=lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
 password_hash TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_user_roles (
 user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK (role IN ('super_admin','admin','promoter','member','affiliate','instructor')),
 PRIMARY KEY(user_id,role)
);
CREATE TABLE IF NOT EXISTS platform_promoter_accounts (
 user_id UUID PRIMARY KEY REFERENCES platform_users(id) ON DELETE CASCADE,
 promoter_code TEXT NOT NULL UNIQUE CHECK (length(btrim(promoter_code))>0)
);
CREATE TABLE IF NOT EXISTS platform_sessions (
 token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
 user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 revoked_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_sessions_user_idx ON platform_sessions(user_id);
CREATE INDEX IF NOT EXISTS platform_sessions_expiry_idx ON platform_sessions(expires_at);
CREATE TABLE IF NOT EXISTS platform_login_attempts (
 key_hash TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL CHECK(attempts>0),
 reset_at TIMESTAMPTZ NOT NULL
);
COMMIT;
