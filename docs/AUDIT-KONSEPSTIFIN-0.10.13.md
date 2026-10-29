# Audit KonsepSTIFIn 0.10.13

## Ruang lingkup

Rilis ini menghubungkan checkout dengan pembuatan tagihan Moota, menambah outbox email Mailketing, memperjelas alur WhatsApp inbound-first, dan menampilkan status pembayaran pada halaman pelanggan.

## Perubahan source

- `src/lib/moota-store.ts`: klaim pembuatan invoice dengan status `not_created/creating/created/failed/unknown`, perlindungan terhadap tagihan ganda saat respons API ambigu, pembaruan link kedaluwarsa, pencocokan webhook transaksi/mutasi, pencatatan ledger, serta antrean WhatsApp/email untuk instruksi dan tanda terima.
- `src/app/api/learning/route.ts`: checkout produk berbayar mencoba membuat invoice setelah pesanan tersimpan.
- `src/app/api/learning/payment/route.ts`: endpoint retry link hanya untuk pesanan yang dimiliki pengguna yang sedang login.
- `src/app/akun/voucher` dan `src/app/api/account/vouchers/route.ts`: pesanan voucher mode live mencoba membuat invoice otomatis; nomor WhatsApp opsional dapat disimpan untuk instruksi inbound-first.
- `src/lib/commerce-store.ts`: penerbitan pesanan layanan dari admin mencoba membuat link Moota otomatis.
- Halaman pembelian, voucher, dan admin pesanan menampilkan link/status dan memperbarui status berkala saat halaman terbuka.
- `src/lib/integration-settings.ts` dan `src/app/admin/pengaturan/integration-panel.tsx`: nomor WhatsApp bisnis dan kredensial Mailketing dikelola dari admin tanpa redeploy. Secret tidak ditampilkan kembali.
- `src/lib/mailketing-client.ts`, `scripts/email-notification-worker.mjs`, dan `scripts/start-with-worker.mjs`: pengiriman email transaksional melalui Mailketing API V2.
- Formulir layanan memberikan tombol agar calon klien memulai chat WhatsApp dan mengirim nomor referensi. StarSender menahan instruksi sampai ada pesan masuk dalam 24 jam terakhir.
- `scripts/migrations/014-checkout-moota-mailketing.sql`: status invoice, error terakhir, waktu request, masa berlaku pesan WhatsApp, status `expired`, dan tabel email outbox.

## Kontrol keamanan

- URL pembayaran harus HTTPS.
- Tagihan dengan status `unknown` tidak dibuat ulang otomatis karena permintaan sebelumnya mungkin sudah diterima Moota.
- Webhook yang tidak cocok masuk antrean rekonsiliasi, bukan otomatis dianggap lunas.
- Instruksi WhatsApp dengan link pembayaran kedaluwarsa tidak dikirim.
- Pesan WhatsApp tetap menunggu chat pelanggan dalam jendela 24 jam dan menghormati opt-out.
- Email transaksi terpisah dari kampanye email marketing; kampanye marketing belum diaktifkan.
- Nomor WhatsApp bisnis yang ditampilkan publik bukan secret.

## Hasil pemeriksaan lokal

- Syntax check Node untuk worker JavaScript dan file TypeScript server yang dapat diproses Node: lulus.
- TypeScript parser tidak menemukan error sintaks pada file TS/TSX yang diperiksa. Satu error non-sintaks `window.fbq` muncul dari tipe global tracking yang sudah ada.
- Instalasi dependensi lengkap mengalami timeout. Build Next.js produksi, typecheck penuh, lint, dan test suite belum dapat dinyatakan lulus.
- Tes API live Moota, StarSender, dan Mailketing belum dilakukan.

## Risiko tersisa

1. Path default `/api/v2/create-transaction` diambil dari dokumentasi Moota API V2. Request/response akun Moota tetap harus diuji melalui transaksi staging karena tes koneksi API tidak membuktikan pembuatan tagihan berhasil.
2. Pencatatan otomatis bergantung pada webhook Moota yang valid, payload yang cocok, dan migrasi 012, 013, 014 yang sudah diterapkan.
3. Status `unknown` memerlukan pemeriksaan dashboard Moota sebelum percobaan ulang untuk mencegah tagihan ganda.
4. Mailketing baru mengirim email setelah token dan sender domain valid serta migrasi 014 aktif.
