# KonsepSTIFIn 0.10.18

Rilis peningkatan pengalaman pengunjung dengan fokus pada kebutuhan pengguna, informasi awal yang relevan, alur pemilihan layanan, konsistensi visual, dan animasi yang menghormati preferensi aksesibilitas.

## Perubahan utama

- Menambahkan pemilih jalur pengunjung interaktif: tes personal, keluarga, kelompok, mencari promotor, menjadi promotor, atau membaca edukasi.
- Memindahkan pilihan layanan ke area awal halaman, sebelum akses akun yang sudah terdaftar, sehingga calon klien tidak terdistraksi oleh login terlalu dini.
- Menyusun ulang halaman beranda: kebutuhan pengunjung, layanan, konteks masalah, proses, dokumentasi nyata, informasi persiapan, batasan layanan, edukasi, FAQ, akun, dan CTA akhir.
- Menambahkan panduan informasi minimum yang perlu disiapkan, tanpa meminta alamat lengkap atau data sensitif di tahap awal.
- Mengirim event Meta Pixel `VisitorPathSelected` dan `VisitorPathCTA` saat Pixel tersedia, tanpa data pribadi, agar minat pengunjung dapat dianalisis.
- Menambahkan transisi, animasi masuk ringan, efek hover, dan feedback pilihan pada kartu. Animasi dinonaktifkan saat `prefers-reduced-motion` aktif.
- Memperluas konsistensi animasi ke landing page tes, promotor, affiliate, dan galeri dokumentasi.
- Tidak mengubah harga, promo, checkout, integrasi Moota, StarSender, Mailketing, autentikasi, atau struktur database.

## Upgrade ke 0.10.18

1. Backup repository dan database produksi.
2. Masukkan seluruh isi arsip rilis ke repository `muhamadsofyanar/konsepstifin-platform`, branch `main`.
3. Pastikan `package.json` dan `package-lock.json` menunjukkan `0.10.18`.
4. Commit semua perubahan dalam satu commit.
5. Deploy sekali melalui Coolify.
6. Pastikan build berhasil, healthcheck `healthy`, dan `/api/health` menunjukkan `0.10.18`.
7. Uji jalur personal, keluarga, kelompok, promotor, pencarian promotor, edukasi, login, dan halaman layanan di desktop serta HP.

## Database dan environment

- Tidak ada migrasi database baru.
- Tidak ada environment variable baru.
- Tidak ada perubahan pada sumber harga/promo atau kredensial integrasi.

## Status pengujian

- Pemeriksaan sintaks source dan struktur JSX: dijalankan setelah perubahan.
- Validasi JSON package dan lockfile: wajib lulus.
- Test interaksi pemilih jalur pengunjung: ditambahkan.
- Build produksi Next.js dan test suite penuh: harus diverifikasi melalui build Coolify jika dependensi lokal tidak tersedia.
