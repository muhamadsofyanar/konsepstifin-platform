# Serah Terima Konsep STIFIn Platform v0.4.0

## Hasil implementasi

- Endpoint promotor nasional dan fallback mode branch.
- Cache tersanitasi: fresh 15 menit, stale maksimal 24 jam, timeout 15 detik, batas 10.000 baris.
- Pencocokan maksimum tiga kandidat berdasarkan mapping manual, kabupaten/kota, lalu provinsi.
- Pra-checkout wajib untuk produk Tes STIFIn dan CTA tes pada halaman wilayah.
- Penyimpanan lead idempoten, snapshot kandidat awal, transaksi, serta audit perubahan admin.
- Dashboard rekonsiliasi pembayaran, order SEJOLI, biaya, payout, margin, promotor final, dan jadwal.
- API dan halaman publik tidak menampilkan kontak promotor atau kolom mentah sumber.
- Dokumentasi konfigurasi produksi dan rollback.

## Verifikasi lokal

- `npm test`: 17 tes lulus; 2 tes integrasi PostgreSQL tersedia dan otomatis dilewati tanpa `TEST_DATABASE_URL`.
- `npm run lint`: lulus.
- `npx tsc --noEmit`: lulus.
- `npm run build`: lulus dengan Next.js 16.2.10.

Jalankan tes integrasi PostgreSQL sebelum menerima order produksi:

```bash
TEST_DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE npm test -- src/lib/interest-store.integration.test.ts
```

Ikuti `docs/OPERASIONAL_PROMOTOR_NASIONAL.md` untuk deployment dan uji transaksi.
