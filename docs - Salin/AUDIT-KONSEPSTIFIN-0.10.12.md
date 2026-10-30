# Audit KonsepSTIFIn 0.10.12

## Tujuan rilis

Menggabungkan perbaikan pengalaman calon klien, pemisahan peran akun, landing page produk, informasi transaksi, dan keterbacaan pengaturan integrasi dalam satu deployment.

## Perubahan

1. Navigasi publik membaca sesi akun dan membedakan Masuk, Akun Peserta, Pusat Promotor, Pusat Cabang, Pusat Mitra, Pengajar, dan Ruang Admin.
2. Endpoint `/api/account/me` mengembalikan label peran, email, nama promotor jika tersedia, dan status kepala cabang tanpa mengirim kredensial rahasia.
3. Formulir minat memeriksa sesi sebelum tampil. Pengunjung tetap dapat mengajukan tanpa akun. Akun terdaftar mendapat email awal. Promotor, kepala cabang, dan affiliate dapat memilih pengajuan untuk diri sendiri atau calon klien. Mode calon klien meminta persetujuan kontak dan pembagian data yang eksplisit.
4. Pemilihan layanan di formulir bantuan menjadi reaktif. Jika pengguna memilih Family Test, skema promo tampil jika promo aktif dan tersedia.
5. Homepage memiliki empat jalur utama: personal, keluarga, kelompok, dan kemitraan; ditambah alur langkah, informasi penting, dan FAQ.
6. Landing page produk menjelaskan audiens yang sesuai, proses, fasilitas, informasi sebelum mengajukan, FAQ, dan langkah berikutnya.
7. Dashboard akun memisahkan peserta, affiliate, promotor/kepala cabang, dan admin.
8. Footer publik diperbaiki agar tidak menyempitkan deskripsi menjadi kolom sangat kecil pada desktop dan tetap responsif pada mobile.
9. Panel integrasi merapikan status Moota/StarSender, menjelaskan field ID rekening dan path, serta menyamarkan token pada tampilan URL webhook StarSender. Tombol salin tetap menyalin URL lengkap.
10. Instruksi voucher menjelaskan urutan pembayaran dan status verifikasi secara lebih jelas. Mode simulasi tetap memberi peringatan untuk tidak mentransfer uang.
11. Nomor versi package dan health endpoint diperbarui menjadi `0.10.12`.

## Database dan konfigurasi

- Tidak ada migrasi database baru pada rilis ini.
- Variabel lingkungan dasar dan integrasi yang sudah tersimpan tetap dipertahankan.
- Perubahan kredensial Moota/StarSender tetap dikelola dari halaman admin dan tidak memerlukan redeploy.
- Path Create Terima Uang Moota tidak diisi otomatis oleh rilis ini karena endpoint dan payload pembuatan link pembayaran belum terverifikasi secara independen. Jangan mengaktifkan pembuatan tagihan otomatis sampai endpoint resmi dan responsnya diuji.
- Inbound-first StarSender dari rilis sebelumnya tetap dipertahankan. Penerimaan chat tidak otomatis menjadi persetujuan marketing.

## Batasan yang diketahui

- Pengajuan layanan dicatat sebagai lead CRM. Rilis ini tidak menambahkan relasi baru agar riwayat lead tampil sebagai daftar personal pada dashboard peserta.
- Profil peserta umum belum menyimpan nama/nomor WhatsApp di tabel identitas; formulir masih meminta nama dan nomor WhatsApp. Email akun diisi awal.
- Harga, jadwal, dan penugasan promotor tetap membutuhkan konfirmasi sesuai alur yang sudah ada.
