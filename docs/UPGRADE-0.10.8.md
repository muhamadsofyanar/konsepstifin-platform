# Upgrade KonsepSTIFIn 0.10.8

Rilis ini memprioritaskan akuisisi klien melalui jaringan promotor dan meningkatkan jalur konversi calon peserta pada halaman publik. Tidak ada migrasi database baru.

## Perubahan

- Tab **Dapatkan klien** menjadi tampilan awal Pusat Mitra.
- Promotor dan affiliate memperoleh tautan referral per kebutuhan: tes personal, pasangan, keluarga, sekolah/komunitas, serta informasi calon promotor.
- Setiap tautan membawa label kampanye `utm_source`, `utm_medium`, `utm_campaign`, dan `utm_content`.
- Redirect `/r/{alias}` mempertahankan parameter kampanye yang diizinkan menuju halaman internal. Destinasi tetap menggunakan allowlist sehingga tidak menjadi open redirect.
- Pesan siap salin dan tombol berbagi WhatsApp tersedia untuk tiap kebutuhan.
- Ringkasan kunjungan referral, permintaan layanan, akun baru, dan pembelian tampil di Pusat Akuisisi.
- Halaman utama mengutamakan layanan Tes STIFIn dan menyediakan formulir bantuan memilih layanan langsung dari hero.

## Upgrade

1. Cadangkan source code, database PostgreSQL, dan volume `/app/storage`.
2. Deploy paket 0.10.8 melalui Coolify dengan environment produksi yang sudah digunakan.
3. Tidak ada migrasi database baru. Jika migrasi 011 belum diterapkan pada instalasi 0.10.7, terapkan sesuai panduan integrasi yang berlaku sebelum menggunakan fitur terkait.
4. Login menggunakan akun promotor/affiliate, buka `/akun/mitra`, lalu periksa tab **Dapatkan klien**.
5. Salin tautan Tes Personal dan buka di browser privat. Pastikan tautan menuju halaman layanan yang benar, cookie referral tercatat, dan UTM tetap terlihat pada URL halaman tujuan.
6. Kirim formulir percobaan dengan data uji yang disetujui, lalu periksa permintaan di Aktivitas referral dan `/admin/leads`.
7. Pastikan `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, dan `npm run test:smoke` lulus sebelum produksi.

## Catatan atribusi

Referral tetap memakai aturan first-touch 30 hari yang sudah ada. Jika browser telah memiliki cookie referral yang valid, sistem tidak menggantinya dengan tautan baru. Kunjungan referral adalah catatan dari mekanisme referral yang ada, bukan metrik klik iklan atau pengguna unik lintas perangkat.

## Batas pengujian

Integrasi Moota sengaja tidak diubah pada rilis ini. Build produksi dan koneksi API live harus diverifikasi di lingkungan yang memiliki dependensi lengkap dan konfigurasi produksi.
