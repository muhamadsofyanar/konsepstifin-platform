# Verifikasi Rilis v0.5.1

Tanggal verifikasi: 30 Agustus 2026  
Branch: `work/national-v0.5.0`  
Versi aplikasi: `0.5.1`

## Ruang lingkup yang diverifikasi

- Query penyimpanan lead memakai target partial unique index PostgreSQL yang sesuai.
- Respons error publik tidak membocorkan SQL, constraint, driver, atau detail database.
- Lead `test_service` dapat menerima URL checkout terverifikasi di `app.konsepstifin.com`.
- Lead `promoter_candidate` tetap berada di pipeline konsultasi dan tidak masuk checkout tes.
- Halaman kontak serta CTA publik membedakan funnel Tes STIFIn dan calon promotor.
- Asisten artikel menampilkan preview sebelum–sesudah dan selalu menyimpan hasil ke `review`.
- Artikel mendukung filter status, pagination 20 baris, sanitasi konten, dan arsip non-destruktif.
- Seluruh template route publik, navigasi, footer, halaman lokal, profil promotor, dan CTA artikel tercakup audit copy.
- Source `app.konsepstifin.com` dan plugin WordPress/SEJOLI tidak diubah.

## Commit implementasi

| Commit | Isi |
|---|---|
| `fee8de4` | Spesifikasi dan rencana v0.5.1 |
| `37f164c` | Perbaikan idempotency lead, error publik, dan redirect checkout |
| `264c4bf` | Entry point dua funnel yang eksplisit |
| `25ec426` | Asisten artikel review-first |
| `3b70b8d` | Lifecycle, sanitasi, filter, pagination, dan arsip artikel |
| `0d9d5c8` | Audit dan penulisan ulang copy publik per journey |

Commit verifikasi akhir dibuat setelah laporan ini masuk ke Git.

## Hasil gerbang final

Perintah dijalankan berurutan dari working tree rilis:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Hasil:

| Pemeriksaan | Hasil |
|---|---|
| Vitest | 19 file lulus, 3 file di-skip; 66 test lulus, 6 test di-skip, 0 gagal |
| ESLint | Lulus, 0 error |
| TypeScript | Lulus, 0 error |
| Next.js production build | Lulus; 24 halaman statis dihasilkan dan seluruh route terkompilasi |
| Standalone health smoke test | Lulus; `{"status":"ok","service":"konsepstifin-platform","version":"0.5.1"}` |
| `git diff --check` | Lulus |

Smoke test memakai `node .next/standalone/server.js` dengan host eksplisit `127.0.0.1`, sesuai konfigurasi `output: standalone` pada build produksi.

## Test yang di-skip

Enam test di tiga suite integrasi PostgreSQL di-skip karena environment verifikasi tidak menyediakan `TEST_DATABASE_URL`:

- `src/lib/interest-store.integration.test.ts`
- `src/lib/promoter-store.integration.test.ts`
- `src/lib/service-coverage-store.integration.test.ts`

Test tersebut tidak dihapus atau diturunkan validasinya. Unit dan component test untuk SQL idempotency, error publik, redirect checkout, pemisahan funnel, asisten artikel, sanitasi, filter, dan pagination tetap dijalankan.

## Batas verifikasi environment

- Koneksi PostgreSQL produksi, data lead nyata, serta migrasi pada database produksi tidak disentuh.
- API promotor upstream produksi dan autentikasinya tidak dipanggil.
- Checkout SEJOLI produksi tidak membuat transaksi nyata.
- Browser visual pada perangkat fisik tidak tersedia; responsivitas diperiksa melalui aturan CSS, test komponen, TypeScript, dan production build.

Setelah redeploy, operator tetap perlu mengirim satu lead tes sampai redirect checkout dan satu lead calon promotor sampai pipeline yang tepat, lalu memeriksa bahwa error browser tidak mengandung detail PostgreSQL.
