# Serah Terima Katalog SEJOLI v12

Tanggal: 18 Juli 2026

## Perubahan

- Menambahkan URL produk SEJOLI untuk seluruh paket Tes STIFIn, WSL 1, WSL 2,
  ID dan Scanner, Paket Lengkap Promotor, dan program affiliate.
- Program Affiliate Promotor memakai halaman pendaftaran Affiliate Konsep
  STIFIn yang sama sampai produk khusus tersedia.
- Menyamakan nama dan harga website dengan daftar produk kerja terbaru.
- Memperbaiki total investasi tahap utama promotor menjadi Rp9.125.000, yaitu
  WSL 1 + WSL 2 + ID dan Scanner. Paket Lengkap tidak lagi ikut dijumlahkan.
- Menambahkan migrasi `catalog-2026-07-sejoli-v2-live-links` agar katalog dan
  URL checkout diterapkan satu kali ke tabel `public_products`.

## Harga Website

| Produk | Harga |
| --- | ---: |
| Tes STIFIn Personal | Rp599.000 |
| Tes STIFIn Pasangan | Rp1.099.000 |
| Tes STIFIn Keluarga | Rp1.549.000 |
| Tes STIFIn Keluarga Plus | Rp2.399.000 |
| Tes STIFIn Sekolah & Komunitas | Mulai Rp4.990.000 |
| Workshop STIFIn Level 1 | Rp875.000 |
| Workshop STIFIn Level 2 | Rp4.250.000 |
| ID Aplikasi & Scanner Promotor | Rp4.000.000 |
| Paket Lengkap Menjadi Promotor | Rp8.500.000 |
| Program Affiliate | Gratis |

## Pemeriksaan Wajib Sebelum Produksi

Harga pada halaman produk SEJOLI masih harus disamakan dengan tabel di atas.
Jangan menjalankan kampanye sebelum harga website dan harga checkout identik.

Setelah deployment:

1. Buka `/admin/produk` untuk menjalankan dan memeriksa migrasi katalog.
2. Periksa `/tes-stifin`, `/jadi-promotor`, dan `/affiliate`.
3. Klik setiap CTA dan pastikan menuju produk SEJOLI yang benar.
4. Pastikan total investasi tahap utama menampilkan Rp9.125.000.
5. Lakukan satu transaksi uji sebelum kampanye publik.
