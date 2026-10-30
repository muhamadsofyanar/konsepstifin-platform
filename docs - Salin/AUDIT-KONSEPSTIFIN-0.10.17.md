# Audit source KonsepSTIFIn 0.10.17

## File utama yang diperbarui

- `src/app/page.tsx`: jalur akun pelanggan/anggota dan promotor aktif.
- `src/app/public-account-link.tsx`: tautan Masuk/Daftar untuk pengunjung dan akses berbasis peran untuk akun yang terdeteksi.
- `src/app/public-site-shell.tsx`: footer terstruktur dan atribut `aria-current` pada navigasi aktif.
- `src/app/jadi-promotor/page.tsx`: CTA terpisah untuk calon promotor dan promotor aktif.
- `src/app/public-refresh.css`: gaya jalur akun, footer, dan responsive layout.
- `src/app/belajar/learning.css`: pemolesan halaman detail produk.
- `package.json`, `package-lock.json`, `README.md`, dan label versi admin: `0.10.17`.

## Perubahan yang sengaja tidak dilakukan

- Tidak mengubah endpoint checkout, webhook Moota, StarSender, Mailketing, autentikasi server, atau kebijakan akses.
- Tidak menambah migrasi database.
- Tidak mengubah harga maupun skema promo yang bersumber dari admin.

## Verifikasi

- Pemeriksaan transpile sintaks untuk lima file TSX yang berubah: lulus.
- CSS `public-refresh.css`: kurung kurawal seimbang.
- Versi package dan lockfile: konsisten `0.10.17`.
- `npm ci`: timeout saat instalasi dependency.
- Build produksi, lint lengkap, dan test suite: belum terverifikasi. Hasil build Coolify tetap menjadi gerbang sebelum rilis dianggap sehat.
