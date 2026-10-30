# Audit integrasi KonsepSTIFIn 0.10.7

## Perubahan versi ini

- Riwayat kampanye marketing menampilkan 20 kampanye terakhir.
- Ringkasan antrean StarSender menampilkan jumlah pending, sending, sent, failed, dan unknown.
- Tombol pembaruan mengambil status terbaru dari API admin tanpa memuat ulang halaman.
- Tidak ada perubahan skema database; tetap gunakan migrasi 011 dari versi 0.10.6.

## Cakupan integrasi yang dipertahankan

- Moota API V2: tes koneksi daftar rekening, pembuatan link Terima Uang melalui path yang dikonfigurasi, validasi signature webhook, deduplikasi transaksi, pencocokan pembayaran, dan rekonsiliasi manual.
- StarSender V3: notifikasi pesanan, notifikasi pembayaran, outbox, worker, dan kampanye marketing berbasis persetujuan eksplisit.

## Batas verifikasi

- Pemeriksaan sintaks TypeScript/TSX mencakup seluruh 293 file di `src`, tanpa diagnostic sintaks.
- Skrip worker lolos `node --check`.
- Build penuh, suite tes, dan koneksi live tidak dapat dikonfirmasi pada lingkungan ini karena dependensi proyek tidak tersedia dan akses registry npm tidak ada.
- Integrasi pembuatan link Moota belum boleh dianggap siap produksi sampai path create dan field request dicocokkan dengan dokumentasi API aktif akun Moota dan diuji di staging.
