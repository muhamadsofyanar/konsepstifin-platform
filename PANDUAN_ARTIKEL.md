# Panduan Mengelola Artikel

Halaman artikel tersedia di `/edukasi`. Setiap artikel memiliki halaman detail
di `/edukasi/alamat-artikel`.

## Lokasi penyimpanan artikel

Seluruh artikel sementara disimpan dalam:

```text
src/app/edukasi/articles.ts
```

Untuk menambahkan artikel, duplikasi satu objek artikel yang sudah ada lalu
ubah `slug`, kategori, judul, ringkasan, tanggal, durasi baca, dan isi blok.
Nilai `slug` harus unik, menggunakan huruf kecil, dan dipisahkan tanda hubung.

Contoh:

```ts
{
  slug: 'judul-artikel-baru',
  category: 'Keluarga',
  title: 'Judul Artikel Baru',
  excerpt: 'Ringkasan singkat artikel.',
  publishedAt: '2026-07-20',
  publishedLabel: '20 Juli 2026',
  readTime: '5 menit baca',
  tone: 'forest',
  blocks: [
    {
      heading: 'Judul bagian',
      paragraphs: ['Isi paragraf pertama.'],
      bullets: ['Poin pertama.', 'Poin kedua.'],
    },
  ],
  takeaway: 'Kesimpulan singkat artikel.',
}
```

Pilihan `tone`: `forest`, `leaf`, `sand`, `mint`, atau `charcoal`.

Setelah artikel ditambahkan, jalankan `npm run lint` dan `npm run build`
sebelum deployment. Tahap berikutnya dapat menggunakan CMS atau dashboard
penulis tanpa mengubah alamat artikel yang sudah dipublikasikan.

