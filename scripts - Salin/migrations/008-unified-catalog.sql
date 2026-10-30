BEGIN;
ALTER TABLE learning_products ADD COLUMN IF NOT EXISTS source_product_key TEXT UNIQUE;
ALTER TABLE learning_products ADD COLUMN IF NOT EXISTS price_note TEXT NOT NULL DEFAULT '';
-- A service buyer can be a CRM contact without an online account.
ALTER TABLE learning_purchases ALTER COLUMN user_id DROP NOT NULL;
COMMIT;
