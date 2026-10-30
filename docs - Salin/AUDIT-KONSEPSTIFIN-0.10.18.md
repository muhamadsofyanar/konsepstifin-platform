# Audit source KonsepSTIFIn 0.10.18

## File yang berubah

- `src/app/visitor-path-finder.tsx`: komponen client baru untuk enam jalur pengunjung, dengan event Meta Pixel opsional tanpa data pribadi.
- `src/app/visitor-path-finder.test.tsx`: uji pilihan default, pilihan keluarga, dan jalur calon promotor.
- `src/app/page.tsx`: urutan beranda disusun ulang; pilihan layanan ditempatkan lebih awal; panel akun dipindahkan ke bawah; checklist persiapan ditambahkan.
- `src/app/public-refresh.css`: visual pemilih jalur, checklist, animasi konsisten, hover, breakpoint mobile, dan reduced motion.
- `src/app/admin/pengaturan/page.tsx`: label versi diperbarui.
- `package.json`, `package-lock.json`, README, panduan upgrade, dan dokumentasi UI/UX diperbarui ke `0.10.18`.

## Hal yang tidak diubah

- Harga produk dan harga promo.
- Sumber data promo pusat.
- Checkout dan ledger.
- Integrasi Moota, StarSender, dan Mailketing.
- Autentikasi, peran, kebijakan akses, dan database.
- Environment variables.

## Pemeriksaan

- Periksa konsistensi versi package dan lockfile.
- Jalankan test komponen `visitor-path-finder.test.tsx`.
- Jalankan typecheck, lint, dan build produksi.
- Jika build lokal tidak tersedia, wajib menggunakan build Coolify sebagai gerbang produksi dan menjalankan smoke test setelah deploy.
