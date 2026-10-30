# UI/UX KonsepSTIFIn 0.10.17

## Prinsip desain

- **Jelas sebelum indah:** setiap halaman menjelaskan siapa penggunanya, apa manfaat layanan, dan langkah selanjutnya.
- **Jalur berdasarkan status:** pengunjung baru, pelanggan/anggota, calon promotor, dan promotor aktif tidak diarahkan ke CTA yang sama.
- **Informasi transparan:** harga, promo, proses, jadwal, dan status yang belum pasti dinyatakan secara eksplisit.
- **Satu sumber promo:** informasi promo tetap berasal dari pengaturan admin.
- **Mobile-first:** kartu, navigasi, formulir, CTA, dan footer harus nyaman dipakai di layar kecil.
- **Aksesibilitas:** tautan tetap bisa dinavigasi dengan keyboard, focus-visible terlihat, dan animasi menghormati reduced motion.

## Implementasi rilis

- Beranda: jalur akun bagi pelanggan/anggota dan promotor aktif ditampilkan setelah banner promo.
- Header: tautan Masuk dan Daftar terlihat untuk pengunjung; akun yang terdeteksi tetap diarahkan ke ruang sesuai peran.
- Halaman calon promotor: CTA membedakan calon promotor dari promotor yang sudah aktif.
- Footer: navigasi dikelompokkan agar lebih mudah dipindai.
- Halaman detail produk: hierarchy visual, harga, informasi penting, proses, FAQ, dan CTA dipertegas.

## KPI yang disarankan untuk evaluasi

1. Rasio klik CTA utama dari beranda ke halaman layanan.
2. Rasio pengunjung yang membuka halaman detail produk.
3. Rasio formulir permintaan selesai dibanding formulir dimulai.
4. Rasio daftar akun yang berhasil dan login berhasil.
5. Rasio calon promotor yang mengajukan konsultasi setelah membaca tahapan.
6. Tingkat kegagalan checkout dan perbedaan status pembayaran dengan catatan Moota.
7. Kecepatan halaman, Core Web Vitals, dan tingkat keluar di perangkat mobile.

Jangan menetapkan target angka tanpa baseline analitik. Catat baseline terlebih dahulu, lalu evaluasi per minggu.
