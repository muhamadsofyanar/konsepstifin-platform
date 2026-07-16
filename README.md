# Konsep STIFIn Platform

Platform tes STIFIn dan pengembangan jaringan promotor Indonesia.

## Isi versi ini

- Beranda utama sebagai pintu masuk ke tiga perjalanan yang terpisah.
- Landing page khusus `/tes-stifin` untuk layanan personal, keluarga, sekolah, dan komunitas.
- Landing page khusus `/jadi-promotor` untuk Preview, WSL, aktivasi, dan affiliate.
- Bonus produk berupa e-book, video, atau fasilitas lain yang mudah disesuaikan.
- Jalur calon promotor: Preview, WSL 1, WSL 2, lalu ID dan alat sesuai persyaratan.
- Dua program affiliate: Affiliate Umum dan Affiliate Promotor Resmi.
- Pusat edukasi dengan halaman daftar dan detail artikel yang siap dikembangkan.
- Dashboard artikel dengan login admin, status draf/terjadwal/terbit, serta penyimpanan PostgreSQL.
- Generator Gemini/OpenAI untuk 1, 3, atau 5 artikel sekaligus dengan kategori yang dapat diklik.
- Pustaka STIFIn privat untuk mengunggah PDF, mengekstrak teks per halaman, dan memberi sumber pada artikel AI.
- Pemisahan otomatis antara rujukan STIFIn, materi internal, materi terbatas, dan modul copywriting/kampanye.
- Artikel AI lebih panjang dan terstruktur, dengan waktu baca yang dihitung dari isi nyata.
- Rujukan berstatus publik dapat ditampilkan pada artikel; materi internal dan terbatas tetap disembunyikan.
- Artikel edukasi, rekomendasi produk, dan affiliate SEJOLI dengan CTA serta keterbukaan affiliate.
- Komentar bermoderasi, like, share, klik produk, dan statistik interaksi.
- Tombol **Masuk tim** mengarah ke portal pengelolaan artikel yang dilindungi login.

Panduan menambahkan artikel tersedia di `PANDUAN_ARTIKEL.md`.
Panduan mengaktifkan editor dan PostgreSQL tersedia di
`PANDUAN_DASHBOARD_ARTIKEL.md`.
Panduan fitur AI dan interaksi tersedia di `PANDUAN_AI_DAN_INTERAKSI.md`.
Panduan Pustaka STIFIn tersedia di `PANDUAN_PUSTAKA_STIFIN.md`.

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
membuka formulir minat dan menyimpan permintaan ke PostgreSQL pada tabel
`public_interest_leads`.

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
- Periksa kembali klasifikasi setiap PDF di **Pustaka STIFIn**, terutama materi
  copywriting, kesehatan, finansial, politik, dan materi lisensi.
