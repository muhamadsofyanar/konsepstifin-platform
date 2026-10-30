BEGIN;
CREATE TABLE IF NOT EXISTS platform_branches (
 code TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 regency_code TEXT NOT NULL UNIQUE CHECK (regency_code ~ '^[0-9]{2}\.[0-9]{2}$'),
 regency_name TEXT NOT NULL,
 manager_code TEXT NOT NULL UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_promoter_profiles (
 user_id UUID PRIMARY KEY REFERENCES platform_promoter_accounts(user_id),
 branch_code TEXT NOT NULL REFERENCES platform_branches(code),
 name TEXT NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
 service_area TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_promoter_profiles_branch_idx ON platform_promoter_profiles(branch_code);
CREATE TABLE IF NOT EXISTS platform_activation_tokens (
 token_hash TEXT PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_activation_tokens_user_idx ON platform_activation_tokens(user_id);
COMMIT;
