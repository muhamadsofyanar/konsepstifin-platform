BEGIN;

-- Track customer-initiated WhatsApp conversations. Marketing consent remains a separate requirement.
CREATE TABLE IF NOT EXISTS whatsapp_inbound_sessions (
  phone_e164 TEXT PRIMARY KEY,
  last_inbound_at TIMESTAMPTZ NOT NULL,
  last_message_id TEXT NOT NULL DEFAULT '',
  opted_out_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_inbound_sessions_recent_idx
  ON whatsapp_inbound_sessions(last_inbound_at DESC);

CREATE TABLE IF NOT EXISTS starsender_inbound_events (
  message_id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS starsender_inbound_events_phone_idx
  ON starsender_inbound_events(phone_e164, received_at DESC);

ALTER TABLE notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE notification_outbox ADD CONSTRAINT notification_outbox_status_check
  CHECK (status IN ('pending','sending','sent','failed','unknown','awaiting_inbound'));
CREATE INDEX IF NOT EXISTS notification_outbox_waiting_inbound_idx
  ON notification_outbox(status, recipient_phone, available_at) WHERE status='awaiting_inbound';

COMMIT;
