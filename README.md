# Konsep STIFIn Platform

Versi **0.5.0** adalah website Next.js untuk `konsepstifin.com`: direktori promotor nasional yang aman, dua funnel lead terpisah, halaman lokal berbasis bukti, dan dashboard operasional.

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
- Dashboard artikel, produk, pustaka, dan Content Intelligence yang telah ada tetap dipertahankan.

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
