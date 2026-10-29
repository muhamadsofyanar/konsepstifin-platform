# Upgrade KonsepSTIFIn 0.10.15

## Tujuan
Memperbaiki crash container saat voucher worker dijalankan di Node.js 24.

## Perubahan
- `src/lib/voucher-service.ts` sekarang mengimpor `./starsender-client.ts` dengan ekstensi eksplisit. Native Node ESM tidak otomatis mencari ekstensi `.ts` untuk import relatif tanpa ekstensi.
- Tidak ada perubahan skema database dan tidak ada migrasi baru.
- Perubahan ini mempertahankan fitur checkout Moota, voucher, StarSender inbound-first, dan Mailketing dari 0.10.13/0.10.14.

## Deployment
1. Backup repository dan database.
2. Masukkan seluruh source versi 0.10.15 ke branch `main`.
3. Deploy melalui Coolify.
4. Pastikan build TypeScript lulus dan container sehat.
5. Periksa log voucher worker, notification worker, dan email worker. Tidak boleh ada `ERR_MODULE_NOT_FOUND`.
6. Buka `/api/health` dan pastikan versi `0.10.15`.

## Database
Tidak ada migrasi baru. Pastikan migrasi yang sudah diperlukan oleh fitur aktif (termasuk 012, 013, dan 014 jika fitur-fitur tersebut digunakan) telah diterapkan sebelum menguji antrean pembayaran/notifikasi.

## Rollback
Jika container baru gagal healthcheck, Coolify dapat melakukan rollback. Jangan hapus container/database lama sebelum memverifikasi checkout, webhook, dan antrean worker.
