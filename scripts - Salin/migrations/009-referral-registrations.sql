BEGIN;
-- Creation-time attribution. Never infer or backfill an inviter from an email address.
CREATE TABLE IF NOT EXISTS platform_referral_registrations (
 user_id UUID PRIMARY KEY REFERENCES platform_users(id),
 partner_user_id UUID NOT NULL REFERENCES platform_users(id),
 alias TEXT NOT NULL REFERENCES platform_referral_aliases(alias),
 attribution_expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(user_id <> partner_user_id)
);
CREATE INDEX IF NOT EXISTS platform_referral_registrations_partner_idx
 ON platform_referral_registrations(partner_user_id,created_at DESC);
CREATE OR REPLACE FUNCTION preserve_registration_referral() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Registration referral is immutable'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS registration_referral_source ON platform_referral_registrations;
CREATE TRIGGER registration_referral_source BEFORE UPDATE ON platform_referral_registrations
 FOR EACH ROW EXECUTE FUNCTION preserve_registration_referral();
COMMIT;
