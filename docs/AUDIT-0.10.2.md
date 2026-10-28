# Audit halaman publik KonsepSTIFIn 0.10.2

Baseline: source 0.10.1 dari pekerjaan sebelumnya. Pemeriksaan mencakup source, halaman publik yang tersedia melalui pencarian, serta browser pada aplikasi lokal. Salinan halaman dari pencarian dapat tertinggal dari deployment, sehingga verifikasi hasil perubahan dilakukan pada source kandidat dan aplikasi lokal, bukan dianggap sebagai bukti kondisi produksi terbaru.

## Temuan dan tindakan

| Temuan | Tindakan |
| --- | --- |
| Beranda masih berfokus pada dua jalur lama | Perbarui hero, pilihan perjalanan, ringkasan katalog, dan navigasi agar kelas/ebook serta pusat mitra mudah ditemukan |
| Harga beranda menjadi paragraf panjang | Tampilkan baris nama/harga dengan tautan per produk, angka tabular, dan jarak baca yang konsisten |
| Gaya hero, kartu, angka, dan tombol kurang seragam | Tambahkan stylesheet khusus public-site untuk header, hero, harga, kartu layanan, tahapan promotor, affiliate, kontak, dan footer. Aturan tersebut tidak menimpa seluruh admin secara global |
| Tautan akun publik masih menonjolkan admin | Utamakan Akun saya. Pertahankan akses admin melalui footer |
| Halaman affiliate mengatakan akun affiliate belum tersedia | Sesuaikan dengan fitur yang sudah ada: tautan produk pribadi, komisi per status, pengajuan pencairan, dan persetujuan admin |
| Kontak belum mempunyai jalur affiliate dan bantuan produk digital | Tambahkan jalur login ke Bantuan akun. Tetap jelaskan aktivasi peran mitra oleh admin |
| Tujuan Bantuan/pusat mitra hilang setelah login | Tambahkan return path internal yang diizinkan dan redirect yang sesuai. Tujuan eksternal atau /admin tetap tidak diterima |
| Direktori promotor dan layanan kota tidak selalu memakai shell publik yang sama | Tambahkan layout/header/footer yang konsisten serta target skip navigation pada halaman publik terkait |
| Angka dibaca dengan menghapus semua karakter selain digit | Gunakan parser Rupiah utuh yang menolak rentang dan kalimat dengan angka tambahan |
| Total tahap tidak lengkap dapat terbaca nol atau harga paket yang salah | Total/saving hanya ditampilkan jika sumber angka valid dan lengkap. Harga paket yang masih memerlukan penawaran tidak diganti dengan jumlah tahap terpisah |
| Nilai nol layanan atau satu Rupiah program affiliate bisa membingungkan pengunjung | Bedakan Minta penawaran, Konfirmasi jadwal, dan Konfirmasi ketentuan berdasarkan konteks. Tidak mengubah nilai database/ledger |
| Data terstruktur dapat menampilkan penawaran gratis yang belum disetujui | Hapus Offer nol dari informasi program affiliate. Offer layanan hanya diterbitkan jika harga tetap positif tersedia dan memakai URL detail yang benar |
| Produk mewarisi metadata/canonical beranda | Tambahkan metadata per produk. Produk tidak tersedia tidak diundang untuk diindeks |
| Pemuatan font mengandalkan CSS eksternal | Sertakan dua font variabel lokal beserta lisensinya. Tidak menambah dependency runtime produksi |
| /api/health masih mencantumkan versi 0.9.1 | Ambil versi dari package.json dan periksa kecocokannya dalam smoke release |
| Label sumber layanan lama menyebut checkout SEJOLI | Sesuaikan istilah publik pada lapisan presentasi, tanpa menghapus sumber data administrasi |

## Verifikasi

- Seluruh suite Vitest: 279 pengujian lulus, 6 dilewati, sebelum penambahan satu kasus batas terakhir pada kalkulasi paket.
- Pengujian parser/kalkulasi angka terakhir: 5 lulus, termasuk kasus paket yang masih memerlukan penawaran. Empat kasus sudah tercakup dalam suite sebelumnya, satu kasus tambahan memverifikasi perbaikan terakhir.
- ESLint, TypeScript, dan Next production build: lulus.
- Smoke standalone HTTP: lulus. Mencakup akun, migrasi, CRM, referral, checkout, pembayaran, worker, ebook, sertifikat, komisi/pencairan manual, hapus/arsip, harga, font lokal, versi health, serta canonical produk.
- Browser Chromium: halaman beranda, tes, calon promotor, affiliate, kontak, tentang, direktori promotor, wilayah, dan edukasi diperiksa pada 1440 px dan 390 px.
- Menu ponsel diperiksa pada 320 px. Lebar dokumen diperiksa agar tidak melebihi viewport pada halaman yang diuji.
- Materi/video, sertifikat, halaman produk, admin produk, dan pusat mitra tetap ikut pemeriksaan browser dari smoke sebelumnya.

Pengujian memakai data sintetis serta PGlite dan adapter PostgreSQL wire, bukan database produksi pengguna. Hasil ini tidak membuktikan seluruh karakteristik konkurensi PostgreSQL produksi. Tidak ada voucher riil atau transfer bank yang dijalankan. Video pihak ketiga masih mengikuti izin embed dan koneksi provider.

## Kebijakan angka yang dipertahankan

Tidak ada perubahan otomatis pada harga yang sudah disimpan admin, snapshot invoice, nilai ledger, saldo, persentase komisi, atau akun. Harga default di source juga tidak dibulatkan menjadi angka baru tanpa konfirmasi bisnis. Format tampilan dan penafsiran konteks bukan perubahan harga transaksi.

Nilai khusus seperti tambahan satu Rupiah dapat mempunyai maksud operasional. Bila nilai tersebut salah, admin perlu memperbaikinya melalui editor produk, lalu halaman publik mengikuti data tersebut. Perilaku ini menghindari rilis UI yang diam-diam mengubah harga jual.

## Batas cakupan

Tampilan publik dan konsistensi alur diperbarui. Rilis ini tidak menambahkan gateway pembayaran, booking otomatis, email transaksi, reset password mandiri, bundel, atau penandatangan sertifikat baru. Aktivasi affiliate tetap keputusan admin. Pengajuan melalui Bantuan belum menjadi aktivasi otomatis.

Tidak ada jaminan peningkatan penjualan, peringkat pencarian, hasil tes, atau penghasilan mitra. Tidak ada angka statistik pemasaran baru yang dibuat untuk memperindah halaman. Gambar yang sudah ada tetap digunakan, tanpa dinyatakan sebagai bukti jumlah peserta atau testimoni baru.

## Sesudah deploy

Buka /api/health dan pastikan version 0.10.2. Periksa ulang harga produksi pada Semua produk, lalu bandingkan kartu landing dengan detail produk yang sama. Gunakan akun uji untuk memeriksa permintaan layanan dan sumber referral. Untuk database yang sudah memakai migrasi 008, tidak ada migrasi tambahan.
