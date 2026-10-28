BEGIN;
-- Additive upgrade. Existing identity, ledger, referrals and voucher schema remain intact.
ALTER TABLE commerce_orders ALTER COLUMN lead_id DROP NOT NULL;
CREATE TABLE IF NOT EXISTS learning_products (
 id BIGSERIAL PRIMARY KEY,slug TEXT UNIQUE NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',
 kind TEXT NOT NULL CHECK(kind IN ('course','ebook','webinar','consultation','bundle')),
 state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','published','archived')),
 price BIGINT NOT NULL CHECK(price BETWEEN 0 AND 999999999999),access_days INTEGER CHECK(access_days BETWEEN 1 AND 36500),
 commission_bps INTEGER NOT NULL DEFAULT 0 CHECK(commission_bps BETWEEN 0 AND 10000),
 attribution_enabled BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS learning_lessons (
 id BIGSERIAL PRIMARY KEY,product_id BIGINT NOT NULL REFERENCES learning_products(id),module TEXT NOT NULL,title TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('text','video','link','file')),body TEXT NOT NULL DEFAULT '',url TEXT NOT NULL DEFAULT '',file_path TEXT NOT NULL DEFAULT '',
 position INTEGER NOT NULL DEFAULT 0,unlock_days INTEGER NOT NULL DEFAULT 0 CHECK(unlock_days BETWEEN 0 AND 36500),
 required BOOLEAN NOT NULL DEFAULT true,preview BOOLEAN NOT NULL DEFAULT false,state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','published','archived'))
);
CREATE TABLE IF NOT EXISTS learning_coupons (
 code TEXT PRIMARY KEY,product_id BIGINT NOT NULL REFERENCES learning_products(id),discount BIGINT NOT NULL CHECK(discount>0),max_uses INTEGER NOT NULL CHECK(max_uses>0),
 per_user INTEGER NOT NULL DEFAULT 1 CHECK(per_user>0),expires_at TIMESTAMPTZ,active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS learning_purchases (
 id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES platform_users(id),product_id BIGINT NOT NULL REFERENCES learning_products(id),
 order_id BIGINT UNIQUE REFERENCES commerce_orders(id),request_key TEXT NOT NULL,payload TEXT NOT NULL,snapshot JSONB NOT NULL,
 partner_user_id UUID REFERENCES platform_users(id),referral_alias TEXT NOT NULL DEFAULT '',coupon_code TEXT REFERENCES learning_coupons(code),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(user_id,request_key)
);
CREATE TABLE IF NOT EXISTS learning_grants (
 id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES platform_users(id),product_id BIGINT NOT NULL REFERENCES learning_products(id),
 purchase_id BIGINT UNIQUE REFERENCES learning_purchases(id),source TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',
 started_at TIMESTAMPTZ NOT NULL DEFAULT now(),expires_at TIMESTAMPTZ,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','revoked')),
 duration_days INTEGER CHECK(duration_days BETWEEN 1 AND 36500),required_lessons JSONB NOT NULL DEFAULT '[]',last_lesson_id BIGINT REFERENCES learning_lessons(id),created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learning_grants_user_idx ON learning_grants(user_id,product_id);
CREATE TABLE IF NOT EXISTS learning_progress (
 user_id UUID NOT NULL REFERENCES platform_users(id),lesson_id BIGINT NOT NULL REFERENCES learning_lessons(id),completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(user_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS learning_jobs (
 order_id BIGINT PRIMARY KEY REFERENCES commerce_orders(id),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),attempts INTEGER NOT NULL DEFAULT 0,last_error TEXT NOT NULL DEFAULT ''
);
-- Enqueue in the receipt/refund transaction, even if web process dies immediately after commit.
CREATE OR REPLACE FUNCTION queue_learning_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM learning_purchases WHERE order_id=NEW.order_id) THEN
 INSERT INTO learning_jobs(order_id) VALUES(NEW.order_id) ON CONFLICT(order_id) DO UPDATE SET updated_at=now();
 END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS commerce_learning_receipt ON commerce_ledger;
CREATE TRIGGER commerce_learning_receipt AFTER INSERT ON commerce_ledger FOR EACH ROW EXECUTE FUNCTION queue_learning_receipt();
CREATE TABLE IF NOT EXISTS affiliate_payouts (
 id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES platform_users(id),request_key TEXT NOT NULL,amount BIGINT NOT NULL CHECK(amount>0),details TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'requested' CHECK(state IN ('requested','approved','paid','rejected')),reason TEXT NOT NULL DEFAULT '',actor TEXT NOT NULL DEFAULT '',reference TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(user_id,request_key)
);
CREATE TABLE IF NOT EXISTS affiliate_entries (
 id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES platform_users(id),purchase_id BIGINT REFERENCES learning_purchases(id),amount BIGINT NOT NULL CHECK(amount<>0),
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','available','reserved','paid','rejected','reversed')),
 payout_id BIGINT REFERENCES affiliate_payouts(id),event_key TEXT UNIQUE NOT NULL,reverses_id BIGINT REFERENCES affiliate_entries(id),reason TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS learning_audit (id BIGSERIAL PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,payload JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS learning_notifications (id BIGSERIAL PRIMARY KEY,event_key TEXT UNIQUE NOT NULL,user_id UUID NOT NULL REFERENCES platform_users(id),message TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'inbox',created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS learning_certificates (code TEXT PRIMARY KEY,user_id UUID NOT NULL REFERENCES platform_users(id),product_id BIGINT NOT NULL REFERENCES learning_products(id),participant_name TEXT NOT NULL,program_name TEXT NOT NULL,issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),revoked_at TIMESTAMPTZ,reason TEXT NOT NULL DEFAULT '',UNIQUE(user_id,product_id));
CREATE TABLE IF NOT EXISTS learning_tickets (id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES platform_users(id),subject TEXT NOT NULL,message TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','closed')),reply TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- Simulation receipts remain visible in audit history, excluded from operational totals.
ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION mark_voucher_simulation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 UPDATE commerce_orders SET is_simulation=(NEW.mode='test') WHERE id=NEW.order_id;
 RETURN NEW; END $$;
DO $$ BEGIN
 IF to_regclass('voucher_orders') IS NOT NULL THEN
  EXECUTE 'UPDATE commerce_orders o SET is_simulation=(v.mode=''test'') FROM voucher_orders v WHERE v.order_id=o.id';
  EXECUTE 'DROP TRIGGER IF EXISTS voucher_simulation_marker ON voucher_orders';
  EXECUTE 'CREATE TRIGGER voucher_simulation_marker AFTER INSERT OR UPDATE OF mode ON voucher_orders FOR EACH ROW EXECUTE FUNCTION mark_voucher_simulation()';
 END IF;
END $$;

COMMIT;
