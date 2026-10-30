# Serah Terima Pusat Layanan Nasional v0.3.0

## Ringkasan

Upgrade ini mengubah direktori wilayah menjadi alur koordinasi layanan nasional. Pengunjung tetap dapat mengirim permintaan ketika promotor belum tersedia. Data pribadi hanya tersimpan di tabel lead dan tidak ditampilkan pada daftar promotor publik.

## Perubahan utama

- formulir consent kontak dan pembagian terbatas nomor WhatsApp;
- pencatatan provinsi, kabupaten/kota, sumber halaman, tenggat respons, dan status awal;
- status awal otomatis `ditawarkan` saat kandidat ditemukan atau `mencari_promotor` saat memakai fallback nasional;
- adapter promotor mendukung `STIFIN_BRANCH_CODES` dan deduplikasi berdasarkan kode promotor;
- nomor telepon promotor disanitasi dari respons publik;
- halaman wilayah provinsi dan kabupaten/kota dapat diindeks, sedangkan kecamatan dan desa memakai `noindex`;
- dashboard `/admin/leads` untuk memantau dan mengubah status;
- riwayat perubahan status pada tabel `lead_status_history`;
- rate limit formulir publik.

## Catatan integrasi sumber

Arsip plugin WordPress/SEJOLI diperlakukan sebagai referensi integrasi, bukan disalin ke aplikasi Next.js. Materi PDF pada `KIRIM AI.zip` diperlakukan sebagai calon pustaka privat dan tidak otomatis dipublikasikan. Kontrak API promotor yang relevan tetap `GET {STIFIN_API_BASE}/proGetCab/pro/{branchCode}`.

## Konfigurasi

Gunakan `STIFIN_BRANCH_CODES=NASIONAL,CABANG-LAIN` untuk beberapa sumber. `STIFIN_BRANCH_CODE` tetap didukung. Pastikan `DATABASE_URL`, kredensial admin, dan rahasia sesi tersedia.

## Validasi sebelum produksi

Jalankan `npm run lint` dan `npm run build`. Setelah deployment, uji satu lead dengan kandidat dan satu lead tanpa kandidat. Periksa consent, status awal, dashboard admin, dan pastikan nomor WhatsApp tidak muncul pada HTML atau API publik.
