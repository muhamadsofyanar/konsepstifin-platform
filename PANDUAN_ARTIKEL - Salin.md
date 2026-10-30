# Panduan Mengelola Artikel

Halaman artikel tersedia di `/edukasi`. Setiap artikel memiliki halaman detail
di `/edukasi/alamat-artikel`.

Jika PostgreSQL dan login admin telah dikonfigurasi, kelola artikel melalui:

```text
https://konsepstifin.com/admin/login
```

Ikuti `PANDUAN_DASHBOARD_ARTIKEL.md` untuk setup Coolify.

## Lokasi penyimpanan artikel

Artikel di bawah ini berfungsi sebagai konten bawaan atau fallback ketika
database belum tersedia:

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

Jika mengubah artikel bawaan secara manual, jalankan `npm run lint` dan
`npm run build` sebelum deployment. Untuk pengelolaan harian, gunakan dashboard
agar artikel dapat disimpan sebagai draf, dijadwalkan, atau diterbitkan tanpa
mengubah kode. Editor juga mendukung artikel edukasi, produk, dan affiliate
SEJOLI.
