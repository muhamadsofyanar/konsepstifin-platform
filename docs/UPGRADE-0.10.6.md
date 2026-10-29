# Upgrade KonsepSTIFIn 0.10.6

Rilis ini menambahkan integrasi Moota API V2 untuk pembuatan link Terima Uang dan penerimaan webhook, antrean notifikasi WhatsApp StarSender, serta halaman kampanye marketing dengan persetujuan promosi terpisah. Semua perubahan database bersifat aditif. Data lama tidak dihapus.

## Sebelum deploy

1. Backup PostgreSQL dan volume `/app/storage`.
2. Deploy source 0.10.6 ke staging terlebih dahulu.
3. Jalankan migrasi `scripts/migrations/011-integrations.sql` setelah migrasi 010 berhasil.
4. Uji webhook dengan payload sintetis dan secret staging. Jangan menguji pembayaran palsu di database produksi.

## Environment variables

Simpan nilai rahasia hanya di Environment Variables Coolify, bukan di GitHub atau database.

```dotenv
MOOTA_API_BASE_URL=https://app.moota.co
MOOTA_API_TOKEN=
MOOTA_WEBHOOK_SECRET=
MOOTA_BANK_ACCOUNT_ID=
MOOTA_RECEIVE_MONEY_CREATE_PATH=
MOOTA_BANK_ACCOUNT_FIELD=bank_id
MOOTA_API_TIMEOUT_MS=12000

STARSENDER_API_KEY=
STARSENDER_API_URL=https://api.starsender.online/api/send
```

`MOOTA_API_TOKEN` menggunakan token API Moota V2. `MOOTA_WEBHOOK_SECRET` adalah secret khusus webhook yang dipakai untuk memverifikasi header `Signature` HMAC-SHA256 terhadap raw request body. Keduanya bukan token yang sama kecuali konfigurasi akun Moota memang menetapkannya demikian.

`MOOTA_RECEIVE_MONEY_CREATE_PATH` sengaja tidak memiliki default. Dokumentasi publik menandai operasi Terima Uang lama sebagai deprecated. Salin path operasi create yang aktif dari dokumentasi API pada akun Moota Anda. Jangan menebak path atau mengirim data produksi ke endpoint uji. Payload create saat ini menggunakan field `bank_id`, `name`, `phone`, `email`, `description`, `amount`, `expired_at`, `note`, dan `unique_code`; sesuaikan `MOOTA_BANK_ACCOUNT_FIELD` bila skema endpoint aktif menyebut field rekening berbeda. Jika skema aktif berbeda untuk field lainnya, adapter perlu disesuaikan dengan kontrak resmi sebelum dipakai live.

`STARSENDER_API_KEY` adalah Device API key StarSender V3. Header Authorization dikirim tanpa prefix `Bearer`, sesuai dokumentasi StarSender. Nomor penerima dinormalisasi ke format internasional.

## Alur Moota

1. Admin menerbitkan pesanan dari `/admin/pesanan`.
2. Admin memilih **Buat link pembayaran Moota** pada rincian pesanan.
3. Link dan ID invoice disimpan pada pesanan. Jika StarSender terkonfigurasi, notifikasi link pembayaran dimasukkan ke antrean.
4. Daftarkan URL `https://DOMAIN-ANDA/api/webhooks/moota` pada Moota dan gunakan secret webhook yang sama dengan `MOOTA_WEBHOOK_SECRET`.
5. Endpoint memvalidasi signature dari raw body, mencatat event unik, mencocokkan invoice/reference/nominal, lalu menambahkan penerimaan ke ledger.
6. Event yang tidak cocok tidak mengubah status pembayaran. Event tersebut disimpan dengan status `unmatched` untuk rekonsiliasi manual.
7. Worker menjalankan notifikasi WhatsApp di luar request webhook agar pengiriman pesan tidak membuat Moota timeout.

Pembuatan invoice tidak boleh dipakai sebelum path create dan field request dicocokkan dengan dokumentasi endpoint aktif. Tombol tes koneksi Moota hanya memeriksa akses API dan daftar rekening, bukan membuat tagihan riil. Event yang tidak cocok bisa ditinjau dari Pengaturan dan direkonsiliasi ke ID pesanan setelah admin memverifikasi nominal serta referensinya.

## Marketing StarSender

1. Buka menu **Marketing**.
2. Aktifkan persetujuan marketing hanya setelah pelanggan memberikan persetujuan eksplisit untuk promosi WhatsApp. Catat persetujuan sesuai kebijakan privasi internal.
3. Pilih kontak yang memiliki persetujuan aktif, tulis pesan, lalu masukkan kampanye ke antrean. Maksimum 100 kontak per kampanye.
4. Kontak yang opt-out dikecualikan dari kampanye baru.
5. Periksa tabel `notification_outbox` untuk status `pending`, `sent`, `failed`, atau `unknown`. Status `unknown` tidak dikirim ulang otomatis karena provider mungkin sudah menerima pesan ketika koneksi terputus.

Pesan pemasaran harus relevan, tidak menyesatkan, tidak dikirim ke kontak tanpa persetujuan, dan menghormati permintaan berhenti.

## Migrasi

Setelah backup, jalankan command operator pada container versi baru dengan `DATABASE_URL` mengarah ke database target yang benar:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Command membaca file migrasi bernomor secara berurutan, termasuk `011-integrations.sql`. Jika migrasi sebelumnya sudah pernah dijalankan, tinjau log command dan pastikan semua migrasi selesai. Alternatifnya, jalankan file `scripts/migrations/011-integrations.sql` langsung pada PostgreSQL setelah migrasi 010. Migrasi menambahkan kolom invoice Moota, tabel event webhook, status persetujuan marketing, kampanye, dan outbox notifikasi. Objek baru memakai `IF NOT EXISTS` agar migrasi ini aditif dan dapat diulang.

## Pemeriksaan setelah deploy

- `/api/health` harus melaporkan versi `0.10.6`.
- `/admin/pengaturan` menampilkan status konfigurasi tanpa membocorkan token.
- Tes koneksi Moota harus berhasil jika `MOOTA_API_TOKEN` valid.
- Pesanan terbit dapat membuat link Moota hanya jika path create dan ID rekening telah dikonfigurasi.
- Webhook dengan signature salah harus menerima HTTP 403.
- Webhook valid yang dikirim dua kali tidak boleh menggandakan ledger.
- Pesanan tanpa kecocokan harus tetap belum dibayar dan event tercatat sebagai `unmatched`.
- Marketing harus menolak kampanye ketika StarSender belum dikonfigurasi atau tidak ada kontak berpersetujuan aktif.
- Uji `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, dan `npm run test:smoke` di lingkungan Node 24 dengan dependensi terpasang.

Rollback dilakukan dengan mengembalikan image/source aplikasi sebelumnya. Kolom dan tabel migrasi 011 bersifat aditif dan tidak perlu dihapus saat rollback.
