-- Additive internal orders only. Existing external payment references are not receipts.
CREATE TABLE IF NOT EXISTS commerce_orders (
 id BIGSERIAL PRIMARY KEY,
 number TEXT UNIQUE NOT NULL,
 lead_id BIGINT NOT NULL,
 customer_name TEXT NOT NULL,
 customer_phone TEXT NOT NULL,
 customer_email TEXT NOT NULL DEFAULT '',
 state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','issued','cancelled')),
 lines JSONB NOT NULL,
 total BIGINT NOT NULL CHECK(total > 0 AND total <= 999999999999),
 create_key TEXT UNIQUE NOT NULL,
 create_payload TEXT NOT NULL,
 created_by TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS commerce_orders_lead_idx ON commerce_orders(lead_id);
CREATE TABLE IF NOT EXISTS commerce_ledger (
 id BIGSERIAL PRIMARY KEY,
 order_id BIGINT NOT NULL REFERENCES commerce_orders(id),
 kind TEXT NOT NULL CHECK(kind IN ('receipt','refund','correction')),
 amount BIGINT NOT NULL CHECK(amount <> 0 AND abs(amount) <= 999999999999),
 reverses_id BIGINT UNIQUE REFERENCES commerce_ledger(id),
 reason TEXT NOT NULL,
 reference TEXT NOT NULL DEFAULT '',
 actor TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK((kind='receipt' AND amount>0 AND reverses_id IS NULL) OR (kind='refund' AND amount<0 AND reverses_id IS NULL) OR (kind='correction' AND reverses_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS commerce_ledger_order_idx ON commerce_ledger(order_id);
CREATE TABLE IF NOT EXISTS commerce_audit (
 id BIGSERIAL PRIMARY KEY,
 order_id BIGINT NOT NULL REFERENCES commerce_orders(id),
 action TEXT NOT NULL,
 operation_key TEXT NOT NULL,
 payload TEXT NOT NULL,
 actor TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(order_id,operation_key)
);
