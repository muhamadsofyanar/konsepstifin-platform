# KonsepSTIFIn 0.10.16

Rilis perbaikan runtime worker. `src/lib/voucher-service.ts` menggunakan ekstensi `.ts` secara eksplisit ketika mengimpor `starsender-client`, sesuai resolusi ESM Node.js 24. Docker build juga menjalankan pemeriksaan import runtime sebelum build Next.js agar error serupa terdeteksi saat build, bukan setelah container berjalan.

## Upgrade

1. Masukkan source rilis ini ke branch `main` repository `muhamadsofyanar/konsepstifin-platform`.
2. Jalankan deployment Coolify.
3. Tidak ada migrasi database baru. Jika migrasi 014 dari 0.10.13 belum diterapkan, ikuti `UPGRADE-KONSEPSTIFIN-0.10.13.md` setelah backup database.
4. Pastikan build melewati pemeriksaan `Voucher worker runtime imports OK`.
5. Setelah container sehat, periksa `/api/health` dan pastikan versi `0.10.16`.
6. Periksa log worker voucher, notifikasi WhatsApp, dan email.

## Status pengujian

Perbaikan import diterapkan berdasarkan log runtime Coolify. Build produksi dan API live belum diverifikasi di lingkungan lokal ini karena `npm ci` mengalami timeout. Build Coolify berikutnya menjadi verifikasi final.
