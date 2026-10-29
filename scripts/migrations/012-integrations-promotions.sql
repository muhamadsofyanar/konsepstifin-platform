BEGIN;
CREATE TABLE IF NOT EXISTS platform_integrations (
  provider TEXT PRIMARY KEY CHECK (provider IN ('all')),
  iv TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  updated_by UUID REFERENCES platform_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_promotion_settings (
  id INTEGER PRIMARY KEY CHECK (id=1),
  config JSONB NOT NULL,
  updated_by UUID REFERENCES platform_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO platform_promotion_settings(id,config) VALUES (1,
'{"familyEnabled":true,"workshopEnabled":true,"startDate":"2026-10-28","endDate":"2026-12-31","minimumPaidTestPrice":500000,"familySchemes":[{"key":"family-3-1","paidTests":3,"freeTests":1,"label":"3 tes + 1 gratis"},{"key":"family-4-1","paidTests":4,"freeTests":1,"label":"4 tes + 1 gratis"},{"key":"family-7-2","paidTests":7,"freeTests":2,"label":"7 tes + 2 gratis"}],"workshopPrices":{"wsl1":500000,"wsl2":2500000,"wst":1000000}}'::jsonb)
ON CONFLICT(id) DO NOTHING;

-- WST is a separately selectable workshop offered during the central year-end campaign.
INSERT INTO public_products(product_key,group_name,eyebrow,title,description,price,price_note,features,bonuses,action,active,featured,sort_order)
VALUES ('wst','promoter','WORKSHOP','WST','Program WST sesuai paket Year-End Workshop dari pusat. Rincian cakupan, jadwal, dan persyaratan dikonfirmasi oleh tim sebelum pendaftaran.','Rp1.000.000','harga promo Year-End Workshop · jadwal dikonfirmasi admin','["Harga mengikuti program promo pusat selama periode aktif","Konfirmasi jadwal dan cakupan kegiatan","Informasi teknis sebelum mendaftar"]','[]','Minta informasi WST',true,false,4)
ON CONFLICT(product_key) DO NOTHING;
INSERT INTO learning_products(slug,title,description,kind,state,price,source_product_key,price_note)
SELECT 'layanan-wst',title,description,'consultation','published',1000000,'wst',price_note FROM public_products WHERE product_key='wst'
ON CONFLICT(source_product_key) DO NOTHING;
COMMIT;
