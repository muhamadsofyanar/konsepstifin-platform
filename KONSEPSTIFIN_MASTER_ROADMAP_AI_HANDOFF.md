# MASTER ROADMAP DAN AI HANDOFF
## Migrasi Bertahap Dashboard Konsep STIFIn dari SEJOLI

**Status dokumen:** Dokumen induk proyek  
**Titik lanjut terbaru:** Bagian 34 — audit terarah source dan rancangan teknis paket akun/CRM. Belum ada implementasi atau deployment.
**Instruksi terbaru pemilik:** Gabungkan keputusan dan pekerjaan terkait; jangan meminta persetujuan satu per satu. Bagian 31–33 mengatasi instruksi lama yang bertentangan. Keputusan 6 disetujui; keputusan 7–10 memakai asumsi kerja, bukan persetujuan kebijakan produksi.
**Tanggal keputusan:** 14 September 2026  
**Keputusan utama:** Konsep STIFIn membangun dashboard mandiri dan mengganti SEJOLI secara bertahap. SEJOLI tetap aktif sebagai sistem lama sampai setiap modul pengganti selesai, diuji, direkonsiliasi, dan disetujui untuk produksi.

---

## 1. Cara Menggunakan Dokumen Ini

Dokumen ini harus diberikan kepada AI atau developer baru sebelum pekerjaan dilanjutkan. Jangan memulai ulang analisis proyek dari nol.

Aturan kerja untuk AI berikutnya:

1. Baca seluruh dokumen ini sebelum mengubah kode.
2. Baca `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`, dan instruksi repository terbaru.
3. Periksa `git status`, branch aktif, commit terakhir, dan perubahan yang belum disimpan.
4. Kerjakan hanya satu fase atau satu subfase yang disetujui pengguna.
5. Jangan menonaktifkan atau memodifikasi sistem SEJOLI produksi tanpa persetujuan eksplisit.
6. Jangan mengarang struktur database, hook SEJOLI, endpoint STIFIn, aturan komisi, atau hasil pengujian.
7. Gunakan pengujian otomatis dan staging sebelum menyentuh transaksi nyata.
8. Setelah selesai, perbarui Bagian 17: Log Kelanjutan Proyek.
9. Catat file yang diubah, migrasi database, pengujian, hasil, masalah, dan langkah berikutnya.
10. Jangan menaruh password, token, API key, kredensial gateway, PassID, atau data pribadi pengguna dalam dokumen maupun repository.

### Prompt singkat untuk AI baru

> Baca `KONSEPSTIFIN_MASTER_ROADMAP_AI_HANDOFF.md` sepenuhnya. Audit kondisi repository tanpa mengubah kode. Temukan fase aktif pada Bagian 16 dan entri terakhir pada Bagian 17. Jelaskan pemahamanmu secara ringkas, sebutkan batas pekerjaan fase tersebut, lalu tunggu persetujuan sebelum implementasi. Jangan mengerjakan fase lain dan jangan mematikan SEJOLI.

---

## 2. Tujuan Produk

Membangun satu platform Konsep STIFIn yang sederhana bagi admin, promotor, calon promotor, klien, calon klien, pengajar, dan peserta.

Target pengalaman pengguna:

- Satu akun untuk seluruh aktivitas.
- Satu dashboard dengan menu sesuai peran.
- Satu sumber data utama.
- Website publik, CRM, penjualan, voucher, LMS, artikel, dan SEO saling terhubung.
- Pengguna tidak perlu memahami bahwa pada masa transisi sebagian transaksi masih diproses oleh SEJOLI.

Target bisnis:

- Admin mengelola calon klien, klien, calon promotor, dan promotor.
- Promotor dapat membeli voucher secara otomatis.
- Promotor yang diberi hak dapat membuat kelas dan artikel.
- Klien dapat membeli secara penuh, DP, atau cicilan.
- Seluruh promotor memperoleh manfaat SEO melalui `konsepstifin.com`.
- Data lead, transaksi, kelas, voucher, dan atribusi promotor dapat dilaporkan secara konsisten.

---

## 3. Kondisi Sistem Saat Dokumen Dibuat

### 3.1 Platform Next.js

Arsip sumber: `konsepstifin-dashboard-crm.zip`.

Karakteristik yang telah teridentifikasi:

- Next.js 16.2.10, React 19.2.4, TypeScript, PostgreSQL driver, Tailwind CSS, dan Vitest.
- Domain utama: `https://konsepstifin.com`.
- Deployment: Docker melalui Coolify.
- Fitur tersedia: website publik, katalog, artikel, SEO, direktori promotor nasional, halaman lokal, dua funnel lead, dan dashboard admin.
- Route admin yang sudah ada mencakup artikel, content intelligence, leads, produk, promotor, dan pustaka.
- Funnel yang sudah dipisahkan: layanan tes dan calon promotor.
- CRM sudah mengenal calon klien, klien, calon promotor, dan promotor jaringan.
- Autentikasi saat ini belum boleh dianggap sebagai RBAC multi-pengguna yang siap diberikan kepada promotor.
- Sebagian data lama pernah menggunakan `localStorage`; semua data produksi harus memakai database.

### 3.2 WordPress dan SEJOLI

Arsip sumber: `ksf-export-b7e1c4d9a806f35e12ab479d.tar.gz`.

Komponen yang telah teridentifikasi:

- SEJOLI sebagai sistem produk, checkout, member, affiliate, order, dan komisi.
- `dw-sejoli-lms` untuk kelas, materi, kuis, pengajar, peserta, serta sertifikat.
- `sejoli-payplan` untuk full payment, DP, jadwal termin, persetujuan akad, dan pengingat cicilan.
- `sejoli-stifin-voucher` untuk menambah voucher setelah order selesai dengan perlindungan transaksi ganda.
- `sejoli-xendit` sebagai payment gateway.
- `sejoli-lead-campaign` untuk formulir dan pengelolaan lead.
- `sejoli-uistyler` untuk tampilan member area.
- Domain transaksi lama: `https://app.konsepstifin.com`.

### 3.3 Prinsip pemanfaatan SEJOLI

SEJOLI menjadi sumber pembelajaran perilaku bisnis, bukan kode yang disalin tanpa pemeriksaan. Fitur yang akan diadaptasi harus dirumuskan ulang sebagai kebutuhan Konsep STIFIn dan diimplementasikan secara legal, aman, serta sesuai arsitektur baru.

---

## 4. Keputusan Arsitektur

Gunakan pendekatan **strangler migration** atau penggantian bertahap.

1. Next.js menjadi wajah publik dan dashboard baru.
2. PostgreSQL menjadi sumber data utama platform baru.
3. SEJOLI tetap menangani fungsi lama yang belum diganti.
4. Modul baru mengambil alih fungsi satu per satu.
5. Setiap perpindahan memakai periode paralel dan rekonsiliasi data.
6. SEJOLI hanya dihentikan setelah tidak ada ketergantungan aktif dan arsip historis sudah aman.

### Batas integrasi selama transisi

- Jangan membuat dua sistem sama-sama berwenang mengubah status pembayaran yang sama.
- Tetapkan satu **system of record** untuk setiap jenis data pada setiap fase.
- Gunakan ID eksternal untuk menghubungkan data baru dengan order/user SEJOLI.
- Semua sinkronisasi harus idempoten: pengulangan event tidak boleh menggandakan order, cicilan, komisi, akses, atau voucher.
- Bila sinkronisasi gagal atau hasil API ambigu, pindahkan transaksi ke status `needs_review`; jangan mengulang transaksi uang/voucher secara buta.

---

## 5. Peran dan Hak Akses

| Peran | Ruang lingkup utama |
|---|---|
| Super Admin | Seluruh konfigurasi, data, pengguna, audit, dan laporan |
| Admin Operasional | CRM, jadwal, order, pembayaran, voucher, dan tindak lanjut |
| Editor | Review dan publikasi artikel serta halaman SEO |
| Promotor | Lead/peserta milik sendiri, voucher, atribusi, kelas dan artikel sesuai izin |
| Pengajar | Kelas, materi, peserta, kuis/tugas, dan penilaian yang ditugaskan |
| Calon Promotor | Progres konsultasi, WSL, pembayaran, dokumen, dan aktivasi |
| Klien/Peserta | Pesanan, invoice, cicilan, jadwal, kelas, progress, dan sertifikat |

Ketentuan:

- Satu akun dapat mempunyai beberapa peran.
- Hak akses harus diperiksa di server, bukan hanya menyembunyikan menu.
- Promotor hanya boleh melihat data yang ditugaskan atau diatribusikan kepadanya.
- Kontak dan data transaksi tidak boleh tampil pada endpoint publik.
- Perubahan sensitif wajib masuk audit log.

---

## 6. Modul Target

### 6.1 Identity dan Dashboard

- Login, logout, reset password, dan manajemen sesi.
- RBAC multi-peran.
- Profil pengguna terpadu.
- Dashboard kontekstual menurut peran.
- Notifikasi dan aktivitas terbaru.

### 6.2 CRM

- Calon klien, klien, calon promotor, dan promotor.
- Pipeline, PIC, assignment promotor, catatan, tugas, follow-up, dan histori.
- Relasi satu orang dengan banyak proses atau transaksi tanpa menggabungkan berdasarkan nomor telepon secara otomatis.
- Konversi lead menjadi order tanpa input data ulang.

### 6.3 Commerce

- Produk, variasi, harga, order, invoice, pembayaran, refund, dan hak akses.
- Full payment, DP, dan cicilan.
- Snapshot harga dan ketentuan saat order dibuat.
- Webhook gateway yang terverifikasi dan idempoten.

### 6.4 Voucher

- Pemetaan akun promotor dengan Kode ID.
- Paket dan pembelian voucher.
- Pemrosesan, verifikasi saldo, bukti aktivitas, dan `needs_review`.
- Satu order hanya boleh memicu satu penambahan voucher.

### 6.5 LMS

- Program, kelas, modul, materi, kuis/tugas, progress, kelulusan, dan sertifikat.
- Kelas gratis/berbayar serta online/offline.
- Promotor dapat membuat kelas jika mempunyai izin.
- Workflow kelas promotor: `draft → submitted → review → published/revision/rejected`.

### 6.6 CMS dan SEO

- Artikel, kategori, tag, media, revisi, jadwal publikasi, dan arsip.
- Workflow artikel promotor: `draft → submitted → review → published/revision/rejected`.
- Halaman promotor dan wilayah pada domain utama.
- Metadata, canonical, sitemap, structured data, internal link, dan kontrol index/noindex berbasis bukti layanan.
- Deteksi konten duplikat sebelum publikasi.

### 6.7 Pelaporan

- Funnel lead dan calon promotor.
- Penjualan, piutang cicilan, voucher, kelas, dan komisi.
- Performa promotor dan wilayah.
- Ekspor yang dibatasi oleh peran dan terlindungi dari formula injection.

---

## 7. Alur Bisnis Inti

### Calon klien menjadi klien

`Lead → Dihubungi → Memilih layanan → Order → Full/DP/Cicilan → Jadwal → Tes selesai → Klien → Follow-up/referral`

### Calon promotor menjadi promotor

`Pendaftaran → Konsultasi → Preview → WSL → Pembelian alat/ID → Verifikasi aktivasi → Promotor aktif`

### Pembelian voucher

`Pilih paket → Validasi Kode ID → Order → Pembayaran → Webhook terverifikasi → Tambah voucher → Verifikasi saldo → Berhasil/needs_review`

### Pembuatan kelas promotor

`Draft → Susun materi → Ajukan → Review admin → Revisi/publikasi → Pendaftaran peserta → Pembelajaran → Kelulusan → Sertifikat`

### Artikel promotor

`Draft → Pemeriksaan minimum SEO → Ajukan → Review editor → Revisi/publikasi → Atribusi lead → Evaluasi performa`

---

## 8. Fase 0 — Discovery, Backup, dan Kontrak Data

### Tujuan

Menetapkan aturan bisnis serta memetakan data SEJOLI sebelum kode transaksi baru dibuat.

### Pekerjaan

- Inventarisasi tabel, post type, user meta, order meta, hook, cron, dan konfigurasi plugin terkait.
- Buat backup WordPress, database SEJOLI, PostgreSQL, dan file unggahan.
- Dokumentasikan produk aktif, status order, status pembayaran, cicilan, komisi, akses kelas, dan voucher.
- Tetapkan aturan kepemilikan lead, komisi, pembatalan, refund, keterlambatan, serta hak akses setelah DP.
- Susun kamus data dan pemetaan ID lama ke ID baru.
- Siapkan staging yang terisolasi dari payment gateway dan API voucher produksi.

### Kriteria selesai

- Backup dapat dipulihkan pada staging.
- Kamus data dan pemetaan entitas disetujui.
- Tidak ada field keuangan/kursus/voucher penting yang belum terpetakan.
- Daftar aturan bisnis yang belum diputuskan telah ditanyakan kepada pemilik.

### SEJOLI

Tetap menjadi sistem utama seluruh transaksi.

---

## 9. Fase 1 — Fondasi Produksi dan Satu Akun

### Tujuan

Menyediakan autentikasi multi-pengguna, RBAC, profil terpadu, audit, dan dashboard berdasarkan peran.

### Pekerjaan

- Skema pengguna, peran, permission, profil, sesi, dan audit log.
- Migrasi autentikasi admin tunggal ke sistem akun yang aman.
- Portal admin dan promotor.
- Perlindungan route dan pemeriksaan ownership di server.
- Reset password, rate limiting, session expiry, dan pencabutan sesi.
- Backup PostgreSQL dan prosedur pemulihan.
- Pemetaan sementara akun baru dengan ID user SEJOLI.

### Kriteria selesai

- Admin dan promotor dapat login dengan akun berbeda.
- Pengujian membuktikan promotor A tidak dapat membaca data promotor B.
- Semua perubahan peran dan data sensitif tercatat.
- Backup dan restore diuji.
- Sistem lama tetap dapat diakses bila dashboard baru gagal.

### SEJOLI

Masih menangani checkout, pembayaran, member area, LMS, affiliate, komisi, dan voucher.

---

## 10. Fase 2 — CRM Terpadu

### Tujuan

Menjadikan dashboard baru sebagai sumber utama lead dan hubungan pelanggan/promotor.

### Pekerjaan

- Master person/contact dan proses bisnis terpisah.
- Pipeline calon klien dan calon promotor.
- PIC, assignment, catatan, tugas, timeline, consent, dan atribusi.
- Konversi lead menjadi klien/promotor berdasarkan peristiwa yang telah diverifikasi.
- Integrasi formulir publik yang sudah ada.
- Impor data lead yang layak dari sistem lama setelah deduplikasi terkontrol.

### Kriteria selesai

- Semua lead baru masuk PostgreSQL.
- Riwayat perubahan status utuh.
- Tidak ada kontak pribadi pada API/HTML publik.
- Dashboard dan ekspor mematuhi scope peran.

### SEJOLI

Tidak lagi menjadi sumber utama lead, tetapi tetap menjadi sumber transaksi lama.

---

## 11. Fase 3 — Produk, Order, Pembayaran, DP, dan Cicilan

### Tujuan

Menggantikan fungsi commerce utama SEJOLI untuk transaksi baru.

### Pekerjaan

- Produk, harga, order, order item, invoice, payment attempt, refund, entitlement, kontrak cicilan, dan termin.
- Pilihan full, DP, dan maksimal skema cicilan yang diputuskan pemilik.
- Snapshot harga dan ketentuan pada waktu checkout.
- Checkout baru serta integrasi payment gateway.
- Signature verification, idempotency key, replay protection, dan rekonsiliasi webhook.
- Status `pending`, `paid`, `partially_paid`, `overdue`, `cancelled`, `refunded`, dan `needs_review` sesuai kontrak final.
- Aturan aktivasi akses setelah full/DP sesuai produk.
- Pengingat termin dan pencatatan pembayaran manual dengan audit.

### Strategi cutover

1. Jalankan produk percobaan pada staging.
2. Aktifkan satu produk berisiko rendah di checkout baru.
3. Rekonsiliasi order dan dana setiap hari.
4. Tambahkan produk secara bertahap.
5. Order lama tetap dilayani pada SEJOLI; jangan memindahkan cicilan aktif tanpa prosedur khusus.

### Kriteria selesai

- Nominal order, invoice, gateway, dan laporan cocok.
- Webhook duplikat tidak menggandakan pembayaran atau hak akses.
- DP dan termin dapat dilacak hingga lunas.
- Kegagalan/hasil ambigu masuk antrean pemeriksaan.
- Refund dan pembatalan telah diuji.

### SEJOLI

Menerima order lama dan produk yang belum dipindahkan. Produk yang telah cutover menerima order baru hanya di sistem baru.

---

## 12. Fase 4 — Voucher Promotor Otomatis

### Tujuan

Memindahkan pembelian dan pemrosesan voucher ke dashboard baru.

### Pekerjaan

- Pemetaan akun ke Kode ID promotor.
- Katalog paket voucher.
- Integrasi order baru dengan layanan/API voucher resmi.
- Mesin status voucher dan audit aktivitas.
- Lock/idempotency per order.
- Pembacaan saldo sebelum/sesudah bila API mendukung.
- Mode uji tanpa perubahan saldo.
- Tombol proses ulang hanya untuk kondisi aman dan terdefinisi.

### Kriteria selesai

- Order uji tidak mengubah saldo nyata.
- Satu order nyata terkontrol berhasil dan saldo terverifikasi.
- Callback berulang tidak menambah voucher dua kali.
- Timeout/hasil jaringan ambigu menghasilkan `needs_review`.
- Promotor hanya melihat saldo dan aktivitas miliknya.

### SEJOLI

Plugin voucher tetap aktif untuk order lama. Produk voucher baru dialihkan setelah cutover dan rekonsiliasi berhasil.

---

## 13. Fase 5 — LMS Mandiri

### Tujuan

Mengganti `dw-sejoli-lms` dan mengizinkan promotor tertentu membuat kelas dengan kontrol mutu.

### Pekerjaan

- Program, kelas, modul, materi, media, enrollment, progress, kuis/tugas, penilaian, kelulusan, dan sertifikat.
- Editor kelas dan workflow review.
- Relasi produk dengan hak akses kelas.
- Impor struktur kelas dan enrollment lama.
- Penyimpanan media yang aman dan akses terproteksi.
- Progress dan sertifikat tidak boleh berubah akibat impor berulang.

### Strategi cutover

- Mulai dengan satu kelas baru.
- Kelas lama tetap berjalan pada SEJOLI selama migrasi.
- Migrasikan kelas lama per batch dan lakukan sampling progress peserta.
- Tautan lama diberi redirect setelah kelas dinyatakan stabil.

### Kriteria selesai

- Pengajar/promotor dapat membuat draft tetapi tidak menerbitkan tanpa izin.
- Peserta hanya mengakses kelas yang dimiliki.
- Progress, kelulusan, dan sertifikat konsisten.
- Akses kelas mengikuti status order/entitlement.
- Data kelas lama telah direkonsiliasi.

---

## 14. Fase 6 — CMS dan SEO Nasional Promotor

### Tujuan

Memberi promotor fasilitas konten dan halaman lokal tanpa memecah otoritas domain.

### Struktur URL sasaran

- `/promotor/[slug-promotor]`
- `/promotor-stifin/[kota]`
- `/tes-stifin/[kota]`
- `/edukasi/[slug]` atau keputusan slug artikel final
- `/kelas/[slug]`

### Pekerjaan

- Editor artikel, media, kategori, tag, revisi, preview, jadwal, dan arsip.
- Workflow review untuk artikel promotor.
- Profil promotor, layanan, wilayah, kelas, artikel, dan atribusi.
- Canonical, sitemap, structured data, metadata, internal linking, dan noindex berbasis bukti.
- Pemeriksaan duplikasi serta standar editorial.
- Lead dari profil/artikel membawa atribusi promotor tanpa mengekspos kontak pribadi.

### Kriteria selesai

- Promotor dapat menulis tetapi publikasi mengikuti permission/workflow.
- Sitemap hanya memuat halaman yang layak diindeks.
- Tidak ada halaman kota massal tanpa bukti layanan.
- Canonical dan structured data konsisten dengan data produk/promotor.
- Atribusi lead dapat ditelusuri.

### SEJOLI

Tidak lagi digunakan untuk artikel atau SEO. Fungsi ini tetap sepenuhnya pada domain utama.

---

## 15. Fase 7 — Affiliate, Komisi, Migrasi Akhir, dan Pensiun SEJOLI

### Tujuan

Menghapus ketergantungan operasional terakhir terhadap SEJOLI dengan menjaga histori dan kewajiban keuangan.

### Pekerjaan

- Rumus atribusi, komisi, approval, reversal, payout, dan laporan.
- Migrasi user/member, produk, order, pembayaran, cicilan, komisi, akses kelas, sertifikat, dan aktivitas voucher yang diperlukan.
- Rekonsiliasi total per entitas dan sampling bukti transaksi.
- Redirect URL member/checkout lama.
- Mode read-only untuk sistem lama.
- Arsip database dan prosedur pencarian histori.
- Rencana rollback serta periode observasi.

### Syarat mematikan SEJOLI

SEJOLI tidak boleh dimatikan sebelum seluruh kondisi berikut terpenuhi:

- Tidak ada checkout baru menuju SEJOLI.
- Tidak ada cicilan aktif yang hanya tercatat di SEJOLI.
- Tidak ada webhook atau cron penting yang masih menuju SEJOLI.
- Saldo, invoice, pembayaran, refund, komisi, enrollment, dan voucher telah direkonsiliasi.
- URL penting telah dialihkan.
- Backup final dapat dipulihkan.
- Pemilik menyetujui berita acara cutover.

---

## 16. Status Fase

Gunakan hanya satu status: `BELUM DIMULAI`, `AKTIF`, `TERTUNDA`, `SELESAI`, atau `DIBATALKAN`.

| Fase | Nama | Status awal | System of record saat ini |
|---|---|---|---|
| 0 | Discovery, Backup, dan Kontrak Data | AKTIF | SEJOLI + PostgreSQL sesuai data asal |
| 1 | Fondasi Produksi dan Satu Akun | BELUM DIMULAI | Admin lama/SEJOLI |
| 2 | CRM Terpadu | BELUM DIMULAI | PostgreSQL untuk lead yang sudah tersedia; perlu audit produksi |
| 3 | Commerce, DP, dan Cicilan | BELUM DIMULAI | SEJOLI |
| 4 | Voucher Promotor | BELUM DIMULAI | SEJOLI + plugin voucher |
| 5 | LMS Mandiri | BELUM DIMULAI | SEJOLI + dw-sejoli-lms |
| 6 | CMS dan SEO Nasional | BELUM DIMULAI | Next.js `konsepstifin.com` |
| 7 | Affiliate dan Pensiun SEJOLI | BELUM DIMULAI | SEJOLI |

Catatan: status di atas merupakan baseline dari audit arsip, bukan pernyataan bahwa kondisi produksi telah diverifikasi.

---

## 17. Log Kelanjutan Proyek

Setiap AI/developer wajib menambahkan satu entri setelah pekerjaan material.

### Entri 001 — 14 September 2026

- **Pelaksana:** ChatGPT/Codex.
- **Keputusan:** Menggunakan migrasi bertahap; SEJOLI tidak dimatikan sekaligus.
- **Sumber yang diaudit:** Arsip platform Next.js dan ekspor plugin/theme WordPress–SEJOLI.
- **Temuan:** Platform publik/CRM dan modul transaksi lama sudah tersedia; pendekatan paling aman adalah mempertahankan domain utama sebagai pusat pengalaman dan memindahkan system of record per modul.
- **Perubahan kode:** Tidak ada.
- **Perubahan produksi:** Tidak ada.
- **Fase aktif berikutnya:** Fase 0 — Discovery, Backup, dan Kontrak Data.
- **Tindakan pertama:** Audit skema/data produksi secara aman, tetapkan aturan bisnis commerce/komisi/akses, lalu buat spesifikasi teknis Fase 1.

### Entri 002 — 14 September 2026

- **Pelaksana:** ChatGPT/Codex.
- **Fase/subfase:** Fase 0 — audit kontrak data dari source.
- **Tujuan:** Mengidentifikasi sumber data PostgreSQL dan WordPress–SEJOLI yang harus dipetakan sebelum migrasi.
- **Keputusan yang dikunci:** Source code hanya menjadi bukti struktur dan perilaku; jumlah serta kualitas data produksi harus diverifikasi melalui ekspor terkontrol.
- **File yang dibuat/diubah:** Dokumen induk ini, Bagian 22–25.
- **Migrasi database:** Tidak ada.
- **Pengujian yang dijalankan:** Pemeriksaan statis definisi tabel, indeks, hook transaksi, dan metadata plugin.
- **Hasil pengujian:** Ditemukan data aktif pada PostgreSQL untuk lead, artikel, engagement, promotor/mapping, cakupan layanan, produk, dan pustaka. Ditemukan data WordPress untuk user/member, order SEJOLI, kontrak/termin PayPlan, transaksi voucher, LMS, sertifikat, serta lead campaign.
- **Perubahan produksi:** Tidak ada.
- **Risiko/masalah tersisa:** Belum tersedia dump skema dan ekspor data produksi; tabel inti SEJOLI serta aturan komisi harus diaudit dari database/dokumentasi produksi, bukan diasumsikan dari plugin tambahan.
- **Langkah berikutnya:** Kunci aturan pemberian akses setelah DP/full payment, lalu lanjutkan daftar keputusan bisnis Fase 0 satu per satu.
- **Commit/deployment acuan:** Tidak ada; arsip hanya diaudit secara lokal.

### Entri 003 — 14 September 2026

- **Pelaksana:** ChatGPT/Codex.
- **Fase/subfase:** Fase 0 — keputusan akses produk.
- **Tujuan:** Menetapkan kapan layanan atau hak akses diberikan untuk pembelian penuh, DP, dan cicilan.
- **Keputusan yang dikunci:** Tes dapat dijadwalkan setelah DP; kelas mengikuti kebijakan per produk; voucher serta alat/ID diproses setelah lunas; kursi event/WSL dapat diamankan setelah DP dengan tenggat pelunasan.
- **File yang dibuat/diubah:** Dokumen induk ini, Bagian 25–26.
- **Migrasi database:** Tidak ada.
- **Pengujian yang dijalankan:** Tidak ada; tahap keputusan bisnis.
- **Hasil pengujian:** Tidak berlaku.
- **Perubahan produksi:** Tidak ada.
- **Risiko/masalah tersisa:** Besaran DP, jumlah termin, interval, serta kebijakan keterlambatan belum disetujui.
- **Langkah berikutnya:** Tinjau dan kunci Usulan Keputusan 2 tentang struktur DP dan cicilan.
- **Commit/deployment acuan:** Tidak ada.

### Entri 004 — 14 September 2026

- **Pelaksana:** ChatGPT/Codex.
- **Fase/subfase:** Fase 0 — struktur DP dan cicilan.
- **Tujuan:** Mengunci batas plan, termin, interval, dan perhitungan DP.
- **Keputusan yang dikunci:** Bayar penuh atau satu plan; maksimal tiga alternatif plan per produk; DP minimal 20%; DP ditambah 1–5 termin; interval mingguan, bulanan, atau tanggal khusus; tanpa bunga/denda otomatis; boleh lunas lebih awal.
- **File yang dibuat/diubah:** Dokumen induk ini, Bagian 25 dan 27.
- **Migrasi database:** Tidak ada.
- **Pengujian yang dijalankan:** Tidak ada; tahap keputusan bisnis.
- **Hasil pengujian:** Tidak berlaku.
- **Perubahan produksi:** Tidak ada.
- **Risiko/masalah tersisa:** Kebijakan keterlambatan, pembatalan, refund, dan suspend akses belum disetujui.
- **Langkah berikutnya:** Tinjau dan kunci Usulan Keputusan 3.
- **Commit/deployment acuan:** Tidak ada.

### Entri 005 — 14 September 2026

- **Pelaksana:** ChatGPT/Codex.
- **Fase/subfase:** Fase 0 — kebijakan tunggakan, pembatalan, refund, dan akses.
- **Tujuan:** Mengunci perilaku sistem ketika termin terlambat atau transaksi dibatalkan.
- **Keputusan yang dikunci:** Pengingat H-3/jatuh tempo/H+1/H+7; overdue H+1; suspend akses digital H+7 tanpa menghapus data; tanpa denda otomatis; refund harus terkonfirmasi; order dan audit tidak dihapus.
- **File yang dibuat/diubah:** Dokumen induk ini, Bagian 25 dan 28.
- **Migrasi database:** Tidak ada.
- **Pengujian yang dijalankan:** Tidak ada; tahap keputusan bisnis.
- **Hasil pengujian:** Tidak berlaku.
- **Perubahan produksi:** Tidak ada.
- **Risiko/masalah tersisa:** Naskah ketentuan konsumen perlu pemeriksaan hukum; kepemilikan dan reassignment lead belum disetujui.
- **Langkah berikutnya:** Tinjau dan kunci Usulan Keputusan 4.
- **Commit/deployment acuan:** Tidak ada.

### Entri 006 — 14 September 2026

- **Pelaksana:** ChatGPT/Codex.
- **Fase/subfase:** Fase 0 — kepemilikan dan penugasan lead.
- **Tujuan:** Mengunci otoritas data lead, prioritas assignment, SLA respons, dan reassignment.
- **Keputusan yang dikunci:** Lead dikelola Konsep STIFIn; peran sumber, penanggung jawab, dan pelaksana dipisahkan; SLA menerima 4 jam operasional dan kontak pertama 24 jam operasional; reassignment tidak menghapus atribusi.
- **File yang dibuat/diubah:** Dokumen induk ini, Bagian 25 dan 29.
- **Migrasi database:** Tidak ada.
- **Pengujian yang dijalankan:** Tidak ada; tahap keputusan bisnis.
- **Hasil pengujian:** Tidak berlaku.
- **Perubahan produksi:** Tidak ada.
- **Risiko/masalah tersisa:** Besaran dan pembagian komisi per produk belum ditentukan.
- **Langkah berikutnya:** Tinjau dan kunci Usulan Keputusan 5 tentang atribusi dan komisi.
- **Commit/deployment acuan:** Tidak ada.

### Template entri berikutnya

```markdown
### Entri NNN — YYYY-MM-DD

- Pelaksana:
- Fase/subfase:
- Tujuan:
- Keputusan yang dikunci:
- File yang dibuat/diubah:
- Migrasi database:
- Pengujian yang dijalankan:
- Hasil pengujian:
- Perubahan produksi:
- Risiko/masalah tersisa:
- Langkah berikutnya:
- Commit/deployment acuan:
```

---

## 18. Aturan Penghematan Kredit dan Pencegahan Pengulangan

1. Jangan meminta AI membangun seluruh platform dalam satu sesi.
2. Mulai setiap sesi dengan menyebutkan satu fase dan satu hasil yang diinginkan.
3. Gunakan dokumen ini sebagai konteks utama; jangan mengirim ulang seluruh riwayat percakapan.
4. Jika hanya meminta analisis, AI tidak boleh mengubah kode.
5. Jika meminta implementasi, AI harus menyampaikan desain terbatas dan memperoleh persetujuan sebelum coding.
6. Setiap subfase harus menghasilkan perubahan yang dapat diuji secara mandiri.
7. Jangan mengulang audit file yang sudah tercatat kecuali arsip/repository berubah.
8. Simpan keputusan baru pada dokumen ini dan perbarui status fase.

### Contoh permintaan hemat kredit

> Lanjutkan Fase 0 berdasarkan dokumen handoff. Fokus hanya pada kamus data user, promotor, produk, order, pembayaran, cicilan, enrollment, dan voucher. Jangan coding. Buat daftar informasi produksi yang masih perlu saya berikan.

> Lanjutkan Fase 1 berdasarkan dokumen handoff. Audit autentikasi yang sudah ada, lalu ajukan desain RBAC dan skema database. Jangan implementasi sebelum saya setujui.

> Implementasikan hanya subfase login dan session Fase 1 berdasarkan spesifikasi yang sudah disetujui. Jalankan tes dan perbarui log handoff.

---

## 19. Risiko Utama

| Risiko | Pengendalian |
|---|---|
| Pembayaran tercatat dua kali | Idempotency, signature webhook, unique constraint, dan rekonsiliasi |
| Voucher bertambah dua kali | Lock per order, ledger aktivitas, dan verifikasi saldo |
| Data SEJOLI dan dashboard berbeda | System of record eksplisit per fase dan laporan rekonsiliasi |
| Promotor melihat data orang lain | RBAC dan ownership check pada server serta tes isolasi |
| Cicilan aktif hilang saat migrasi | Pertahankan order lama pada SEJOLI sampai lunas atau migrasi khusus |
| Progress LMS hilang | Migrasi batch, checksum/count, sampling, dan rollback |
| SEO rusak akibat URL berubah | Redirect, canonical, sitemap stabil, dan monitoring indeks |
| Halaman kota menjadi spam | Index hanya jika ada bukti promotor/layanan aktual |
| Sistem lama dimatikan terlalu cepat | Cutover gate dan persetujuan pemilik |
| Kredensial bocor | Secret manager/environment, rotasi credential, dan larangan log PII |

---

## 20. Definition of Done Global

Sebuah fase hanya boleh berstatus `SELESAI` bila:

- Kebutuhan dan keputusan bisnis telah tertulis.
- Implementasi mengikuti hak akses dan perlindungan data.
- Unit/integration test relevan lulus.
- Build, lint, dan pemeriksaan tipe lulus.
- Pengujian staging end-to-end lulus.
- Backup dan rollback tersedia.
- Rekonsiliasi data lulus bila menyangkut migrasi/transaksi.
- Dokumentasi operasional diperbarui.
- Log Bagian 17 diperbarui.
- Pemilik menyetujui cutover fase bila mengubah sistem produksi.

---

## 21. Keputusan yang Masih Harus Dikunci pada Fase 0

1. Daftar produk aktif dan produk pertama yang akan dipindahkan.
2. Payment gateway yang dipertahankan pada sistem baru.
3. Maksimal pilihan cicilan per produk dan aturan jatuh tempo.
4. Kapan akses diberikan: setelah DP atau setelah lunas, per jenis produk.
5. Aturan pembatalan, refund, keterlambatan, dan termin tidak dibayar.
6. Rumus atribusi serta komisi promotor/affiliate.
7. Pihak yang boleh membuat kelas dan pihak yang boleh menerbitkannya.
8. Pihak yang boleh menulis artikel dan standar review.
9. Data historis mana yang wajib dimigrasikan dan mana yang cukup diarsipkan.
10. Durasi operasi paralel sebelum modul SEJOLI dinonaktifkan.

---

**Instruksi akhir:** Jangan langsung membangun semua fase. Mulai dari Fase 0, selesaikan keputusan dan kontrak datanya, lalu buat spesifikasi teknis Fase 1 untuk ditinjau pemilik.

---

## 22. Hasil Audit Kontrak Data Awal

Bagian ini bersumber dari pemeriksaan statis kedua arsip. Informasi berikut belum membuktikan isi atau kondisi database produksi.

### 22.1 PostgreSQL platform Next.js

| Kelompok data | Tabel/komponen teridentifikasi | Status migrasi awal |
|---|---|---|
| Lead/CRM | `public_interest_leads`, `lead_status_history` | Dipertahankan dan dinormalisasi bertahap |
| Artikel | `education_articles` | Dipertahankan; kelak ditambah ownership dan workflow multi-pengguna |
| Engagement | `article_comments`, `article_likes`, `article_events` | Dipertahankan dengan peninjauan privasi/retensi |
| Pustaka | `knowledge_sources`, `knowledge_chunks` | Di luar commerce; jangan dicampur dengan materi LMS tanpa desain |
| Promotor | store promotor, snapshot/mapping wilayah | Dipertahankan sebagai data referensi; profil akun internal harus dipisahkan dari data publik |
| Cakupan wilayah | `public_serviceable_regions` | Dipertahankan untuk keputusan index/noindex berbasis bukti |
| Produk | product store | Menjadi sumber katalog setelah skema commerce baru disetujui |

`public_interest_leads` saat ini mencampur identitas kontak, proses pipeline, atribusi, jadwal, pembayaran ringkas, biaya, dan assignment dalam satu baris. Pada arsitektur sasaran, jangan menjadikannya tabel transaksi utama. Data tersebut harus dipisahkan bertahap menjadi person/contact, lead/opportunity, assignment, activity, order, payment, dan attribution dengan ID lama tetap disimpan untuk rekonsiliasi.

Field yang telah teridentifikasi pada lead meliputi:

- Identitas/kontak: nama, telepon, email, kota, provinsi, kabupaten/kota.
- Proses: `lead_type`, layanan, `product_key`, status, jadwal, PIC, catatan.
- Atribusi: UTM, referrer, source path.
- Consent: izin dihubungi, izin berbagi, waktu consent.
- Matching: kode promotor, nama promotor, cabang, metode, kandidat.
- Transaksi ringkas: status pembayaran, ID order SEJOLI, nilai jual, payout promotor, biaya lain.
- Kontrol: idempotency key, created/updated time, dan riwayat status.

### 22.2 WordPress–SEJOLI dan plugin tambahan

| Kelompok data | Sumber yang ditemukan | Catatan migrasi |
|---|---|---|
| Akun/member | WordPress users/usermeta dan member SEJOLI | Password tidak boleh diekspor sebagai plaintext; tentukan reset atau migrasi hash yang kompatibel |
| Produk/order | Inti SEJOLI serta metadata order | Skema inti harus diaudit dari database produksi sebelum mapper dibuat |
| DP/cicilan | `kst_payplan_contracts`, `kst_payplan_installments`, `kst_payplan_audit` | Pertahankan nomor kontrak, parent order, urutan termin, nominal, jatuh tempo, status, pembayaran, dan snapshot kesepakatan |
| Voucher | `kstifin_ssv_transactions` serta profil Kode ID | `order_id` unik; status, attempts, HTTP result, response, dan error diperlukan untuk audit |
| LMS | course/access dalam struktur WordPress/SEJOLI; tabel completion, quiz result, certificate token | Struktur course tidak boleh diasumsikan hanya berasal dari tiga tabel tambahan; post/meta/access perlu diekspor bersama |
| Lead campaign | `lead_form`, `lead_form_data`, `lead_form_extension`, `lead_form_options` | Banyak payload terserialisasi/longtext; perlu parser dan pemetaan field, bukan copy langsung |
| Gateway | plugin Xendit dan data order/payment SEJOLI | Secret tidak diekspor; transaksi harus direkonsiliasi dengan laporan gateway |

### 22.3 Perilaku kritis yang wajib dipertahankan

- PayPlan membuat kontrak dan termin setelah order DP selesai.
- DP merupakan pembayaran pertama, bukan biaya tambahan di luar total kewajiban.
- Satu parent order hanya memiliki satu kontrak PayPlan.
- Kombinasi kontrak dan nomor urut termin harus unik.
- Token pembayaran termin serta ID order termin harus unik.
- Ketentuan pembelian bertahap disimpan sebagai snapshot dan memiliki bukti persetujuan.
- Voucher hanya diproses untuk produk yang dipetakan dan order berstatus selesai.
- Satu ID order voucher hanya boleh diproses satu kali.
- Request penambahan voucher tidak boleh diulang otomatis ketika hasil jaringan ambigu.
- LMS menyimpan progress per user, akses, chapter, dan lesson; hasil kuis serta token sertifikat harus tetap terhubung kepada pemiliknya.
- Halaman dan API publik tidak boleh mengekspos kontak, PassID, saldo, atau data transaksi promotor.

---

## 23. Kontrak ID Migrasi

Setiap entitas baru yang berasal dari sistem lama minimal mempunyai:

- ID internal baru yang stabil.
- `legacy_system`, misalnya `sejoli_wordpress` atau `nextjs_v0`.
- `legacy_entity_type`.
- `legacy_id` dalam format string agar dapat menampung ID numerik maupun gabungan.
- Waktu impor.
- Batch impor.
- Checksum atau fingerprint payload sumber yang tidak memuat secret.

Kombinasi `legacy_system + legacy_entity_type + legacy_id` harus unik. Impor berulang wajib memperbarui atau melewati baris yang sama, bukan membuat duplikat.

Aturan nominal:

- Simpan rupiah sebagai bilangan bulat, bukan floating point.
- Simpan currency secara eksplisit dengan nilai awal `IDR`.
- Bedakan total order, jumlah yang telah dibayar, saldo kewajiban, fee gateway, payout, refund, dan biaya lain.
- Jangan menghitung ulang histori dengan harga produk terbaru; gunakan snapshot order.

Aturan waktu:

- Simpan waktu sistem baru dalam UTC dengan timezone-aware timestamp.
- Pertahankan nilai waktu asli dari WordPress/SEJOLI untuk audit.
- Tampilkan waktu operasional dalam WIB jika kebijakan bisnis tetap WIB.

---

## 24. Paket Ekspor Produksi yang Masih Dibutuhkan

Jangan mengirim database produksi mentah melalui percakapan. Buat ekspor minimal, terenkripsi bila mengandung data pribadi, dan hapus secret sebelum diberikan untuk pemetaan.

Paket yang diperlukan:

1. Daftar nama tabel dan struktur kolom/index tanpa isi data.
2. Ekspor produk aktif dan nonaktif beserta harga serta pengaturan akses.
3. Ekspor order dengan status, member, produk, nominal, waktu, affiliate, dan referensi gateway.
4. Ekspor kontrak PayPlan dan seluruh termin.
5. Ekspor transaksi voucher beserta status, tanpa token API dan tanpa response sensitif.
6. Ekspor course, chapter, lesson, access/enrollment, progress, kuis, dan sertifikat.
7. Ekspor affiliate, rumus/level komisi, komisi tercatat, reversal, dan payout.
8. Ekspor akun/member yang diperlukan; jangan sertakan secret atau password plaintext.
9. Daftar cron aktif, webhook aktif, dan URL callback tanpa credential.
10. Laporan agregat dari Xendit untuk rekonsiliasi nominal dan status.

Sebelum impor dibuat, lakukan pencocokan jumlah per status dan total nominal antara sumber, ekspor, serta laporan gateway.

---

## 25. Gate Keputusan Fase 0

Keputusan disajikan sebagai satu paket sesuai instruksi terbaru pemilik. Pertanyaan hanya diajukan bersama untuk hal yang benar-benar menghambat pekerjaan saat ini; detail commerce tidak menghalangi desain fondasi akun/CRM.

| Urutan | Keputusan | Status |
|---|---|---|
| 1 | Waktu pemberian akses untuk pembelian full, DP, dan cicilan | DIKUNCI — lihat Bagian 26 |
| 2 | Batas jumlah plan/termin dan interval cicilan | DIKUNCI — lihat Bagian 27 |
| 3 | Keterlambatan, pembatalan, refund, dan pencabutan akses | DIKUNCI — lihat Bagian 28 |
| 4 | Kepemilikan lead dan aturan reassignment | DIKUNCI — lihat Bagian 29 |
| 5 | Atribusi affiliate/promotor serta komisi | STRUKTUR DIKUNCI — Bagian 30; tarif belum ditetapkan |
| 6 | Hak promotor membuat/menerbitkan kelas | DIKUNCI — Bagian 30 |
| 7 | Hak promotor membuat/menerbitkan artikel | ASUMSI KERJA — Bagian 31 |
| 8 | Cakupan data historis yang dimigrasikan | ASUMSI KERJA — Bagian 31; menunggu inventaris produksi |
| 9 | Produk pertama untuk pilot checkout baru | ASUMSI KERJA — Bagian 31; bukan penghalang CRM |
| 10 | Durasi operasi paralel dan syarat cutover | ASUMSI KERJA — Bagian 31; cutover perlu persetujuan |

---

## 26. Keputusan 1 — Waktu Pemberian Akses

**Status:** Dikunci pada 14 September 2026 berdasarkan persetujuan pemilik untuk melanjutkan rekomendasi.

| Jenis produk | Setelah pembayaran penuh | Setelah DP | Ketentuan tambahan |
|---|---|---|---|
| Tes STIFIn | Dapat masuk penjadwalan | Dapat mengamankan jadwal | Pelaksanaan mengikuti konfirmasi promotor dan batas pelunasan produk |
| Kelas | Akses aktif | Dapat aktif jika produk memang mengizinkan akses setelah DP | Kebijakan disimpan per produk, bukan berlaku otomatis untuk semua kelas |
| Voucher promotor | Diproses otomatis | Tidak diproses | Penambahan voucher hanya setelah pembayaran lunas dan tervalidasi |
| Alat dan ID | Dapat diproses | Belum diproses | Pengiriman/aktivasi setelah lunas dan persyaratan resmi terpenuhi |
| Event/WSL | Peserta dikonfirmasi | Kursi dapat diamankan | Pelunasan wajib sebelum tenggat yang ditentukan pada produk/event |

### Aturan sistem

- Status pembayaran dan status pemenuhan layanan harus dipisahkan.
- Pembayaran DP tidak boleh ditampilkan sebagai lunas.
- Hak akses dibuat melalui entitlement agar dapat diberi, ditahan, kedaluwarsa, atau dicabut dengan audit.
- Setiap produk memiliki kebijakan akses sendiri: `after_full_payment` atau `after_down_payment`.
- Voucher selalu memakai `after_full_payment` dan tidak dapat diubah promotor.
- Aktivasi setelah DP tidak menghapus kewajiban termin berikutnya.
- Perubahan kebijakan produk hanya berlaku untuk order baru; order lama memakai snapshot kebijakan saat checkout.

### Usulan Keputusan 2 — Struktur DP dan cicilan

Rekomendasi awal untuk ditinjau pemilik:

- Setiap produk dapat menawarkan: bayar penuh, satu pilihan DP, dan maksimal tiga alternatif plan cicilan.
- Satu order hanya boleh memilih satu metode pembayaran.
- DP merupakan pembayaran pertama dan mengurangi total kewajiban.
- Satu plan terdiri dari DP ditambah 1–5 termin berikutnya.
- Interval yang diizinkan: mingguan atau bulanan; tanggal khusus dapat dipakai untuk event/WSL.
- Nominal DP ditentukan per plan, dengan batas minimum bawaan 20% dari harga produk; admin dapat menetapkan minimum lebih tinggi.
- Tidak ada bunga atau denda otomatis pada versi awal.
- Biaya payment gateway ditampilkan terpisah dan tidak mengurangi pokok kewajiban.
- Pembeli dapat melunasi lebih awal tanpa penalti.
- Jadwal, harga, DP, jumlah termin, interval, dan ketentuan disimpan sebagai snapshot order.
- Promotor tidak boleh membuat atau mengubah skema cicilan tanpa izin admin.

Alasan pembatasan: maksimal tiga pilihan mengikuti pola PayPlan yang sudah tersedia, sedangkan maksimal lima termin menjaga operasional dan rekonsiliasi tetap sederhana pada versi awal.

---

## 27. Keputusan 2 — Struktur DP dan Cicilan

**Status:** Dikunci pada 14 September 2026.

- Setiap produk dapat menawarkan bayar penuh, satu pilihan DP, dan maksimal tiga alternatif plan cicilan.
- Satu order hanya boleh menggunakan satu metode pembayaran.
- DP merupakan pembayaran pertama dan mengurangi total kewajiban.
- Setiap plan terdiri dari DP dan 1–5 termin berikutnya.
- Interval yang diizinkan adalah mingguan, bulanan, atau tanggal khusus untuk event/WSL.
- Minimum DP bawaan adalah 20% dari harga produk; admin dapat menetapkan minimum lebih tinggi.
- Versi awal tidak menggunakan bunga dan denda otomatis.
- Biaya payment gateway ditampilkan terpisah dan tidak mengurangi pokok kewajiban.
- Pembeli dapat melunasi lebih awal tanpa penalti.
- Harga, DP, jumlah termin, interval, tanggal, dan ketentuan disimpan sebagai snapshot order.
- Promotor tidak boleh membuat atau mengubah skema cicilan tanpa izin admin.

### Usulan Keputusan 3 — Keterlambatan, pembatalan, refund, dan akses

Rekomendasi awal:

1. Sistem mengirim pengingat H-3, pada hari jatuh tempo, H+1, dan H+7.
2. Termin berstatus `overdue` mulai H+1, tetapi tidak dikenai denda otomatis.
3. Pada H+7, akses digital yang diberikan karena DP berubah menjadi `suspended`; data dan progress tidak dihapus.
4. Admin dapat memberikan masa tenggang atau mengaktifkan kembali akses dengan alasan yang masuk audit log.
5. Pembatalan sebelum layanan dijadwalkan/dimulai dapat diajukan untuk refund sesuai komponen biaya yang memang dapat dikembalikan.
6. Setelah tes, kelas, event, voucher, alat, atau ID telah dipenuhi/diproses, refund tidak dilakukan otomatis dan wajib ditinjau admin berdasarkan bukti pemenuhan serta kebijakan produk.
7. Voucher yang sudah berhasil ditambahkan tidak boleh dibatalkan otomatis karena berisiko membuat saldo tidak konsisten.
8. Refund gateway dan status order dicatat terpisah. Status `refunded` hanya diberikan setelah pengembalian dana benar-benar terkonfirmasi.
9. Pembatalan tidak menghapus order, invoice, kontrak, termin, progress, atau audit trail.
10. Semua produk menyimpan snapshot kebijakan pembatalan/refund pada saat checkout.

Catatan: teks ketentuan konsumen dan kebijakan refund final perlu ditinjau secara hukum sebelum dipublikasikan. Dokumen ini menetapkan perilaku sistem, bukan pendapat hukum.

---

## 28. Keputusan 3 — Keterlambatan, Pembatalan, Refund, dan Akses

**Status:** Dikunci pada 14 September 2026.

- Pengingat cicilan dikirim pada H-3, hari jatuh tempo, H+1, dan H+7.
- Termin berubah menjadi `overdue` mulai H+1 tanpa denda otomatis.
- Pada H+7, akses digital yang berasal dari skema DP/cicilan berubah menjadi `suspended`; data dan progress tidak dihapus.
- Admin dapat memberi masa tenggang atau mengaktifkan kembali akses dengan alasan yang tercatat dalam audit log.
- Pembatalan sebelum layanan dimulai dapat diajukan untuk refund sesuai komponen biaya yang dapat dikembalikan pada kebijakan produk.
- Setelah tes, kelas, event, voucher, alat, atau ID telah dipenuhi/diproses, refund tidak dilakukan otomatis dan harus ditinjau admin berdasarkan bukti pemenuhan.
- Voucher yang sudah berhasil ditambahkan tidak dibatalkan otomatis.
- Refund gateway dan status order dicatat terpisah; status `refunded` hanya diberikan setelah dana benar-benar terkonfirmasi kembali.
- Pembatalan tidak menghapus order, invoice, kontrak, termin, progress, atau audit trail.
- Kebijakan pembatalan/refund disimpan sebagai snapshot saat checkout.
- Naskah publik kebijakan konsumen tetap memerlukan pemeriksaan hukum sebelum digunakan.

### Usulan Keputusan 4 — Kepemilikan lead dan reassignment

Rekomendasi awal:

1. Data lead secara hukum dan operasional dikelola oleh Konsep STIFIn; promotor memperoleh hak penanganan terbatas, bukan kepemilikan bebas atas seluruh database.
2. Sistem menyimpan tiga peran terpisah: `source_promoter` (asal atribusi), `assigned_promoter` (penanggung jawab saat ini), dan `fulfilling_promoter` (pelaksana layanan).
3. Lead yang datang dari profil, artikel, kelas, atau referral promotor diprioritaskan kepada promotor sumber.
4. Lead umum dari halaman nasional ditugaskan berdasarkan wilayah layanan, kapasitas, ketersediaan, dan status aktif; performa hanya menjadi kriteria tambahan yang transparan.
5. Promotor diberi waktu maksimal 4 jam operasional untuk menerima/menolak assignment dan maksimal 24 jam operasional sejak assignment untuk mencatat kontak pertama.
6. Jika tidak diterima dalam 4 jam, sistem dapat menawarkan kepada promotor berikutnya. Jika tidak ada kontak pertama dalam 24 jam, admin menerima peringatan dan dapat melakukan reassignment.
7. Reassignment tidak menghapus atribusi sumber. Sumber lead, penangan, dan pelaksana tetap tersimpan untuk perhitungan laporan/komisi yang kelak disepakati.
8. Admin dapat memindahkan lead karena permintaan klien, wilayah, kapasitas, konflik, ketidakaktifan, atau alasan operasional lain; alasan wajib dicatat.
9. Promotor hanya dapat melihat kontak lead yang ditugaskan kepadanya dan telah memberikan consent berbagi.
10. Promotor tidak boleh mengunduh database lead secara massal. Ekspor data miliknya membutuhkan izin khusus dan tercatat.
11. Lead tidak digabung otomatis hanya berdasarkan telepon/email karena satu kontak dapat dipakai keluarga. Sistem menampilkan dugaan duplikat untuk ditinjau admin.
12. Penolakan, kedaluwarsa assignment, dan reassignment masuk timeline lead serta audit log.

---

## 29. Keputusan 4 — Kepemilikan Lead dan Reassignment

**Status:** Dikunci pada 14 September 2026.

- Data lead dikelola oleh Konsep STIFIn; promotor memperoleh hak penanganan terbatas sesuai assignment dan consent.
- Sistem membedakan `source_promoter`, `assigned_promoter`, dan `fulfilling_promoter`.
- Lead dari profil, artikel, kelas, atau referral promotor diprioritaskan kepada promotor sumber.
- Lead umum nasional dibagikan berdasarkan wilayah, kapasitas, ketersediaan, dan status aktif; performa menjadi kriteria tambahan yang transparan.
- Promotor memiliki maksimal 4 jam operasional untuk menerima atau menolak assignment dan maksimal 24 jam operasional untuk mencatat kontak pertama.
- Lead yang tidak diterima dalam batas waktu dapat ditawarkan kepada promotor berikutnya. Keterlambatan kontak pertama menimbulkan peringatan dan dapat menyebabkan reassignment oleh admin.
- Reassignment tidak menghapus atribusi sumber.
- Admin dapat melakukan reassignment karena permintaan klien, wilayah, kapasitas, konflik, ketidakaktifan, atau alasan operasional lain; alasan wajib dicatat.
- Promotor hanya melihat kontak lead yang ditugaskan kepadanya dan telah memberikan consent berbagi.
- Ekspor massal lead oleh promotor dilarang secara bawaan dan hanya dapat dibuka dengan izin khusus yang tercatat.
- Dugaan duplikat ditandai untuk review admin, tidak digabung otomatis hanya berdasarkan telepon atau email.
- Seluruh acceptance, rejection, expiry, dan reassignment tersimpan dalam timeline dan audit log.

## 30. Keputusan 5 — Atribusi dan komisi

Status: struktur disetujui pengguna pada 14 September 2026. Nominal/persentase per produk belum ditetapkan dan tidak boleh dikarang oleh AI.

1. Komisi ditetapkan per produk sebagai nominal atau persentase; tidak ada satu persentase global yang dipaksakan ke semua produk.
2. Harga produk menyimpan `commission_pool` maksimum sehingga total komisi tidak dapat melebihi anggaran komisi produk.
3. Komisi dapat mempunyai komponen `source_commission` untuk promotor/affiliate sumber dan `fulfillment_fee` untuk promotor pelaksana.
4. `assigned_promoter` tidak otomatis menerima komisi hanya karena menangani lead; komisi penanganan hanya ada jika produk mengaturnya secara eksplisit.
5. Jika sumber dan pelaksana adalah orang yang sama, kedua komponen dapat diterima oleh orang tersebut tanpa membuat transaksi komisi duplikat.
6. Atribusi sumber menggunakan link/kode/referral yang tervalidasi. Jika calon klien kemudian dipindahkan ke promotor lain, atribusi sumber tetap tersimpan.
7. Atribusi terakhir tidak boleh menimpa sumber awal secara diam-diam. Perubahan manual hanya oleh admin dengan alasan dan audit log.
8. Komisi dibuat berstatus `pending` setelah pembayaran memenuhi syarat produk, lalu menjadi `approved` setelah layanan selesai dan masa refund berakhir, sesuai aturan produk yang disepakati.
9. Refund atau chargeback sebelum payout membatalkan/mengurangi komisi. Jika payout sudah terjadi, sistem mencatat saldo koreksi; histori lama tidak dihapus.
10. Payout dilakukan dari saldo komisi yang `approved`, bukan langsung dari setiap webhook pembayaran.
11. Setiap komisi terhubung ke order, produk, penerima, peran komisi, dasar perhitungan, nilai, status, dan versi aturan.
12. Persentase/nominal aktual tiap produk ditentukan admin dan disimpan sebagai snapshot order agar perubahan harga tidak mengubah komisi historis.

Rekomendasi ini sengaja belum menetapkan angka komisi karena besaran untuk tes, kelas, WSL, voucher, alat, dan produk digital dapat berbeda.

### Keputusan 6 — Izin promotor membuat kelas

Status: DISETUJUI pengguna. Ini melengkapi workflow LMS pada Bagian 6 dan 13, bukan memulai implementasi LMS.

- Admin memberikan izin pembuat kelas secara individual; status promotor saja tidak otomatis memberikan izin tersebut.
- Promotor berizin dapat membuat dan mengedit draft kelas sendiri, menyusun modul, materi, kuis/tugas, serta mengajukan harga.
- Publikasi kelas, harga jual, cicilan, dan pembagian pendapatan memerlukan persetujuan admin. Pembagian pendapatan pengajar tidak otomatis sama dengan komisi referral.
- Promotor hanya mengakses peserta dan progres kelas yang menjadi tanggung jawabnya; akses ini tidak membuka database CRM nasional.
- Perubahan material pada kelas terbit diajukan sebagai revisi. Versi yang telah disetujui tetap melayani peserta sampai revisi diterbitkan.
- Pengarsipan menghentikan penjualan baru, bukan menghapus materi, progres, atau hak peserta lama secara otomatis.
- Pemeriksaan admin mencakup kelengkapan materi, hak penggunaan konten, harga, syarat akses, dan kriteria kelulusan/sertifikat.

### Entri 007 — 14 September 2026 — kelanjutan log Bagian 17

- Persetujuan: struktur atribusi dan komisi (Keputusan 5).
- Perubahan: status pada Bagian 25, pengesahan Bagian 30, dan usulan izin kelas.
- Tarif komisi, dasar persentase rinci, serta jadwal payout tetap perlu ditetapkan sebelum modul komisi diaktifkan.
- Kode, database, produksi, dan transaksi: tidak diubah; tidak ada pengujian runtime.
- Fase 0 tetap aktif; backup/restore dan data produksi belum diverifikasi.
- Langkah berikutnya: persetujuan izin kelas pada Keputusan 6; tidak perlu mengaudit ulang arsip yang sama.

## 31. Paket Keputusan Tersisa — Asumsi Kerja untuk Mempercepat

Pemilik menyetujui Keputusan 6 dan meminta seluruh pembahasan tersisa digabung. Nilai baru di bawah merupakan asumsi rancangan yang dapat diubah; bukan klaim bahwa pemilik telah menyetujui seluruh detail.

| Keputusan | Default rancangan | Batas tindakan |
|---|---|---|
| 7 — Artikel | Promotor berizin menulis draft sendiri; editor/admin menerbitkan. Revisi konten terbit melalui review, dengan versi lama tetap tampil. Pertahankan URL `/edukasi/[slug]`. | Tidak membuka publikasi otomatis atau menghapus artikel lama. |
| 8 — Histori | Prioritaskan akun terpetakan, lead aktif, produk aktif, order/cicilan belum selesai, komisi belum dibayar, hak kelas, progres, dan transaksi voucher belum tuntas. Histori lainnya tetap pada arsip lama yang dapat diakses admin. | Tidak menghapus data lama atau mengimpor data pribadi tanpa scope dan pemetaan terverifikasi. |
| 9 — Pilot | Awali transaksi sintetis sandbox. Kandidat pilot nyata: satu layanan Tes STIFIn bayar penuh, tanpa otomatisasi voucher, cicilan, atau payout. ID produk nyata dipilih setelah inventaris. | Tidak mengalihkan checkout sebelum pengujian dan persetujuan cutover. |
| 10 — Paralel | Usulan minimum 14 hari observasi per modul, diperpanjang sampai rekonsiliasi dan kasus kritis lulus. Order/cicilan lama tetap pada sistem lama sampai selesai atau dimigrasikan secara khusus. | Durasi bukan bukti kelulusan; tidak boleh ada dua mesin pemenuhan aktif untuk order yang sama. |

Detail tertunda yang TIDAK menghalangi desain akun dan CRM: tarif komisi, basis persentase, tanggal payout, batas refund tiap produk, produk pilot final, jadwal jam operasional SLA, dan persetujuan kebijakan konsumen. Fitur terkait belum boleh diaktifkan pada produksi sebelum detailnya tersedia.

## 32. Jalur Kerja Gabungan Fase 1 → Fase 2

Koreksi atas hambatan proses sebelumnya: tidak semua keputusan pembayaran harus selesai sebelum fondasi akun dan CRM dapat dirancang atau diuji lokal. Fase 0 tetap belum selesai pada aspek backup/restore dan verifikasi produksi; pekerjaan lokal fondasi dapat maju memakai data sintetis.

### Batas paket pertama

Bangun di repository Next.js yang sudah ada; jangan membuat website baru. Pertahankan artikel, pustaka, SEO, katalog, direktori nasional, dan tautan SEJOLI. Pembayaran, voucher, LMS, dan komisi tetap sistem lama dalam paket pertama.

| Urutan | Hasil yang dituju | Uji penerimaan wajib |
|---|---|---|
| 1A — Akun | Akun individual, peran admin/promotor, undangan/aktivasi, sesi yang dapat dicabut; promotor tidak boleh mendaftar menjadi admin. | Akun nonaktif/sesi dicabut ditolak; perubahan peran tidak bergantung pada menu frontend. |
| 1B — Otorisasi | Pemeriksaan izin dan ownership pada setiap endpoint terlindungi. Promotor nasional tidak otomatis menjadi akun jaringan. | Promotor A tidak dapat membaca/mengubah lead B melalui daftar, detail, URL langsung, atau ekspor. |
| 1C — Migrasi aman | Migrasi tambahan bernomor dan mapping ID lama; akun login dipisahkan dari orang/contact CRM. | Migrasi pada salinan uji mempertahankan data lama; proses dapat diulang tanpa duplikasi. |
| 2A — CRM dasar | Empat kelompok yang sudah ada tetap tersedia; tambah/edit, pencarian, filter, dan pagination server-side. | Reload mempertahankan data; total berasal dari database, bukan hanya 500 baris termuat. |
| 2B — Assignment | Sumber, penanggung jawab, pelaksana terpisah; terima/tolak, pindah oleh admin, dan catatan kontak pertama. | Dua penerimaan bersamaan tidak menghasilkan dua penanggung jawab; pemindahan mencabut akses lama dan menjaga sumber. |
| 2C — Timeline | Aktivitas, catatan, consent, riwayat assignment/status, dan pengingat internal. | Setiap perubahan tercatat dengan pelaku/waktu; kegagalan pencatatan tidak meninggalkan perubahan parsial. |
| 2D — Regresi | Form layanan tes dan calon promotor tetap bekerja; checkout lama dipertahankan. | Lead duplikat idempoten; calon promotor tidak diarahkan ke checkout tes; endpoint publik tidak bocor kontak. |

### Model data konseptual, bukan skema yang sudah terimplementasi

- Identity: akun, role/permission, sesi, undangan/reset token, audit.
- CRM: orang/contact, proses lead, riwayat assignment, aktivitas, bukti consent, relasi ID lama.
- Satu orang dapat punya beberapa proses; satu nomor telepon bisa dipakai beberapa orang. Tidak ada auto-merge berdasarkan kontak saja.
- Akun adalah identitas login; klien tanpa akun tetap boleh menjadi kontak CRM.
- Kode promotor resmi dipetakan setelah verifikasi admin, bukan diambil begitu saja dari input pengguna.
- Status pembayaran ringkas CRM hanya referensi hasil pengecekan SEJOLI, bukan sumber otoritatif pembayaran atau pemicu voucher.

### Gerbang rilis

Sebelum promotor nyata memakai Fase 2: fondasi 1A–1C dan tes isolasi lulus, staging terpisah tersedia, backup/restore tervalidasi, akun awal terverifikasi, dan pemilik menyetujui rilis. Build sukses saja tidak cukup. Jangan menghubungkan test suite ke database produksi.

## 33. Status Terbaru dan Instruksi AI Penerus

Status aktual: Keputusan 1–6 disetujui; 7–10 didokumentasikan sebagai asumsi kerja. Paket Fase 1→2 telah dipetakan, belum diimplementasikan. Tabel status Fase 16 tidak menyatakan aplikasi sudah selesai. Tidak ada backup produksi, migrasi, deployment, atau pengujian runtime yang dilakukan dalam pembaruan ini.

### Entri 008 — kelanjutan log Bagian 17

- Instruksi pemilik: jangan satu-satu; gabungkan agar cepat menuju Fase 2; setuju izin kelas.
- Perubahan: instruksi kerja terbaru, status Keputusan 6, paket asumsi 7–10, urutan fondasi/CRM dan uji penerimaan.
- Dokumen saja; kode dan produksi tidak berubah.
- Langkah konkret berikut: baca `AGENTS.md`/instruksi repository dan audit terarah `src/lib/admin-auth.ts`, route login/logout, layout admin, `src/lib/interest-store.ts`, API leads dan UI CRM; susun desain teknis paket 1A–2D berdasarkan source aktual, bukan audit seluruh plugin dari nol.

### Prompt kelanjutan yang menggantikan prompt lama

> Baca dokumen handoff, terutama Bagian 31–33. Jangan tanyakan ulang Keputusan 1–6 atau mengunci 7–10 satu per satu. Fokus pada paket akun/RBAC dan CRM Fase 1→2 di source Next.js yang tersedia. Audit hanya file yang relevan dan laporkan rancangan teknis gabungan beserta tes. Gunakan data sintetis; jangan mengubah SEJOLI/produksi. Detail pembayaran/komisi yang tertunda bukan penghalang pekerjaan lokal CRM. Implementasi dan hasil pengujian harus dicatat terpisah dari rancangan; jangan mengaku fase selesai hanya karena dokumen selesai.

## 34. Rancangan Teknis Gabungan Akun dan CRM — Hasil Audit Source

Status: rancangan teknis berdasarkan source, bukan hasil implementasi. Persetujuan terakhir pemilik melanjutkan paket gabungan; jangan mengulang pertanyaan bisnis. Nama komponen baru di bawah adalah usulan, bukan file yang sudah ada.

### 34.1 Fakta yang diperiksa langsung

| File pada root arsip Next.js | Temuan | Implikasi |
|---|---|---|
| `src/lib/admin-auth.ts` | Kredensial dari ADMIN_EMAIL/ADMIN_PASSWORD; cookie HMAC berisi email dan kedaluwarsa 8 jam; logout menghapus cookie browser. | Belum ada akun multi-pengguna atau pencabutan sesi individual di server. |
| `src/app/api/admin/login/route.ts` | Pembatasan percobaan menggunakan Map dalam proses; kunci dari x-forwarded-for. | Perlu penyimpanan pembatasan bersama dan konfigurasi proxy tepercaya sebelum rilis multi-instance. |
| `src/app/api/admin/leads/route.ts` | POST khusus admin; pelaku diambil dari ADMIN_EMAIL. | Audit harus mengambil ID pelaku dari sesi terverifikasi, bukan environment/body. |
| `src/app/admin/leads/page.tsx` | Memeriksa autentikasi admin dan memuat getLeads untuk LeadManager. | Portal promotor tidak boleh menerima array data admin lalu menyaringnya di browser. |
| `src/lib/interest-store.ts` | getLeadById/getLeadHistory/getLeads berorientasi admin; getLeads memakai LIMIT; update dan riwayat memakai transaksi. | Tambah query scoped dan pagination, pertahankan transaksi audit. |
| `src/app/admin/layout.tsx` | Layout menampilkan navigasi dan metadata noindex. | Layout bukan pengganti pemeriksaan permission setiap endpoint. |
| Pemakai `isAdminAuthenticated` di API | Artikel, pustaka, produk, intelligence, promotor, dan leads memakai pemeriksaan yang sama. | Jangan mengubah arti fungsi ini menjadi sekadar “pengguna telah login”; promotor bisa mendapat akses admin jika demikian. |

Folder ekstraksi tidak memiliki metadata .git. Tidak ada branch/commit aktif yang dapat diverifikasi dari arsip ini. Jangan mengklaim source ekstraksi identik dengan deployment produksi. AGENTS.md meminta panduan Next.js lokal dibaca sebelum coding; CLAUDE.md merujuk AGENTS.md.

### 34.2 Desain akses yang dituju

- Pertahankan `/admin` untuk admin dan sediakan `/dashboard` sebagai pintu masuk pengguna individual; promotor masuk `/dashboard/leads`.
- `isAdminAuthenticated()` tetap berarti akun admin aktif. Tambah resolver principal terpisah untuk pengguna lain; jangan memakai boolean admin untuk seluruh peran.
- Principal dibentuk server dari akun aktif dan sesi valid: ID akun, peran, permission, serta kode promotor yang telah dipetakan admin.
- Query daftar, total, detail, riwayat, dan perubahan promotor menggunakan scope penugasan yang sama. Tidak ada SELECT seluruh data lalu filter di frontend.
- Promotor yang kehilangan penugasan kehilangan akses detail kontak pada request berikutnya. Atribusi sumber bukan izin untuk melihat PII.
- Tolak perubahan finansial, kode sumber, pemindahan assignment, role, atau consent oleh promotor melalui allowlist field server.
- Admin lama tidak boleh otomatis berubah menjadi promotor; role baru tidak diberikan melalui registrasi publik.

### 34.3 Model tambahan dan strategi kompatibilitas

| Entitas baru usulan | Data minimum | Pengaman |
|---|---|---|
| `platform_users` | ID, email login ternormalisasi, hash password, status, created/updated | Email login unik; jangan terapkan keunikan email ini pada kontak CRM keluarga. |
| `platform_user_roles` | user_id, role | Kombinasi unik; pengguna tidak dapat menaikkan hak sendiri. |
| `platform_promoter_accounts` | user_id, kode promotor terverifikasi | Pemetaan diaudit; bukan salinan semua promotor nasional menjadi akun. |
| `platform_sessions` | token_hash, user_id, expires_at, revoked_at | Token mentah hanya di cookie; pencabutan diperiksa di server. |
| `platform_account_tokens` | token_hash, user_id, purpose, expiry, used_at | Undangan/reset sekali pakai; jangan kirim hash password/secret ke browser. |
| `platform_audit_events` | actor_id, jenis, target, waktu, perubahan terpilih | Jangan simpan token atau payload PII lengkap dalam log. |
| `crm_people` + mapping | identitas kontak, id legacy proses | Tidak auto-merge; migrasi awal mempertahankan orang terpisah bila identitas belum pasti. |
| `crm_lead_assignments` | lead_id, account/code, status, accepted_at, ended_at | Satu penugasan aktif; penerimaan bersamaan diselesaikan atomik. |

Pertahankan `public_interest_leads` dan `lead_status_history` pada rilis pertama. Tambahkan relasi nullable ke orang/akun dan field sumber/pelaksana secara aditif. Jangan mengganti seluruh tabel proses sekaligus. Tulis migrasi bernomor terpisah, bukan menambah perubahan destruktif pada initializer request. Uji idempotensi, hitungan baris dan FK pada database sintetis/salinan staging.

Bootstrap akun admin adalah langkah deployment terkontrol, bukan membuat ulang akun dari environment pada setiap login. Setelah migrasi akun disetujui, cookie lama diinvalidasi; jangan menyisakan bypass admin berbasis password environment tanpa batas. Jangan menonaktifkan akses admin produksi selama paket masih diuji.

### 34.4 Pembagian berkas kerja

| Bagian | File baru usulan | File lama yang perlu diubah |
|---|---|---|
| Model akun, otorisasi | `src/lib/identity/types.ts`, `src/lib/identity/permissions.ts`, `src/lib/identity/account-store.ts` | `src/lib/admin-auth.ts` sebagai adapter admin saja |
| Sesi dan aktivasi | `src/lib/identity/session-store.ts`, `src/lib/identity/account-token-store.ts` | API login/logout; tambah route aktivasi/reset sesuai desain final |
| Query CRM terbatasi | `src/lib/crm/scoped-lead-store.ts`, `src/lib/crm/assignment-service.ts` | `src/lib/interest-store.ts` dan API leads/[id] |
| Antarmuka | `src/app/dashboard/page.tsx`, `src/app/dashboard/leads/page.tsx` | `src/app/admin/leads/lead-manager.tsx`, page CRM, navigasi admin |
| Migrasi | `scripts/migrations/001-identity.sql`, `scripts/migrations/002-crm-access.sql` | Tambah runner terkontrol sesuai runtime yang diverifikasi |
| Tes | Pasangan `.test.ts` dan `.integration.test.ts` setiap service | Tes route leads dan regresi login/form publik yang sudah ada |

### 34.5 Kontrak perilaku endpoint

- Daftar CRM: parameter group, q, page, pageSize. Default pageSize 25, maksimum 100; group tetap empat kelompok yang sudah ada. Balasan memuat items, total, page, pageSize. Urutan stabil created_at DESC, id DESC.
- GET detail dan histori: validasi ID, cek sesi dan scope sebelum membaca data; target di luar scope memberikan respons tidak ditemukan tanpa membocorkan identitas.
- PATCH promotor: hanya status operasional yang diizinkan dan aktivitas kontak/catatan khusus promotor. Keuangan/internal_notes admin tidak dikirim ke promotor; gunakan DTO terpisah.
- Assignment admin: input penanggung jawab baru dan alasan; baca/lock lead, tutup assignment lama, buat yang baru dan audit dalam transaksi yang sama.
- Accept assignment: hanya penerima yang dituju; tolak versi assignment kadaluwarsa/tergantikan. Pengulangan yang identik tidak membuat timeline ganda.
- Permintaan mutasi cookie-auth wajib memakai proteksi CSRF/origin; private response no-store. Akun nonaktif dan sesi revoked ditolak.
- SLA otomatis belum diaktifkan sampai kalender jam operasional tersedia; tampilkan status penanganan dan aksi admin terlebih dahulu, bukan menghitung jam operasional sebagai 24 jam kalender.

### 34.6 Skenario penerimaan gabungan

1. Admin A membuat akun promotor P dan Q; P tidak dapat memberi dirinya role admin.
2. Login P gagal sebelum aktivasi; token aktivasi kedaluwarsa/terpakai ditolak.
3. Logout mencabut sesi server; token sesi yang sama tidak bisa dipakai kembali.
4. Menonaktifkan P langsung menolak sesi yang sebelumnya valid.
5. Lead milik Q tidak muncul dalam daftar/total/detail/histori P, termasuk bila P mengganti ID URL.
6. Lead tanpa consent berbagi tidak membuka kontak untuk promotor; admin tetap dapat menangani sesuai izin internal.
7. P tidak dapat memodifikasi payment_status, sale_amount, payout, source, consent atau assignment melalui payload buatan.
8. Dua accept bersamaan hanya menghasilkan satu assignment aktif dan satu aktivitas penerimaan.
9. Pindah lead P ke Q mempertahankan sumber; P tidak lagi membaca kontak setelah commit.
10. Fixture lebih dari 500 lead membuktikan pencarian, total dan pagination bekerja dari database, bukan batas dataset browser.
11. Input berulang dengan idempotency key sama tidak menambah lead; kegagalan audit membatalkan perubahan terkait.
12. Form calon promotor tetap tidak masuk checkout tes; form tes tetap memakai URL SEJOLI tervalidasi.
13. Promotor tidak dapat membuka API artikel/pustaka/produk/intelligence admin; laman SEO publik tetap berfungsi.

Perintah verifikasi yang disediakan repository: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. Tes integrasi memerlukan TEST_DATABASE_URL khusus uji. Hasil saat dokumen ini dibuat: belum dijalankan; tidak ada klaim lulus.

### Entri 009 — kelanjutan log Bagian 17

- Pemilik menyetujui paket gabungan menuju Fase 2.
- Audit aktual: autentikasi, route login, route leads, halaman CRM, layout admin, query store dan pemakai guard admin.
- Temuan dan rancangan ditambahkan ke Bagian 34; tidak mengubah kode aplikasi.
- Titik berikutnya: implementasi fondasi identitas/guard dan tesnya, dilanjutkan query CRM scoped serta UI. Gunakan satu paket kerja berurutan tanpa meminta persetujuan setiap keputusan bisnis.
- Batas: belum ada skema baru, akun, backup, pengujian runtime, ataupun deployment. Rancangan ini bukan implementation plan rinci dengan kode tes lengkap; plan eksekusi harus diturunkan dari kontrak di atas sebelum perubahan aplikasi.
