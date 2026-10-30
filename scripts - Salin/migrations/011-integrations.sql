BEGIN;

-- Moota invoice references are additive. Existing manual ledger entries remain intact.
ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS moota_invoice_id TEXT;
ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS moota_payment_url TEXT;
ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS moota_payment_amount BIGINT;
ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS moota_expires_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS commerce_orders_moota_invoice_idx
  ON commerce_orders(moota_invoice_id) WHERE moota_invoice_id IS NOT NULL AND moota_invoice_id <> '';

-- Every verified webhook is persisted once, including unmatched events for later reconciliation.
CREATE TABLE IF NOT EXISTS moota_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT '',
  amount BIGINT,
  reference TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_state TEXT NOT NULL DEFAULT 'received'
    CHECK (processing_state IN ('received','processed','unmatched','ignored','rejected')),
  order_id BIGINT REFERENCES commerce_orders(id),
  processing_note TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS moota_webhook_events_state_idx
  ON moota_webhook_events(processing_state, received_at DESC);

-- Contact permission for marketing is separate from general service-contact consent.
ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS whatsapp_marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS whatsapp_marketing_consent_at TIMESTAMPTZ;
ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS whatsapp_marketing_consent_by TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Outbox prevents provider calls from holding a payment webhook request open.
CREATE TABLE IF NOT EXISTS notification_outbox (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  lead_id BIGINT REFERENCES public_interest_leads(id),
  order_id BIGINT REFERENCES commerce_orders(id),
  campaign_id UUID REFERENCES marketing_campaigns(id),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sending','sent','failed','unknown')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_response JSONB,
  last_error TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_outbox_pending_idx
  ON notification_outbox(status, available_at, id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS notification_outbox_campaign_idx
  ON notification_outbox(campaign_id, status);

COMMIT;
