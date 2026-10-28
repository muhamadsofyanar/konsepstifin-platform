# KonsepSTIFIn 0.9.1

Perbaikan UI/UX admin dan member. Mulai dari [panduan 0.9.1](docs/UPGRADE-0.9.1.md) dan [hasil verifikasi UI/UX](docs/HASIL-PENGUJIAN-0.9.1.md). Migrasi 007 dari 0.9 tetap diperlukan jika belum pernah dijalankan.

# KonsepSTIFIn 0.9.0

Upgrade e-course dan affiliate di atas fondasi 0.8. Mulai dari [panduan upgrade 0.9](docs/UPGRADE-0.9.md), [hasil pengujian](docs/HASIL-PENGUJIAN-0.9.md), dan [spesifikasi sumber](docs/Spesifikasi-Pengembangan-KonsepSTIFIn-dari-Averion.md).

Dokumentasi historis 0.8 di bawah tetap disertakan untuk referensi. Ikuti panduan 0.9 untuk fitur baru.

# KonsepSTIFIn 0.8.0

Portal admin satu pintu pada aplikasi Next.js yang sama: ringkasan, CRM, pesanan/pembayaran manual, konten/layanan, dan pengaturan. Pemesanan baru tidak bergantung pada SEJOLI. Akun admin memakai sesi PostgreSQL yang dapat dicabut.

Untuk aplikasi yang sudah memakai 0.7.0, baca **[MITRA-DAN-VOUCHER.md](MITRA-DAN-VOUCHER.md)**: tautan referral mitra, cek saldo riil, pembelian voucher, dan worker pengisian setelah pembayaran diverifikasi. Akun yang sudah aktif tidak perlu diimpor atau diaktivasi ulang.

Mulai dari **[MULAI-DI-SINI.md](MULAI-DI-SINI.md)** untuk unggah manual GitHub, konfigurasi Coolify, migrasi, penyiapan admin, backup, dan rollback.

- [Hasil pengujian](HASIL-PENGUJIAN.md)
- [Rancangan yang disetujui](docs/superpowers/specs/2026-10-28-admin-satu-pintu-design.md)
- [Rencana implementasi](docs/superpowers/plans/2026-10-28-admin-satu-pintu.md)

## Pengembangan

Node 24. PostgreSQL melalui `DATABASE_URL`. Copy `.env.example` ke `.env.local` untuk pengembangan dan isi nilai lokal Anda sendiri.

```sh
npm ci
npm run dev
# Terminal kedua dengan ENV yang sama:
npm run voucher:worker
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

Dokumen proyek sebelum 0.6.0 dipertahankan sebagai histori dan dapat memuat arah lama. Gunakan MITRA-DAN-VOUCHER.md dan MULAI-DI-SINI.md untuk deployment paket ini.
