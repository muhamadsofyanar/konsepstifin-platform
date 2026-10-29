# Upgrade KonsepSTIFIn 0.10.14

## Perbaikan

Rilis ini memperbaiki error TypeScript pada `src/app/belajar/portal.tsx`: `p.moota_invoice_error && ...` menghasilkan tipe `unknown` yang tidak valid sebagai child React. Kondisi diganti menjadi `Boolean(p.moota_invoice_error) && ...`. Versi paket dan label admin diperbarui ke `0.10.14`.

## Deploy

1. Backup source dan database.
2. Masukkan isi paket ke repository `muhamadsofyanar/konsepstifin-platform`, branch `main`.
3. Jalankan satu deployment Coolify.
4. Tidak ada migrasi baru untuk versi 0.10.14. Jika migrasi `014-checkout-moota-mailketing.sql` dari versi 0.10.13 belum diterapkan, ikuti instruksi pada panduan 0.10.13 setelah backup.
5. Pastikan `/api/health` mengembalikan `"version":"0.10.14"`.
6. Uji halaman Pembelian saya dan pembuatan link Moota di staging.

## Catatan verifikasi

Perbaikan ditargetkan langsung pada error yang dilaporkan Coolify. Build penuh belum diverifikasi secara lokal karena instalasi dependensi mengalami timeout; build Coolify berikutnya harus menjadi verifikasi final. Jika ada error TypeScript baru, gunakan error pertama yang dilaporkan dan perbaiki sebelum redeploy berikutnya.
