# Serah Terima Konsep STIFIn Platform v0.4.1

## Perbaikan promotor

Deployment Coolify pada commit `fbce7cc881c6567c0b1106b8f88d6962d320354d`
berhasil. Container baru berstatus sehat. Masalah daftar promotor bukan berasal
dari Docker atau healthcheck.

Penyebab yang ditemukan pada source:

1. Aplikasi hanya mengambil API STIFIn jika `STIFIN_BRANCH_CODE` atau
   `STIFIN_BRANCH_CODES` tersedia di environment Coolify.
2. Filter wilayah lama tidak menampilkan promotor berkode kabupaten/kota pada
   halaman provinsi induknya. Contoh pemetaan `12.71` tidak cocok dengan halaman
   Sumatera Utara berkode `12`.
3. Contoh `STIFIN_PROMOTERS_JSON` dalam dokumentasi memuat `regionCodes`, tetapi
   parser lama mengabaikan properti tersebut.
4. Pemetaan promotor tersedia melalui API admin, tetapi belum memiliki layar
   pengelolaan.

Versi 0.4.1 memperbaiki keempat masalah tersebut. Respons `/api/promotor` juga
memuat metadata nonrahasia `configured`, `source`, `branchCount`, dan `region`
untuk diagnosis produksi.

## Konfigurasi Coolify wajib

Untuk cakupan nasional, pertahankan mode awal dan isi daftar cabang yang hendak
digabungkan:

```text
STIFIN_API_BASE=https://apro.stifin.id/api
STIFIN_PROMOTER_MODE=national
STIFIN_BRANCH_CODES=KODE-CABANG-1,KODE-CABANG-2
```

Jika STIFIn memberikan endpoint nasional resmi, gunakan:

```text
STIFIN_PROMOTER_MODE=national
STIFIN_PROMOTER_NATIONAL_PATH=/PATH-ENDPOINT-NASIONAL-RESMI
```

Untuk satu cabang, gunakan `STIFIN_PROMOTER_MODE=branch` dan
`STIFIN_BRANCH_CODE`. Setelah redeploy, buka `/api/promotor`. Nilai
`meta.configured` harus `true`, `meta.mode` harus `national`, dan
`count` harus lebih dari nol. Masuk ke `/admin/promotor`, lalu isi kode wilayah
seperti `12.71` untuk Kota Medan atau kode lain sesuai Wilayah.id.

## Content Intelligence dan Local SEO

Fitur baru:

- skor SEO, AEO, dan GEO terpisah;
- keyword dan search intent;
- struktur pilar dan cluster;
- saran internal link;
- deteksi potensi kanibalisasi;
- audit freshness, sumber, reviewer, bukti pengalaman, dan kedalaman artikel;
- Local SEO Planner berdasarkan pemetaan promotor;
- status Draf, Review, Terjadwal, dan Terbit;
- FAQ serta breadcrumb pada halaman wilayah;
- sitemap index `/sitemap-index.xml`;
- sitemap `/sitemaps/static.xml`, `/sitemaps/articles.xml`,
  `/sitemaps/regions.xml`, dan `/sitemaps/promoters.xml`.

Kecamatan hanya masuk indeks jika memiliki promotor aktif. Desa dan kelurahan
tetap `noindex`. Search Console dan Core Web Vitals disiapkan sebagai tahap
berikutnya karena memerlukan koneksi akun Google dan data produksi.

## Verifikasi

- ESLint: lulus.
- TypeScript `tsc --noEmit`: lulus.
- Next.js production build: lulus.
- Route baru `/admin/promotor` dan seluruh sitemap terdeteksi oleh build.

## Pemulihan deploy e58bb3

- Menu **Cari Lokasi** dipulihkan pada navigasi desktop dan mobile.
- Halaman `/wilayah` kembali memakai header serta footer publik.
- Endpoint `/api/health` dan Docker `HEALTHCHECK` ditambahkan agar Coolify
  menunggu status sehat sebelum menghapus container lama.
