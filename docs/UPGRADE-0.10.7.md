# Upgrade KonsepSTIFIn 0.10.7

Rilis ini menyempurnakan dashboard marketing StarSender. Admin kini dapat melihat riwayat 20 kampanye terakhir beserta jumlah pesan yang menunggu, sedang diproses, terkirim, gagal, atau memiliki hasil pengiriman yang belum pasti. Status bisa diperbarui langsung dari halaman Marketing.

## Upgrade

1. Cadangkan source, database PostgreSQL, dan volume `/app/storage`.
2. Ganti source dengan paket 0.10.7 lalu deploy ulang melalui Coolify.
3. Tidak ada migrasi database baru pada versi ini. Pastikan migrasi `011-integrations.sql` dari versi 0.10.6 sudah berhasil dijalankan.
4. Pastikan `STARSENDER_API_KEY` diatur di environment server jika ingin mengirim pesan.
5. Buka `/admin/marketing`, periksa persetujuan promosi, lalu gunakan tombol **Perbarui status** pada riwayat kampanye.

## Integrasi Moota

Konfigurasi Moota dari versi 0.10.6 tetap digunakan. `MOOTA_API_TOKEN`, `MOOTA_WEBHOOK_SECRET`, `MOOTA_BANK_ACCOUNT_ID`, dan `MOOTA_RECEIVE_MONEY_CREATE_PATH` harus disetel di environment server. Path create dan nama field payload harus cocok dengan operasi Terima Uang yang aktif pada dokumentasi API akun Moota. Jangan mengisi path berdasarkan tebakan. Tes koneksi hanya memeriksa API dan daftar rekening, bukan membuat tagihan.

## Pemeriksaan

Jalankan `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, dan `npm run test:smoke` di lingkungan build Node 24. Setelah deploy, periksa `/api/health`, halaman Pengaturan, dan halaman Marketing.
