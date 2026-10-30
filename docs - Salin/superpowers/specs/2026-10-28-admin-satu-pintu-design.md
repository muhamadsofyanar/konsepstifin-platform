# Rancangan KonsepSTIFIn: Admin Satu Pintu Tanpa SEJOLI

Tanggal: 28 Oktober 2026
Status: disetujui pemilik pada 28 Oktober 2026. Implementasi 0.6.0 tersedia; hasil aktual dan keterbatasan tercatat di HASIL-PENGUJIAN.md.
Basis: `konsepstifin-platform-main.zip`, aplikasi versi 0.5.1.

## 1. Arah yang sudah ditentukan

- Memperbaiki aplikasi yang sekarang, bukan membuat website baru.
- Menghapus ketergantungan operasional pada SEJOLI.
- Memusatkan pekerjaan admin pada satu portal.
- Menyederhanakan sistem teknis sekaligus pengelolaannya.
- Menyerahkan ZIP source lengkap. Pemilik mengunggah ke GitHub dan melakukan redeploy di Coolify.

## 2. Pendekatan

Pendekatan yang dipilih dari arahan pemilik: mempertahankan Next.js dan PostgreSQL, lalu merapikan modul di dalam aplikasi yang sama. Tidak menambah WordPress, aplikasi backend terpisah, atau kewajiban memakai n8n untuk fungsi inti.

Alternatif yang dipertimbangkan:

| Pendekatan | Dampak |
| --- | --- |
| Rapikan aplikasi sekarang | Memakai kembali konten, pustaka, CRM, dan deployment. Ini pendekatan yang sesuai arahan pemilik. |
| Backend terpisah atau CMS baru | Memerlukan layanan, autentikasi, dan deployment tambahan. Tidak dipilih karena menambah pengelolaan. |
| Tetap memakai SEJOLI | Tidak dipilih karena pemilik meminta penggantiannya. |

## 3. Temuan source yang mendasari rancangan

- `/admin` sekarang langsung mengarah ke CRM. Belum ada halaman ringkasan operasional.
- Navigasi admin memiliki enam tautan; artikel, pustaka, dan pemeriksaan konten terpisah.
- Login admin menggunakan kredensial environment dan cookie bertanda tangan. Modul akun database dan sesi yang dapat dicabut sudah ada, tetapi memakai endpoint dan konfigurasi terpisah.
- CRM admin mengambil kumpulan lead, lalu mencari dan memfilter di browser. Endpoint akun sudah memiliki pagination SQL, tetapi belum menggantikan alur CRM admin.
- Ketergantungan SEJOLI tersebar pada `site-config.ts`, product store, formulir publik, API interests, validasi artikel/AI, CTA artikel, halaman affiliate, dan teks publik.
- Produk mempunyai harga tampilan berbentuk teks. Perhitungan transaksi baru membutuhkan nominal angka tersendiri, bukan mengurai teks seperti “mulai dari”.
- Product initializer dapat menimpa nilai katalog saat revisi seed tertentu belum tercatat. Perubahan ini harus dibatasi agar harga yang diedit admin tidak kembali ke seed.
- CRM menyimpan status pembayaran dan ID order SEJOLI. Nilai lama perlu dipertahankan sebagai referensi histori.
- Container sudah menyediakan direktori pustaka; file sumber membutuhkan volume persisten agar tidak hilang ketika redeploy.

Pemeriksaan sebelumnya: 103 tes Node lulus; dua berkas tes integrasi tidak dapat dimuat karena PGlite belum terpasang. Itu belum membuktikan build atau kelayakan produksi.

## 4. Susunan portal admin

Satu pintu masuk di `/admin/login`. Setelah login, admin masuk ke `/admin` dan melihat ringkasan. Tautan admin lama tetap berfungsi agar bookmark tidak rusak.

| Menu utama | Fungsi |
| --- | --- |
| Ringkasan | Lead baru, jadwal, pesanan menunggu pembayaran, dan aktivitas terakhir dari database. Jika data belum tersedia, tampilkan keadaan kosong yang jelas. |
| Klien & Promotor | Empat kelompok CRM yang sudah ada, pencarian, filter, pagination server, detail, assignment, status, dan catatan riwayat. Direktori nasional menjadi subbagian agar tidak bercampur dengan promotor jaringan sendiri. |
| Pesanan & Pembayaran | Pesanan internal yang terhubung ke lead/kontak, rincian layanan, nominal, status, serta pencatatan pembayaran manual. |
| Konten & Layanan | Artikel, bantuan AI, pustaka, pemeriksaan SEO, katalog, dan harga dalam subbagian. Fungsi lama dipertahankan. |
| Pengaturan | Akun admin, status database, status konfigurasi integrasi, petunjuk penyimpanan, dan aktivitas administrasi. Nilai secret tidak dikirim ke browser. |

Ringkasan dan daftar dapat dibuka di ponsel. Kesalahan penyimpanan harus tampil sebagai kegagalan; jangan menampilkan keberhasilan saat database gagal.

## 5. Satu sistem login

- Gunakan modul akun dan sesi database yang sudah ada sebagai fondasi bersama.
- Semua fungsi admin memeriksa sesi server dan peran admin/super_admin yang sama.
- Login lama dan endpoint akun menggunakan layanan autentikasi yang sama; jangan mempertahankan bypass admin berbasis environment setelah cutover.
- Urutan cutover: backup database/file, jalankan migrasi aditif, provision admin database, verifikasi kredensial melalui command operator tanpa menerbitkan sesi browser, lalu aktifkan login tunggal dan invalidasi cookie lama. Jika prasyarat gagal, hentikan cutover dengan pesan jelas; jangan membuat bypass login untuk pemulihan.
- Environment hanya dipakai untuk menyiapkan admin awal melalui perintah terkontrol. Jangan membuat ulang akun atau mereset password pada setiap request.
- Logout mencabut sesi di server. Perubahan password/nonaktif akun mencabut sesi yang relevan.
- Mutasi memakai pemeriksaan origin/CSRF. Respons privat memakai `no-store`.
- Pertahankan pembatasan login di database dan pemeriksaan akun nonaktif.
- Endpoint non-admin yang sudah ada tidak otomatis mendapat akses portal admin.
- Jangan membuka pendaftaran admin publik atau menambah portal pelanggan/promotor baru pada paket ini.

## 6. Pengganti SEJOLI

### Usulan pembayaran yang belum disetujui

Pembayaran awal menggunakan transfer manual yang diverifikasi admin. Payment gateway belum dipilih oleh pemilik. Ini keputusan rancangan yang perlu dikonfirmasi sebelum implementasi alur pembayaran.

Alur yang diusulkan:

1. Pengunjung memilih layanan dan mengirim formulir pada website yang sama.
2. Sistem menyimpan lead dan menampilkan nomor referensi tanpa mengarahkan ke SEJOLI.
3. Admin meninjau kebutuhan, menyepakati harga/jadwal, dan membuat pesanan internal dari lead.
4. Admin menyampaikan instruksi pembayaran yang telah dikonfigurasi. Jika belum ada rekening/instruksi, sistem menampilkan bahwa konfirmasi admin diperlukan.
5. Admin mencatat pembayaran setelah memeriksa mutasi rekening di luar aplikasi. Pengiriman formulir atau bukti tidak otomatis mengubah status menjadi lunas.
6. Pesanan dan pembayaran tampil di CRM terkait. Status layanan tetap terpisah dari status pembayaran.

Ruang lingkup transaksi minimum:

- Nomor pesanan unik, pelanggan, referensi lead, item layanan, jumlah, harga satuan integer Rupiah, dan total hasil perhitungan server.
- Harga/nama item disalin ke pesanan agar perubahan katalog tidak mengubah histori transaksi.
- Admin dapat menyimpan draf, menerbitkan pesanan, membatalkan yang belum dibayar, serta mencatat penerimaan dan pengembalian dana aktual.
- Saldo dihitung dari pembayaran yang tercatat dan pengembalian dana. Nominal negatif, pecahan, terlalu besar, dan melebihi saldo yang sah ditolak.
- Status pembayaran dihitung dari ledger, bukan dipilih bebas melalui formulir CRM.
- Pencatatan uang memakai transaksi database, locking, idempotensi, serta pelaku dan waktu. Pengiriman ulang tidak boleh mencatat penerimaan dua kali.
- Catatan pembayaran yang sudah diposting tidak diedit atau dihapus diam-diam. Koreksi memiliki entri koreksi dan alasan yang dapat ditelusuri.
- Invoice atau tanda terima yang dibuka admin selalu memerlukan autentikasi. Jangan membuat halaman publik yang membuka identitas pelanggan melalui nomor urut.
- Riwayat order SEJOLI dipertahankan sebagai referensi lama. Tidak diimpor menjadi penerimaan uang baru tanpa rekonsiliasi.
- Pesanan lama yang belum selesai tidak otomatis menjadi tagihan baru. Admin harus merekonsiliasi saldo awal beserta referensi pembayaran sebelum melanjutkan pesanan tersebut di sistem baru, agar pelanggan tidak ditagih dua kali.
- Tidak membuat cicilan otomatis, payout komisi, penerbitan voucher otomatis, atau LMS pada paket awal ini. Pengganti fitur tersebut membutuhkan aturan bisnis dan pengujian tersendiri.

### Penghapusan ketergantungan aplikasi

- Ubah konfigurasi, tipe produk, label, CTA, validasi artikel/AI, dan event tracking menjadi istilah netral.
- CTA artikel mengarah ke layanan/form internal. URL lama yang tersimpan tidak boleh tetap mengalihkan pengguna ke SEJOLI.
- Tautan member/affiliate lama diganti dengan informasi atau formulir internal yang benar-benar tersedia; jangan mengiklankan dashboard atau komisi otomatis yang belum dibangun.
- Sesuaikan teks halaman publik, privasi, ketentuan, dan metadata dengan alur aktual. URL artikel serta halaman SEO dipertahankan.
- Field historis boleh tetap ada pada database untuk kompatibilitas, tetapi tidak menjadi syarat operasi baru.

## 7. CRM dan integritas data

- Pertahankan empat kelompok: calon klien, klien, calon promotor, promotor jaringan.
- Pencarian, filter, jumlah total, ringkasan, dan pagination dihitung pada server. Default 25 baris per halaman, maksimum 100.
- Filter tidak hanya bekerja terhadap sebagian data pertama yang terunduh.
- Memilih halaman, mengubah filter, dan menyimpan detail tidak boleh menimpa hasil request terbaru dengan respons lama.
- Assignment/status/catatan beserta riwayatnya disimpan secara atomik. Pelaku diambil dari akun login.
- Jangan menggabungkan orang otomatis hanya karena nomor telepon sama.
- Lead baru tetap menangkap sumber kampanye/UTM dan consent. Data kontak tidak muncul di endpoint publik.
- Detail CRM menampilkan ringkasan pesanan terkait; jangan menduplikasi sumber kebenaran status uang di dua modul.

## 8. Database, penyimpanan, dan operasi

- Tetap satu PostgreSQL melalui `DATABASE_URL` yang dikelola pemilik.
- Buat migrasi tambahan bernomor dan dapat dijalankan ulang. Jangan drop tabel, menghapus riwayat, atau mengubah data uang lama secara spekulatif.
- Pisahkan migrasi dari request publik. Terapkan penambahan skema sebelum mengaktifkan alur baru.
- Image runner Coolify wajib memuat command operator, SQL migrasi, serta modul yang dibutuhkan untuk migrasi/provisioning. Dockerfile saat ini belum menyalin kelengkapan tersebut. Uji command pada image final, bukan hanya dari folder source. Selaraskan versi Node dan dukungan TypeScript dengan command yang benar-benar dipaketkan.
- Pertahankan harga dan konten yang pernah diedit admin. Seed hanya melengkapi data yang belum ada.
- File pustaka membutuhkan volume persisten di `/app/storage`. Backup mencakup database dan direktori file, bukan ZIP source saja.
- Pengujian menggunakan database sintetis/khusus tes. Jangan menjalankan migrasi atau tes pada produksi dari sesi ini.
- Endpoint health publik hanya mengembalikan status aman. Pemeriksaan konfigurasi terperinci hanya untuk admin.

## 9. Urutan pengerjaan setelah rancangan disetujui

1. Siapkan salinan kerja terpisah; baca panduan Next.js versi terpasang; pasang dependensi dan catat hasil baseline.
2. Satukan autentikasi admin dan tutup jalur bypass. Uji login, logout, nonaktif akun, peran, CSRF, dan kegagalan database.
3. Bangun migrasi serta layanan pesanan/pembayaran internal. Uji perhitungan, konkurensi, idempotensi, koreksi, dan histori.
4. Putus semua redirect/validasi SEJOLI dan hubungkan formulir/CTA/katalog ke alur internal. Uji regresi publik.
5. Perbaiki query dan pagination CRM; satukan navigasi dan halaman ringkasan/pengaturan.
6. Jalankan seluruh pengujian, typecheck, lint, build, dan pemeriksaan tampilan/alur. Perbaiki kegagalan yang relevan.
7. Kemaskan source lengkap beserta panduan unggah, konfigurasi, migrasi, backup, redeploy, dan rollback.

## 10. Bukti penerimaan yang wajib dilaporkan

- Satu login admin dapat mengakses seluruh menu yang diizinkan. Pengguna non-admin dan sesi lama/cabut ditolak.
- Seluruh pemesanan, CTA artikel, katalog, dan navigasi aktif tidak lagi membutuhkan domain SEJOLI.
- Lebih dari 500 lead dapat dicari dan dihitung dengan benar melalui pagination server.
- Pesanan menyimpan harga historis. Pembayaran ulang/bersamaan tidak menggandakan uang atau menghasilkan saldo salah.
- Gangguan audit/database membatalkan perubahan terkait, bukan meninggalkan perubahan parsial.
- Data katalog lama tetap utuh setelah migrasi dan redeploy ulang.
- Halaman publik dan artikel lama tetap berfungsi; tidak ada kontak pelanggan atau kredensial bocor dalam respons publik.
- Hasil setiap command pengujian dicatat terpisah dari klaim deployment. Pengujian yang belum berjalan harus disebutkan.

## 11. Paket serah terima

- ZIP source lengkap, tanpa `node_modules`, `.next`, `.git`, `.env` nyata, atau data pribadi.
- `.env.example` yang cocok dengan implementasi final.
- Panduan singkat berbahasa Indonesia: backup, unggah file ke root repository GitHub, pengaturan Coolify, perintah migrasi yang sudah diuji, volume, redeploy, cek login/form/transaksi, dan rollback.
- Daftar perubahan, hasil pengujian aktual, keterbatasan, dan checksum paket.
- Tidak melakukan push GitHub atau redeploy Coolify dari sesi ini.

## 12. Hal yang perlu ditinjau pemilik

Apakah pembayaran transfer dengan verifikasi admin sesuai sebagai pengganti awal SEJOLI? Bila pembayaran harus otomatis melalui payment gateway sejak rilis pertama, penyedia, kredensial sandbox, serta aturan callback/rekonsiliasi perlu ditetapkan sebelum implementasi bagian transaksi.

Rancangan ini belum menyatakan bahwa source sudah diperbaiki atau siap produksi.
