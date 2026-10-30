BEGIN;

-- Unified WhatsApp conversation store. Existing lead, consent and notification data remain intact.
CREATE TABLE IF NOT EXISTS starsender_message_events (
  message_id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming','outgoing')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS starsender_message_events_phone_idx ON starsender_message_events(phone_e164,received_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  lead_id BIGINT REFERENCES public_interest_leads(id) ON DELETE SET NULL,
  assigned_promoter_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting','closed')),
  bot_mode TEXT NOT NULL DEFAULT 'bot' CHECK (bot_mode IN ('bot','human')),
  last_message_text TEXT NOT NULL DEFAULT '',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_count INTEGER NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_conversations_recent_idx
  ON whatsapp_conversations(last_message_at DESC, id);
CREATE INDEX IF NOT EXISTS whatsapp_conversations_lead_idx
  ON whatsapp_conversations(lead_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_conversations_promoter_idx
  ON whatsapp_conversations(assigned_promoter_code, last_message_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  outbox_id BIGINT REFERENCES notification_outbox(id) ON DELETE SET NULL,
  provider_message_id TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL CHECK (direction IN ('incoming','outgoing')),
  sender_type TEXT NOT NULL DEFAULT 'customer' CHECK (sender_type IN ('customer','agent','bot','system')),
  sender_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT '',
  quoted_message TEXT NOT NULL DEFAULT '',
  delivery_status TEXT NOT NULL DEFAULT 'received' CHECK (delivery_status IN ('queued','sent','delivered','read','failed','received','unknown')),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS outbox_id BIGINT REFERENCES notification_outbox(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_messages_provider_id_idx
  ON whatsapp_messages(provider_message_id) WHERE provider_message_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_messages_outbox_id_idx
  ON whatsapp_messages(outbox_id) WHERE outbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS whatsapp_messages_conversation_idx
  ON whatsapp_messages(conversation_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'umum',
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_templates_active_idx ON whatsapp_templates(active,category,title);
INSERT INTO whatsapp_templates(title,category,body) VALUES
  ('Sapaan','umum','Assalamu’alaikum {{nama}}. Terima kasih telah menghubungi KonsepSTIFIn. Ada yang dapat kami bantu?'),
  ('Informasi tes','tes','Tes STIFIn merupakan layanan pemetaan kecenderungan mesin kecerdasan. Pelaksanaannya dibantu promotor. Apakah Anda ingin dibantu mencari promotor di wilayah Anda?'),
  ('Permintaan domisili','tes','Boleh diinformasikan kabupaten/kota dan provinsi domisili Anda agar kami dapat membantu mencari promotor terdekat?'),
  ('Tindak lanjut','follow_up','Halo {{nama}}, kami ingin memastikan apakah masih ada informasi yang perlu dibantu terkait permintaan Anda. Silakan sampaikan pertanyaan atau kebutuhan Anda.'),
  ('Calon promotor','promotor','Terima kasih atas minat Anda bergabung sebagai promotor STIFIn. Tim akan membantu menjelaskan tahapan, persyaratan, dan proses verifikasi. Pengajuan belum berarti status promotor telah disetujui.')
ON CONFLICT(title) DO NOTHING;

CREATE TABLE IF NOT EXISTS whatsapp_bot_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_processing_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  system_instructions TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE whatsapp_bot_settings ADD COLUMN IF NOT EXISTS ai_processing_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;
INSERT INTO whatsapp_bot_settings(id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS whatsapp_bot_jobs (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  inbound_message_id BIGINT NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','queued','sent','failed','skipped')),
  outbox_id BIGINT REFERENCES notification_outbox(id) ON DELETE SET NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inbound_message_id)
);
ALTER TABLE whatsapp_bot_jobs ADD COLUMN IF NOT EXISTS outbox_id BIGINT REFERENCES notification_outbox(id) ON DELETE SET NULL;
ALTER TABLE whatsapp_bot_jobs DROP CONSTRAINT IF EXISTS whatsapp_bot_jobs_status_check;
ALTER TABLE whatsapp_bot_jobs ADD CONSTRAINT whatsapp_bot_jobs_status_check CHECK (status IN ('pending','processing','queued','sent','failed','skipped'));
CREATE INDEX IF NOT EXISTS whatsapp_bot_jobs_pending_idx
  ON whatsapp_bot_jobs(status, available_at, id) WHERE status = 'pending';

-- Drip campaigns use the same consent and 24-hour checks as existing WhatsApp marketing.
CREATE TABLE IF NOT EXISTS whatsapp_drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS whatsapp_drip_steps (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES whatsapp_drip_campaigns(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order BETWEEN 1 AND 30),
  delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (delay_minutes BETWEEN 0 AND 525600),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, step_order)
);
CREATE TABLE IF NOT EXISTS whatsapp_drip_enrollments (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES whatsapp_drip_campaigns(id) ON DELETE CASCADE,
  lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  current_step INTEGER NOT NULL DEFAULT 0 CHECK (current_step >= 0),
  next_send_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_error TEXT NOT NULL DEFAULT '',
  UNIQUE(campaign_id, lead_id)
);
CREATE INDEX IF NOT EXISTS whatsapp_drip_due_idx
  ON whatsapp_drip_enrollments(status, next_send_at) WHERE status = 'active';

ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL;
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'system';
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL;
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS drip_enrollment_id BIGINT REFERENCES whatsapp_drip_enrollments(id) ON DELETE SET NULL;
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS drip_step_id BIGINT REFERENCES whatsapp_drip_steps(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS notification_outbox_conversation_idx
  ON notification_outbox(conversation_id, created_at DESC) WHERE conversation_id IS NOT NULL;

COMMIT;
