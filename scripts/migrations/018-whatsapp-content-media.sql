BEGIN;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS media_url TEXT NOT NULL DEFAULT '';
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS media_url TEXT NOT NULL DEFAULT '';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS media_url TEXT NOT NULL DEFAULT '';
ALTER TABLE whatsapp_group_broadcasts ADD COLUMN IF NOT EXISTS media_url TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS whatsapp_attachments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL, mime_type TEXT NOT NULL,
 bytes BYTEA NOT NULL CHECK (octet_length(bytes)<=10485760),
 created_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO whatsapp_templates(title,category,body,active)
SELECT v.title,v.category,v.body,TRUE FROM (VALUES
('Edukasi layanan','attract','Halo {{nama}}, ingin mengenal layanan STIFIn? Kami dapat mengirimkan informasi proses, biaya, dan pilihan lokasi. Balas INFO jika Anda berminat.'),
('Kenali kebutuhan','engage','Halo {{nama}}, apa yang ingin Anda ketahui tentang layanan kami? Ceritakan kebutuhan dan domisili Anda agar tim dapat membantu.'),
('Tindak lanjut konsultasi','engage','Halo {{nama}}, kami menindaklanjuti percakapan sebelumnya. Apakah ada informasi yang masih Anda perlukan sebelum menentukan langkah berikutnya?'),
('Ajakan booking','convert','Halo {{nama}}, jika ingin melanjutkan pemesanan, silakan sampaikan pilihan tanggal dan lokasi. Tim akan memeriksa ketersediaan lalu mengonfirmasi jadwal dan biaya.'),
('Pendampingan setelah layanan','delight','Halo {{nama}}, terima kasih telah menggunakan layanan kami. Apakah ada bagian penjelasan yang ingin Anda tanyakan kembali? Kami siap membantu.'),
('Permintaan umpan balik','delight','Halo {{nama}}, bagaimana pengalaman Anda menggunakan layanan kami? Silakan sampaikan penilaian dan saran agar kami dapat memperbaiki pelayanan.'),
('Ajakan rekomendasi','referral','Halo {{nama}}, jika ada keluarga atau rekan yang membutuhkan informasi layanan, Anda boleh membagikan tautan resmi kami. Mereka dapat menghubungi tim sesuai kebutuhan.'),
('Sapa kembali','reactivation','Halo {{nama}}, kami ingin menyapa kembali. Apakah informasi layanan masih Anda perlukan? Balas INFO untuk melanjutkan atau STOP jika ingin berhenti menerima pesan.')
) AS v(title,category,body)
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates t WHERE t.title=v.title);
COMMIT;
