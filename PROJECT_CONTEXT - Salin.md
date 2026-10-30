# Konteks Utama Proyek Konsep STIFIn

Dokumen ini adalah pegangan untuk melanjutkan proyek dengan ChatGPT atau AI lain. Jangan menaruh password, API key, token, atau data pribadi pelanggan di dokumen maupun repository.

## Pemilik dan arah usaha

- Pemilik/pengelola: Muhamad Sofyan AR.
- Peran formal: Branch Manager STIFIn Cabang Khusus Kabupaten Pekalongan.
- Domisili pengelola: Jatinangor, Sumedang.
- Merek publik: **Konsep STIFIn**.
- Domain utama: `konsepstifin.com`.
- Domain staging: `tes.konsepstifin.com`.
- Identitas Pekalongan dipakai untuk kebutuhan internal atau acara formal. Pemasaran publik memakai merek Konsep STIFIn agar dapat melayani jaringan nasional.
- Sasaran utama: menjadi cabang nomor satu berdasarkan pertumbuhan promotor aktif dan volume tes.

## Fakta operasional

- Tes STIFIn harus dilakukan secara offline karena membutuhkan pengambilan sidik jari.
- Harga tes minimal saat ini Rp550.000; sebagian layanan menjual hingga Rp650.000.
- Promotor dapat berasal dari seluruh Indonesia dan bebas menginduk ke cabang mana pun.
- Promotor dalam jaringan saat ini tersebar, antara lain Jakarta, Subang, Bandung, dan wilayah lain.
- Cabang/promotor lain dapat menjadi mitra sekaligus kompetitor.
- Branch Manager dapat mengadakan WSL 1 dan WSL 2 serta menjual alat tes dan ID kepada calon promotor sesuai aturan resmi yang berlaku.
- Snapshot awal: 11 promotor dan 38 voucher. Angka ini harus diganti dengan data aktual setelah sistem database tersedia.

## Fungsi platform

Platform ini dirancang sebagai satu pusat untuk:

1. Landing page dan edukasi publik.
2. Pemesanan jadwal tes offline.
3. CRM calon pelanggan dan peserta tes.
4. Rekrutmen, onboarding, dan pemantauan promotor nasional.
5. Pencatatan voucher, tes, alat tes, dan ID.
6. Pengelolaan acara WSL 1 dan WSL 2.
7. Dashboard pertumbuhan, konversi, serta performa wilayah/promotor.
8. Integrasi WhatsApp melalui StarSender, email melalui Mailketing, dan otomasi melalui n8n.
9. Basis pengetahuan/SOP yang kelak dapat diselaraskan dengan Obsidian.

## Pengguna dan hak akses yang direncanakan

- **Publik:** melihat informasi, mendaftar tes, dan mengajukan diri sebagai calon promotor.
- **Admin/Branch Manager:** seluruh data, laporan, pengaturan, voucher, WSL, dan promotor.
- **Tim operasional:** prospek, jadwal, transaksi, dan tindak lanjut.
- **Promotor:** data prospek/peserta miliknya, jadwal, voucher, target, dan materi pendukung.

Hak akses tersebut belum boleh dianggap aman sampai autentikasi server dan database benar-benar dipasang.

## Stack dan infrastruktur

- Aplikasi: Next.js + TypeScript.
- Repository: `https://github.com/muhamadsofyanar/konsepstifin-platform` (private).
- Branch deployment: `main`.
- Deployment: Coolify dengan Dockerfile.
- Port aplikasi: `3000`.
- Server: Ubuntu VPS, sekitar 4 core, RAM 8 GB, penyimpanan 100 GB.
- DNS/proxy: Cloudflare.
- Otomasi: n8n.
- WhatsApp: StarSender.
- Email: Mailketing.
- Catatan/knowledge base: Obsidian.

## Status aplikasi saat dokumen dibuat

- Deployment Docker di Coolify sudah pernah berhasil.
- Domain staging sudah diarahkan dan dapat dipakai untuk pengujian.
- Versi aplikasi saat ini adalah MVP antarmuka: landing page, formulir booking, dashboard, CRM, promotor, voucher, WSL, laporan, dan pengaturan.
- Data demo/booking browser dapat memakai `localStorage`; ini bukan database produksi dan dapat hilang jika data browser dibersihkan.
- Integrasi StarSender, Mailketing, n8n, login aman, pembayaran, dan database belum dianggap selesai sampai diuji end-to-end.

## Prioritas pembangunan berikutnya

### Fase 1 — Fondasi produksi

- PostgreSQL sebagai sumber data utama.
- Autentikasi dan role-based access control.
- Model data pelanggan, booking, promotor, tes, voucher, transaksi, WSL, aktivitas, dan wilayah.
- Audit log dan backup database otomatis.
- Kebijakan privasi dan persetujuan pemrosesan data.

### Fase 2 — Mesin penjualan

- Pipeline prospek: baru, dihubungi, tertarik, terjadwal, hadir, selesai, batal.
- Penugasan prospek ke promotor berdasarkan lokasi, kapasitas, dan performa.
- Pengingat WhatsApp otomatis yang tetap mematuhi persetujuan pelanggan.
- Follow-up email dan WhatsApp pascates.
- Referral keluarga/komunitas dan pelacakan sumber prospek.

### Fase 3 — Pertumbuhan promotor

- Funnel calon promotor dari pendaftaran sampai aktif.
- Kalender WSL 1/2, kehadiran, kelulusan, pembelian alat/ID, dan aktivasi.
- Onboarding 30 hari dan target aktivitas mingguan.
- Dashboard promotor aktif, tes per promotor, retensi, dan wilayah.
- Materi pemasaran yang dapat dipersonalisasi tanpa merusak identitas merek.

### Fase 4 — Manajemen dan optimasi

- Unit economics, pendapatan, biaya akuisisi, dan margin.
- Cohort promotor dan pelanggan.
- Peringatan stok voucher/alat.
- Integrasi pembayaran bila dibutuhkan.
- Eksperimen landing page dan kampanye berdasarkan data.

## KPI utama

- Promotor baru per bulan.
- Persentase calon promotor menjadi aktif.
- Promotor aktif 30/60/90 hari.
- Tes selesai per minggu dan per bulan.
- Tes per promotor aktif.
- Konversi lead ke booking, booking ke hadir, dan hadir ke selesai.
- Waktu respons pertama.
- Pembatalan/no-show.
- Sumber lead dan biaya per lead bila memakai iklan.
- Repeat/referral keluarga.

## Aturan teknis dan keamanan

- Jangan pernah commit `.env`, password, token, API key, kredensial SMTP, atau data sidik jari.
- Data sidik jari tidak boleh disimpan di platform ini kecuali ada dasar hukum, SOP resmi, keamanan, dan persetujuan yang memadai.
- Simpan secret hanya pada Environment Variables di Coolify/n8n.
- Nomor telepon dan data pelanggan tidak boleh tampil di halaman publik.
- Gunakan akun per pengguna; jangan berbagi password admin.
- Aktifkan backup, pembaruan keamanan, rate limiting, validasi input, dan audit log sebelum produksi.
- API key StarSender dan kredensial SMTP yang pernah terlihat dalam tangkapan layar harus dirotasi sebelum integrasi produksi.

## Prosedur deployment ringkas

1. Perubahan kode masuk ke branch `main` di GitHub.
2. Coolify menarik repository private melalui GitHub App/Source yang terotorisasi.
3. Build Pack menggunakan Dockerfile, Base Directory `/`, port `3000`.
4. Klik Deploy dan pastikan build serta rolling update selesai.
5. Uji `tes.konsepstifin.com` di desktop dan ponsel.
6. Periksa formulir, dashboard, log aplikasi, dan HTTPS.

## Instruksi untuk AI penerus

Sebelum mengubah kode:

1. Baca `README.md`, `AGENTS.md`, `CLAUDE.md`, dan dokumen ini.
2. Audit struktur repo serta jalankan build/lint.
3. Pertahankan merek publik Konsep STIFIn; jangan menjadikan Pekalongan sebagai batas wilayah pemasaran.
4. Bedakan fakta resmi, asumsi bisnis, dan fitur yang baru direncanakan.
5. Jangan mengarang klaim ilmiah atau medis tentang STIFIn.
6. Dahulukan alur bisnis yang terukur: lead → booking → hadir → tes selesai → referral; dan calon promotor → WSL → alat/ID → aktif → produktif.
7. Berikan panduan teknis langkah demi langkah karena pemilik bukan developer profesional.

## Definisi selesai untuk rilis produksi

Rilis belum dianggap produksi hanya karena halaman dapat dibuka. Minimal harus ada database, login aman, role, backup, validasi, audit log, kebijakan privasi, integrasi yang diuji, monitoring, serta prosedur pemulihan.
