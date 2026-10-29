# Panduan upgrade KonsepSTIFIn 0.10.17

## Tujuan rilis

Meningkatkan UI/UX agar pengunjung lebih cepat memahami jalur layanan, pengguna terdaftar mudah menemukan akses akun, promotor aktif memiliki jalur masuk yang jelas, dan halaman produk tampil lebih profesional.

## Perubahan

1. **Jalur akun di beranda:** pelanggan/anggota dan promotor aktif dibedakan dengan CTA masing-masing.
2. **Navigasi akun:** pengunjung mendapat tautan Masuk dan Daftar. Akun yang sudah terdeteksi tetap diarahkan ke ruang sesuai perannya.
3. **Footer terstruktur:** tautan dibagi menjadi Jelajahi, Berkembang bersama, dan Akun & bantuan.
4. **Landing promotor:** calon promotor diarahkan ke tahapan dan biaya, sedangkan promotor aktif dapat masuk ke portal.
5. **Detail produk:** breadcrumb, panel pembelian/pengajuan, informasi harga, proses, FAQ, dan CTA bawah diperjelas.
6. **Responsivitas:** layout jalur akun, footer, panel detail produk, dan CTA disesuaikan untuk layar kecil.

## Langkah deploy

1. Simpan backup source dan database.
2. Salin seluruh isi ZIP ke repository GitHub yang digunakan Coolify, branch `main`.
3. Pastikan `package.json` dan `package-lock.json` sama-sama menunjukkan `0.10.17`.
4. Commit sekali dan deploy melalui Coolify.
5. Pastikan build Next.js selesai, healthcheck `healthy`, lalu periksa `https://konsepstifin.com/api/health`.
6. Lakukan smoke test: homepage, CTA tes, daftar, login, halaman produk, halaman calon promotor, portal anggota, checkout, serta admin/pengaturan.

## Risiko dan batasan

- Tidak ada migrasi database dan tidak ada perubahan nama environment.
- Perubahan tampilan tidak membuktikan pembayaran atau notifikasi bekerja; integrasi tersebut tetap perlu diuji secara terpisah.
- Build produksi belum bisa dijalankan di lingkungan penyusunan ini karena `npm ci` timeout. Jangan melewati verifikasi build Coolify.
