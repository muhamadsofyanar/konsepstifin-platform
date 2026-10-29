# Panduan upgrade KonsepSTIFIn 0.10.18

## Tujuan

Meningkatkan kualitas pengalaman pengunjung dengan memperjelas kebutuhan, memperpendek waktu menuju layanan yang tepat, mengurangi kebingungan akun, memperbaiki hirarki visual, dan memberi animasi yang halus tanpa mengganggu aksesibilitas.

## Perubahan yang terlihat

1. Pemilih tujuan interaktif di beranda dengan enam jalur: personal, keluarga, kelompok, cari promotor, menjadi promotor, dan edukasi.
2. Pilihan layanan muncul sebelum panel akun sehingga calon klien melihat langkah yang relevan lebih awal.
3. Panel login/akun dipindahkan ke bagian bawah setelah konten layanan, informasi, dan FAQ.
4. Checklist persiapan berisi kota/wilayah, jumlah peserta, dan tujuan. Tidak meminta alamat lengkap atau data sensitif di awal.
5. Animasi ringan pada hero, kartu, pilihan jalur, dan galeri. Semua animasi utama dinonaktifkan untuk pengguna yang mengaktifkan `prefers-reduced-motion`.
6. Perbaikan visual responsif untuk pemilih jalur dan checklist informasi.

## Deployment

1. Backup source dan database.
2. Salin seluruh isi ZIP ke repository `muhamadsofyanar/konsepstifin-platform`, branch `main`.
3. Commit seluruh perubahan sekaligus.
4. Jalankan satu deployment melalui Coolify.
5. Pastikan build dan healthcheck berhasil.
6. Verifikasi `https://konsepstifin.com/api/health` menunjukkan `0.10.18`.
7. Uji interaksi pemilih jalur, tautan setiap rekomendasi, navigasi mobile, halaman produk, dan akses login.

## Database dan integrasi

Tidak ada migrasi database, perubahan environment, atau perubahan pada checkout dan integrasi pembayaran/notifikasi. Harga dan promo tetap dikelola melalui pengaturan yang sudah ada.

## Batasan pengujian

Jangan menganggap build produksi lolos hanya dari validasi source. Pastikan hasil build Next.js dan healthcheck Coolify berhasil. Setelah deploy, lakukan uji visual di desktop dan HP serta pastikan tidak ada horizontal overflow.
