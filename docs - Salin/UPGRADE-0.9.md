# Upgrade KonsepSTIFIn 0.8 ke 0.9.0

Tanggal: 28 Oktober 2026. Referensi: `Spesifikasi-Pengembangan-KonsepSTIFIn-dari-Averion.md`.

Rilis ini mengimplementasikan target pertama dokumen: satu produk e-course dapat dibeli melalui akun yang sudah ada, dibuka setelah lunas, dipelajari dengan progres tersimpan, serta diatribusikan ke mitra dengan komisi yang diaktifkan pengelola. Fondasi 0.8 tetap digunakan. Averion hanya menjadi referensi perilaku; tidak ada backend PHP kedua.

## Isi paket

- Katalog produk digital dan editor produk admin; harga Rupiah ditentukan server.
- Produk kursus, ebook, serta informasi webinar/konsultasi melalui materi. Penjadwalan layanan tetap manual.
- Modul bernama, urutan materi, teks aman, tautan HTTPS, video melalui tautan, dan file privat.
- Draf, terbit, arsip, materi wajib, pratinjau, serta pembukaan berdasarkan hari sejak aktivasi.
- Pendaftaran akun peserta dengan peran member saja; akun lama tetap dapat digunakan.
- Checkout produk tunggal yang terpisah dari checkout voucher; snapshot harga, aturan komisi, atribusi dan persyaratan penyelesaian.
- Kelas gratis tanpa transaksi penerimaan uang fiktif.
- Satu ledger pembayaran yang sama dengan pesanan internal; pembayaran sebagian tidak membuka akses.
- Hak akses, perpanjangan, materi terakhir, progres idempoten, serta unduhan dengan pemeriksaan sesi dan hak akses setiap permintaan.
- Komisi persentase per produk; default 0 dan atribusi nonaktif. Saat diaktifkan admin: first-touch referral 30 hari per checkout, tanpa komisi pembelian sendiri.
- Komisi pending → approved → available; reservasi pencairan atomik; persetujuan, penolakan dan pencatatan bukti transfer manual.
- Refund mencatat pembalik komisi dan menangguhkan kontribusi akses pembelian terkait. Durasi renewal dihitung ulang agar durasi pembelian yang direfund tidak tersisa dalam renewal.
- Sertifikat penyelesaian manual setelah seluruh materi wajib snapshot selesai. Verifikasi publik tanpa email, telepon atau pembayaran. Cetak/simpan PDF melalui browser.
- Kupon diskon nominal dengan batas produk, jumlah total, per akun dan kedaluwarsa; checkout mengunci kupon.
- Pemberitahuan dalam akun, tiket bantuan dan jawaban admin.
- Worker kelas terpisah dari worker voucher dalam satu container. Antrean tugas database tersimpan dalam transaksi pembayaran.
- Laporan penerimaan operasional mengecualikan voucher simulasi; histori pesanan dan ledger tetap tersimpan.

## Satu paket deployment

Siapkan semua ENV dan volume berikut sebelum mengganti source agar cukup melakukan satu build/redeploy. Migrasi database tetap berupa perintah operator eksplisit. Aplikasi tidak menjalankan migrasi ketika request masuk atau ketika build.

1. Backup database dan seluruh volume storage. Simpan source/image 0.8 yang sedang dipakai.
2. Unggah seluruh isi folder dalam ZIP ke root repository GitHub aplikasi yang sama. Pertahankan konfigurasi Coolify yang sudah ada.
3. Pertahankan `DATABASE_URL`, `PLATFORM_ORIGIN` serta konfigurasi STIFIn yang berlaku. `PLATFORM_ORIGIN` harus origin resmi tanpa slash akhir, misalnya `https://domain-anda.id`.
4. Tambahkan ENV opsional `LEARNING_STORAGE_PATH=/app/storage/learning`.
5. Mount volume persisten terpisah ke `/app/storage/learning`. Pertahankan volume storage sebelumnya, termasuk `/app/storage/stifin-sources`. Proses berjalan sebagai user node; volume harus dapat dibaca/ditulis user tersebut. File materi tidak boleh berada dalam `public`.
6. Deploy source dengan Dockerfile bawaan Node 24. Tidak ada dependency baru; lockfile dipertahankan.
7. Dalam terminal container yang terhubung ke database tujuan, jalankan:

```sh
IDENTITY_ADMIN_CONFIRM=yes npm run identity:migrate
```

Perintah memuat migrasi 001 sampai 007 dalam urutan nama. Pada container standalone yang tidak menyertakan skrip npm, perintah setara:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Gunakan saat maintenance sebelum transaksi baru diterima. Migrasi dapat diulang; tidak menghapus akun, kata sandi, transaksi atau progres lama. Rilis ini tidak menyalin data bisnis Averion ke database KonsepSTIFIn.

8. Periksa `/api/health` menampilkan versi 0.9.0. Buka admin `/admin/kelas`, peserta `/belajar`, serta akun promotor/voucher lama. Periksa log kedua worker. Tidak perlu restart kedua kalinya untuk menjalankan migrasi, tetapi akses fitur baru baru tersedia setelah migrasi selesai.
9. Terbitkan satu produk uji yang Anda tentukan sendiri. Gunakan akun peserta yang sama untuk pembelian. Verifikasi transfer di `/admin/pesanan`; kelas terbuka setelah total penerimaan bersih sama dengan total pesanan.

## Migrasi dan perubahan database

Migrasi baru `007-learning.sql` menambah tabel `learning_products`, `learning_lessons`, `learning_coupons`, `learning_purchases`, `learning_grants`, `learning_progress`, `learning_jobs`, `affiliate_payouts`, `affiliate_entries`, `learning_audit`, `learning_notifications`, `learning_certificates`, dan `learning_tickets`.

Kolom `commerce_orders.is_simulation` memisahkan transaksi uji dari ringkasan operasional. Trigger pada voucher menandai pesanan mode test, termasuk backfill dari voucher lama. Migrasi 002 untuk instalasi baru juga sudah mencantumkan kolom tersebut. Trigger pada ledger mencatat tugas learning bersama receipt/refund/correction yang berkaitan dengan pembelian digital. Tabel pembayaran, pengguna, dan referral lama tidak digandakan.

## Panduan admin

Menu Konten & Layanan → Kelas & Komisi membuka `/admin/kelas`. Tambahkan produk, masa akses, dan modul/materi. Biarkan draf sampai isinya siap. Arsipkan produk yang pernah terjual. Produk baru tidak mempunyai contoh materi atau harga bisnis bawaan.

Gunakan teks biasa untuk isi materi. HTML/script tidak dieksekusi. Video dibuka lewat tautan HTTPS, bukan embed arbitrer. Untuk file, unggah file melalui pengelola volume server ke direktori privat, kemudian isi path relatifnya, misalnya `modul/worksheet.pdf`. Rilis ini belum memiliki unggahan file melalui browser.

Sebelum mengaktifkan komisi, tetapkan kebijakan dan tarif. Atribusi hanya menggunakan cookie referral yang diverifikasi database, tidak menerima identitas mitra dari formulir checkout. Tautan mitra untuk kelas berbentuk `/r/alias?to=/belajar`; alias lama tetap berlaku. Aktivasi komisi berlaku untuk pesanan baru; snapshot pesanan lama tetap dipakai.

Komisi memerlukan dua langkah eksplisit: setujui pending, lalu ubah approved menjadi available ketika layak dicairkan. Pengajuan mencadangkan seluruh saldo available. Admin melakukan transfer bank secara manual lalu mencatat referensinya. Sistem tidak mentransfer uang. Refund yang belum direkonsiliasi memblokir persetujuan/pembayaran pencairan. Refund atas komisi yang sudah dibayar menjadi saldo koreksi untuk penyelesaian manual; rilis ini belum menyediakan editor penyelesaian utang tersebut.

Akses manual memerlukan ID akun dan alasan, tersedia dari daftar akun pada halaman admin. Untuk memulihkan hak setelah perubahan pembayaran, admin meninjau kebijakan dan memberi akses manual dengan alasan. Receipt setelah refund tidak otomatis mengaktifkan ulang grant yang ditangguhkan. Refund parsial menangguhkan grant terkait sampai ditinjau, bukan menghitung hak proporsional yang belum disepakati.

Sertifikat manual memerlukan setidaknya satu materi wajib dalam snapshot saat bergabung, dan semua materi tersebut sudah diselesaikan. Persyaratan peserta lama tidak berubah ketika materi baru ditambahkan. Sertifikat yang dicabut tidak otomatis diterbitkan ulang. Gunakan pencabutan dengan alasan dan proses koreksi pengelola.

## Peserta, mitra, pengajar

Peserta membuka `/akun/daftar` atau masuk dengan akun lama, lalu `/belajar`. Kelas gratis langsung aktif tanpa ledger uang. Pembelian berbayar menampilkan nomor pesanan dan instruksi rekening tersimpan. Peserta menghubungi admin dengan nomor pesanan untuk verifikasi. Setelah lunas, peserta dapat membaca materi, menyimpan progres dan mengunduh file yang berhak diakses. Materi bertahap dan masa akses diperiksa server.

Mitra membuka `/akun/tautan` untuk tautan kelas dan `/akun/komisi` untuk rincian komisi, saldo, rekening tujuan dan riwayat pencairan. Pendaftaran affiliate nonpromotor belum dibuka.

Pengajar belum memiliki editor atau daftar peserta dengan izin khusus. Admin utama mengelola materi pada rilis ini. Jangan memberikan peran admin kepada pengajar hanya untuk menggantikan pembatasan kelas yang belum tersedia.

## Backup dan pemulihan

Backup PostgreSQL dengan `pg_dump` menggunakan koneksi database dari lingkungan server. Gunakan format custom dan simpan hasil di lokasi backup yang terpisah. Salin seluruh isi volume learning dan storage lama, beserta pemetaan ENV dan source/image rilis. Simpan file materi dan database sebagai satu set bertanggal. Jangan menyimpan password dalam source atau argumen yang dipublikasikan.

Untuk uji restore: siapkan database dan volume staging kosong, pulihkan dump dengan `pg_restore`, kembalikan file ke volume privat, pasang source/image dan ENV yang cocok, lalu periksa login akun lama, pesanan, progres, file privat dan antrean. Mulai worker hanya setelah database dan file siap. Worker lokal idempoten; pengisian voucher ambigu tetap harus diperiksa manual.

Rollback aplikasi memakai source/image 0.8 yang disimpan dan backup yang sesuai. Jangan menjatuhkan tabel baru secara otomatis setelah transaksi 0.9 masuk. Migrasi 007 tidak menyertakan down migration yang menghapus data. Jika perlu pemulihan database produksi, hentikan transaksi, rekonsiliasi perubahan setelah backup, dan gunakan prosedur operator yang disetujui.

## Batas rilis yang jelas

Belum termasuk: bundel yang dapat diterbitkan dan snapshot isinya, kategori kelas/pengajar terpisah, editor pengajar dengan penugasan, kursus dari kuis/penilaian, sertifikat otomatis atau generator PDF server, unggah file web, token unduhan terpisah dari sesi, lupa kata sandi melalui email, payment gateway dan callback, pengiriman email/WhatsApp, pemasaran/opt-out, order bump/upsell, ulasan, penjadwalan kalender, pendaftaran affiliate nonpromotor, nominal komisi tetap atau level, serta laporan funnel lanjutan. Draft bundel boleh disimpan tetapi server menolak publikasinya.

Daftar tersebut berasal dari tahap berikutnya pada dokumen arahan atau memerlukan keputusan bisnis/penyedia. Rilis ini tidak menganggap semua usulan MD selesai. Kebutuhan produksi yang masih harus divalidasi: restore backup nyata, konkurensi PostgreSQL produksi, pengisian voucher riil, kanal notifikasi, serta isi/harga/tarif yang ditentukan pemilik.
