# Rilis terkini: KonsepSTIFIn 0.10.7

Integrasi Moota API V2 dan webhook pembayaran, link Terima Uang yang dikaitkan dengan pesanan, antrean notifikasi StarSender, serta kampanye marketing dengan persetujuan promosi eksplisit.

**WAJIB migrasi sampai 011** setelah upgrade. Versi 0.10.7 tidak menambah migrasi database baru jika migrasi 011 sudah berhasil. Baca [panduan 0.10.7](docs/UPGRADE-0.10.7.md) dan [status pengujian 0.10.7](HASIL-PENGUJIAN-0.10.7.txt). Pemeriksaan build penuh harus dilakukan dengan dependensi terpasang sebelum produksi. Pertahankan database, akun, harga dan volume file yang sudah dipakai. Dokumentasi di bawah adalah riwayat versi sebelumnya.

# Riwayat: KonsepSTIFIn 0.10.4

Perbaikan pengajuan layanan dari affiliate, terutama ID & Alat dan jalur calon promotor. Sumber referral disimpan terpisah dari izin berbagi kontak. Konfirmasi menampilkan KSF dan alias tersimpan. Aktivitas mitra menampilkan daftar pengajuan tanpa data kontak klien.

Baca [panduan upgrade dan uji 0.10.4](docs/UPGRADE-0.10.4.md). Tidak ada migrasi baru jika 009 sudah berhasil. Jika belum, jalankan migrasi sampai 009. Paket lengkap ini sudah mencakup seluruh perbaikan 0.10.3. Bagian di bawah adalah riwayat.

# Riwayat: KonsepSTIFIn 0.10.3

Pendaftaran peserta kini terhubung ke affiliate, dengan tab Aktivitas referral dan pemeriksaan asal pendaftaran untuk admin. Materi/video dipindahkan ke halaman ruang belajar tersendiri. Tautan, formulir daftar, menu, akses ponsel, dan navigasi kembali juga diperbaiki.

**WAJIB migrasi 009**, termasuk untuk pengguna 0.10.2. Baca [panduan upgrade 0.10.3](docs/UPGRADE-0.10.3.md) dan [audit 0.10.3](docs/AUDIT-0.10.3.md). Pertahankan database dan akun lama. Pendaftar yang sebelumnya belum mempunyai sumber referral tidak dihubungkan secara otomatis. Dokumentasi di bawah adalah riwayat versi sebelumnya.

# Riwayat: KonsepSTIFIn 0.10.2

Penyegaran landing page, navigasi publik, harga, informasi affiliate, bantuan akun, font lokal, dan metadata produk. Versi health mengikuti package.json.

Mulai dari [panduan upgrade 0.10.2](docs/UPGRADE-0.10.2.md) dan [audit 0.10.2](docs/AUDIT-0.10.2.md). Tidak ada migrasi baru jika database sudah sampai migrasi 008. Harga, akun, dan transaksi yang tersimpan tetap dipertahankan. Dokumentasi di bawah merupakan riwayat.

# Riwayat: KonsepSTIFIn 0.10.1

Video di dalam materi, desain sertifikat siap cetak, halaman detail produk yang sama dari landing page/katalog/affiliate, serta satu pusat mitra dan satu editor produk admin.

Mulai dari [panduan 0.10.1](docs/UPGRADE-0.10.1.md) dan [audit 0.10.1](docs/AUDIT-0.10.1.md). Dari 0.10.0 yang sudah bermigrasi sampai 008, tidak ada migrasi database baru. Dokumentasi versi di bawah adalah riwayat.

# Rilis terkini: 0.10.0

Untuk paket ini ikuti **docs/UPGRADE-0.10.0.md** dan **PETUNJUK-UPGRADE-0.10.0.txt**. Migrasi 008 wajib. Dokumentasi di bawah dipertahankan sebagai referensi historis.

# Rilis terbaru: 0.9.1

Baca `docs/UPGRADE-0.9.1.md`. Upgrade ini merapikan menu, memperbaiki benturan CSS, dan memudahkan admin serta peserta.

# Rilis terbaru: 0.9.0

Baca `docs/UPGRADE-0.9.md` sebelum deployment. Admin kelas: `/admin/kelas`. Ruang peserta: `/belajar`. Komisi: `/akun/komisi`.

# KonsepSTIFIn: panduan unggah dan deploy

Pembaruan terbaru **0.8.0** menambah tautan referral pribadi, pembelian voucher, dan antrean pengisian melalui API STIFIn. Untuk upgrade dari 0.7.0 yang sudah berjalan, ikuti **MITRA-DAN-VOUCHER.md**. Jangan provision ulang akun aktif. Migrasi sekarang juga mencakup `005-referrals.sql` dan `006-vouchers.sql` (lihat nama file aktual pada folder migrasi).

Paket ini memperbaiki aplikasi yang ada. SEJOLI tidak dipakai untuk pemesanan baru. Pembayaran dicatat setelah admin memeriksa transfer. Data transaksi lama tetap menjadi histori, bukan pembayaran baru.

## 1. Simpan cadangan sebelum mengganti aplikasi

- Simpan commit GitHub dan image aplikasi lama untuk rollback.
- Backup PostgreSQL menggunakan fasilitas database/Coolify. Pastikan backup dapat dipulihkan ke database terpisah.
- Backup file pustaka dari `/app/storage`. Source ZIP tidak berisi database atau file pelanggan.
- Catat konfigurasi environment dan volume lama secara pribadi. Jangan mengunggah secret ke GitHub.

## 2. Unggah isi source ke GitHub

1. Ekstrak ZIP.
2. Buka folder `konsepstifin-admin-0.8.0`.
3. Unggah **isinya** ke root repository yang sekarang. `package.json`, `package-lock.json`, dan `Dockerfile` harus berada di root, bukan di dalam satu folder tambahan.
4. Sertakan semua file source, `scripts`, `public`, konfigurasi, dan dokumen baru. Jangan mengunggah `.env` asli, `node_modules`, atau `.next`.
5. Bila GitHub membatasi jumlah file, unggah per folder atau gunakan GitHub Desktop. Commit seluruh perubahan sebelum deploy.
6. Periksa bagian Files Changed, terutama `Dockerfile`, `scripts/migrations`, `src/lib/admin-auth.ts`, dan `package-lock.json`.

Tidak ada push atau deployment yang dilakukan oleh pembuat paket.

## 3. Pengaturan Coolify

| Pengaturan | Nilai |
| --- | --- |
| Build Pack | Dockerfile |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` |
| Internal port | `3000` |
| Node di dalam image | 24 |
| DATABASE_URL | URL PostgreSQL milik Anda, isi sebagai secret runtime |
| PLATFORM_ORIGIN | Origin tepat, misalnya `https://konsepstifin.com`, tanpa `/` terakhir atau path |
| Persistent Storage Destination Path | `/app/storage` |

Pastikan akun `node` dalam container dapat menulis ke volume pustaka. Jika memakai directory mount, sesuaikan kepemilikan folder pada server. Jangan mengganti volume lama dengan volume kosong tanpa menyalin isinya.

Kredensial `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, dan flag `PLATFORM_IDENTITY_ENABLED` tidak lagi menjadi jalur login. Hapus konfigurasi yang tidak dipakai setelah akun database terverifikasi. Jangan menyalin `.env.example` secara utuh lalu membiarkan placeholder.

AI opsional: atur `AI_PROVIDER=openai` dan `OPENAI_API_KEY`, atau `AI_PROVIDER=gemini` dan `GEMINI_API_KEY`. Model dapat diatur lewat `OPENAI_MODEL`/`GEMINI_MODEL`. Halaman admin tetap berfungsi tanpa konfigurasi AI. Konfigurasi direktori promotor mengikuti `.env.example`.

## 4. Cara pindah tanpa mengunci admin lama

**Pilihan yang disarankan: resource kandidat sementara.** Buat resource Coolify sementara dari commit baru dengan domain uji dan database staging hasil pemulihan backup. Gunakan salinan file pustaka dengan volume terpisah. Deploy, siapkan akun, lalu uji alur dengan data sintetis. Aplikasi lama tetap melayani domain utama.

Setelah staging lulus, siapkan kandidat produksi dengan image/source baru, koneksi database produksi dan file pustaka yang benar, tetapi tetap gunakan domain sementara. Jalankan migrasi aditif, provision, dan verifikasi admin pada langkah 5. Uji login pada domain sementara dengan `PLATFORM_ORIGIN` yang sama dengan domain tersebut. Jangan mencatat uang uji pada database produksi.

Saat kandidat sudah siap, atur domain utamanya dan ubah `PLATFORM_ORIGIN` menjadi origin produksi. Restart/redeploy sesuai perubahan environment. Lepaskan domain utama dari resource lama agar tidak ada dua aplikasi menerima trafik domain yang sama. Uji login lagi sebelum menghentikan resource lama. Rollback aplikasi tetap tersedia.

**Jika langsung redeploy resource lama:** website baru bisa terbuka, tetapi admin harus menunggu migrasi dan pembuatan akun pada langkah 5 selesai. Cookie admin lama sengaja tidak berlaku. Gunakan jadwal pemeliharaan singkat; jangan mengira password environment lama otomatis menjadi akun baru.

Catatan penting: pada Dockerfile deployment, pre-deployment command Coolify berjalan di container **yang sedang aktif**, bukan image baru. Post-deployment berjalan di container baru setelah deployment ditandai selesai. Karena container lama belum memiliki script paket ini, jangan mengandalkan pre-deployment untuk menjalankan script baru. Gunakan Terminal kandidat/container baru secara eksplisit.

## 5. Migrasi dan penyiapan admin

Buka Terminal **container versi 0.8.0**. Direktori kerja `/app`. Jalankan:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Hasil yang diharapkan:

```text
Applied 001-identity.sql
Applied 002-commerce.sql
Applied 003-operations.sql
```

Perintah dapat diulang. Migrasi menambah tabel; tidak menghapus order SEJOLI, lead, atau produk lama. Jangan menjalankan command ke database yang belum dicadangkan.

Siapkan akun pertama. Ganti email dan kata sandi contoh sebelum menjalankan. Gunakan kata sandi minimal 12 karakter. JSON dikirim melalui stdin, bukan argumen proses. Jangan commit atau membagikan isinya.

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs provision <<'JSON'
{"email":"EMAIL-ADMIN-ANDA","password":"GANTI-DENGAN-SANDI-KUAT-ANDA","roles":["super_admin"]}
JSON
```

Lalu verifikasi menggunakan email/sandi yang sama:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs verify <<'JSON'
{"email":"EMAIL-ADMIN-ANDA","password":"GANTI-DENGAN-SANDI-KUAT-ANDA"}
JSON
```

Respons harus memuat `"verified":true`. Verifikasi tidak menerbitkan sesi browser. Provision tidak mereset kata sandi akun yang sudah ada. Jika akun sudah ada tetapi sandinya berbeda, verifikasi akan gagal; jangan lanjutkan perpindahan domain sebelum akses diperbaiki. Hasil gagal login/verify berulang dibatasi 15 menit.

Tambahan admin berikutnya dapat dibuat di **Pengaturan → Tambah admin**. Akun pemilik pertama disiapkan lewat command operator; admin biasa tidak dapat mengubah akun pemilik. Menonaktifkan admin terakhir ditolak.

## 6. Pemeriksaan setelah deploy

1. Buka `/api/health`. Respons memuat versi `0.8.0`.
2. Buka `/admin/login`, login akun database, dan pastikan masuk ke Ringkasan.
3. Buka Pengaturan. Isi bank, nomor rekening, nama pemilik, dan petunjuk pembayaran.
4. Pada staging, kirim formulir layanan dan calon promotor. Catat nomor referensi. Pastikan tetap di website dan tidak menuju SEJOLI.
5. Periksa CRM. Cari kontak, ubah status/catatan, reload, dan periksa riwayat. Gunakan link pesanan terkait.
6. Pada staging, buat draf pesanan dari lead, periksa harga, lalu terbitkan. Catat pembayaran sintetis dan coba kirim ulang request yang sama. Ledger harus tetap satu entri.
7. Buka rincian pesanan; periksa sisa tagihan dan instruksi bank. Gunakan Cetak rincian bila diperlukan.
8. Uji konten, pustaka, katalog, direktori promotor, dan beberapa URL artikel lama. File pustaka lama harus tetap bisa dibaca.
9. Logout; halaman/API admin harus menolak sesi yang sama. Uji login ulang.
10. Periksa tampilan desktop dan ponsel di browser Anda sebelum menyelesaikan perpindahan produksi.

## 7. Cara kerja sehari-hari

- **Ringkasan:** permintaan, jadwal, jumlah kontak, dan pembayaran.
- **Klien & Promotor:** empat kelompok CRM dengan pencarian dan pagination dari database. Direktori nasional berbeda dari promotor jaringan sendiri.
- **Pesanan & Pembayaran:** draf, penerbitan, penerimaan, pengembalian, dan koreksi dengan alasan. Total dihitung server, harga disimpan sebagai histori pesanan.
- **Konten & Layanan:** artikel/AI, pustaka, pemeriksaan SEO, dan katalog.
- **Pengaturan:** rekening, akses admin, serta status konfigurasi.

Form publik mencatat permintaan, bukan otomatis menyetujui jadwal atau pembayaran. Admin menyepakati kebutuhan/harga, membuat pesanan, menyampaikan instruksi, memeriksa mutasi bank, lalu mencatat penerimaan.

Nominal dan status pembayaran baru tidak diedit melalui CRM. CRM menampilkan referensi keuangan lama secara terpisah dan pesanan internal terkait. Jangan membuat tagihan ulang untuk order lama yang belum selesai tanpa rekonsiliasi saldo awal.

Koreksi membalik entri salah tanpa menghapus entri asal. Pengembalian dipakai untuk uang yang benar-benar dikembalikan. Konfirmasikan kondisi nyata sebelum mencatat keduanya.

Pembayaran tetap diverifikasi manual melalui mutasi transfer oleh admin. Voucher dikirim melalui API setelah lunas, dengan mode uji sebagai konfigurasi awal. Tautan referral sudah tersedia; komisi otomatis dan LMS belum diaktifkan.

## 8. Jika terjadi masalah

- **Login 403:** periksa `PLATFORM_ORIGIN`, domain yang sedang dibuka, dan protokol HTTPS. Origin harus tepat. Gunakan satu domain canonical untuk admin.
- **Login 401:** periksa akun database/role, bukan environment password lama. Jalankan verify.
- **Login/operator 503 atau gagal:** periksa koneksi database, log runtime, migrasi, dan apakah script dijalankan di container baru.
- **Dashboard menampilkan data belum tersedia:** jangan menganggap nilainya nol. Periksa database/migrasi pada Pengaturan.
- **File pustaka hilang:** periksa volume dan izin. Redeploy tidak memulihkan file yang belum dicadangkan.
- **Permintaan pembayaran gagal/timeout:** coba kembali data yang sama dari form yang sama. Kunci idempotensi dipertahankan selama percobaan ulang dengan payload yang sama.

## 9. Rollback

1. Hentikan trafik ke kandidat baru bila pemeriksaan gagal.
2. Kembalikan domain/image/commit aplikasi lama melalui Coolify dan pulihkan konfigurasi lama yang diperlukan oleh versi tersebut.
3. Migrasi baru bersifat aditif, jadi jangan menghapus tabel baru saat rollback aplikasi.
4. Jika transaksi internal nyata sudah tercatat, catat dan rekonsiliasi terlebih dahulu. Pemulihan database dari backup dapat membuang transaksi setelah waktu backup; jangan melakukannya tanpa mengekspor dan merekonsiliasi perubahan itu.
5. Pulihkan file pustaka dari backup jika diperlukan, lalu uji akses data.

## 10. Validasi lokal bagi pengembang

```sh
npm ci
npm test
npm run test:identity
npm run test:unit:node
npm run typecheck
npm run lint
npm run build
npm run test:smoke
```

`test:smoke` menggunakan database sintetis sementara melalui PostgreSQL wire protocol. Script menimpa `DATABASE_URL` untuk proses ujinya, tidak menghubungi database Anda, dan menghapus lingkungan sementara setelah selesai. Tes ini meniru file runner Docker, tetapi tidak menjalankan Docker atau browser.

Enam tes integrasi lama memerlukan `TEST_DATABASE_URL` khusus uji. Jangan menunjuknya ke produksi; beberapa fixture lama melakukan pembersihan tabel.

## Referensi deployment

- https://coolify.io/docs/applications/builds/dockerfile
- https://coolify.io/docs/applications/configuration/persistent-storage

Lihat `HASIL-PENGUJIAN.md` untuk hasil aktual dan batas pemeriksaan paket ini. Dokumen handoff lama disertakan sebagai histori; rancangan dan panduan versi 0.6.0 ini menggantikan instruksi lama yang masih menyebut SEJOLI atau login environment.
