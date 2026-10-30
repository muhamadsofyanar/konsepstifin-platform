# Upload manual KonsepSTIFIn 0.10.26

## Isi pembaruan

- Admin: menu **Pesan Akun** di `/admin/pesan`, cari akun aktif dan mulai/balas percakapan.
- Member dan promotor: menu **Pesan Admin** di `/akun/pesan`, kirim/balas pesan pribadi dengan tim admin.
- Tanda jumlah pesan belum dibaca pada navigasi. Semua admin aktif melayani inbox tim yang sama.
- Profil kontak di dalam Pesan Admin: nama tampilan dan nomor WhatsApp. Nomor belum diverifikasi; belum ada verifikasi OTP.
- WhatsApp Inbox pelanggan tetap menggunakan satu nomor pusat melalui integrasi yang sudah ada. Promotor tetap hanya mengakses pelanggan yang ditugaskan dan telah menyetujui pembagian data.

Chat dashboard tidak membutuhkan StarSender, tidak disinkronkan ke WhatsApp, dan tidak mengirim notifikasi WhatsApp secara otomatis. Untuk percakapan WhatsApp pelanggan, konfigurasi StarSender pusat, webhook dan worker yang sudah ada tetap diperlukan. Tidak perlu akun StarSender terpisah untuk setiap promotor yang melayani nomor pusat.

## Pemasangan

1. Backup database dan pertahankan environment serta data storage produksi yang sudah ada.
2. Ekstrak ZIP ke folder kosong. Seluruh berkas proyek berada langsung di akar ZIP, termasuk Dockerfile, package.json, src dan scripts.
3. Unggah seluruh isinya ke akar repositori GitHub pada branch main, ganti file lama yang sesuai. Jangan masukkan sebagai subfolder baru. Pastikan .dockerignore dan .gitignore ikut terunggah. Hapus folder cadangan `src - Salin` jika masih ada.
4. Commit dan deploy di Coolify. Pastikan versi sumber pada package.json adalah 0.10.26.
5. Setelah container versi baru berjalan, buka Terminal aplikasi di Coolify dan jalankan:

```sh
cd /app
IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 019-dashboard-chat.sql
```

6. Pastikan muncul `Applied 019-dashboard-chat.sql`, lalu muat ulang dashboard. Migrasi 011–018 yang sebelumnya berhasil tidak perlu dijalankan lagi untuk fitur chat ini.

Migrasi 019 membuat tiga tabel baru untuk profil kontak, percakapan dan pesan. Tidak dijalankan otomatis saat build/startup dan telah diuji dapat diulang.

## Uji setelah pemasangan

1. Login sebagai member/promotor, buka Pesan Admin dan isi profil kontak jika diperlukan.
2. Kirim pesan percobaan kepada tim admin.
3. Login admin melalui browser/profil terpisah, buka Pesan Akun dan balas akun tersebut.
4. Periksa tanda pesan baru dan balasan di dashboard member/promotor. Pembaruan otomatis menggunakan polling 10 detik saat tab aktif.
5. Pastikan akun member lain tidak menampilkan percakapan tadi, dan akses WhatsApp pelanggan promotor tetap sesuai penugasannya.

## Perilaku dan batas fitur

Pesan teks maksimal 4000 karakter. Riwayat awal menampilkan hingga 100 pesan terbaru; tombol riwayat memuat pesan sebelumnya. Ketika bagian terbaru terlihat, percakapan ditandai dibaca sampai pesan yang sudah dimuat (termasuk pesan sebelumnya). Pesan yang tiba saat pengguna membaca riwayat lama tetap belum dibaca sampai kembali ke bagian terbaru.

Belum ada lampiran chat internal, chat antar-member, notifikasi push, atau sinkronisasi pesan internal ke WhatsApp. Pesan dapat dibaca oleh seluruh admin aktif. Lihat HASIL-PENGUJIAN-0.10.26.md untuk hasil uji dan keterbatasan verifikasi.
