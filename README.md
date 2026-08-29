# Konsep STIFIn Platform

Versi **0.5.1** adalah website Next.js untuk `konsepstifin.com`: direktori promotor nasional yang aman, dua funnel lead terpisah, halaman lokal berbasis bukti, dashboard operasional, serta alur editorial review-first.

Source ini tidak mencakup dan tidak mengubah WordPress/SEJOLI di `app.konsepstifin.com`. Domain tersebut tetap menjadi tujuan checkout, member area, dan affiliate.

## Fitur utama

- Direktori `/promotor` dengan pencarian nama/KodeID, filter wilayah/cabang, pagination 24 kartu, dan tanpa kontak pribadi.
- Adapter promotor nasional dengan sanitizer allowlist, cache fresh 15 menit, serta stale fallback maksimal 24 jam.
- Pemetaan wilayah otomatis dan override PostgreSQL manual.
- Dashboard `/admin/promotor` untuk status upstream, mapping, CSV, dan bukti cakupan layanan.
- Funnel `test_service` untuk konsumen Tes STIFIn: matching promotor, consent berbagi terbatas, lalu pre-checkout.
- Funnel `promoter_candidate` untuk calon promotor: antrean konsultasi dan PIC tanpa checkout layanan tes.
- Dashboard `/admin/leads` untuk pipeline, assignment, atribusi, pembayaran layanan tes, margin, catatan, dan riwayat.
- Halaman `/tes-stifin/[kota]`, `/promotor-stifin/[kota]`, dan `/promotor/[slug-promotor]` dengan aturan index/noindex berbasis bukti.
- Sitemap stabil yang hanya memuat wilayah indexable dan memakai waktu pembaruan sumber yang tersimpan.
- Asisten artikel satu klik yang menampilkan revisi sebelum–sesudah dan selalu menyimpan hasil ke status Review, bukan langsung terbit.
- Daftar artikel admin dengan filter status, pagination 20 baris, sanitasi konten, dan arsip non-destruktif.

## Perubahan produksi v0.5.1

- Query idempotency lead kini cocok dengan partial unique index PostgreSQL, sehingga lead dapat disimpan tanpa error `ON CONFLICT`.
- Error database internal tidak dikirim ke browser; pengunjung menerima pesan netral dan dapat mencoba kembali.
- Lead Tes STIFIn yang berhasil langsung melanjutkan ke URL checkout terverifikasi di `app.konsepstifin.com`.
- Lead calon promotor tetap masuk pipeline konsultasi dan tidak pernah masuk checkout layanan tes.
- Entry point kedua funnel, copy publik seluruh route, serta pengelolaan artikel telah diperjelas.

Setelah redeploy, uji satu pengiriman Tes STIFIn sampai redirect checkout dan satu pengiriman calon promotor sampai muncul di tab pipeline yang tepat. Jangan menganggap healthcheck saja cukup untuk membuktikan koneksi PostgreSQL serta alur form bekerja.

## Menjalankan secara lokal

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

Verifikasi pengembangan:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Test integrasi PostgreSQL otomatis di-skip bila `TEST_DATABASE_URL` tidak tersedia.

## Environment promotor nasional

Konfigurasi produksi utama:

```env
STIFIN_API_BASE=https://apro.stifin.id/api
STIFIN_PROMOTER_MODE=national
STIFIN_PROMOTER_NATIONAL_PATH=/proGet/pro/PRO
STIFIN_API_TIMEOUT_MS=15000
```

Mode `national` tidak membutuhkan kode cabang. Contoh mode `branch` dan `manual` tersedia di `.env.example`. Nilai autentikasi dan kredensial database harus disimpan sebagai secret di Coolify, bukan di repository.

## Kontrak data publik

`GET /api/promotor?q=&province=&regency=&branch=&page=` mengembalikan maksimal 24 item per halaman. Field promotor publik hanya:

```text
code, name, branchCode, area, province, active, regionCodes
```

Email, telepon, PassID, tanggal lahir, saldo, alamat pribadi, identitas akun, konfigurasi upstream, dan error internal tidak boleh muncul pada respons publik.

## Deployment

Deployment produksi memakai `Dockerfile`, port `3000`, dan healthcheck `/api/health`. Domain utama adalah `https://konsepstifin.com`; transaksi tetap diarahkan ke `https://app.konsepstifin.com`.

Panduan environment Coolify, pemantauan API, mapping CSV, pipeline lead, rollback, sitemap, dan smoke test ada di [PANDUAN_PROMOTOR_NASIONAL_DAN_LEAD.md](./PANDUAN_PROMOTOR_NASIONAL_DAN_LEAD.md).

## Batas klaim publik

Tes STIFIn disajikan sebagai layanan edukasi dan refleksi, bukan diagnosis medis atau psikologis. Website tidak menjanjikan hasil belajar, karier, usaha, atau penghasilan. Jadwal layanan selalu menggunakan keterangan **“Jadwal berdasarkan konfirmasi”**.

## Keamanan

- Jangan commit password, token, API key, dump lead, atau data peserta.
- Gunakan HTTPS untuk seluruh sumber eksternal dan checkout.
- Jangan menulis payload PII atau header autentikasi ke log.
- Pastikan izin dokumentasi foto peserta telah tersedia sebelum publikasi.
