# Serah Terima Lead Operations Fix v0.2.6

## Ringkasan

Versi ini menyelesaikan modul lead admin yang sebelumnya belum lengkap dan
menyebabkan `next build` berhenti karena ekspor server tidak ditemukan. Fase ini
melanjutkan roadmap bagian **Lead records** dan **Admin Experience** tanpa
mengubah data awal yang sudah dikirim pengunjung.

## Perbaikan utama

- Menambahkan ekspor `getLeads`, `updateLead`, dan
  `validateLeadAdminUpdate` pada `src/lib/interest-store.ts`.
- Menambahkan migrasi aman untuk `assigned_to`, `admin_notes`, dan `updated_at`.
- Menambahkan status lead `new`, `contacted`, `qualified`, `converted`, dan
  `closed` dengan validasi whitelist di server.
- Menambahkan halaman `/admin/leads` untuk pencarian, filter, penugasan, catatan,
  dan pembaruan status.
- Menambahkan API admin `PATCH /api/admin/leads/[id]` yang dilindungi sesi admin.
- Menambahkan tautan Lead pada navigasi portal tim.
- Mencegah field data awal pengunjung diubah melalui endpoint admin.
- Menambahkan fallback 38 provinsi agar build dan halaman `/wilayah` tidak kosong
  saat API administratif tidak tersedia.
- Menampilkan seluruh provinsi dengan status layanan terpetakan atau koordinasi
  nasional sesuai strategi phased indexation.
- Menyamakan header, footer, dan navigasi pada halaman wilayah serta promotor.

## Upgrade database

Tidak diperlukan migrasi manual. Saat halaman lead atau formulir publik pertama
kali diakses, aplikasi menjalankan `CREATE TABLE IF NOT EXISTS` dan
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Data lead versi sebelumnya tetap
dipertahankan.

## Pemeriksaan setelah deployment

1. Pastikan `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan
   `ADMIN_SESSION_SECRET` terpasang di Coolify.
2. Buka `/admin/login`, lalu masuk ke `/admin/leads`.
3. Kirim satu formulir minat dari halaman publik.
4. Ubah status, penanggung jawab, dan catatan pada lead uji.
5. Pastikan data tetap ada setelah halaman dimuat ulang.

## Hasil verifikasi paket

- TypeScript `tsc --noEmit`: lulus.
- ESLint: lulus.
- Next.js 16 production build: lulus.
- Route `/admin/leads` dan `/api/admin/leads/[id]`: terdeteksi pada inventaris build.
