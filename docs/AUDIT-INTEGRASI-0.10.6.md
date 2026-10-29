# Audit integrasi KonsepSTIFIn 0.10.6

## Perubahan

- Moota API V2: tes koneksi melalui daftar rekening, pembuatan tagihan Terima Uang melalui path API yang dikonfigurasi, penyimpanan invoice ID/URL pada pesanan, dan webhook signature HMAC-SHA256.
- Rekonsiliasi pembayaran: deduplikasi event, pencocokan invoice/referensi/nominal, ledger transaksi yang tetap append-only, audit event, daftar event tidak cocok, dan rekonsiliasi manual dengan ID pesanan.
- StarSender V3: adapter pesan teks dengan Device API key pada header Authorization tanpa prefix Bearer, normalisasi nomor telepon, outbox notifikasi, worker pengiriman, status retry/failure/unknown.
- Marketing: halaman kampanye, persetujuan marketing terpisah dari izin kontak umum, batas 100 penerima per kampanye, penguncian dan pemeriksaan ulang persetujuan dalam transaksi database.

## Kontrol yang dipertahankan

- Tidak ada secret API di source code atau dashboard.
- Webhook memverifikasi raw body sebelum membaca payload.
- Event yang berulang tidak menambahkan pembayaran kedua.
- Nominal yang tidak cocok tidak mengubah saldo pesanan secara otomatis.
- Notifikasi WhatsApp dikirim melalui outbox, bukan langsung dari request webhook.
- Timeout jaringan StarSender ditandai `unknown` dan tidak dikirim ulang otomatis karena provider mungkin sudah menerima pesan.
- Marketing hanya dapat dikirim ke kontak yang memiliki persetujuan promosi aktif.

## Batas verifikasi

- Kredensial Moota dan StarSender tidak disediakan, sehingga tes koneksi live tidak dijalankan.
- Operasi create Terima Uang pada dokumentasi lama ditandai deprecated. Path create wajib diambil dari dokumentasi endpoint aktif milik akun Moota dan diatur melalui `MOOTA_RECEIVE_MONEY_CREATE_PATH`.
- Build penuh dan suite tes belum dapat dijalankan di lingkungan ini karena npm dependency registry tidak tersedia dan paket `zod-validation-error@4.0.2` tidak ada di cache offline. Lihat `HASIL-PENGUJIAN-0.10.6.txt`.
