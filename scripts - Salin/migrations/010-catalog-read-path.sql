BEGIN;
-- Catalog setup belongs to an explicit migration, never a public read.
CREATE TABLE IF NOT EXISTS public_products (
        id BIGSERIAL PRIMARY KEY,
        product_key TEXT NOT NULL UNIQUE,
        group_name TEXT NOT NULL,
        eyebrow TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price TEXT NOT NULL DEFAULT '',
        price_note TEXT NOT NULL DEFAULT '',
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        bonuses JSONB NOT NULL DEFAULT '[]'::jsonb,
        action TEXT NOT NULL DEFAULT 'Lihat produk',
        checkout_url TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
CREATE TABLE IF NOT EXISTS public_product_migrations(revision TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
INSERT INTO public_products(product_key,group_name,eyebrow,title,description,price,price_note,features,bonuses,action,active,featured,sort_order) VALUES
('tesPersonal','test','PERSONAL','Tes STIFIn Personal','Untuk Anda yang ingin memahami cara alami diri sendiri dan mendapat penjelasan hasil secara langsung.','Rp650.001','1 peserta · termasuk sesi penjelasan hasil','["Pemindaian sidik jari secara offline","Hasil tipe mesin kecerdasan","Penjelasan hasil bersama promotor","Arahan praktis pengembangan diri"]','["E-book panduan awal mengenal hasil STIFIn","Ringkasan arahan praktis setelah tes"]','Pesan tes personal',true,true,1),
('tesPasangan','test','PASANGAN','Tes STIFIn Pasangan','Untuk pasangan yang ingin memahami perbedaan cara berpikir, merespons, dan berkomunikasi tanpa saling menyalahkan.','Rp1.100.000','2 peserta · lebih hemat dibandingkan tes terpisah','["Dua kali Tes STIFIn Personal","Penjelasan hasil masing-masing","Pembahasan pola komunikasi pasangan","Arahan praktis untuk diterapkan bersama"]','["E-book komunikasi pasangan","Panduan percakapan untuk memahami perbedaan pasangan"]','Pilih paket pasangan',true,false,2),
('paketKeluarga','test','KELUARGA','Tes STIFIn Keluarga','Untuk pasangan, orang tua, dan anak yang ingin memahami mengapa cara berpikir dan berkomunikasi di rumah bisa berbeda.','Rp1.550.000','3 peserta · cocok untuk ayah, ibu, dan anak','["Seluruh fasilitas tes personal","Jadwal tes keluarga terkoordinasi","Pembahasan pola komunikasi keluarga","Rekomendasi tindak lanjut praktis"]','["E-book komunikasi keluarga","Ringkasan penerapan hasil untuk keluarga"]','Lihat paket keluarga',true,false,3),
('paketKeluargaPlus','test','KELUARGA PLUS','Tes STIFIn Keluarga Plus','Untuk keluarga yang ingin memetakan kecenderungan alami hingga lima anggota sekaligus dalam satu rangkaian layanan.','Rp2.499.999','5 peserta · satu rangkaian layanan keluarga','["Lima kali Tes STIFIn Personal","Penjelasan hasil setiap anggota","Peta sederhana dinamika keluarga","Sesi pembahasan keluarga terkoordinasi"]','["E-book komunikasi keluarga","Panduan penerapan 30 hari bersama keluarga"]','Pilih keluarga plus',true,false,4),
('sekolahKomunitas','test','INSTITUSI','Tes STIFIn Sekolah & Komunitas','Untuk sekolah, lembaga, komunitas, atau tim yang ingin menjalankan tes bersama dengan jadwal dan pendampingan yang terkoordinasi.','Gratis','program sekolah & komunitas · harga dan jadwal dikonfirmasi admin','["Pelaksanaan tes kelompok terjadwal","Koordinasi promotor dan peserta","Rekap pelaksanaan program","Sesi edukasi sesuai kesepakatan"]','["Materi pengantar peserta","Sesi orientasi koordinator"]','Minta penawaran',true,false,5),
('previewPromotor','promoter','KENALI PROFESINYA','Preview Promotor','Dengarkan gambaran peran, peluang, tanggung jawab, biaya, dan perjalanan belajar sebelum Anda memutuskan.','Konfirmasi jadwal','sesi pengenalan gratis atau sesuai agenda aktif','["Gambaran profesi secara utuh","Penjelasan tahapan dan kebutuhan biaya","Ruang tanya jawab sebelum memutuskan"]','[]','Ikuti preview',true,false,1),
('wsl1','promoter','FONDASI','Workshop STIFIn Level 1 (WSL 1)','Bangun pemahaman dasar yang diperlukan untuk melanjutkan perjalanan sebagai calon promotor.','Rp749.999','program offline · 1 hari pelatihan','["Fondasi konsep dan cara kerja STIFIn","Pengenalan 9 personality genetic dan sirkulasi mesin kecerdasan","Materi belajar, ujian, dan sertifikat sesuai ketentuan","Persiapan terarah menuju WSL 2"]','[]','Lihat jadwal WSL 1',true,false,2),
('wsl2','promoter','PENDALAMAN','Workshop STIFIn Level 2 (WSL 2)','Perdalam materi dan praktik sesuai tahap yang berlaku sebelum masuk ke proses aktivasi.','Rp4.500.000','program offline · 2–3 hari pelatihan','["Pendalaman konsep STIFIn tingkat lanjut","Praktik membaca dan membahas hasil tes","Ujian kompetensi sesuai ketentuan","Persiapan menuju aktivasi promotor"]','[]','Lihat jadwal WSL 2',true,false,3),
('idDanAlat','promoter','AKTIVASI','ID Aplikasi & Scanner Promotor','Setelah tahapan terpenuhi, lanjutkan proses ID dan alat tes sesuai ketentuan yang berlaku.','Rp4.499.997','setelah lulus WSL 1 dan WSL 2','["ID aplikasi promotor sesuai ketentuan","Scanner sidik jari untuk menjalankan layanan","Pendampingan instalasi dan penggunaan awal","Langkah aktivasi menuju promotor aktif"]','[]','Informasi ID & alat',true,false,4),
('paketPromotor','promoter','PAKET TERPADU','Paket Lengkap Menjadi Promotor STIFIn','Pilihan praktis untuk Anda yang sudah mantap menempuh perjalanan lengkap dari fondasi belajar hingga kesiapan aktivasi sebagai promotor.','Rp8.499.999','paket lengkap · harga dan jadwal dikonfirmasi admin','["Workshop STIFIn Level 1 (WSL 1)","Workshop STIFIn Level 2 (WSL 2)","ID aplikasi promotor sesuai ketentuan","Scanner sidik jari dan pendampingan instalasi awal","Alur belajar lebih terarah dari awal hingga aktivasi"]','[]','Pilih paket lengkap',true,false,5),
('affiliateUmum','affiliate','JALUR TERBUKA','Program Affiliate Konsep STIFIn','Untuk Anda yang ingin mulai merekomendasikan layanan sambil belajar membangun komunikasi dan jaringan.','Gratis','konsultasi awal · ketentuan dikonfirmasi tim','["Konsultasi cara merekomendasikan layanan","Ketentuan kerja sama disepakati bersama tim","Informasi materi promosi dari tim","Peluang bertumbuh menuju jalur promotor"]','[]','Minta informasi affiliate',true,false,1),
('affiliatePromotor','affiliate','KHUSUS JARINGAN','Program Affiliate Promotor STIFIn','Untuk promotor aktif yang ingin memperluas jangkauan dan merapikan pencatatan transaksi dari jaringannya.','Gratis','khusus promotor aktif yang memenuhi syarat','["Konsultasi rekomendasi untuk promotor","Koordinasi pencatatan dengan admin","Materi kampanye dan produk","Dukungan aktivitas jaringan"]','[]','Konsultasikan affiliate promotor',true,true,2)
ON CONFLICT(product_key) DO NOTHING;
INSERT INTO learning_products(slug,title,description,kind,state,price,source_product_key,price_note)
 SELECT 'layanan-'||lower(product_key),title,description,'consultation',CASE WHEN active THEN 'published' ELSE 'archived' END,
 CASE WHEN price ~ '^Rp[0-9.]+$' THEN replace(substring(price from 3),'.','')::bigint ELSE 0 END,product_key,price_note
 FROM public_products WHERE group_name IN ('test','promoter')
 ON CONFLICT(source_product_key) DO NOTHING;
INSERT INTO public_product_migrations(revision) VALUES('catalog-explicit-010') ON CONFLICT DO NOTHING;
COMMIT;
