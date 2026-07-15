# Konsep STIFIn Platform

Platform tes STIFIn dan pengembangan jaringan promotor Indonesia.

## Isi versi ini

- Website utama untuk layanan personal, keluarga, sekolah, dan komunitas.
- Bonus produk berupa e-book, video, atau fasilitas lain yang mudah disesuaikan.
- Jalur calon promotor: Preview, WSL 1, WSL 2, lalu ID dan alat sesuai persyaratan.
- Dua program affiliate: Affiliate Umum dan Affiliate Promotor Resmi.
- Pusat edukasi dengan halaman daftar dan detail artikel yang siap dikembangkan.
- Dashboard artikel dengan login admin, status draf/terbit, serta penyimpanan PostgreSQL.
- Tombol **Masuk tim** mengarah ke portal pengelolaan artikel yang dilindungi login.

Panduan menambahkan artikel tersedia di `PANDUAN_ARTIKEL.md`.
Panduan mengaktifkan editor dan PostgreSQL tersedia di
`PANDUAN_DASHBOARD_ARTIKEL.md`.

## Memasang link checkout SEJOLI

Semua link checkout dipusatkan dalam satu file:

```text
src/app/site-config.ts
```

Buka file tersebut, lalu isi bagian `sejoliLinks` dengan URL lengkap dari
landing page atau checkout produk SEJOLI. Contoh:

```ts
export const sejoliLinks = {
  tesPersonal: 'https://alamat-checkout-sejoli-anda',
  paketKeluarga: 'https://alamat-checkout-sejoli-anda',
  // lanjutkan untuk produk lainnya
};
```

Jika sebuah link belum diisi, tombol tidak akan rusak. Website otomatis
membuka formulir minat agar calon pelanggan tetap dapat dihubungi.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Aplikasi berjalan pada `http://localhost:3000`.

## Deployment

Repository ini sudah dilengkapi `Dockerfile` untuk deployment melalui Coolify.
Port aplikasi: `3000`.

Domain staging: `https://tes.konsepstifin.com`.

## Keamanan

Jangan menyimpan password, token, API key, atau data peserta dalam repository.
Gunakan Environment Variables di Coolify untuk seluruh informasi rahasia.

## Catatan sebelum dipublikasikan

- Periksa kembali harga, bonus, komisi affiliate, dan persyaratan program.
- Pastikan setiap produk SEJOLI sudah aktif sebelum link ditempel.
- Uji seluruh tombol checkout pada desktop dan ponsel.
