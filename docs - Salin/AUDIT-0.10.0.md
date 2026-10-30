# Audit source dan perubahan KonsepSTIFIn 0.10.0

Tanggal: 28 Oktober 2026. Baseline: KonsepSTIFIn 0.9.1. Referensi pembanding: source Averion 1.2.138 dan Spesifikasi-Pengembangan-KonsepSTIFIn-dari-Averion.md yang disertakan pemilik proyek. Ini adalah laporan perubahan source, bukan hasil pemeriksaan server produksi.

## Temuan dan perbaikan

| Temuan | Perubahan 0.10.0 | Pengujian |
| --- | --- | --- |
| Layanan lama ada di public_products, sementara katalog kelas memakai learning_products | Tambahkan source_product_key unik sebagai penghubung. Personal, pasangan, keluarga, keluarga plus, sekolah, dan jalur promotor masuk katalog gabungan. Data layanan lama tetap dipakai. Perubahan nama/harga/status melalui kedua editor disinkronkan oleh aplikasi | Uji integrasi katalog PostgreSQL emulasi, perubahan harga layanan tanpa mereset komisi, serta pemeriksaan HTTP source standalone |
| Affiliate hanya melihat komisi tanpa daftar produk yang jelas | Tambahkan /akun/produk, pencarian, harga, status komisi, tautan per produk, dan tombol salin. Hubungkan dari menu akun, halaman referral, dan halaman komisi | Uji menu peran dan smoke HTTP halaman akun |
| Referral layanan tercatat di lead tetapi tidak masuk ledger komisi | Pembuatan invoice dari lead menyimpan atribusi dan snapshot aturan produk pada transaksi yang sama. Pembayaran lunas menghasilkan komisi melalui rekonsiliasi yang sudah ada. Refund mengoreksi komisi tanpa menghapus invoice | Uji partial/full payment, idempotensi, referral keluarga sampai komisi, refund, dan pencairan |
| Affiliate tanpa keanggotaan promotor tidak dapat membuat tautan | Peran affiliate yang sudah diberikan admin dapat memiliki alias. Atribusi affiliate tidak membuat penugasan promotor palsu. Peran promoter tetap diperlukan untuk voucher | Uji alias affiliate, kunjungan, sumber referral tanpa kode promotor, dan pencabutan akses setelah akun nonaktif |
| Slug wajib diketik dan duplikasi memberi kesalahan umum | Preview slug dari judul. Server menambah akhiran unik dalam transaksi. Slug khusus duplikat mendapat pesan yang jelas. Edit judul tidak diam-diam mengganti slug lama | Uji nama sama, slug khusus duplikat, dan perubahan judul |
| Produk ebook menggunakan formulir kelas | Formulir ebook berisi unggahan PDF/EPUB privat, bukan instruksi menyusun modul. Publikasi memerlukan file. Akses ebook tidak menampilkan progres atau tombol penyelesaian kelas | Uji komponen formulir ebook, API unggah, tipe file, akses sesudah pelunasan, dan akun lain ditolak |
| Tidak ada tombol hapus produk/materi | Tambahkan aksi admin product.delete dan lesson.delete dengan konfirmasi di UI. Data belum dipakai dihapus. Data bersejarah diarsipkan. Materi wajib pembelian lama tetap bisa diselesaikan | Uji hapus produk kosong, arsip produk terjual, invoice tetap ada, materi arsip untuk peserta lama, dan penerbitan sertifikat |
| Redirect referral membuat URL berdasarkan alamat request container | Gunakan Location relatif pada host yang sedang dibuka pengunjung. Pertahankan product identifier dengan allowlist. Alamat internal 0.0.0.0 tidak dimasukkan ke redirect | Uji request dengan host 0.0.0.0:3000 dan tujuan produk keluarga. Uji tujuan eksternal tetap ditolak |
| Tampilan produk, pembelajaran, dan mitra kurang konsisten | Perbarui header, navigasi ruang kerja, kartu produk, warna, filter, pencarian, status, tautan promosi, unggahan, dan kondisi kosong. Layout memiliki aturan responsif serta reduced motion | Uji komponen dan isolasi CSS dari hero publik. Pemeriksaan browser visual belum berhasil dijalankan |
| Link /akun/kelas memakai tab=kelas yang tidak dikenali | Ubah ke tab=classes, pertahankan rute lama sebagai redirect kompatibel | Pemeriksaan source dan build |
| Kesalahan jaringan pada editor layanan lama dapat meninggalkan tombol menyimpan | Tambahkan penanganan kesalahan dan reset status saving melalui finally | Lint, TypeScript, dan pemeriksaan source |
| Dashboard komisi dapat menampilkan nol sebelum data selesai dimuat | Tampilkan indikator belum dimuat. Batasi API partner dan pengajuan pencairan ke peran mitra | Uji pembatasan role pada API |

## Referensi adaptasi Averion

Source Averion `pages/admin/products.php` menyediakan referensi daftar produk berdasarkan jenis, pencarian, dan pembuatan slug dari nama. `helpers/product-presentation.php` membedakan ebook sebagai file siap diunduh. Pola tersebut diadaptasikan pada Next.js dan PostgreSQL KonsepSTIFIn. Backend PHP Averion tidak ditambahkan sebagai aplikasi kedua.

## Cara data dihubungkan

- Layanan lama mempertahankan product_key dan ID pada public_products. Satu baris katalog terhubung melalui source_product_key. Indeks unik mencegah penggandaan karena katalog dibuka berulang.
- Editor kartu layanan tetap mengelola manfaat, bonus, dan informasi halaman publik. Ruang Semua produk mengelola katalog gabungan serta kebijakan komisi. Sinkronisasi memakai jalur aplikasi, bukan mengandalkan perubahan SQL manual di luar aplikasi.
- Layanan tes dan workshop offline menggunakan formulir CRM. Produk digital memakai checkout peserta. Kedua jalur memakai commerce_orders dan commerce_ledger yang sama.
- Pesanan layanan dapat memiliki kontak tanpa akun. Akun aktif dengan email yang sesuai pada saat invoice dibuat dihubungkan ke riwayat pembelian. Sistem tidak membuat akun palsu dan tidak memberi hak akses kelas untuk layanan tes.
- Mitra sumber dibaca dari atribusi lead yang tersimpan. Penugasan ulang promotor tidak mengganti mitra asal. Pengecualian pembelian sendiri pada layanan memeriksa email kontak terhadap email akun mitra. Produk digital menggunakan ID akun pembeli.
- Nominal komisi tidak diaktifkan oleh rilis. Admin memilih kebijakan dan persentase per produk. Aturan baru tidak diterapkan surut pada invoice lama.
- Rekening, password, alias lama, akun, dan transaksi tetap menggunakan penyimpanan yang sudah ada. File privat memerlukan volume persisten terpisah dari database.

## Hasil verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Vitest seluruh suite | 263 lulus, 6 dilewati sesuai konfigurasi suite. 61 berkas lulus, 3 berkas dilewati |
| Pengujian identity Node | 78 lulus |
| Pengujian jaringan promotor Node | 7 lulus |
| Pengujian akses/sesi Node | 45 lulus |
| ESLint | Lulus, tanpa error |
| Next production build dan TypeScript | Lulus |
| Smoke aplikasi standalone | Lulus. Akun, migrasi, CRM, referral, voucher simulasi, worker, checkout, pembayaran, progres, sertifikat, komisi dan payout manual, katalog layanan, ebook privat, serta hapus/arsip diuji melalui HTTP |
| Pemeriksaan visual browser desktop/ponsel | Belum berhasil. Browser lokal tidak tersedia dan unduhan browser gagal. Hasil komponen/CSS bukan pengganti pemeriksaan visual browser |
| Deployment pada Coolify pengguna | Belum dilakukan. Tidak ada akses deployment yang diberikan pada sesi ini |
| Voucher riil, transfer bank, dan layanan API produksi | Tidak dijalankan |

Pengujian database memakai PGlite serta adapter PostgreSQL wire untuk menjalankan postgres.js. Ini tidak membuktikan seluruh perilaku konkurensi, kinerja, atau konfigurasi PostgreSQL produksi. Smoke memakai data dan akun sintetis, bukan DATABASE_URL produksi pengguna. Build berhasil bukan jaminan domain, TLS, izin volume, dan konfigurasi proxy produksi sudah benar.

## Batas cakupan dan pekerjaan berikutnya

Rilis ini menyelesaikan masalah utama yang dilaporkan dan sambungan katalog/referral/komisi layanan. Seluruh spesifikasi jangka panjang Averion tidak dinyatakan selesai.

- Bundel tetap hanya draf. Isi paket dan pemberian akses bundel belum diaktifkan.
- Webinar dan konsultasi masih memerlukan koordinasi pengelola. Tidak ada kalender booking atau integrasi rapat otomatis.
- Pembayaran dan pencairan menggunakan verifikasi/transfer manual. Tidak ada payment gateway atau autodebet baru.
- Tidak ada pengiriman email pemasaran otomatis baru. Notifikasi akun mengikuti sistem yang sudah ada.
- File unggahan yang akhirnya tidak dipakai tidak dibersihkan otomatis. Penghapusan fisik perlu memperhatikan pemakaian file oleh materi lain dan backup.
- Produk lama yang sebelumnya disebut ebook tetapi belum memiliki file perlu dilengkapi. Rilis tidak menciptakan isi buku.
- Invoice lama, komisi lama, serta kontak yang mendaftar akun setelah invoice dibuat tidak direkonsiliasi surut secara otomatis.
- Visual UI pada browser pengguna dan lingkungan Coolify perlu diperiksa setelah upgrade sesuai panduan. Perubahan desain pada source sudah tersedia, tetapi tidak diklaim identik secara visual dengan Averion.

## Berkas utama

`src/lib/product-store.ts`, `src/lib/learning-service.ts`, `src/lib/commerce-store.ts`, `src/lib/commerce-service.ts`, `src/lib/referral-service.ts`, `src/lib/interest-service.ts`, `src/app/admin/kelas/`, `src/app/akun/produk/`, `src/app/belajar/`, `src/app/api/learning/`, `src/app/r/[alias]/route.ts`, dan `scripts/migrations/008-unified-catalog.sql`.

Ikuti `UPGRADE-0.10.0.md` sebelum mengaktifkan transaksi baru.
