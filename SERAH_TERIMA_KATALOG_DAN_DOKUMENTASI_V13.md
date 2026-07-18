# Serah Terima Upgrade Katalog dan Dokumentasi v13

Tanggal: 18 Juli 2026  
Versi aplikasi: 0.1.2

## Hasil utama

- Harga publik disamakan dengan angka yang tampil pada kartu produk SEJOLI.
- Link produk SEJOLI tetap ditanam sebagai nilai bawaan dan dimasukkan ke database melalui migrasi katalog satu kali.
- Tombol kartu produk aktif langsung membuka checkout SEJOLI.
- Formulir minat tetap tersedia sebagai jalur bantuan memilih layanan, bukan pengganti checkout produk aktif.
- Enam dokumentasi kegiatan nyata ditambahkan ke beranda dan halaman `/tes-stifin`.
- Foto web dikonversi ke WebP dan metadata EXIF/kamera dibuang.

## Harga yang dipakai

| Produk | Harga tampil |
| --- | ---: |
| Tes STIFIn Personal | Rp650.001 |
| Tes STIFIn Pasangan | Rp1.100.000 |
| Tes STIFIn Keluarga | Rp1.550.000 |
| Tes STIFIn Keluarga Plus | Rp2.499.999 |
| Tes STIFIn Sekolah & Komunitas | Gratis |
| Workshop STIFIn Level 1 (WSL 1) | Rp749.999 |
| Workshop STIFIn Level 2 (WSL 2) | Rp4.500.000 |
| ID Aplikasi & Scanner Promotor | Rp4.499.997 |
| Paket Lengkap Menjadi Promotor STIFIn | Rp8.499.999 |
| Program Affiliate Konsep STIFIn | Gratis |

## Perilaku saat redeploy

Migrasi `catalog-2026-07-sejoli-v3-card-prices` berjalan satu kali ketika katalog
pertama kali diakses. Migrasi ini memperbarui katalog database yang sudah ada
agar harga dan URL checkout mengikuti versi ini. Setelah migrasi tercatat,
pengaturan admin berikutnya tidak ditimpa pada setiap restart.

## Cara update GitHub dan redeploy

1. Ekstrak ZIP upgrade ke salinan lokal repository.
2. Salin seluruh isi folder aplikasi ke root repository GitHub dan pertahankan environment variables di Coolify.
3. Commit dan push ke branch yang dipakai deployment.
4. Jalankan redeploy di Coolify.
5. Buka `/`, `/tes-stifin`, `/jadi-promotor`, dan `/affiliate`.
6. Klik setiap tombol produk dan pastikan URL checkout serta harga di SEJOLI sesuai.
7. Buka `/admin/produk` dan pastikan harga database sudah ikut diperbarui.

## Pemeriksaan dokumentasi

Foto yang ditambahkan berasal dari arsip `Kegiatan STIFIn Dalam Ceita.zip`.
Sebelum situs dipublikasikan, pemilik situs tetap perlu memastikan izin penggunaan
wajah peserta untuk publikasi web. Foto tidak diberi klaim hasil atau testimoni.
