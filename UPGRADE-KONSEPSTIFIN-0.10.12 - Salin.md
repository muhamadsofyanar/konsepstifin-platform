# Upgrade KonsepSTIFIn 0.10.12

## Cara deployment

1. Backup source dan database sebelum mengganti rilis.
2. Masukkan isi ZIP ini ke repository `muhamadsofyanar/konsepstifin-platform` pada branch `main`, pertahankan `.git` dan konfigurasi deployment yang sudah ada, lalu commit.
3. Tunggu Coolify membangun commit baru. Jika build gagal saat mengambil `node:24-alpine`, periksa koneksi DNS Docker Hub dan ulangi deployment. Jangan mengubah Dockerfile hanya untuk mengatasi DNS timeout.
4. Pastikan container baru berstatus `healthy`.
5. Buka `/api/health` dan pastikan respons berisi `"version":"0.10.12"`.
6. Uji login guest/member/promotor/affiliate/admin, homepage, minimal tiga landing page produk, pengajuan Family Test, panel integrasi, dan halaman voucher.

## Migrasi

Rilis 0.10.12 tidak menambahkan file migrasi SQL baru. Jangan menjalankan migrasi baru khusus untuk versi ini. Pastikan migrasi dari rilis sebelumnya yang sudah digunakan di produksi tetap tidak dihapus.

## Pengujian wajib setelah deployment

- Pengunjung yang belum login melihat jalur Masuk dan tetap bisa mengajukan layanan tanpa akun.
- Akun peserta diarahkan ke Akun Peserta; affiliate ke Pusat Mitra; promotor ke Pusat Promotor; kepala cabang ke Pusat Cabang; admin ke Ruang Admin.
- Pada formulir bantuan, memilih Family Test menampilkan skema promo bila promo aktif.
- Mode pengajuan atas nama calon klien hanya muncul bagi promotor, kepala cabang, dan affiliate. Pastikan persetujuan kontak calon klien benar-benar diperoleh.
- Landing page memuat manfaat/fasilitas, proses, informasi penting, FAQ, harga/promo yang berlaku, dan CTA.
- URL webhook StarSender ditampilkan tersamarkan; gunakan tombol salin untuk menyalin URL lengkap ke pengaturan StarSender.
- Jangan menganggap Moota Create Terima Uang siap otomatis hanya karena token dan webhook terkonfigurasi. Uji endpoint pembuatan link secara terpisah sebelum dipakai untuk pesanan nyata.

## Verifikasi lokal

Syntax transpilation TypeScript/TSX untuk seluruh file yang diubah berhasil. Instalasi dependensi lokal berulang kali timeout, sehingga build Next.js, typecheck penuh, lint, dan unit test belum dapat dijalankan di lingkungan kerja ini. Build produksi tetap harus diverifikasi oleh Coolify sebelum rilis dinyatakan selesai.
