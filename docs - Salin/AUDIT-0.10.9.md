# Audit perubahan KonsepSTIFIn 0.10.9

## Akuisisi calon klien

Beranda mengurangi jalur utama menjadi Tes STIFIn dan Workshop/Kemitraan. Formulir layanan mengunci layanan yang sudah dipilih agar calon klien tidak memilihnya dua kali. Nama, WhatsApp, dan kota menjadi data utama; email serta catatan ditempatkan di bagian opsional.

## Promo pusat

Konfigurasi promo tersimpan di `platform_promotion_settings`. Promo Family Test mendukung skema dinamis dengan batas minimum Rp500.000 per tes berbayar. Server memvalidasi skema dan periode saat formulir masuk, kemudian mencatat ringkasan promo pada catatan lead. Promo Year-End Workshop mengubah harga yang tampil untuk WSL 1, WSL 2, dan WST, dan menambahkan ringkasan harga promo ke lead.

## Integrasi

Kredensial Moota dan StarSender disimpan sebagai satu konfigurasi terenkripsi di `platform_integrations`, menggunakan AES-256-GCM. API admin hanya mengembalikan status konfigurasi dan metadata non-rahasia. Mutasi dibatasi ke pemilik platform. Modul Moota dan StarSender membaca konfigurasi runtime dari database, dengan fallback environment untuk kompatibilitas lama.

## Database

Migration baru: `012-integrations-promotions.sql`. Migrasi membuat tabel integrasi dan promo, menginisialisasi nilai promo pusat, serta menambahkan produk WST. Jalankan migrasi setelah backup.

## Verifikasi

- 26 file TypeScript/TSX yang berubah berhasil diparse dengan TypeScript `transpileModule` tanpa diagnostic sintaks.
- `npm ci` tidak selesai dalam batas waktu lingkungan ini. Karena dependensi tidak lengkap, build Next.js, typecheck penuh, lint, dan unit test belum dapat dinyatakan lulus.
- Uji API live Moota/StarSender belum dilakukan.

## Operasional worker

Worker notifikasi WhatsApp sekarang menunggu hasil `starsenderStatus()` sebelum memproses antrean. `integration-settings.ts` menggunakan koneksi PostgreSQL langsung agar modul yang sama dapat dibaca oleh Next.js dan notification worker Node. Dockerfile runtime menyertakan modul konfigurasi tersebut.
