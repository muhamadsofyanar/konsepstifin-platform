# KonsepSTIFIn 0.10.5: pembukaan kelas dan katalog lebih ringan

Paket source lengkap yang mencakup perbaikan affiliate, pengajuan ID & Alat, video inline, ruang materi terpisah, ebook, sertifikat, dan tampilan dari rilis sebelumnya.

## Pemasangan

1. Backup database dan volume file seperti biasa.
2. Unggah isi folder konsepstifin-0.10.5 ke root repository aplikasi yang sama, lalu redeploy menggunakan Dockerfile yang disertakan.
3. Pertahankan DATABASE_URL, PLATFORM_ORIGIN, akun, password, harga, alias, transaksi, serta volume storage yang sedang dipakai.
4. **Jalankan migrasi sampai 010**, termasuk jika migrasi 009 sudah berhasil. Di terminal container aplikasi versi baru:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Migrasi 010-catalog-read-path.sql memindahkan penyiapan katalog ke langkah pemasangan. Ia menyiapkan tabel katalog, mengisi produk yang belum ada, dan mencatat revisi. Produk publik dan produk gabungan yang sudah ada tidak ditimpa oleh seed. Komisi yang telah diatur admin dan pesanan lama dipertahankan. Perintah migrasi berurutan dapat diulang tanpa provision akun atau import ulang jaringan.

5. Refresh paksa browser dengan Ctrl + Shift + R.
6. Buka /api/health dan pastikan version bernilai 0.10.5. Health memeriksa server web. Kesiapan tabel katalog dan penanda migrasi diperiksa oleh diagnostik modul admin.

Paket ini bisa langsung menggantikan 0.10.4. Tidak perlu memasang versi antara. Paket belum diterapkan oleh asisten pada server produksi pengguna.

## Perubahan alur pemuatan

| Bagian | Sebelumnya | Sekarang |
| --- | --- | --- |
| Membuka ruang materi | Permintaan dashboard, daftar pelajaran, lalu materi | Satu permintaan khusus kelas yang dipilih |
| Query data saat membuka kelas normal | 10 query pada tiga layanan | 6 query dalam satu layanan kelas |
| Daftar Akses saya | Memuat katalog dan seluruh dashboard | Memuat data akses serta progres saja |
| Query dashboard untuk Akses saya | 6 query dashboard, ditambah pekerjaan katalog | 2 query akses dan progres |
| Membaca katalog rutin | Memeriksa skema dan melakukan upsert sinkronisasi | Satu SELECT untuk daftar yang diminta |
| Halaman detail produk | Memuat seluruh dashboard untuk memeriksa kepemilikan | Satu pemeriksaan keberadaan akses aktif |
| Tampilan katalog | Seluruh kartu hasil filter | Maksimal 12 kartu per halaman |
| Perpindahan halaman | Belum ada feedback navigasi khusus | Indikator klik dan tampilan loading |

Angka di tabel adalah jumlah kerja pada sumber dan pengujian terarah, bukan hasil benchmark waktu di VPS. Jumlah query tidak memasukkan query pemeriksaan sesi, transaksi BEGIN/COMMIT, atau pemuatan server halaman. API lama view=dashboard tanpa section tetap tersedia untuk kompatibilitas dan diagnostik. Permintaan yang mengalami kegagalan sementara masih dapat diulang sekali seperti rilis sebelumnya.

Pagination katalog membatasi kartu yang dirender, bukan menambahkan pagination server. API katalog masih membatasi maksimal 200 produk. Pencarian dan filter jenis tetap bekerja pada hasil katalog yang dimuat.

## Harga dan kesegaran data

Pembacaan katalog tidak lagi membuat tabel atau menyinkronkan harga. Penyiapan dilakukan saat migrasi. Saat admin menyimpan produk melalui editor gabungan, produk publik dan produk gabungan tetap diperbarui dalam transaksi yang sama. Jalur editor legacy juga memperbarui pasangan produk terkait dalam satu transaksi. Tidak ada cache bersama untuk data pribadi, akses, saldo, atau materi.

Gunakan editor produk aplikasi untuk perubahan katalog. Edit SQL langsung pada salah satu tabel tidak disinkronkan otomatis saat pengunjung membuka halaman. Rilis tidak membulatkan atau mengubah nominal yang sudah tersimpan secara otomatis.

## Hak akses dan referral

- Halaman kelas mengambil data pengguna yang masuk dan produk yang dipilih. Produk milik akun lain, materi lintas kelas, materi terkunci, serta akses kedaluwarsa diperiksa server.
- File privat tetap diperiksa melalui endpoint unduhan. Path penyimpanan tidak dikirim pada respons ruang materi.
- Progres serta pelajaran terakhir tetap tersimpan. Materi wajib yang diarsipkan tetap mengikuti aturan akses dari snapshot sebelumnya.
- Indikator navigasi hanya memberi feedback, tanpa melakukan prefetch tautan secara manual. Tautan /r/, API, logout, unduhan, dan URL eksternal dikecualikan dari indikator tersebut.
- Prefetch halaman tetap mengikuti mekanisme Link bawaan Next.js. Tidak ada kunjungan affiliate baru yang dibuat oleh kode indikator saat hover.
- Semua perbaikan referral 0.10.4 tetap disertakan, termasuk atribusi pengajuan ID & Alat tanpa membuka kontak yang tidak disetujui.

## Pemeriksaan setelah pemasangan

1. Buka Akses saya. Kartu kelas tampil tanpa memuat katalog di belakangnya.
2. Buka satu kelas. Pastikan materi, progres, daftar pelajaran, serta navigasi sebelumnya/berikutnya berfungsi.
3. Masuk sebagai akun lain dan coba URL kelas tadi. Akses materi tetap ditolak jika tidak dimiliki.
4. Buka Katalog. Gunakan pencarian, filter jenis dan halaman berikutnya jika produk lebih dari 12.
5. Simpan perubahan produk dari admin, lalu periksa harga pada landing page, katalog dan detail produk yang sama.
6. Uji tautan affiliate ID & Alat dalam jendela privat. Kirim sampai ada KSF, lalu cocokkan di Aktivitas referral.
7. Coba perpindahan halaman dengan koneksi normal dan koneksi lambat untuk melihat indikator dan loading.

Kecepatan nyata tetap dipengaruhi CPU/RAM VPS, latensi database, jaringan pengguna, dan penyedia video eksternal. Rilis ini mengurangi kerja yang tidak diperlukan. Tidak ada klaim waktu respons tertentu atau pengukuran terhadap VPS pengguna.
