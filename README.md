# KonsepSTIFIn 0.10.14

Rilis perbaikan build dari 0.10.13. Perbaikan ini mengubah kondisi render `moota_invoice_error` di `src/app/belajar/portal.tsx` menjadi boolean eksplisit agar nilai bertipe `unknown` tidak diperlakukan sebagai `ReactNode`. Fitur checkout Moota, antrean StarSender inbound-first, dan Mailketing tetap mengikuti source 0.10.13.

## Upgrade

1. Masukkan source rilis ini ke branch `main` repository `muhamadsofyanar/konsepstifin-platform`.
2. Jalankan build/deployment Coolify.
3. Tidak ada migrasi database baru pada 0.10.14. Jika migrasi 014 dari rilis 0.10.13 belum dijalankan, ikuti `UPGRADE-KONSEPSTIFIN-0.10.13.md` setelah backup database.
4. Setelah container sehat, periksa `/api/health` dan pastikan versi `0.10.14`.

## Status pengujian

Perbaikan TypeScript pada ekspresi JSX telah diterapkan berdasarkan error build Coolify. Build produksi penuh dan typecheck seluruh proyek belum dapat dijalankan di lingkungan kerja ini karena `npm ci` mengalami timeout. Gunakan build Coolify sebagai verifikasi akhir dan periksa log jika muncul error lanjutan.
