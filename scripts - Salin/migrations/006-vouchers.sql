BEGIN;
ALTER TABLE commerce_orders ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES platform_users(id);
CREATE TABLE IF NOT EXISTS voucher_settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 unit_price BIGINT NOT NULL CHECK(unit_price>0 AND unit_price<=999999999999),
 max_quantity INTEGER NOT NULL CHECK(max_quantity BETWEEN 1 AND 10000),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO voucher_settings(id,unit_price,max_quantity) VALUES(1,165000,1000) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS voucher_orders (
 order_id BIGINT PRIMARY KEY REFERENCES commerce_orders(id),
 buyer_user_id UUID NOT NULL REFERENCES platform_users(id),
 promoter_code TEXT NOT NULL,
 promoter_name TEXT NOT NULL,
 branch_code TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10000),
 unit_price BIGINT NOT NULL CHECK(unit_price>0),
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','preparing','dispatching','needs_review','success','test_success','closed')),
 dispatch_reference TEXT UNIQUE NOT NULL,
 before_balance JSONB,
 after_balance JSONB,
 last_error TEXT,
 claimed_at TIMESTAMPTZ,
 dispatched_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- An uncertain delivery continues to hold this lock until explicit reconciliation.
CREATE UNIQUE INDEX IF NOT EXISTS voucher_one_unresolved_promoter ON voucher_orders(promoter_code) WHERE status IN ('preparing','dispatching','needs_review');
CREATE INDEX IF NOT EXISTS voucher_orders_buyer_idx ON voucher_orders(buyer_user_id,order_id DESC);
CREATE TABLE IF NOT EXISTS voucher_reconciliations (
 id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL REFERENCES voucher_orders(order_id),
 actor_id UUID NOT NULL REFERENCES platform_users(id),action TEXT NOT NULL,note TEXT NOT NULL,reference TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
