# Upgrade KonsepSTIFIn 0.10.13

## Sebelum deploy

- Backup PostgreSQL dan file persisten.
- Pastikan source 0.10.12 yang saat ini berjalan dapat dipulihkan.
- Pastikan migrasi `012-integrations-promotions.sql` dan `013-whatsapp-inbound-first.sql` sudah diterapkan. Jangan menghapus data pengaturan integrasi yang sudah terenkripsi.

## Deploy

1. Gabungkan seluruh source paket ini ke repository `muhamadsofyanar/konsepstifin-platform`, branch `main`.
2. Jalankan satu deployment Coolify.
3. Setelah container baru `healthy`, buka terminal container aplikasi dan jalankan satu kali:

   ```bash
   IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 014-checkout-moota-mailketing.sql
   ```

4. Pastikan output `Applied 014-checkout-moota-mailketing.sql`.
5. Buka `https://konsepstifin.com/api/health` dan pastikan respons menunjukkan `"version":"0.10.13"`.

## Konfigurasi Moota

- Buka Admin → Pengaturan → Integrasi Eksternal.
- Pastikan API token, secret webhook, dan ID rekening internal Moota terisi.
- Path default: `/api/v2/create-transaction`. Jangan mengubahnya kecuali dokumentasi API V2 akun Anda menyebut path lain.
- Klik Tes koneksi Moota. Tes ini hanya memeriksa akses API/rekening, bukan bukti pembuatan tagihan berhasil.
- Daftarkan URL webhook yang tampil di admin pada Moota dan gunakan secret webhook yang sama sesuai mekanisme signature Moota.

## Konfigurasi StarSender

- Isi Device API Key.
- Isi nomor WhatsApp resmi KonsepSTIFIn dengan format `628...`.
- Buat secret webhook acak dan simpan.
- Salin URL webhook pesan masuk lengkap dari admin dan pasang di pengaturan webhook StarSender.
- Kirim pesan uji dari nomor pelanggan ke nomor resmi. Pastikan event pesan masuk tercatat sebelum instruksi otomatis diuji.

## Konfigurasi Mailketing

- Isi API token Mailketing API V2.
- Isi nama pengirim dan email pengirim dari domain yang sudah diverifikasi di Mailketing.
- Simpan dan klik Tes koneksi Mailketing.
- Email instruksi pembayaran dan tanda terima masuk ke antrean transaksional. Email dengan link pembayaran yang sudah kedaluwarsa tidak dikirim.
- Kampanye email marketing tidak diaktifkan oleh rilis ini dan harus memakai persetujuan marketing yang terpisah.

## Uji wajib di staging

1. Buat pembelian produk digital berbayar. Pastikan pesanan tersimpan dan link Moota muncul di Pembelian saya.
2. Buat pesanan voucher mode `live` hanya jika siap melakukan transaksi nyata. Pastikan link Moota muncul di riwayat voucher.
3. Terbitkan pesanan layanan dari admin. Pastikan sistem mencoba membuat link Moota otomatis.
4. Selesaikan satu transaksi uji bernilai kecil. Pastikan webhook tercatat, ledger diperbarui, status menjadi lunas, dan akses/pengisian diproses sesuai aturan.
5. Pastikan nomor pelanggan yang belum chat memiliki status WhatsApp `awaiting_inbound`. Setelah pelanggan mengirim pesan, instruksi dikirim hanya dalam jendela 24 jam.
6. Jika Mailketing sudah diatur, pastikan email instruksi dan tanda terima tercatat sebagai `sent` pada `email_notification_outbox`.
7. Uji pembayaran tidak cocok/duplikat. Sistem harus menahan transaksi untuk rekonsiliasi, bukan menandainya lunas.

## Pemulihan

Jika build gagal, pertahankan container lama dan periksa log build. Jika transaksi Moota memiliki status `unknown`, periksa dashboard Moota sebelum mencoba membuat ulang link agar tidak terjadi tagihan ganda. Jangan menghapus status `unknown` hanya untuk menghilangkan peringatan.
