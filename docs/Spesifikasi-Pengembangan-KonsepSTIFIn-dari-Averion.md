# Spesifikasi Pengembangan KonsepSTIFIn Berdasarkan Averion

- **Tanggal:** 28 Oktober 2026.
- **Tujuan dokumen:** bahan arahan dan serah terima kepada developer.
- **Baseline aplikasi:** KonsepSTIFIn 0.8.
- **Referensi:** source Averion 1.2.138 yang diberikan pemilik proyek.
- **Status:** usulan pengembangan, bukan laporan fitur yang sudah diimplementasikan.
- **Batas pekerjaan dokumen ini:** penyusunan spesifikasi. Tidak ada perubahan kode aplikasi.

Fitur Averion dalam dokumen ini diidentifikasi melalui pembacaan source. Pemeriksaan tersebut bukan pengujian seluruh fitur Averion saat berjalan. Bagian yang membutuhkan keputusan bisnis ditandai secara terpisah agar developer tidak menganggapnya sebagai kebijakan yang sudah disetujui.

## 1. Tujuan pengembangan

Mengembangkan KonsepSTIFIn menjadi satu platform untuk:

- Layanan tes STIFIn dan pengelolaan calon klien.
- Jaringan kepala cabang dan promotor.
- Referral serta penjualan melalui mitra.
- Pembelian voucher promotor.
- Penjualan e-course dan produk digital.
- Pembelajaran, progres peserta, dan sertifikat.
- Pembayaran, komisi, serta laporan operasional.

Seluruh fungsi menggunakan **satu akun, satu backend admin, dan satu database utama**.

Averion menjadi referensi fitur dan alur bisnis. Implementasi mengikuti teknologi KonsepSTIFIn yang sekarang, yaitu Next.js dan PostgreSQL. Tidak perlu menjalankan aplikasi PHP Averion sebagai backend kedua.

## 2. Kondisi awal yang harus dipertahankan

Versi 0.8 sudah menyediakan fondasi berikut:

| Bagian | Kondisi awal |
| --- | --- |
| Akun | Login berbasis database, sesi, dan aktivasi akun |
| Jaringan | Kepala cabang dan sepuluh promotor |
| Cabang | Satu cabang untuk satu wilayah kabupaten/kota |
| CRM | Penyimpanan, pencarian, dan penugasan lead |
| Referral | Alias pribadi, tautan historis, dan pencatatan sumber lead |
| Pesanan | Pesanan internal dan pencatatan pembayaran |
| Pembayaran | Transfer yang diverifikasi admin |
| Voucher | Cek saldo, pembelian sesuai jumlah, dan proses pengisian |
| Pengamanan pengiriman | Status pemeriksaan untuk hasil pengisian yang belum pasti |

**Hasil pengujian operasional yang sudah dikonfirmasi pengguna:** pembelian satu voucher dalam mode simulasi berhasil dan pembayaran tercatat lunas.

Keberhasilan pengisian voucher riil masih perlu diverifikasi pada transaksi operasional yang sah.

Pengembangan selanjutnya harus mempertahankan akun, kata sandi, alias, transaksi, dan data jaringan yang sudah ada.

## 3. Peta fitur Averion yang bisa diadaptasi

| Fitur yang ditemukan pada source Averion | Pengembangan untuk KonsepSTIFIn | Prioritas |
| --- | --- | --- |
| Katalog produk dengan beberapa jenis produk | Katalog layanan, e-course, ebook, webinar, dan paket | Utama |
| Kelas, kategori, serta materi | Pengelolaan kelas dan modul belajar | Utama |
| Akses produk setelah pembayaran | Pembukaan akses kelas setelah lunas | Utama |
| Progres dan materi terakhir dibuka | Progres belajar dan tombol lanjutkan belajar | Utama |
| Masa akses produk | Akses kelas berjangka atau tanpa tanggal berakhir | Utama |
| Unduhan dengan pemeriksaan akses | Modul PDF, worksheet, dan ebook terlindungi | Utama |
| Materi bertahap | Pembukaan modul berdasarkan waktu sejak akses aktif | Berikutnya |
| Sertifikat manual dan otomatis | Sertifikat penyelesaian kelas | Berikutnya |
| Affiliate dan aturan komisi | Komisi penjualan mitra per produk | Utama setelah checkout kelas |
| Pengajuan pencairan komisi | Pengelolaan payout mitra | Setelah komisi stabil |
| Bundel produk | Paket beberapa kelas atau produk | Berikutnya |
| Kupon | Diskon dengan batas penggunaan | Berikutnya |
| Order bump dan upsell | Penawaran tambahan saat atau setelah pembelian | Lanjutan |
| Lead magnet | Materi gratis untuk pendaftaran calon pelanggan | Berikutnya |
| Daftar tunggu dan peluncuran produk | Pendaftaran minat sebelum kelas dibuka | Berikutnya |
| Email sequence dan broadcast | Pesan transaksi dan tindak lanjut terjadwal | Bertahap |
| Pemulihan checkout terbengkalai | Pengingat pesanan yang belum selesai | Setelah notifikasi stabil |
| Adapter pembayaran dan callback | Integrasi satu penyedia pembayaran yang dipilih | Setelah alur manual stabil |
| Ulasan produk | Ulasan peserta yang mempunyai akses atau pembelian | Berikutnya |
| Tiket bantuan | Bantuan terkait akun, pembayaran, dan kelas | Berikutnya |
| Analitik funnel dan pelacakan | Laporan perjalanan pengunjung sampai pembelian | Bertahap |
| Canvas dan rotator halaman | Halaman promosi dan pengujian variasi halaman | Lanjutan |
| Pembagian pendapatan partner | Kerja sama dengan pengajar atau pemilik materi | Lanjutan |
| Lisensi produk perangkat lunak | Penjualan produk dengan kunci lisensi | Opsional |
| Pengaturan staf, log, dan kesehatan sistem | Hak akses staf dan pemantauan operasional | Fondasi |

**Catatan:** source Averion juga memiliki pengingat perpanjangan akses. Alurnya menggunakan pembayaran ulang. Jangan menganggap fitur tersebut sudah menyediakan autodebet langganan.

## 4. Akun dan pembagian hak akses

### 4.1 Satu akun dengan beberapa peran

Satu orang dapat memiliki beberapa peran tanpa membuat akun baru.

Contoh:

- Kepala cabang sekaligus promotor.
- Promotor sekaligus affiliate.
- Promotor sekaligus peserta kelas.
- Pengajar sekaligus peserta kelas.

Email atau identitas akun tetap menjadi penghubung utama. Jangan membuat akun pelanggan baru setiap kali orang yang sama membeli produk lain.

### 4.2 Hak akses yang disarankan

| Peran | Akses yang diberikan |
| --- | --- |
| Pemilik/admin utama | Pengaturan platform, produk, akun, pembayaran, jaringan, dan laporan |
| Kepala cabang | Operasional cabang, promotor, lead cabang, dan voucher sesuai kewenangan |
| Staf keuangan | Verifikasi pembayaran, pemeriksaan transaksi, dan pencairan sesuai izin |
| Staf konten | Mengelola produk, halaman, dan materi sesuai izin |
| Promotor/mitra | Lead yang ditugaskan, tautan referral, voucher sendiri, dan penjualan sendiri |
| Affiliate nonpromotor | Tautan serta komisi produk yang diizinkan |
| Pengajar | Kelas dan peserta yang menjadi tanggung jawabnya |
| Pelanggan/peserta | Pembelian, kelas, unduhan, progres, dan sertifikat sendiri |

Affiliate nonpromotor merupakan kemungkinan pengembangan. Jangan langsung membuka pendaftarannya sebelum admin menentukan aturan penerimaan.

**Kriteria penerimaan:**

- Pelanggan tidak dapat membuka fungsi admin.
- Promotor tidak dapat melihat lead promotor lain tanpa penugasan.
- Pengajar tidak memperoleh akses ke seluruh data keuangan platform.
- Perubahan peran berlaku pada pemeriksaan akses berikutnya.
- Pembatasan berlaku pada API dan file, bukan hanya pada menu.

## 5. Katalog produk yang terhubung dengan transaksi

Katalog perlu mendukung jenis produk berikut:

1. Layanan tes STIFIn.
2. Voucher khusus promotor.
3. E-course.
4. Ebook atau modul digital.
5. Webinar atau kelas langsung.
6. Konsultasi atau coaching.
7. Bundel beberapa produk.

Jenis produk menentukan tindakan setelah pembayaran.

| Jenis produk | Tindakan setelah pembayaran |
| --- | --- |
| Tes STIFIn | Membuka proses penjadwalan atau penanganan layanan |
| Voucher promotor | Memproses pengisian melalui API STIFIn |
| E-course | Memberikan hak akses kelas |
| Ebook | Memberikan hak unduh |
| Webinar | Memberikan informasi dan akses acara |
| Konsultasi | Membuka proses penjadwalan |
| Bundel | Memberikan hak atas seluruh isi paket |

Data produk minimal mencakup:

- Nama, slug, jenis, deskripsi, dan gambar.
- Harga serta status publikasi.
- Isi yang diterima pembeli.
- Masa akses jika berlaku.
- Kebijakan komisi.
- Hubungan dengan kelas, file, atau layanan.
- Riwayat perubahan penting.

**Ketentuan penting:**

- Harga berasal dari server.
- Pesanan menyimpan harga dan isi produk saat pembelian.
- Perubahan produk tidak mengubah nilai pesanan lama.
- Produk yang pernah terjual sebaiknya diarsipkan, bukan dihapus beserta riwayatnya.

Untuk tahap awal, pisahkan checkout voucher dan checkout kelas. Keranjang campuran dapat dikembangkan setelah pemenuhan masing-masing produk stabil.

## 6. Modul e-course

### 6.1 Struktur pembelajaran

Gunakan struktur:

**Produk e-course → modul → materi.**

Contoh struktur kelas:

| Tingkat | Contoh |
| --- | --- |
| Produk e-course | Pengantar Konsep STIFIn |
| Modul | Pengenalan materi |
| Materi | Video, artikel, PDF, atau latihan |

Nama kelas dan isi materi ditentukan pengelola. Contoh tersebut hanya menggambarkan struktur.

### 6.2 Fungsi admin dan pengajar

Pengelola dapat:

- Membuat kelas dan kategori.
- Menambahkan deskripsi, thumbnail, dan pengajar.
- Menyusun modul serta urutan materi.
- Menambahkan video, teks, file, dan tautan yang diizinkan.
- Menentukan materi pratinjau gratis.
- Menentukan materi wajib.
- Mengatur status draft, terbit, dan arsip.
- Melihat daftar peserta serta progresnya.
- Memberikan akses manual dengan alasan yang tercatat.

Source Averion mendukung beberapa bentuk konten, termasuk embed dan HTML. Pada KonsepSTIFIn, konten tersebut harus melalui sanitasi dan pembatasan sumber. Jangan menyediakan eksekusi script bebas dari editor materi.

### 6.3 Fungsi peserta

Peserta dapat:

- Melihat kelas yang dimiliki.
- Membuka modul dan materi yang sudah tersedia.
- Melanjutkan materi terakhir.
- Menandai materi selesai.
- Melihat progres.
- Mengunduh file yang menjadi haknya.
- Melihat masa berlaku akses.
- Mengajukan bantuan terkait kelas.

### 6.4 Pembukaan akses setelah pembayaran

Alur yang diinginkan:

1. Pelanggan memilih kelas.
2. Sistem membuat pesanan.
3. Pelanggan menyelesaikan pembayaran.
4. Admin atau integrasi pembayaran memverifikasi pelunasan.
5. Sistem memberikan akses kelas satu kali.
6. Kelas muncul pada akun pelanggan.

Pemberian akses harus aman terhadap pemrosesan ulang. Klik verifikasi atau callback berulang tidak boleh menggandakan hak akses.

Pembayaran sebagian belum membuka akses, kecuali suatu produk memiliki aturan cicilan atau uang muka yang disetujui secara khusus.

### 6.5 Akses kelas gratis

Kelas gratis perlu memiliki alur pendaftaran tersendiri.

Sistem memberikan akses dengan sumber yang jelas, misalnya:

- Pendaftaran kelas gratis.
- Bonus pembelian.
- Pemberian admin.
- Program promosi.

Jangan membuat penerimaan pembayaran fiktif untuk memberikan akses gratis.

## 7. Progres, materi bertahap, dan masa akses

### 7.1 Progres belajar

Simpan minimal:

- Materi terakhir dibuka.
- Materi yang diselesaikan.
- Waktu penyelesaian.
- Jumlah materi wajib.
- Persentase progres.

Penandaan selesai harus idempoten. Klik berulang tidak menambah hitungan.

**Catatan untuk developer:** tombol selesai atau sinyal dari pemutar video merupakan catatan aktivitas. Data tersebut tidak otomatis membuktikan pemahaman peserta.

Jika pengelola memerlukan penilaian kompetensi, tambahkan kuis atau tugas sebagai modul tersendiri.

### 7.2 Materi bertahap

Averion memiliki pembukaan modul berdasarkan jumlah hari sejak akses produk aktif.

KonsepSTIFIn dapat mengadaptasikan aturan tersebut, misalnya:

- Modul pertama langsung terbuka.
- Modul berikutnya terbuka beberapa hari kemudian.
- Peserta melihat tanggal pembukaannya.

Pemeriksaan harus berlangsung pada server. Materi terkunci tidak boleh terbuka melalui URL langsung, API, atau tautan unduhan.

### 7.3 Masa akses dan perpanjangan

Produk dapat mempunyai:

- Akses dengan tanggal berakhir.
- Akses tanpa tanggal berakhir.
- Akses berdasarkan periode program.

Untuk perpanjangan berbayar, usulan perilakunya:

- Jika akses masih aktif, durasi baru ditambahkan dari tanggal berakhir sebelumnya.
- Jika sudah berakhir, akses baru dihitung dari waktu aktivasi yang ditentukan.
- Progres belajar tetap tersimpan.
- Pembayaran yang sama tidak memperpanjang akses berulang kali.

Developer harus memastikan perubahan masa akses tidak mengulang jadwal materi secara tidak sengaja.

### 7.4 Perubahan isi kelas

Ketika pengajar menambahkan materi wajib, peserta lama bisa mengalami perubahan progres.

Karena itu, tentukan kebijakan versi kelas:

- Materi baru berlaku untuk seluruh peserta; atau
- Persyaratan penyelesaian mengikuti versi saat peserta bergabung.

Kebijakan ini perlu diputuskan sebelum sertifikat otomatis diaktifkan.

## 8. Sertifikat dan unduhan terlindungi

### 8.1 Sertifikat

Adaptasi fitur Averion untuk:

- Penerbitan manual oleh pengelola.
- Penerbitan otomatis berdasarkan syarat penyelesaian.
- Nomor sertifikat unik.
- Nama peserta dan nama program.
- Tanggal penerbitan.
- Unduhan PDF.
- Halaman verifikasi publik.
- Pencabutan sertifikat dengan alasan tercatat.

Halaman verifikasi cukup menampilkan data yang diperlukan. Jangan menampilkan email, nomor telepon, atau rincian pembayaran peserta.

Sertifikat penyelesaian e-course harus mempunyai penamaan yang jelas. Jangan menyamakannya dengan kewenangan resmi promotor atau sertifikasi lain tanpa dasar dari penyelenggara terkait.

### 8.2 Ebook, PDF, dan worksheet

File berbayar harus mengikuti hak akses akun.

Persyaratan:

- Pemeriksaan akses sebelum setiap unduhan.
- Tautan unduhan sementara.
- Penyimpanan file di lokasi yang tidak terbuka langsung.
- Log unduhan untuk pemeriksaan operasional.
- Pemutusan akses saat hak unduh berakhir atau dicabut.
- Penyimpanan file yang tetap tersedia setelah redeploy.

Proteksi ini mengendalikan akses dari platform. Jangan menjanjikan pencegahan mutlak terhadap penyalinan file setelah pengguna mengunduhnya.

## 9. Affiliate dan komisi mitra

### 9.1 Gunakan fondasi referral yang sudah ada

Pertahankan:

- Kode promotor resmi.
- Alias pribadi yang dapat diubah.
- Alias lama yang tetap dimiliki akun yang sama.
- Sumber referral yang tersimpan.
- Persetujuan pembagian kontak.
- Penugasan lead yang terpisah dari sumber referral.

Sumber referral, petugas penanganan, dan pelaksana layanan merupakan data yang berbeda.

Contoh: Yeni mendatangkan calon pelanggan. Kepala cabang kemudian menugaskan promotor lain untuk menangani layanan. Sistem tetap menyimpan Yeni sebagai sumber pendaftar.

**Penerima komisi pada situasi tersebut harus mengikuti kebijakan bisnis, bukan otomatis mengikuti perubahan penugasan.**

### 9.2 Atribusi penjualan

Referral lead yang sekarang ada perlu dihubungkan ke proses checkout.

Pesanan menyimpan:

- Identitas mitra asal.
- Alias atau sumber referral yang berlaku.
- Produk yang dibeli.
- Aturan atribusi yang dipakai.
- Aturan komisi saat transaksi.
- Alasan jika admin melakukan pengecualian.

Jangan langsung menyalin fitur pengikatan pelanggan seumur hidup dari Averion.

KonsepSTIFIn saat ini menggunakan konsep first-touch referral dengan masa berlaku 30 hari untuk lead. Penerapannya pada pembelian berikutnya perlu ditentukan secara eksplisit.

### 9.3 Aturan komisi

Averion menyediakan referensi komisi per produk dan aturan berdasarkan level.

Tahap awal KonsepSTIFIn cukup mendukung:

- Produk tanpa komisi.
- Komisi persentase.
- Komisi nominal tetap sebagai pengembangan tambahan.
- Aturan khusus mitra jika dibutuhkan.
- Tanggal mulai berlakunya aturan.

Usulan dasar perhitungan: nilai item setelah diskon, dengan perlakuan biaya transaksi dan komponen lain ditentukan terpisah.

Besaran komisi belum ditetapkan dalam dokumen ini.

**Voucher promotor sebaiknya tidak otomatis menghasilkan komisi affiliate.** Jika diperlukan, aktifkan melalui kebijakan khusus agar pembelian stok tidak dianggap sama dengan penjualan produk kepada pelanggan.

### 9.4 Status komisi

Gunakan status yang jelas:

1. Tercatat dan menunggu.
2. Disetujui.
3. Tersedia untuk pencairan.
4. Dicadangkan untuk permintaan pencairan.
5. Dibayar.
6. Ditolak atau dibalik dengan alasan.

Komisi tidak langsung menjadi uang yang dapat ditarik hanya karena pesanan dibuat.

Ketika refund terjadi:

- Sistem menghitung dampaknya terhadap komisi.
- Riwayat awal tetap tersimpan.
- Koreksi dilakukan melalui transaksi pembalik.
- Komisi yang sudah dibayar masuk proses penyelesaian sesuai kebijakan.

### 9.5 Pencairan

Mitra dapat:

- Melihat rincian komisi.
- Melihat saldo tersedia.
- Mengajukan pencairan.
- Melihat status dan bukti pembayaran.

Admin dapat:

- Meninjau pengajuan.
- Menyetujui atau menolak dengan alasan.
- Mencatat pembayaran dan referensinya.
- Melihat siapa yang memproses.

Dana yang masuk pengajuan harus dicadangkan secara atomik agar dua permintaan tidak memakai saldo yang sama.

Untuk tahap awal, pencairan tetap melalui transfer manual oleh admin.

## 10. Pembayaran dan pemenuhan produk

KonsepSTIFIn harus tetap memiliki satu sumber pencatatan pembayaran.

Jangan membuat status lunas terpisah pada modul kelas, voucher, dan affiliate yang dapat saling bertentangan.

Pisahkan tiga keadaan:

| Keadaan | Contoh |
| --- | --- |
| Pesanan | Diterbitkan atau dibatalkan |
| Pembayaran | Belum dibayar, sebagian, lunas, atau dikembalikan |
| Pemenuhan | Akses kelas aktif, voucher berhasil, atau perlu pemeriksaan |

Integrasi pembayaran dapat mengadaptasikan pola adapter Averion. Source yang tersedia memuat adapter Midtrans, Xendit, Tripay, Duitku, Moota, dan PayPal.

Daftar tersebut merupakan temuan source. Pemilihan penyedia dan kelayakan integrasinya harus diverifikasi saat implementasi.

**Usulan:** pilih satu integrasi terlebih dahulu berdasarkan rekening dan layanan yang dipakai pengelola.

Persyaratan integrasi:

- Verifikasi autentikasi atau tanda tangan callback.
- Cocokkan nomor pesanan, nilai, dan mata uang.
- Cegah pencatatan pembayaran ganda.
- Tangani callback terlambat dan urutan status yang berubah.
- Sediakan rekonsiliasi ketika data berbeda.
- Pisahkan kredensial pengujian dan produksi.
- Jalankan pemberian akses setelah pembayaran sah tersimpan.

Aturan voucher yang sudah ada tetap berlaku: hasil pengiriman yang belum pasti tidak boleh diulang otomatis.

## 11. Promosi, paket, dan pendaftaran minat

### 11.1 Bundel

Contoh kebutuhan:

- Paket beberapa e-course.
- E-course dan ebook.
- Program belajar dengan sesi konsultasi.

Sistem menyimpan isi bundel saat pembelian. Perubahan isi paket berikutnya tidak boleh mencabut hak pembeli lama secara diam-diam.

### 11.2 Kupon

Kupon dapat dibatasi berdasarkan:

- Produk.
- Tanggal.
- Jumlah penggunaan.
- Penggunaan per akun.
- Minimal pembelian.
- Mitra atau kampanye.

Validasi dilakukan pada server dan aman terhadap dua checkout bersamaan.

### 11.3 Order bump dan upsell

Averion memiliki referensi untuk penawaran tambahan.

Fitur ini dapat diterapkan setelah checkout utama stabil, dengan ketentuan:

- Harga tambahan terlihat jelas.
- Pelanggan memilih secara sadar.
- Sistem tidak menambahkan produk berbayar otomatis.
- Setiap item mempunyai aturan komisi dan pemenuhan yang jelas.

### 11.4 Lead magnet dan daftar tunggu

Gunakan untuk:

- Materi pengantar gratis.
- Ebook contoh.
- Webinar pengenalan.
- Pendaftaran minat kelas mendatang.

Sumber referral tetap tercatat. Persetujuan pemasaran dan pembagian kontak harus jelas.

Untuk tahap awal, gunakan formulir KonsepSTIFIn yang sudah ada. Builder formulir bertingkat dan editor halaman visual dapat ditunda agar backend tetap sederhana.

## 12. Notifikasi, bantuan, dan pengelolaan pelanggan

### 12.1 Notifikasi transaksi

Prioritaskan pesan untuk:

- Aktivasi dan pemulihan akun.
- Pesanan dibuat.
- Pembayaran diterima.
- Akses kelas diberikan.
- Pengisian voucher berhasil atau perlu pemeriksaan.
- Masa akses mendekati berakhir.
- Sertifikat tersedia.
- Status pencairan komisi.

Gunakan antrean dengan log pengiriman dan pencegahan pesan ganda.

Kegagalan notifikasi tidak boleh membatalkan pembayaran atau hak akses yang sudah sah.

### 12.2 Pesan pemasaran

Averion memiliki referensi email sequence, broadcast, dan pengingat checkout.

Untuk KonsepSTIFIn:

- Pisahkan pesan transaksi dari pemasaran.
- Sediakan persetujuan dan penghentian pesan pemasaran.
- Hentikan pengingat bayar setelah lunas.
- Batasi frekuensi pengiriman.
- Catat kegagalan dan percobaan ulang.

Pilih satu kanal utama terlebih dahulu. Tidak perlu memasang seluruh penyedia pesan yang ada pada Averion.

### 12.3 Tiket bantuan

Tiket dapat terhubung dengan:

- Akun.
- Pesanan.
- Voucher.
- Kelas.
- Materi.
- Komisi.

Pengguna hanya melihat tiketnya sendiri. Staf mendapat akses sesuai penugasan.

### 12.4 Pemulihan kata sandi

Tambahkan alur lupa kata sandi agar pengelola tidak harus menangani setiap kasus secara manual.

Token pemulihan harus sekali pakai, mempunyai batas waktu, dan tidak mengungkap kata sandi lama.

## 13. Dashboard dan laporan

### 13.1 Dashboard admin

Tampilkan:

- Penjualan dan penerimaan pembayaran.
- Refund.
- Pesanan belum selesai.
- Pengisian voucher yang perlu pemeriksaan.
- Peserta serta akses kelas aktif.
- Komisi menunggu, tersedia, dan dibayar.
- Antrean notifikasi yang gagal.
- Kesehatan worker.

### 13.2 Dashboard mitra

Tampilkan:

- Tautan referral.
- Lead yang boleh diakses.
- Penjualan yang diatribusikan.
- Komisi berdasarkan status.
- Riwayat pencairan.
- Voucher miliknya.

### 13.3 Dashboard peserta

Tampilkan:

- Kelas yang dimiliki.
- Progres dan materi terakhir.
- Masa akses.
- Unduhan.
- Sertifikat.
- Riwayat pembelian.

### 13.4 Prinsip laporan

- Bedakan jumlah pesanan dari penerimaan uang.
- Jangan menghitung pesanan belum dibayar sebagai pendapatan diterima.
- Bedakan penjualan bruto, diskon, refund, biaya, dan komisi.
- Hindari hitungan ganda pada callback atau pemrosesan ulang.
- Pisahkan transaksi simulasi dari laporan operasional riil.
- Gunakan tampilan waktu yang konsisten untuk pengguna.

## 14. Struktur backend dan data yang disarankan

Tetap gunakan satu backend, tetapi bagi tanggung jawab modul dengan jelas.

| Modul | Tanggung jawab |
| --- | --- |
| Akun dan izin | Identitas, sesi, peran, dan pemulihan |
| Jaringan | Cabang, wilayah, serta keanggotaan promotor |
| CRM dan referral | Lead, persetujuan, sumber, dan penugasan |
| Katalog | Produk, harga, bundel, dan promosi |
| Commerce | Pesanan, pembayaran, serta refund |
| Voucher | Integrasi dan pemeriksaan pengisian |
| Learning | Kelas, modul, materi, dan progres |
| Hak akses | Pemberian, perpanjangan, dan pencabutan akses |
| Affiliate | Atribusi penjualan dan ledger komisi |
| Notifikasi | Template, antrean, serta log |
| Operasional | Bantuan, audit, laporan, dan pemantauan |

Entitas tambahan yang kemungkinan dibutuhkan:

- Kelas, modul, dan materi.
- Hubungan produk dengan kelas.
- Hak akses peserta.
- Progres dan materi terakhir.
- Aset unduhan.
- Sertifikat.
- Atribusi pesanan.
- Snapshot aturan komisi.
- Ledger komisi dan pencairan.
- Kupon dan penggunaan.
- Bundel dan isi paket.
- Antrean notifikasi.
- Tiket bantuan.

Nama tabel dan rincian teknis diserahkan kepada developer. Hindari membuat tabel pelanggan, pesanan, atau pembayaran baru yang menggandakan fungsi sistem sekarang.

### 14.1 Prinsip proses latar

Gunakan pola pencatatan tugas yang tahan restart:

1. Pembayaran sah tersimpan.
2. Tugas pemberian akses, komisi, dan notifikasi tercatat.
3. Worker memprosesnya.
4. Setiap tugas memiliki kunci unik.
5. Status dapat diperiksa admin.

Tugas lokal yang idempoten dapat dicoba ulang. Pengiriman voucher dengan hasil belum pasti tetap mengikuti aturan pemeriksaan manual.

## 15. Fitur yang ditunda atau memerlukan pengembangan baru

### 15.1 Ditemukan pada Averion, tetapi belum perlu diprioritaskan

- Editor halaman visual lengkap.
- Pengujian variasi halaman.
- Harga yang naik otomatis berdasarkan penjualan.
- Banyak level membership.
- Reseller dengan halaman penjualan sendiri.
- Pembagian pendapatan partner yang kompleks.
- Lisensi perangkat lunak.
- Banyak payment gateway sekaligus.
- Integrasi MCP atau API eksternal yang luas.

Aktifkan berdasarkan kebutuhan operasional yang jelas.

### 15.2 Usulan baru yang belum dipastikan tersedia pada source yang diperiksa

- Bank soal dan kuis dengan penilaian.
- Tugas yang dinilai pengajar.
- Kehadiran webinar.
- Penilaian kompetensi.
- Penjadwalan konsultasi dengan kapasitas dan kalender.
- Aplikasi mobile atau pembelajaran offline.

Developer perlu memperlakukan daftar kedua sebagai pengembangan tambahan. Jangan menganggapnya sudah tersedia dan tinggal dipindahkan.

## 16. Urutan pengerjaan yang disarankan

| Tahap | Ruang lingkup | Hasil yang harus dapat digunakan |
| --- | --- | --- |
| 1 | Katalog transaksi, akun pelanggan, e-course, hak akses, progres, dan unduhan | Pelanggan membeli satu kelas dan langsung belajar setelah lunas |
| 2 | Atribusi checkout, aturan komisi, dashboard mitra, serta pencairan manual | Penjualan kelas melalui mitra dapat ditelusuri sampai komisi dibayar |
| 3 | Materi bertahap, sertifikat, bundel, kupon, dan notifikasi transaksi | Pengelolaan kelas serta promosi lebih lengkap |
| 4 | Satu integrasi pembayaran, rekonsiliasi, bantuan, serta laporan lanjutan | Beban verifikasi dan penanganan berkurang |
| 5 | Otomasi pemasaran dan fitur opsional yang dipilih | Pengembangan mengikuti kebutuhan yang terbukti |

Keamanan akun, audit, backup, dan migrasi menjadi bagian setiap tahap.

**Target pertama yang paling berguna:** satu e-course berbayar yang bisa dibeli pelanggan, dibuka setelah lunas, dan dipromosikan melalui tautan mitra.

## 17. Keputusan bisnis yang perlu ditetapkan

Developer tidak boleh menetapkan sendiri hal-hal berikut:

| Keputusan | Hal yang perlu ditentukan |
| --- | --- |
| Produk awal | Kelas atau produk digital pertama yang akan dijual |
| Masa akses | Berjangka atau tanpa tanggal berakhir |
| Syarat sertifikat | Materi selesai, penilaian, atau persetujuan pengajar |
| Komisi | Persentase atau nominal, dasar hitung, serta produk yang berlaku |
| Atribusi | Berlaku per transaksi atau pengikatan pelanggan tertentu |
| Pembelian sendiri | Apakah mitra memperoleh komisi atas pembeliannya sendiri |
| Mitra nonaktif | Perlakuan lead dan komisi ketika mitra dinonaktifkan |
| Refund | Dampaknya terhadap akses, sertifikat, dan komisi |
| Pencairan | Minimal pengajuan, jadwal, serta bukti yang diperlukan |
| Pengajar | Hak akses dan kemungkinan pembagian pendapatan |
| Pembayaran | Penyedia yang akan dipakai |
| Notifikasi | Kanal utama dan penyedia pengiriman |
| Perubahan kelas | Dampak materi baru terhadap peserta dan sertifikat lama |

Sampai keputusan tersebut tersedia, gunakan perilaku terbatas yang jelas. Misalnya komisi produk belum aktif, alih-alih menerapkan persentase tanpa persetujuan.

## 18. Kriteria penerimaan dan serah terima developer

Pengembangan dinyatakan selesai jika skenario berikut terbukti:

1. Akun lama tetap bisa masuk setelah upgrade.
2. Pelanggan dapat membeli kelas tanpa dibuatkan akun duplikat.
3. Pembayaran sebagian tidak membuka kelas.
4. Pelunasan membuka akses satu kali.
5. Pemrosesan ulang tidak menggandakan pembayaran, akses, atau komisi.
6. Pengguna lain tidak dapat membuka materi dan file melalui URL langsung.
7. Materi bertahap tetap terkunci pada server.
8. Progres tetap tersimpan setelah logout dan redeploy.
9. Perpanjangan tidak menghapus progres.
10. Refund mengikuti kebijakan akses dan komisi yang ditetapkan.
11. Alias mitra lama tetap berfungsi.
12. Perubahan penugasan lead tidak menghapus sumber referral.
13. Harga dan komisi pesanan lama tetap mengikuti snapshot.
14. Pencairan bersamaan tidak memakai saldo komisi yang sama.
15. Sertifikat hanya terbit ketika syarat terpenuhi.
16. Kegagalan notifikasi tidak membatalkan hak akses.
17. Restart worker tidak menggandakan proses.
18. Pengembangan kelas tidak mengganggu pengisian voucher.
19. Transaksi simulasi tidak masuk laporan transaksi riil.
20. Backup dapat dipulihkan beserta file pembelajaran.

Developer menyerahkan:

- Source lengkap.
- Daftar migrasi database.
- Daftar ENV baru beserta fungsinya.
- Panduan upgrade dari versi yang berjalan.
- Panduan admin, mitra, pengajar, dan peserta.
- Hasil pengujian.
- Panduan backup dan pemulihan.
- Catatan batas fitur yang belum dikerjakan.
- Paket yang tetap mendukung unggah manual GitHub dan redeploy Coolify.

## 19. Referensi source untuk developer

Gunakan arsip `Averion-v1.2.138-GitHub-Coolify.zip` sebagai sumber referensi. Path di bawah relatif terhadap root source Averion setelah diekstrak. Penulisan path ini sengaja tidak bergantung pada lokasi workspace percakapan.

| Kebutuhan | Referensi Averion |
| --- | --- |
| Struktur data | `averion.sql` |
| Akses setelah bayar, perpanjangan, dan materi bertahap | `helpers/order-core.php` |
| Tampilan kelas dan progres | `pages/user/class-detail.php` |
| Pembaca materi | `pages/user/material-view.php` |
| Pemeriksaan penyelesaian materi | `actions/user/complete-material.php` |
| Unduhan dan sertifikat | `helpers/downloads-certs.php` |
| Atribusi affiliate | `helpers/affiliate.php` |
| Aturan komisi | `helpers/commission.php` |
| Otomasi pemasaran | `helpers/marketing-automation.php` |
| Proses latar | `cron/process.php` |

Referensi tambahan dapat diperiksa pada folder `payment_gateways`, `webhooks`, `notifications`, serta halaman admin terkait produk, komisi, pencairan, bundel, kupon, dan tiket bantuan.

**Arahan pengerjaan:** pertahankan fondasi KonsepSTIFIn 0.8, bangun e-course terlebih dahulu, lalu hubungkan penjualannya dengan affiliate. Adaptasikan fitur Averion secara bertahap agar pengelolaan tetap satu pintu.
