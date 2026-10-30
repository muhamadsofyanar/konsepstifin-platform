# Audit dan validasi KonsepSTIFIn 0.10.5

## Perubahan sumber

- Migrasi 010 menyiapkan katalog secara eksplisit. Pembacaan produk tidak lagi memanggil CREATE TABLE, pengecekan information_schema, atau upsert lintas katalog.
- Pembacaan detail legacy memakai filter product_key di SQL, bukan memuat seluruh daftar.
- Penyimpanan editor legacy memperbarui pasangan katalog secara atomik. Editor gabungan mempertahankan mekanisme transaksi yang sudah ada. Komisi, ID produk, riwayat harga pesanan, dan pembayaran tidak direset.
- Classroom service mengembalikan akses, outline, progres, serta materi awal melalui satu permintaan dengan cakupan pengguna dan produk.
- Dashboard peserta menerima section sehingga tab yang dibuka hanya mengambil tabel yang diperlukan. Tab yang belum dibuka tidak dimuat dan tidak dirender.
- Katalog menggunakan 12 kartu per halaman, termasuk reset halaman ketika pencarian/filter diganti.
- Pemeriksaan kepemilikan produk memakai EXISTS akses aktif, bukan membaca dashboard lengkap.
- Loading boundary ditambahkan untuk halaman. Indikator klik same-origin tidak mengirim permintaan jaringan sendiri dan tidak memprefetch referral atau endpoint aksi.
- Docker dan smoke menyalin modul kebijakan akses yang kini digunakan juga oleh layanan ruang materi/worker.

## Bukti pengujian

- Suite Vitest: 307 lulus, 6 dilewati, 69 file lulus dan 3 file dilewati.
- Uji terarah menghitung enam query untuk ruang materi dan dua query untuk daftar akses. Ia memeriksa bahwa tabel pembelian, tiket, sertifikat, serta notifikasi tidak dibaca saat membuka kelas.
- Uji cakupan menolak pembacaan material untuk pengguna tanpa akses, tautan materi lintas produk, materi terkunci, dan akses yang berakhir. Pemeriksaan akses dilakukan kembali pada setiap permintaan.
- Uji API memverifikasi ID pengguna berasal dari sesi, bukan query userId, dan file_path tidak dikirim ke browser.
- Uji katalog memverifikasi satu SELECT per pembacaan rutin, tidak ada schema check atau sinkronisasi, migrasi berulang tidak menimpa edit operator, serta kegagalan sinkronisasi membatalkan kedua sisi edit.
- Uji React memverifikasi pembukaan materi awal memakai satu permintaan classroom, pergantian materi tidak menampilkan hasil permintaan lama, katalog baru diambil saat tab dibuka, dan katalog hanya merender 12 kartu.
- TypeScript, ESLint, dan build produksi Next.js selesai tanpa kesalahan.
- Smoke standalone menguji migrasi 001–010, penyiapan katalog, worker, checkout, pembayaran, progres, sertifikat, unduhan privat, CRM, hak akses dan atribusi affiliate termasuk regresi ID & Alat.
- Pemeriksaan browser mencakup jalur baca khusus kelas dan tab akses, tampilan ponsel/desktop, serta indikator klik. Halaman publik, admin produk, affiliate, detail produk dan sertifikat ikut diperiksa dalam smoke browser.

## Batas pengujian

Pengujian database memakai PGlite melalui adapter PostgreSQL wire dan data sintetis. Ini bukan pengujian beban PostgreSQL produksi. Angka pengurangan query dan permintaan bukan persentase percepatan waktu. Perbandingan waktu pada VPS pengguna belum dilakukan. Penyedia video eksternal tetap memerlukan jaringan serta izin embed.

Pemeriksaan browser menggunakan Chromium lokal. Screenshot hanya digunakan untuk pemeriksaan internal dan tidak disertakan dalam paket. Pembuatan image diuji sebagai build Next standalone lokal, bukan menjalankan Docker pada server pengguna. Tidak ada transfer bank, pengiriman voucher riil, atau perubahan database produksi.

Batas loading Next.js dapat mengirim redirect sebagai meta refresh ketika respons sudah streaming. Smoke memeriksa tujuan redirect dan akses API tetap ditolak tanpa sesi, serta memeriksa hasil navigasi di browser.

Paket belum dideploy oleh asisten. Setelah upgrade, migrasi 010 harus dijalankan. Semua perbaikan pada 0.10.4 tetap dipertahankan.
