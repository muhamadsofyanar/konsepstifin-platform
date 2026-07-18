# Konsep STIFIn Platform

Versi saat ini: **0.2.4 / revisi v15.4** — Content Intelligence dengan tombol optimasi AI langsung per artikel, pemilihan artikel otomatis, pemetaan aman, dan perbaikan kontras halaman Affiliate. Lihat `SERAH_TERIMA_AKSES_OPTIMASI_AI_V15_4.md`.

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
- Jejak rujukan dan halaman disimpan untuk pemeriksaan admin, tetapi tidak ditampilkan pada halaman artikel publik.
- Artikel edukasi, rekomendasi produk, dan affiliate SEJOLI dengan CTA serta keterbukaan affiliate.
- Komentar bermoderasi, like, share, klik produk, dan statistik interaksi.
- Tombol **Masuk tim** mengarah ke portal pengelolaan artikel yang dilindungi login.
- Harga katalog publik mengikuti harga yang tampil pada kartu produk SEJOLI.
- Enam foto dokumentasi kegiatan nyata tampil di beranda dan halaman Tes STIFIn.
- Tombol produk aktif membuka checkout SEJOLI; formulir minat dipisahkan sebagai bantuan memilih layanan.
- Content Intelligence native Next.js untuk menilai kesiapan artikel terhadap SEO, AEO, dan pencarian berbasis AI.
- Peta pilar–cluster, deteksi potensi kanibalisasi, serta saran internal link pada `/admin/intelligence`.
- Metadata keyword, search intent, topical cluster, evidence pengalaman nyata, reviewer, sumber, dan artikel terkait.
- Trust panel pada artikel publik menampilkan pengalaman nyata, reviewer, tanggal review, serta sumber yang memang aman dipublikasikan.

Panduan menambahkan artikel tersedia di `PANDUAN_ARTIKEL.md`.
Panduan mengaktifkan editor dan PostgreSQL tersedia di
`PANDUAN_DASHBOARD_ARTIKEL.md`.
Panduan fitur AI dan interaksi tersedia di `PANDUAN_AI_DAN_INTERAKSI.md`.
Panduan Pustaka STIFIn tersedia di `PANDUAN_PUSTAKA_STIFIN.md`.
Panduan upgrade Content Intelligence tersedia di
`SERAH_TERIMA_CONTENT_INTELLIGENCE_V15.md`.

## Content Intelligence

Masuk ke `/admin/intelligence` untuk melihat skor kesiapan editorial 0–100,
prioritas perbaikan, peta topical authority, konflik keyword/judul, dan saran
internal link. Skor adalah alat quality control konten yang dapat dikendalikan
tim, bukan jaminan ranking Google atau penyebutan oleh sistem AI.

Lengkapi metadata artikel melalui `/admin/artikel`. Artikel lama tetap aman dan
dapat diperbarui bertahap. Kolom database baru dibuat otomatis menggunakan
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` saat aplikasi pertama kali mengakses
modul artikel setelah deployment.

## Mengelola link checkout SEJOLI

Link bawaan checkout dipusatkan dalam satu file:

```text
src/app/site-config.ts
```

Buka file tersebut untuk mengubah URL bawaan produk. Setelah aplikasi memakai
PostgreSQL, nama, harga, deskripsi, status, urutan, dan URL checkout juga dapat
dikelola tanpa redeploy melalui `/admin/produk`.

```ts
export const sejoliLinks = {
  tesPersonal: 'https://alamat-checkout-sejoli-anda',
  paketKeluarga: 'https://alamat-checkout-sejoli-anda',
  // lanjutkan untuk produk lainnya
};
```

Nilai dari `/admin/produk` menjadi prioritas. Jika URL database kosong, website
memakai `sejoliLinks`. Jika keduanya belum diisi, tombol tidak akan rusak dan
website otomatis
membuka formulir minat dan menyimpan permintaan ke PostgreSQL pada tabel
`public_interest_leads`.

Saat upgrade versi 0.1.2 pertama kali dijalankan, migrasi katalog satu kali akan
menyamakan harga dan link database dengan kartu produk SEJOLI yang disepakati.
Sesudah itu, perubahan berikutnya tetap dapat dilakukan melalui `/admin/produk`.

## Dokumentasi kegiatan nyata

Foto web berada di `public/images/dokumentasi`. Daftar foto, caption, dan teks
alternatif dipusatkan di `src/app/activity-gallery.tsx`. Salinan web sudah
dioptimalkan ke WebP dan metadata kamera telah dibuang.

Sebelum publikasi, pastikan izin penggunaan wajah setiap peserta sudah sesuai
dengan persetujuan dokumentasi yang dimiliki tim.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Aplikasi berjalan pada `http://localhost:3000`.

## Deployment

Repository ini sudah dilengkapi `Dockerfile` untuk deployment melalui Coolify.
Port aplikasi: `3000`.

Domain produksi: `https://konsepstifin.com`.

Website publik, edukasi, SEO, katalog, dan landing page berada di domain utama.
Checkout SEJOLI, member area, serta affiliate berada di
`https://app.konsepstifin.com`. Subdomain `tes.konsepstifin.com` tidak lagi
digunakan.

## Keamanan

Jangan menyimpan password, token, API key, atau data peserta dalam repository.
Gunakan Environment Variables di Coolify untuk seluruh informasi rahasia.

## Catatan sebelum dipublikasikan

- Periksa kembali harga, bonus, komisi affiliate, dan persyaratan program.
- Pastikan setiap produk SEJOLI sudah aktif sebelum link ditempel.
- Uji seluruh tombol checkout pada desktop dan ponsel.
- Periksa kembali klasifikasi setiap PDF di **Pustaka STIFIn**, terutama materi
  copywriting, kesehatan, finansial, politik, dan materi lisensi.
