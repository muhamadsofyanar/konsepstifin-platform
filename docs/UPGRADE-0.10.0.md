# Upgrade KonsepSTIFIn 0.10.0

Paket source lengkap dari baseline 0.9.1. Rilis ini menggabungkan layanan lama dengan katalog digital dan produk promosi mitra. Baca juga AUDIT-0.10.0.md untuk cakupan serta batas verifikasi.

## Persiapan

1. Backup database PostgreSQL dan volume file. Catat commit/release 0.9.1 untuk rollback aplikasi.
2. Unggah **isi** folder konsepstifin-0.10.0 ke root repository aplikasi yang sama. package.json dan Dockerfile harus berada pada root. Jangan menimpa Environment Variables Coolify dengan .env.example.
3. Pertahankan DATABASE_URL yang sama. Jangan membuat database baru, menjalankan provision ulang, mengimpor ulang akun, atau mengganti kata sandi.
4. PLATFORM_ORIGIN harus berisi origin publik yang digunakan untuk login, misalnya https://konsepstifin.com, tanpa slash akhir. Jangan gunakan 0.0.0.0 atau domain contoh untuk produksi. HOSTNAME=0.0.0.0 pada Dockerfile tetap benar sebagai alamat bind container.
5. Pasang volume persisten yang dapat ditulis user node pada /app/storage/learning. Tetapkan LEARNING_STORAGE_PATH=/app/storage/learning. File ebook yang diunggah disimpan di lokasi ini. Jangan meletakkannya di public.
6. Bila proxy membatasi unggahan, izinkan request lebih dari 20 MB beserta overhead multipart. Batas file aplikasi tetap 20 MB.

## Satu deployment aplikasi

Deploy source 0.10.0 menggunakan Dockerfile bawaan. Setelah container baru berjalan, buka terminal container dan jalankan:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Command memakai DATABASE_URL yang sudah tersimpan pada container. Jangan menyalin kredensial ke chat atau log. Semua migrasi berurutan akan diperiksa/dijalankan ulang. Migrasi 008 menambahkan identitas penghubung produk layanan dan mengizinkan pembelian layanan dari kontak CRM yang belum memiliki akun. Tidak ada penghapusan akun atau transaksi.

Jalankan migrasi pada jendela pemeliharaan sebelum membuka transaksi baru. Jika memakai post-deployment command Coolify, jalankan command yang sama sebagai langkah rilis. Katalog 0.10 memerlukan migrasi 008. Healthy pada healthcheck hanya menunjukkan server web sudah berjalan.

Muat ulang /admin/kelas?section=products. Produk publik lama akan dihubungkan berdasarkan product_key yang sudah ada. Penambahan tersebut tidak mengubah harga publik, password, atau aturan komisi yang telah disetel. Tidak perlu deployment kedua setelah migrasi. Worker learning dan voucher tetap berjalan bersama web.

## Menu dan alur baru

| Kebutuhan | Menu |
| --- | --- |
| Semua layanan, ebook, e-course, dan komisi produk | /admin/kelas?section=products |
| Detail kartu layanan lama seperti benefit dan bonus | /admin/produk |
| Modul dan materi e-course | /admin/kelas?section=lessons |
| Verifikasi pembayaran transfer | /admin/pesanan |
| Persetujuan komisi dan pencairan | /admin/kelas?section=finance |
| Daftar produk promosi mitra | /akun/produk |
| Katalog publik gabungan | /belajar?tab=catalog |
| Akses ebook dan kelas yang dimiliki | /belajar?tab=classes |

### Layanan personal, pasangan, keluarga, dan promotor

Layanan lama kini muncul bersama produk digital. Nama, deskripsi, harga, dan status tersambung dengan pengelolaan kartu layanan. Detail benefit/bonus tetap di editor layanan lama. Layanan dengan harga berupa konfirmasi atau program sekolah ditampilkan sebagai permintaan penawaran, bukan otomatis mendapat layanan gratis.

Layanan menggunakan formulir permintaan dan CRM agar admin mengonfirmasi wilayah, jumlah peserta, jadwal, dan harga. Produk layanan tidak menjadi kelas otomatis. Harga invoice layanan adalah harga yang disepakati admin pada pesanan.

### Mengaktifkan komisi

1. Buka Semua produk, lalu Edit layanan/produk yang diinginkan.
2. Aktifkan kebijakan atribusi dan isi persentase komisi. Simpan. Tidak ada persentase bawaan yang ditetapkan rilis ini.
3. Promotor atau affiliate yang sudah disetujui admin membuka Produk promosi. Salin tautan produk dan bagikan.
4. Untuk layanan, calon klien membuka produk tersebut dan mengirim formulir. Atribusi kontak memakai referral pertama yang valid selama 30 hari dan disimpan ketika calon klien menyetujui pembagian kontak. Tanpa persetujuan tersebut, sistem tidak menyematkan mitra pada lead.
5. Buat pesanan dari lead asli. Aturan komisi tersimpan ketika pesanan dibuat. Jika nilai draf berubah, nilai yang diterbitkan dipakai sebagai dasar komisi layanan. Penugasan promotor untuk melayani klien tidak mengubah asal referral.
6. Setelah pelunasan diverifikasi, komisi berstatus menunggu tinjauan. Admin menyetujui lalu membuatnya tersedia sebelum mitra mengajukan pencairan.
7. Admin melakukan transfer secara manual, lalu mencatat referensinya. Refund/koreksi pembayaran diproses melalui ledger dan rekonsiliasi yang sama.

Pesanan lama sebelum upgrade tidak dihitung ulang menjadi komisi secara otomatis. Ini menghindari pemberian komisi ganda atau penerapan aturan baru secara surut. Untuk layanan dengan kontak tanpa akun, invoice tetap di CRM. Bila email lead sesuai akun aktif saat pesanan dibuat, pembelian juga terhubung ke riwayat pembelian akun tersebut. Rilis ini tidak menautkan ulang seluruh riwayat berdasarkan email secara surut.

Affiliate tanpa keanggotaan promotor memperoleh tautan berdasarkan peran affiliate yang sudah diberikan admin. Affiliate tidak otomatis menjadi promotor, mendapat voucher, atau ditugaskan menangani tes. Pendaftaran umum tidak otomatis memberi peran affiliate.

### Ebook

Pilih jenis Ebook pada formulir produk. Unggah PDF atau EPUB, maksimal 20 MB, lalu simpan. Produk tidak bisa diterbitkan tanpa file unduhan. File tidak dibuka ke publik atau sebagai pratinjau gratis. Pemilik akses aktif mendapat tombol unduh. Untuk ebook gratis, peserta tetap perlu mendaftar agar hak akses tercatat.

Ebook tidak memakai progres modul atau tombol penyelesaian kelas. File lama yang sudah dipasang sebagai materi file tetap dapat dipakai. Bila ebook lama hanya memiliki teks atau video, unggah file buku sebelum menerbitkan/menyimpan sebagai ebook yang siap dijual.

Pergantian jenis produk setelah ada pembelian atau hak akses ditolak. Buat produk baru untuk menawarkan jenis yang berbeda.

### Slug

Nama produk menghasilkan preview slug. Saat disimpan, server membuat slug unik dengan akhiran -2, -3, dan seterusnya bila terjadi duplikasi. Slug khusus tetap dapat diisi. Mengosongkan slug pada produk lama mempertahankan identitasnya agar tautan yang sudah dibagikan tidak berubah hanya karena judul diganti.

### Hapus dan arsip

Produk digital yang belum digunakan dapat dihapus bersama materi dan kuponnya. Produk dengan pembelian/hak akses disembunyikan melalui arsip agar invoice dan akses pembeli lama tetap ada. Layanan lama diarsipkan dan disembunyikan pada halaman publik, tidak dihapus dari sumber layanan.

Materi yang belum digunakan dapat dihapus. Materi yang produknya sudah dibeli atau diberi akses akan diarsipkan. Materi wajib yang tersimpan dalam snapshot pembelian lama tetap dapat dibuka dan diselesaikan pemiliknya, termasuk untuk syarat sertifikat. Materi arsip tidak masuk pembelian baru. File fisik tidak otomatis dihapus karena mungkin digunakan materi lain. Backup volume secara terpisah.

## Pemeriksaan setelah upgrade

- Login admin dan promotor dengan password lama.
- Buka Semua produk dan pastikan Personal, Pasangan, Keluarga, dan Keluarga Plus ada dengan harga yang benar.
- Buka Produk promosi dari akun mitra. Pastikan status komisi dan tautan spesifik produk tampil.
- Buka tautan referral dari domain publik. Alamat tujuan harus tetap pada domain yang sama dan tidak berubah menjadi 0.0.0.0:3000.
- Uji ebook gratis/draf untuk memastikan volume dapat ditulis dan file dapat diunduh oleh pemilik akses.
- Periksa antrean worker dan status migrasi sebelum transaksi riil. Pengujian source tidak mengirim voucher riil atau transfer bank.

## Rollback

Rollback kode ke release 0.9.1 bila diperlukan. Jangan menghapus kolom atau data migrasi 008 untuk rollback aplikasi. Kolom tambahan kompatibel dengan source lama. Pembelian layanan tanpa akun tetap tidak terlihat oleh dashboard learning 0.9.1, sehingga operasional affiliate layanan perlu dihentikan selama rollback. Bila perlu memulihkan database dari backup, lakukan sebagai prosedur terpisah dengan pemeriksaan transaksi setelah waktu backup. File ebook membutuhkan backup volume sendiri.
