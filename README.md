# KonsepSTIFIn 0.10.17

Rilis peningkatan UI/UX untuk perjalanan pengunjung, pelanggan, calon promotor, dan promotor aktif. Basisnya adalah source 0.10.16 yang telah berhasil dideploy pada produksi.

## Perubahan utama

- Menambahkan jalur masuk yang membedakan pelanggan/anggota dan promotor aktif di beranda.
- Menampilkan tautan Masuk dan Daftar secara jelas untuk pengunjung yang belum login.
- Merapikan footer menjadi kelompok Jelajahi, Berkembang Bersama, serta Akun & Bantuan.
- Memperjelas CTA calon promotor, termasuk jalur masuk bagi promotor yang sudah aktif.
- Memperhalus halaman detail produk, informasi harga, proses, FAQ, dan panel pengajuan.
- Menjaga desain responsif, fokus keyboard, dan dukungan reduced motion.
- Tidak mengubah alur checkout, Moota, StarSender, Mailketing, struktur database, atau kredensial.

## Upgrade ke 0.10.17

1. Backup repository dan database produksi.
2. Masukkan seluruh isi arsip rilis ke repository `muhamadsofyanar/konsepstifin-platform`, branch `main`.
3. Commit semua perubahan dalam satu commit.
4. Deploy satu kali melalui Coolify.
5. Pastikan healthcheck berstatus `healthy` dan `/api/health` menampilkan `0.10.17`.
6. Uji beranda, daftar akun, login, detail produk, jalur calon promotor, portal anggota, checkout, dan pengaturan admin di desktop serta HP.

## Database dan environment

- Tidak ada migrasi database baru.
- Tidak ada environment variable baru.
- Kredensial integrasi tidak perlu dimasukkan ulang.
- Promo pusat tetap mengambil data dari pengaturan admin.

## Status pengujian

- Pemeriksaan sintaks TypeScript/JSX untuk file yang diubah: lulus.
- Pemeriksaan keseimbangan kurung CSS: lulus.
- Versi `package.json` dan `package-lock.json`: konsisten pada `0.10.17`.
- Build produksi Next.js: belum terverifikasi lokal. Instalasi dependency (`npm ci`) mengalami timeout di lingkungan kerja ini. Wajib menunggu hasil build dan healthcheck Coolify sebelum menyatakan rilis produksi lolos.
