# Audit dan hasil perubahan 0.10.1

Baseline: source 0.10.0 yang disiapkan pada percakapan ini. Pemeriksaan menggunakan source 0.9.1, implementasi 0.10.0, referensi Averion, dan screenshot masalah yang diberikan pengguna. Tidak ada akses ke database atau deployment Coolify produksi.

## Temuan yang ditangani

| Temuan | Perbaikan |
| --- | --- |
| Materi video hanya menjadi tautan tab baru | Pemutar inline untuk YouTube, Vimeo, dan file HTTPS MP4/WebM/OGV. URL diubah menjadi sumber embed dari provider yang diizinkan, bukan menerima HTML iframe bebas. Tautan eksternal menjadi bantuan opsional bila video tidak dapat disematkan |
| Sertifikat menyerupai halaman teks biasa | Layout formal dengan bingkai hijau/emas, nama peserta, program, tanggal, penerbit, nomor verifikasi, dan status berlaku/dicabut. Ada tombol cetak/simpan PDF dan salin tautan verifikasi. CSS cetak memakai A4 mendatar |
| Produk landing, katalog, dan affiliate mempunyai pengalaman tujuan berbeda | Halaman detail canonical /produk/layanan/PRODUCT_KEY untuk layanan dan /produk/SLUG untuk digital. Kartu layanan landing, katalog, admin, dan affiliate memakai tujuan tersebut |
| URL /belajar?product=... dapat menjadi katalog yang membingungkan | Tautan lama dialihkan oleh server ke detail produk yang tepat, bukan mengandalkan filter state komponen |
| Affiliate tersebar di beberapa halaman | Pusat /akun/mitra memiliki tab Produk promosi, Komisi & pencairan, serta Tautan affiliate. Menu akun memiliki satu pintu Produk & affiliate. /akun/produk dan /akun/komisi lama tetap berfungsi sebagai redirect |
| Editor produk admin masih terpisah | /admin/produk diarahkan ke Semua produk. Editor layanan kini mengelola manfaat, bonus, label, dan catatan harga bersama nama/harga/status/komisi |
| Pilihan produk hilang setelah login/daftar | Tujuan produk dibawa melalui parameter next dan diperiksa dengan allowlist internal. Login kembali ke produk tersebut. Daftar tetap dilanjutkan dengan login tanpa otomatis membuat pesanan berbayar |
| Slug digital dapat menyerupai kode layanan | Namespace layanan dipisah dan tautan promosi baru membawa jenis service/digital. Kelas dengan slug wsl1 tidak tertukar dengan layanan WSL 1 |
| Gangguan katalog ikut ditampilkan saat peserta membuka materi yang sudah tersedia | Pesan kesalahan dipisahkan per bagian. Pembacaan GET mendapat satu retry untuk respons server 5xx. Aksi pembayaran/checkout tidak diberi retry otomatis oleh helper tersebut |
| Rekening pembayaran bisa gagal dimuat tanpa penjelasan | Data rekening dimuat ketika membuka Pembelian, memakai retry GET yang sama. Kegagalan ditampilkan dengan tombol muat ulang, sementara rekening yang belum dikonfigurasi diberi keterangan yang jelas |

## Arti satu link produk

Halaman landing, dashboard, dan pusat affiliate mengarah ke produk yang sama. Contoh paket keluarga selalu menuju /produk/layanan/paketKeluarga. Tautan referral tetap melalui /r/ALIAS terlebih dahulu untuk mencatat mitra, kemudian menuju halaman detail tersebut.

URL detail biasa tidak otomatis menunjuk affiliate. Untuk promosi, gunakan tombol salin tautan pada pusat mitra. Kebijakan referral pertama yang valid dan masa 30 hari tetap berlaku. Pada layanan CRM, sumber mitra disimpan ketika calon klien menyetujui pembagian kontak. Komisi memerlukan konfigurasi admin dan pembayaran yang sah. Rilis ini tidak mengaktifkan nominal komisi secara sepihak atau menghitung komisi surut untuk pesanan lama.

Layanan tes tetap memerlukan koordinasi jadwal dan harga melalui CRM. Ebook dan e-course menggunakan checkout akun. Keduanya mempertahankan ledger transaksi yang sama.

## Verifikasi

- Suite Vitest, ESLint, Next production build, dan TypeScript dijalankan pada source rilis.
- Smoke menjalankan aplikasi standalone, migrasi, akun, CRM, referral, pembayaran simulasi, worker, hak akses ebook/materi, komisi dan pencairan manual, serta penghapusan/arsip dengan data sintetis.
- Browser Chromium dipakai untuk memeriksa desktop 1440 px dan ponsel 390 px: materi, iframe video, produk layanan, admin produk, pusat mitra, serta sertifikat.
- Sertifikat dari browser dicetak menjadi satu halaman PDF A4 landscape. Data uji sertifikat yang sudah terkena refund tetap ditandai dicabut, sesuai status database.
- Pemeriksaan overflow dilakukan pada halaman detail produk ponsel dan halaman mitra pada dua lebar layar.
- Sumber video dipastikan dipasang sebagai iframe/native video dengan URL yang sesuai. Pengujian ini tidak membuktikan bahwa setiap video pihak ketiga dapat diputar. Izin embed, akun private, koneksi, dan kebijakan provider tetap berlaku. URL video produksi pengguna belum diberikan.
- Database pengujian memakai PGlite dengan adapter PostgreSQL wire. Hasil ini tidak mengklaim pengujian konkurensi atau kinerja PostgreSQL produksi, voucher riil, maupun transaksi bank riil.

Angka hasil pengujian akhir dicatat pada HASIL-PENGUJIAN-0.10.1.txt di root paket.

## Prioritas yang masih perlu tahap berikutnya

1. Alur lupa password yang dapat dipakai peserta sendiri. Fondasi akun tidak sama dengan halaman pemulihan yang siap dipakai pengguna.
2. Pengaturan identitas penerbit sertifikat, logo resmi, dan penandatangan yang benar-benar disetujui pemilik. Rilis ini tidak membuat tanda tangan atau akreditasi fiktif.
3. Notifikasi transaksi di luar inbox aplikasi, termasuk konfirmasi pembayaran serta pengingat status. Integrasi kanal/email memerlukan konfigurasi penyedia yang dipilih pengelola.
4. Pratinjau ebook/PDF di dalam akun dan pengelolaan file yang tidak terpakai. Unduhan privat yang sudah ada tetap berfungsi.
5. Penjadwalan layanan dan webinar, bundel, serta gateway pembayaran bila dibutuhkan. Fitur tersebut belum diaktifkan oleh rilis tampilan ini.
6. Peninjauan isi layanan lama, termasuk catatan harga atau teks yang masih menyebut checkout SEJOLI. Data yang sudah diedit admin tidak ditimpa otomatis. Kini teks layanan dapat diperbaiki dari satu editor.

Tidak ada perubahan pada password, kode sertifikat, invoice, kebijakan komisi yang sudah tersimpan, atau sumber referral historis yang dimaksudkan oleh rilis ini. Migrasi sampai 008 tetap merupakan prasyarat. Untuk instalasi yang sudah berhasil pada 0.10.0, tidak ada migrasi baru.
