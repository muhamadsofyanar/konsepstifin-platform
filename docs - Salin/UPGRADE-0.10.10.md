# Upgrade KonsepSTIFIn 0.10.11

## Prasyarat
- Backup database PostgreSQL dan direktori file.
- Pastikan migration `012-integrations-promotions.sql` dari 0.10.9 sudah diterapkan.
- Deploy commit/source 0.10.11.

## Migrasi
Jalankan satu kali setelah deployment: `IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 013-whatsapp-inbound-first.sql`. Perintah memerlukan `DATABASE_URL` untuk database yang benar. Jangan jalankan pada database yang belum diverifikasi.

## Konfigurasi StarSender
1. Buka Admin > Pengaturan > Integrasi Eksternal sebagai pemilik platform.
2. Masukkan Device API Key StarSender pada kolom API key. Endpoint default `https://api.starsender.online/api/send` sesuai dokumentasi StarSender V3.
3. Klik `Buat secret acak`, lalu `Simpan integrasi tanpa redeploy`.
4. Setelah halaman diperbarui, salin URL webhook pesan masuk yang ditampilkan. Masukkan URL tersebut pada pengaturan webhook device StarSender.
5. Kirim pesan dari nomor uji ke nomor WhatsApp KonsepSTIFIn dan pastikan webhook mengembalikan HTTP 200.

## Perilaku pengiriman
- Semua pesan keluar menunggu pesan masuk pelanggan dalam 24 jam terakhir. Jika belum ada sesi, status antrean menjadi `awaiting_inbound`. Webhook pesan masuk mengaktifkan kembali antrean yang sesuai.
- Pesan `STOP`, `BERHENTI`, `UNSUBSCRIBE`, atau `JANGAN KIRIM` menghentikan pesan yang masih menunggu. `MULAI` atau `START` membuka kembali pesan layanan, tetapi persetujuan marketing tetap terpisah.
- Kampanye hanya dikirim jika consent promosi masih aktif saat worker mengirim.
- Setelah perubahan kode ini, jalankan worker dan endpoint webhook hanya setelah migrasi 013 selesai.

## Konfigurasi Moota
Di halaman Personal Token Moota, gunakan nama `KonsepSTIFIn Production` dan scope `API`, `User_read`, `Bank_read`, `Mutation_read` untuk integrasi penuh. Scope API memiliki hak luas. Simpan token di halaman admin KonsepSTIFIn. URL webhook Moota dan secret harus sesuai dengan yang ditampilkan admin. Jangan mengisi path Create Terima Uang sampai endpoint dan request body diverifikasi dari dokumentasi Moota aktif.

## Verifikasi setelah deployment
- `/api/health` menampilkan versi 0.10.11.
- Tes koneksi Moota berhasil dan akun bank yang diharapkan muncul.
- Webhook StarSender menolak token salah dengan HTTP 403 dan menerima pesan masuk valid.
- Pesan antrean tanpa sesi masuk berubah menjadi `awaiting_inbound`, bukan dikirim.
- Pesan masuk yang valid dalam 24 jam mengaktifkan antrean.
- Pesan STOP menghentikan antrean.
- Kampanye tanpa consent tidak terkirim.

Build/typecheck/test lengkap belum terverifikasi di lingkungan pembuatan paket. Validasi wajib dilakukan melalui build Coolify dan staging sebelum produksi.
