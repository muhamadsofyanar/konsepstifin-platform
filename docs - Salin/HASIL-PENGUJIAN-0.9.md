# Hasil pengujian KonsepSTIFIn 0.9.0

Tanggal: 28 Oktober 2026. Pemeriksaan dilakukan pada source ZIP KonsepSTIFIn 0.8.0 dan referensi Averion 1.2.138 yang dilampirkan. Tidak ada perubahan database/server produksi dalam pekerjaan ini.

## Metode

Pengujian unit dan integrasi memakai Vitest serta PGlite. Pengujian driver memakai postgres.js melalui PGliteSocketServer. Smoke test menjalankan output Next.js standalone, perintah migrasi/provision native Node 24, server HTTP, dan kedua worker sebagai proses terpisah. Semua akun, pembayaran, referensi transfer serta file dalam smoke test merupakan data sintetis. Pengisian voucher riil tidak dijalankan.

Baseline sebelum perubahan: 213 tes aplikasi lulus, 6 dilewati. 
## Hasil akhir

| Pemeriksaan | Hasil |
| --- | --- |
| `npm test` | 237 lulus, 6 dilewati; 58 file lulus, 3 file dilewati |
| `npm run test:identity` | 78 lulus |
| `npm run test:network` | 7 lulus |
| `npm run test:unit:node` | 45 lulus |
| `npm run typecheck` | Lulus |
| `npm run lint` | Lulus |
| `npm run build` | Lulus, penyesuaian statistik memori khusus lingkungan lokal dijelaskan di bawah |
| `npm run test:smoke` | Lulus untuk aplikasi standalone, HTTP dan kedua worker |

Smoke learning membuktikan registrasi peserta, checkout ber-referral, snapshot/idempotensi, pembayaran sebagian dan pelunasan, hak unduh milik sendiri, progres, privasi sertifikat publik, pemulihan oleh worker kelas, komisi dan pencairan manual. Smoke lama untuk login admin, jaringan, CRM, voucher simulasi, alias historis, session/CSRF, serta worker voucher tetap lulus.


## Regresi baru

- Checkout mengambil harga server, menyimpan snapshot dan idempoten per akun/kunci.
- Akun lain tidak dapat menggunakan kunci checkout untuk mengambil pesanan akun sebelumnya.
- Pembayaran sebagian belum membuka kelas; pelunasan membuka satu grant.
- Pembayaran ulang/pemrosesan ulang tidak menggandakan grant.
- Materi bertahap terkunci di server; akun lain dan akses kedaluwarsa ditolak.
- Penandaan selesai idempoten dan renewal mempertahankan progres.
- Kelas gratis tidak membuat receipt fiktif.
- Refund membalik komisi melalui entri baru, termasuk ketika pembeli dinonaktifkan.
- Refund pembelian awal menghapus kontribusi durasinya dari renewal berikutnya.
- Komisi default nonaktif; sumber referral tidak berasal dari input pengguna.
- Dua pengajuan payout tidak memakai saldo available yang sama.
- Payout yang terkait refund diblokir, termasuk saat refund sudah committed tetapi worker belum merekonsiliasi.
- Penolakan payout mengembalikan hanya komisi yang belum dibalik.
- Pembayaran payout memerlukan persetujuan sebelumnya dan referensi bukti.
- Perhitungan komisi memakai bilangan bulat BigInt agar nilai maksimum Rupiah tidak meleset karena floating point.
- Kupon mengunci batas penggunaan dalam transaksi checkout.
- File privat memerlukan akses; traversal dan tautan tidak aman ditolak.
- Materi draf tidak membocorkan isi dalam syllabus.
- Sertifikat memerlukan penyelesaian snapshot materi wajib dan mendukung pencabutan.
- Migrasi dapat diulang tanpa menghilangkan receipt, grant atau job.
- Worker dapat memulihkan receipt yang committed tanpa request-side fulfillment.
- Ringkasan operasional mengecualikan voucher simulasi dan tetap menyimpan ledger.
- API menolak sesi tidak valid, perubahan lintas origin, akses admin oleh member dan pengungkapan error database.
- Dashboard peserta, mitra dan admin diuji melalui binding postgres.js yang sebenarnya.

## Review terpisah

Reviewer menemukan dua masalah penting: sisa durasi renewal ketika pembelian terdahulu direfund, serta pencairan ketika refund belum diproses worker. Keduanya direproduksi dengan tes gagal sebelum perbaikan dan memiliki tes regresi. Tidak ada temuan penting reviewer yang sengaja dibiarkan tanpa perbaikan.

Pemeriksaan driver menemukan masalah transaksi/pooling pada pembacaan laporan. Laporan learning sekarang membaca query berurutan melalui satu koneksi transaksi. Tes unit yang hanya memakai adapter PGlite tidak dianggap cukup untuk memverifikasi binding postgres.js.

## Batas bukti

- PGliteSocket bukan PostgreSQL produksi. Pengujian ini tidak membuktikan seluruh perilaku locking/concurrency pada server produksi.
- Tidak ada uji browser visual otomatis, transfer bank riil, callback gateway, pengisian voucher riil, email/WhatsApp, maupun restore backup produksi.
- Enam tes integrasi lama yang memerlukan sumber eksternal/konfigurasi tetap dilewati sebagaimana baseline. Tidak dihitung sebagai tes lulus.
- Lingkungan pengujian tidak menyediakan statistik memori `/proc` yang diharapkan Node. Build lokal memakai preload kompatibilitas di luar source release. Tidak ada preload atau perubahan statistik memori yang disertakan dalam ZIP/Dockerfile.
- Pengujian awal mendeteksi hasil build `.next/standalone` ikut dipindai Vitest. Konfigurasi sekarang mengecualikan `.next` dan coverage. Import commerce-store diperbaiki agar pengujian domain lama tetap dapat berjalan tanpa modul Next server-only.

## Cakupan kriteria penerimaan MD

| Kriteria | Bukti / batas |
| --- | --- |
| Akun lama dan multi-peran | Tes identitas, aktivasi/login promotor dan smoke akun lama; tidak migrasi akun dari Averion |
| Tidak menggandakan akun pembeli | Email unik, registrasi member saja, checkout menggunakan user sesi |
| Partial/full/idempotency | Tes SQL dan smoke HTTP |
| Pembatasan materi/file/drip | Tes domain dan smoke unduhan lintas akun |
| Progres/renewal | Penyimpanan PostgreSQL, tes idempotensi dan renewal; volume DB harus persisten |
| Refund dan komisi | Suspensi grant terkait, pembalik ledger dan penghitungan ulang kontribusi renewal; komisi yang sudah dibayar perlu penyelesaian manual |
| Alias lama dan sumber referral | Suite referral/jaringan lama serta smoke checkout ber-referral |
| Snapshot harga/komisi | Tes domain dan smoke perubahan harga setelah pembelian |
| Payout serentak | Tes reservasi SQL, penguncian baris dan pemeriksaan saldo; tetap validasi di PostgreSQL produksi |
| Sertifikat | Penerbitan manual dengan syarat snapshot selesai, verifikasi publik dan pencabutan |
| Notifikasi gagal | Pemberitahuan inbox tercatat lokal; integrasi kanal eksternal belum diaktifkan |
| Restart worker | Job database dan smoke receipt langsung ke ledger lalu pemulihan oleh worker packaged |
| Voucher lama | Suite voucher dan smoke worker simulasi tetap dijalankan; hasil ambigu tidak diulang otomatis |
| Transaksi simulasi | Trigger penanda dan tes ringkasan penerimaan |
| Backup/restore | Panduan tersedia; restore produksi masih harus diuji operator di staging |

Fitur yang belum dikerjakan dan keputusan bisnis yang belum diaktifkan dijelaskan lengkap dalam `UPGRADE-0.9.md`.
