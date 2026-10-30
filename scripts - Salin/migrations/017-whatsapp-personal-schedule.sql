BEGIN;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS send_mode TEXT NOT NULL DEFAULT 'inbound_first' CHECK (send_mode IN ('inbound_first','consented_outbound'));
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS send_mode TEXT NOT NULL DEFAULT 'inbound_first' CHECK (send_mode IN ('inbound_first','consented_outbound'));
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS display_name_override TEXT NOT NULL DEFAULT '';
COMMIT;
