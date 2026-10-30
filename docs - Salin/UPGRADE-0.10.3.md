# KonsepSTIFIn 0.10.3: referral pendaftaran dan ruang belajar terpisah

Paket source lengkap, melanjutkan semua perbaikan 0.10.0 sampai 0.10.2. Pekerjaan ini belum diterapkan ke server produksi pengguna.

## Pemasangan

1. Backup database dan volume penyimpanan yang saat ini dipakai.
2. Unggah isi folder konsepstifin-0.10.3 ke root repository aplikasi yang sama. Gunakan Dockerfile yang disertakan dan redeploy.
3. Pertahankan DATABASE_URL, PLATFORM_ORIGIN, akun, kata sandi, alias, dan volume storage yang sudah ada.
4. **Rilis ini membutuhkan migrasi baru 009-referral-registrations.sql**, termasuk jika migrasi 008 sudah berhasil sebelumnya. Di terminal container aplikasi versi baru, jalankan:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Perintah menjalankan migrasi berurutan dan dapat diulang. Tidak perlu provision ulang akun atau import ulang jaringan promotor. Migrasi menambahkan tabel asal pendaftaran beserta indeks dan perlindungan perubahan sumber, tanpa mengubah harga atau mengalihkan transaksi lama.

5. Setelah migrasi berhasil, refresh browser dengan Ctrl + Shift + R.
6. Buka /api/health. Nilai version harus 0.10.3. Health hanya menandakan server web berjalan. Di ruang admin, periksa kesiapan modul agar tabel referral baru juga terdeteksi.

Jangan menggunakan instruksi versi 0.10.2 yang menyebut tidak ada migrasi baru untuk pemasangan 0.10.3. Petunjuk versi sebelumnya di paket merupakan riwayat.

## Halaman dan menu

| Kebutuhan | Halaman |
| --- | --- |
| Daftar kelas dan ebook milik peserta | /belajar?tab=classes |
| Ruang materi kelas atau ebook tertentu | /belajar/kelas/ID_PRODUK |
| Materi tertentu yang bisa dibuka kembali | /belajar/kelas/ID_PRODUK?materi=ID_MATERI |
| Pusat produk dan affiliate | /akun/mitra |
| Pendaftaran dan pembelian dari referral | /akun/mitra?tab=activity |
| Alias serta tautan pendaftaran | /akun/mitra?tab=links |
| Komisi dan pencairan | /akun/mitra?tab=commissions |
| Pemeriksaan asal pendaftaran oleh admin | /admin/kelas?section=students, buka Pendaftaran melalui affiliate |

/akun/tautan sekarang mengarah ke tab Tautan affiliate di pusat mitra. Tautan alias /r/ yang lama tetap berlaku. /akun/produk dan /akun/komisi tetap menuju pusat mitra sebagaimana rilis sebelumnya.

## Cara menguji referral setelah pemasangan

1. Masuk sebagai mitra yang sudah aktif, buka Tautan affiliate, lalu salin Tautan pendaftaran peserta. Bentuknya /r/ALIAS?to=/akun/daftar.
2. Buka tautan tersebut dalam jendela privat atau browser pengujian baru. Jangan menguji pendaftaran dengan akun/email yang sudah ada.
3. Buat akun peserta baru di browser yang sama. Setelah sukses, masuk menggunakan akun itu.
4. Kembali ke akun mitra dan buka Aktivitas referral, lalu Perbarui data. Jumlah akun baru dan satu kode peserta tersamar harus muncul.
5. Admin dapat mencocokkan email peserta dan affiliate pengundang pada bagian Peserta dan hak akses. Identitas lengkap ini tidak dibuka ke mitra.
6. Untuk menguji pembelian tanpa membuat transaksi produksi baru, gunakan lingkungan uji. Pencatatan pembelian dan komisi merupakan tahap berbeda dari pendaftaran.

## Kebijakan atribusi yang diterapkan

- Hanya cookie referral dari kunjungan /r/ yang terverifikasi server yang dibaca saat pendaftaran. Kolom partner/role/referral dalam formulir tidak dipercaya.
- Pembuatan akun dan penyimpanan asal pendaftaran berlangsung dalam satu perintah database. Jika penyimpanan referral gagal, akun tidak dibuat sebagian.
- Akun yang sudah ada tidak dihitung sebagai pendaftaran baru dan sumbernya tidak ditimpa saat login.
- Referral kunjungan pertama yang masih valid tetap berlaku selama 30 hari. Membuka tautan mitra lain tidak mengganti cookie pertama yang masih valid.
- Jika ada asal pendaftaran yang masih dalam jangka atribusi awal, checkout peserta dan pengajuan layanan saat masuk memakai asal tersebut terlebih dahulu. Ini memungkinkan pengguna melanjutkan dari perangkat lain setelah masuk.
- Jika tidak ada asal pendaftaran yang masih valid, checkout dapat membaca cookie kunjungan yang masih valid seperti sebelumnya.
- Pendaftaran tidak memperpanjang jangka 30 hari dan tidak menghasilkan komisi. Setelah waktunya berakhir, riwayat pendaftaran tetap terlihat, tetapi tidak otomatis memberikan komisi untuk pembelian berikutnya.
- Atribusi layanan tetap mengikuti persetujuan pembagian data pada formulir. Pengundang dan promotor yang ditugaskan merupakan dua hal berbeda.
- Komisi tetap mengikuti kebijakan produk, pembayaran terverifikasi, persetujuan, dan pencairan manual. Tidak ada transfer otomatis.

## Batas data lama

Pendaftaran yang terjadi sebelum perbaikan belum memiliki hubungan pengundang di tabel akun. Rilis ini tidak menebak hubungan berdasarkan email atau waktu daftar. Data pendaftaran lama tidak akan muncul otomatis sebagai referral. Catatan permintaan layanan, transaksi, dan komisi yang sudah ada dipertahankan.

## Ruang belajar

Daftar Akses saya hanya berisi kartu akses. Mulai/Lanjutkan belajar menuju halaman materi tersendiri. Ruang materi mempunyai video inline, daftar pelajaran, progres, tombol sebelumnya/berikutnya, kembali ke daftar akses, dan bantuan. Di ponsel, daftar materi dapat dibuka/tutup agar tidak mendominasi layar. Unduhan ebook juga berada di ruang tersendiri. Batas akses, jadwal buka materi, dan pemeriksaan file tetap ditegakkan server.
