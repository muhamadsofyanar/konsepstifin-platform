# Serah Terima Revisi v15.3

Revisi ini menambahkan alur optimasi konten yang aman dan memperbaiki keterbacaan halaman Affiliate.

## Perubahan utama

1. Dashboard **Content Intelligence** memiliki tombol **Analisis otomatis**.
2. Analisis menampilkan pratinjau keyword utama, keyword sekunder, search intent, cluster, peran pilar/cluster/pendukung, dan internal link.
3. Perubahan massal baru disimpan setelah admin menekan **Terapkan** dan menyetujui konfirmasi.
4. Pemetaan otomatis tidak mengubah judul, isi artikel, bukti pengalaman, reviewer, maupun sumber pustaka.
5. Editor artikel memiliki tombol **Optimalkan isi dengan AI** untuk artikel yang sudah tersimpan.
6. Hasil optimasi AI hanya dimasukkan ke formulir sebagai pratinjau. Admin tetap harus memeriksa lalu menekan **Simpan**.
7. AI tidak mengisi bukti nyata atau reviewer. Kedua data tersebut hanya boleh diisi manusia berdasarkan fakta.
8. Kontras teks bagian **Cara Kerja Affiliate** diperbaiki: judul, paragraf, nomor langkah, dan garis pemisah sekarang memakai warna yang terbaca pada latar terang.

## Cara menggunakan pemetaan aman

1. Masuk ke `/admin/intelligence`.
2. Klik **Analisis otomatis**.
3. Periksa skor proyeksi dan daftar perubahan.
4. Klik **Terapkan ke ... artikel** jika hasilnya sesuai.
5. Periksa ulang pilar dan internal link di dashboard.

## Cara menggunakan optimasi isi AI

1. Masuk ke `/admin/artikel` dan pilih artikel tersimpan.
2. Pada bagian **Content Intelligence**, klik **Optimalkan isi dengan AI**.
3. Periksa isi, ringkasan, inti artikel, dan catatan pemeriksaan.
4. Klik **Simpan** hanya jika hasil sudah benar.

## Pemeriksaan teknis

- `npm run lint`: lulus tanpa peringatan.
- `npm run build`: lulus pada Next.js 16.2.10.
- Versi aplikasi: `0.2.3` (paket revisi v15.3).

## Redeploy Coolify

1. Unggah isi paket ke repository GitHub `muhamadsofyanar/konsepstifin-platform` pada branch `main`.
2. Commit dan push perubahan.
3. Buka aplikasi `konsepstifin-platform` di Coolify.
4. Klik **Redeploy** atau **Deploy Latest Commit**.
5. Pastikan log berakhir dengan `Rolling update completed`.
6. Buka `/affiliate`, `/admin/intelligence`, dan `/admin/artikel` untuk pemeriksaan singkat.
