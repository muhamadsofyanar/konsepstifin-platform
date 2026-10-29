# KonsepSTIFIn 0.10.13

Rilis ini menghubungkan pembuatan tagihan Moota dengan checkout produk digital, pesanan voucher, dan pesanan layanan yang diterbitkan admin. Rilis ini juga menambahkan antrean email transaksional Mailketing serta mempertahankan kebijakan StarSender inbound-first.

## Perubahan utama

- Checkout produk berbayar mencoba membuat link pembayaran Moota otomatis setelah pesanan tersimpan.
- Pembelian voucher mode `live` mencoba membuat link Moota otomatis. Pesanan simulasi tidak membuat tagihan nyata.
- Saat admin menerbitkan pesanan layanan, sistem mencoba membuat link Moota secara otomatis.
- Halaman pembelian dan voucher menampilkan link pembayaran Moota, masa berlaku, status pembuatan, dan opsi coba ulang yang aman. Status diperbarui otomatis selama halaman terbuka.
- Webhook Moota mencatat pembayaran ke ledger, memicu rekonsiliasi akses produk/voucher, dan menyiapkan notifikasi pembayaran.
- StarSender menyimpan instruksi pembayaran di outbox, tetapi mengirimnya hanya setelah pelanggan memulai percakapan dalam 24 jam terakhir. Nomor WhatsApp resmi dapat diatur dari admin agar formulir layanan menampilkan tombol mulai chat.
- Mailketing tersedia sebagai kanal email transaksional untuk link pembayaran dan tanda terima. Token, nama pengirim, dan email pengirim dikelola dari admin tanpa redeploy. Email marketing belum otomatis dikirim dan tetap memerlukan persetujuan terpisah.
- Status pembuatan tagihan dicatat agar sistem tidak membuat tagihan baru secara membabi buta ketika respons API ambigu.

## Konfigurasi admin

Buka **Admin → Pengaturan → Integrasi Eksternal**.

**Moota**
- API token Personal Token.
- Secret webhook yang sama dengan konfigurasi tanda tangan webhook Moota.
- ID rekening internal Moota, bukan nomor rekening bank pelanggan.
- Path Create Terima Uang menggunakan default `/api/v2/create-transaction`. Pastikan path dan request body sesuai dokumentasi API V2 akun Moota sebelum mengaktifkan transaksi produksi.
- URL webhook yang ditampilkan admin harus didaftarkan pada Moota.

**StarSender**
- Device API Key.
- Secret webhook pesan masuk.
- Nomor WhatsApp resmi KonsepSTIFIn dalam format `628...`.
- URL webhook pesan masuk dari admin harus dipasang pada device StarSender.

**Mailketing**
- API token dari Mailketing API V2.
- Nama pengirim.
- Email pengirim yang domainnya sudah diverifikasi di Mailketing.
- Klik **Tes koneksi Mailketing** setelah menyimpan konfigurasi.

## Upgrade dan migrasi

1. Backup database dan file sebelum deployment.
2. Pastikan migrasi `012-integrations-promotions.sql` dan `013-whatsapp-inbound-first.sql` dari rilis sebelumnya sudah diterapkan.
3. Masukkan source rilis ini ke branch `main` dan deploy melalui Coolify.
4. Setelah container baru sehat, jalankan satu kali dari terminal container aplikasi:

   ```bash
   IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 014-checkout-moota-mailketing.sql
   ```

5. Pastikan output menampilkan `Applied 014-checkout-moota-mailketing.sql`.
6. Buka `/api/health`; target versi adalah `0.10.13`.
7. Uji transaksi kecil di staging sebelum memakai checkout produksi. Jangan menganggap status `healthy` sebagai bukti webhook pembayaran telah diuji.

## Status verifikasi

Pemeriksaan sintaks untuk file TypeScript yang dapat diproses Node dan worker JavaScript berhasil. Instalasi dependensi lengkap mengalami timeout pada lingkungan kerja ini, sehingga build Next.js produksi, typecheck penuh, lint, dan seluruh test suite belum dapat dinyatakan lulus. Build Coolify dan uji staging tetap wajib sebelum rilis dipakai untuk transaksi riil.
