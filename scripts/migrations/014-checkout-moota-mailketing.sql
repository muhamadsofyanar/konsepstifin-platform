BEGIN;

-- Track automated invoice lifecycle without altering the existing financial ledger.
ALTER TABLE commerce_orders
  ADD COLUMN IF NOT EXISTS moota_invoice_status TEXT NOT NULL DEFAULT 'not_created',
  ADD COLUMN IF NOT EXISTS moota_invoice_error TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS moota_invoice_requested_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE commerce_orders ADD CONSTRAINT commerce_orders_moota_invoice_status_check
    CHECK (moota_invoice_status IN ('not_created','creating','created','failed','unknown'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
UPDATE commerce_orders SET moota_invoice_status='created'
  WHERE COALESCE(moota_payment_url,'')<>'' AND moota_invoice_status='not_created';
CREATE INDEX IF NOT EXISTS commerce_orders_moota_invoice_status_idx
  ON commerce_orders(moota_invoice_status, updated_at DESC)
  WHERE state='issued' AND moota_invoice_status IN ('not_created','failed','unknown');


-- Expire stale WhatsApp payment instructions so a late inbound chat cannot send an expired link.
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE notification_outbox ADD CONSTRAINT notification_outbox_status_check
  CHECK (status IN ('pending','sending','sent','failed','unknown','awaiting_inbound','expired'));
CREATE INDEX IF NOT EXISTS notification_outbox_expiry_idx
  ON notification_outbox(status, expires_at) WHERE expires_at IS NOT NULL AND status IN ('pending','awaiting_inbound');

-- Transactional email queue. It is independent from marketing campaigns and WhatsApp consent.
CREATE TABLE IF NOT EXISTS email_notification_outbox (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  order_id BIGINT REFERENCES commerce_orders(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','unknown','expired')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  provider_response JSONB,
  last_error TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_notification_outbox_pending_idx
  ON email_notification_outbox(status, available_at, id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS email_notification_outbox_order_idx
  ON email_notification_outbox(order_id, created_at DESC);

COMMIT;
