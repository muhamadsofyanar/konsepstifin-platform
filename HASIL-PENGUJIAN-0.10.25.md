# Hasil verifikasi KonsepSTIFIn 0.10.25

Tanggal rilis: 30 Oktober 2026. Sumber: ZIP KonsepSTIFIn 0.10.24 unggahan pengguna.
Runtime uji: Node.js 24.22.1; dependensi dipasang menggunakan npm ci dari lockfile.

## Reproduksi dan perbaikan

Sumber ZIP asli lolos `npm run typecheck`. Setelah folder src disalin ke `src - Salin` untuk mereplikasi isi repositori pada log server, pemeriksaan gagal tepat di `src - Salin/lib/learning-http.ts(9,186)` dengan TS2339: Property 'message' does not exist on type 'never'.

Perbaikan memisahkan cabang SyntaxError dan LearningError. Folder cadangan juga dikecualikan dalam tsconfig.json dan .dockerignore. Pemeriksaan TypeScript setelah perbaikan berhasil walaupun folder salinan bermasalah masih berada di workspace uji. Folder salinan tidak disertakan dalam ZIP rilis.

## Pemeriksaan yang berhasil

- `npm run typecheck`: exit 0 setelah perubahan final.
- `npm run build`: exit 0, kompilasi berhasil, TypeScript selesai dan 42 halaman statis dihasilkan.
- `npm test -- src/lib/learning-http.test.ts`: 5 tes berhasil, mencakup SyntaxError, LearningError, Error biasa, null dan string; pesan internal disembunyikan pada error tak terduga.
- Import runtime Node untuk voucher-service.ts, starsender-client.ts dan integration-settings.ts: berhasil.

Log build, typecheck dan tes terarah disertakan dalam paket.

## Batas verifikasi

Build dilakukan dengan Next.js secara lokal, bukan membangun image Docker di server Coolify. Belum ada deploy atau uji terhadap database produksi. Keberhasilan build lokal tidak menjamin konfigurasi environment, jaringan atau database server sudah benar.

Pengujian luas `npm test` selesai dengan exit 1: 129 berkas lolos, 13 gagal, 6 dilewati; 535 tes lolos, 19 gagal, 16 dilewati. Angka ini berasal dari workspace reproduksi dengan folder src - Salin, sehingga sebagian suite dan kegagalannya terduplikasi. Folder tersebut tidak masuk ZIP rilis. Ini bukan hasil suite bersih untuk paket rilis.

Kegagalan tercatat pada berkas berikut (dan salinannya bila ada):

- src/app/public-interest-action.test.tsx: enam assertion gagal.
- src/app/kontak/page.test.tsx: satu assertion gagal.
- src/app/api/interests/route.test.ts: dua assertion gagal.
- tests/learning/workspaces.test.tsx: satu assertion instruksi pembayaran gagal.
- tests/learning/api.test.ts, src/app/api/account/vouchers/route.test.ts dan src/app/api/admin/leads/route.test.ts: gagal memuat modul server-only.
- src - Salin/lib/interest-store.atomic.test.ts: DATABASE_URL belum dikonfigurasi.

Berkas fitur tersebut tidak diubah dalam perbaikan deploy ini. Log lengkap ada pada PENGUJIAN-LUAS-DIAGNOSTIK.log. Tidak ada klaim seluruh aplikasi bebas bug. Pengujian terarah lima respons error, typecheck dan build produksi selesai dan lolos.
