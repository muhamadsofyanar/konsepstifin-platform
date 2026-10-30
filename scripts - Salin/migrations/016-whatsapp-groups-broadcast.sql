BEGIN;

-- Make the first send time of existing drip campaigns explicit.
ALTER TABLE whatsapp_drip_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Groups discovered from the connected StarSender device. Broadcast is opt-in per group.
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  group_jid TEXT PRIMARY KEY,
  group_name TEXT NOT NULL DEFAULT '',
  device_name TEXT NOT NULL DEFAULT '',
  allow_broadcast BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_groups_broadcast_idx
  ON whatsapp_groups(allow_broadcast, group_name);

-- Reusable target presets. Each preset is an explicit allowlisted subset of groups.
CREATE TABLE IF NOT EXISTS whatsapp_group_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_group_presets_name_idx
  ON whatsapp_group_presets(lower(name));
CREATE TABLE IF NOT EXISTS whatsapp_group_preset_items (
  preset_id UUID NOT NULL REFERENCES whatsapp_group_presets(id) ON DELETE CASCADE,
  group_jid TEXT NOT NULL REFERENCES whatsapp_groups(group_jid) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(preset_id, group_jid)
);

-- Scheduled group broadcasts are app-queued, so the dashboard can show exact local schedule and outcomes.
CREATE TABLE IF NOT EXISTS whatsapp_group_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID REFERENCES whatsapp_group_presets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','processing','paused','completed','cancelled','failed')),
  created_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_group_broadcasts_recent_idx
  ON whatsapp_group_broadcasts(created_at DESC);
CREATE TABLE IF NOT EXISTS whatsapp_group_broadcast_jobs (
  id BIGSERIAL PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES whatsapp_group_broadcasts(id) ON DELETE CASCADE,
  group_jid TEXT NOT NULL REFERENCES whatsapp_groups(group_jid) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','failed','unknown','cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  provider_message_id TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT NOT NULL DEFAULT '',
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, group_jid)
);
CREATE INDEX IF NOT EXISTS whatsapp_group_broadcast_jobs_due_idx
  ON whatsapp_group_broadcast_jobs(status, scheduled_at, id)
  WHERE status = 'pending';

-- Group inbox data is only populated when the StarSender Webhook Group add-on is active.
CREATE TABLE IF NOT EXISTS whatsapp_group_messages (
  id BIGSERIAL PRIMARY KEY,
  provider_message_id TEXT NOT NULL UNIQUE,
  group_jid TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL CHECK (direction IN ('incoming','outgoing')),
  sender_jid TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL DEFAULT '',
  sender_is_admin BOOLEAN,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  device_name TEXT NOT NULL DEFAULT '',
  provider_timestamp TIMESTAMPTZ,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_group_messages_recent_idx
  ON whatsapp_group_messages(group_jid, created_at DESC, id DESC);

COMMIT;
