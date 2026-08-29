# Verifikasi Rilis Nasional v0.5.0

Tanggal verifikasi: 2026-08-29

## Ruang lingkup

Verifikasi ini mencakup Task 5 sampai Task 11 pada website Next.js `konsepstifin.com`. Source `app.konsepstifin.com` serta plugin WordPress/SEJOLI tidak diubah.

## Rangkaian commit

- `483ac7f` — direktori promotor nasional dan dashboard promotor
- `0a6ce34` — pemisahan model lead layanan tes dan calon promotor
- `eed45f1` — submission, matching, idempotency, atribusi, dan pre-checkout
- `c4761a3` — pipeline admin untuk kedua jenis lead
- `7f8a7b2` — halaman lokal dan sitemap berbasis bukti layanan
- `c73e16f` — copywriting aman dan dokumentasi deployment nasional
- `90598cd` — pemisahan domain lead dari driver PostgreSQL pada client bundle

## Pemeriksaan otomatis

Perintah final:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Hasil:

- Vitest: 14 file lulus, 3 file dilewati; 55 test lulus, 6 test dilewati.
- Test integrasi PostgreSQL dilewati karena `TEST_DATABASE_URL` tidak tersedia di lingkungan verifikasi.
- ESLint: lulus.
- TypeScript: lulus tanpa emit.
- Next.js production build: lulus dan menghasilkan 24 halaman statis beserta route dinamis/API yang direncanakan.

## Pemeriksaan runtime

- `next start` menjawab `/api/health` dengan status `ok` dan versi `0.5.0`.
- Server standalone `.next/standalone/server.js` juga menjawab health check yang sama.
- Runtime Docker tidak dijalankan karena executable Docker tidak tersedia. Dockerfile tetap memakai output standalone dan user non-root; jalur standalone-nya telah diverifikasi langsung.

## Keamanan data promotor

Test adapter, sanitizer, katalog, dan public API membuktikan bahwa respons publik hanya memakai kontrak aman. Field publik adalah:

```text
code, name, branchCode, area, province, active, regionCodes
```

Konfigurasi upstream, email, telepon, PassID, tanggal lahir, dan PII sumber lain tidak dikeluarkan oleh public API. Status upstream lengkap hanya tersedia pada dashboard/admin API yang dilindungi.

## SEO lokal

Test SEO lokal memverifikasi bahwa:

- halaman lokal hanya `index` bila ada promotor aktif yang terpetakan atau override layanan dengan catatan bukti;
- halaman tanpa bukti memakai `noindex, follow`;
- halaman pencarian/filter direktori memakai canonical `/promotor` dan `noindex, follow`;
- sitemap hanya memuat cakupan yang memiliki bukti dan memakai `lastModified` dari data nyata;
- profil promotor tidak dibuat massal ke sitemap.

## Batas verifikasi lingkungan

- Pengambilan langsung API nasional produksi tidak dijalankan karena kredensial produksi tidak tersedia.
- Smoke test public API dan sitemap dengan data manual tidak dapat diselesaikan karena katalog wilayah mencoba mengakses `wilayah.id`, sementara koneksi outbound tersebut dibatasi pada lingkungan ini. Perilakunya tetap tercakup oleh test otomatis.
- Pemeriksaan visual lintas perangkat melalui browser tidak dijalankan. Responsive CSS, struktur komponen, dan test komponen telah lulus.
- Integrasi PostgreSQL perlu dijalankan kembali pada CI/staging dengan `TEST_DATABASE_URL` sebelum deployment produksi.

Tidak ada secret atau PII yang dicatat dalam laporan ini.
