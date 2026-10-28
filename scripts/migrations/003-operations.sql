BEGIN;
CREATE TABLE IF NOT EXISTS platform_settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 bank_name TEXT NOT NULL DEFAULT '',
 account_number TEXT NOT NULL DEFAULT '',
 account_holder TEXT NOT NULL DEFAULT '',
 instructions TEXT NOT NULL DEFAULT '',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO platform_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS platform_admin_audit (
 id BIGSERIAL PRIMARY KEY,
 actor_id UUID NOT NULL REFERENCES platform_users(id),
 action TEXT NOT NULL,
 target TEXT NOT NULL,
 details JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_admin_audit_created_idx ON platform_admin_audit(created_at DESC,id DESC);
COMMIT;
