# Panduan Singkat Upload Website

## 1. Lengkapi link SEJOLI

Buka `src/app/site-config.ts`, lalu tempel seluruh link checkout pada bagian
`sejoliLinks`. Jangan mengubah file lain hanya untuk mengganti link.

## 2. Periksa informasi produk

Pada file yang sama, periksa:

- harga Tes STIFIn Personal;
- fasilitas paket keluarga dan institusi;
- bonus e-book atau video;
- tahapan WSL 1, WSL 2, ID, dan alat;
- ketentuan Affiliate Umum dan Affiliate Promotor Resmi.

## 3. Upload ke GitHub

Ekstrak ZIP hasil akhir. Upload seluruh isi folder ke repository
`konsepstifin-platform`, lalu commit ke branch `main`.

## 4. Deploy melalui Coolify

Setelah GitHub selesai diperbarui, buka aplikasi di Coolify dan jalankan
deployment terbaru. Aplikasi menggunakan Dockerfile dan port 3000.

## 5. Uji setelah deployment

Periksa halaman utama melalui desktop dan ponsel. Klik setiap tombol produk,
WSL, ID dan alat, serta affiliate untuk memastikan semuanya menuju halaman
SEJOLI yang tepat.

> Jangan memasukkan password, API key, token, atau data pribadi pelanggan ke
> dalam repository.
