BEGIN;
CREATE TABLE IF NOT EXISTS platform_contact_profiles (
 user_id UUID PRIMARY KEY REFERENCES platform_users(id) ON DELETE CASCADE,
 display_name TEXT NOT NULL DEFAULT '' CHECK(length(display_name)<=120),
 whatsapp_phone TEXT NOT NULL DEFAULT '' CHECK(whatsapp_phone='' OR whatsapp_phone ~ '^[1-9][0-9]{7,14}$'),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dashboard_chat_threads (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 member_id UUID NOT NULL UNIQUE REFERENCES platform_users(id) ON DELETE CASCADE,
 member_read_id BIGINT NOT NULL DEFAULT 0,
 admin_read_id BIGINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dashboard_chat_messages (
 id BIGSERIAL PRIMARY KEY,
 thread_id UUID NOT NULL REFERENCES dashboard_chat_threads(id) ON DELETE CASCADE,
 sender_id UUID NOT NULL REFERENCES platform_users(id),
 sender_kind TEXT NOT NULL CHECK(sender_kind IN ('admin','member')),
 body TEXT NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 4000),
 client_key UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(sender_id,client_key)
);
CREATE INDEX IF NOT EXISTS dashboard_chat_messages_thread_idx ON dashboard_chat_messages(thread_id,id);
CREATE INDEX IF NOT EXISTS dashboard_chat_threads_recent_idx ON dashboard_chat_threads(updated_at DESC);
COMMIT;
