# KonsepSTIFIn 0.7.0

Portal admin satu pintu pada aplikasi Next.js yang sama: ringkasan, CRM, pesanan/pembayaran manual, konten/layanan, dan pengaturan. Pemesanan baru tidak bergantung pada SEJOLI. Akun admin memakai sesi PostgreSQL yang dapat dicabut.

Untuk aplikasi yang sudah memakai 0.6.0, baca **[AKUN-PROMOTOR.md](AKUN-PROMOTOR.md)**: pembaruan akun Kepala Cabang + 10 promotor, import, dan aktivasi.

Mulai dari **[MULAI-DI-SINI.md](MULAI-DI-SINI.md)** untuk unggah manual GitHub, konfigurasi Coolify, migrasi, penyiapan admin, backup, dan rollback.

- [Hasil pengujian](HASIL-PENGUJIAN.md)
- [Rancangan yang disetujui](docs/superpowers/specs/2026-10-28-admin-satu-pintu-design.md)
- [Rencana implementasi](docs/superpowers/plans/2026-10-28-admin-satu-pintu.md)

## Pengembangan

Node 24. PostgreSQL melalui `DATABASE_URL`. Copy `.env.example` ke `.env.local` untuk pengembangan dan isi nilai lokal Anda sendiri.

```sh
npm ci
npm run dev
```

Sebelum login, jalankan migrasi dan siapkan akun melalui command operator sesuai panduan. Tidak ada fallback password environment. API key AI opsional untuk fitur bantuan artikel.

```sh
npm test
npm run test:identity
npm run test:unit:node
npm run typecheck
npm run lint
npm run build
npm run test:smoke
```

Dockerfile menghasilkan Next standalone, port 3000. Pasang volume persisten pada `/app/storage`. Tidak ada kredensial, database pelanggan, atau file pustaka produksi di source ini.

Dokumen proyek sebelum 0.6.0 dipertahankan sebagai histori dan dapat memuat arah lama. Gunakan panduan 0.6.0 untuk deployment paket ini.
