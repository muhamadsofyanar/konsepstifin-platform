# Wilayah Nasional dan Direktori Promotor — Design

**Goal:** Menjadikan Konsep STIFIn dapat ditemukan untuk seluruh hierarki wilayah Indonesia, dengan API publik yang aman dan sinkronisasi promotor opsional.

**Architecture:** Data wilayah administratif diambil melalui adapter Wilayah.id dengan cache HTTP dan normalisasi kode. Route dinamis menampilkan provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan tanpa pre-render seluruh kombinasi. Adapter promotor memanggil API STIFIn server-side bila `STIFIN_API_BASE` dan `STIFIN_BRANCH_CODE` tersedia; respons publik disanitasi dan tidak pernah membocorkan data internal.

**Tech Stack:** Next.js App Router 16, TypeScript, PostgreSQL opsional, Wilayah.id API, endpoint STIFIn `proGetCab/pro/{branch}`.

## Scope

- Semua tingkat wilayah Indonesia tersedia melalui route dan endpoint JSON.
- Halaman wilayah bersifat dinamis, cacheable, dan memiliki metadata canonical.
- API publik bersifat read-only; API pusat tidak dipanggil dari browser.
- Daftar promotor boleh kosong bila sinkronisasi pusat belum dikonfigurasi.
- Sitemap utama tetap ringan; sitemap wilayah tersedia terpisah.

## Data Flow

`browser → Next.js route/API → wilayah.id (cache)`, dan `browser → Next.js API promotor → STIFIn API (server-side, sanitized)`.

## Error Handling

Timeout atau respons invalid dari upstream menghasilkan 502 pada API JSON dan halaman fallback yang menjelaskan data sementara tidak tersedia. Slug/kode tidak valid menghasilkan 404. Cache stale boleh disajikan untuk menjaga ketersediaan.

## Security

- Tidak ada secret di repository.
- Hanya field publik promotor (`kode`, `nama`, `wilayah`, `aktif`, `menerimaKunjungan`, `whatsapp` opsional) yang diteruskan.
- Email, saldo voucher, PassID, dan telepon internal selalu dibuang.
- Endpoint memiliki cache dan batas ukuran respons upstream.
