BEGIN;
CREATE TABLE IF NOT EXISTS platform_referral_aliases (
 alias TEXT PRIMARY KEY CHECK(alias = lower(alias) AND alias ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(alias) BETWEEN 2 AND 80),
 user_id UUID NOT NULL REFERENCES platform_users(id),
 is_current BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS platform_referral_current_idx ON platform_referral_aliases(user_id) WHERE is_current;
INSERT INTO platform_referral_aliases(alias,user_id,is_current)
 SELECT lower(a.promoter_code),a.user_id,true FROM platform_promoter_accounts a
 JOIN platform_promoter_profiles p ON p.user_id=a.user_id
 WHERE lower(a.promoter_code) ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS platform_referral_visits (
 token_hash TEXT PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 alias TEXT NOT NULL REFERENCES platform_referral_aliases(alias),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '30 days',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_referral_visits_expiry_idx ON platform_referral_visits(expires_at);
-- Legacy public-interest schema is initialized independently by the application.
CREATE TABLE IF NOT EXISTS public_interest_leads (
 id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL,city TEXT NOT NULL DEFAULT '',
 service TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',source_path TEXT NOT NULL DEFAULT '/',
 status TEXT NOT NULL DEFAULT 'baru',created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS source_partner_user_id UUID REFERENCES platform_users(id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public_interest_leads'::regclass AND conname='public_interest_leads_source_partner_user_id_fkey') THEN
  ALTER TABLE public_interest_leads ADD CONSTRAINT public_interest_leads_source_partner_user_id_fkey FOREIGN KEY(source_partner_user_id) REFERENCES platform_users(id);
 END IF;
END $$;
ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS source_partner_code TEXT NOT NULL DEFAULT '';
ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS source_referral_alias TEXT NOT NULL DEFAULT '';
-- Attribution is a creation-time fact, independent of later CRM assignment.
CREATE OR REPLACE FUNCTION preserve_referral_source() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.source_partner_user_id,NEW.source_partner_code,NEW.source_referral_alias)
  IS DISTINCT FROM (OLD.source_partner_user_id,OLD.source_partner_code,OLD.source_referral_alias)
 THEN RAISE EXCEPTION 'Referral source is immutable'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS public_interest_referral_source ON public_interest_leads;
CREATE TRIGGER public_interest_referral_source BEFORE UPDATE ON public_interest_leads
 FOR EACH ROW EXECUTE FUNCTION preserve_referral_source();
COMMIT;
