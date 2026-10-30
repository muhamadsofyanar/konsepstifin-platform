# Upgrade KonsepSTIFIn 0.10.9

## Sebelum deployment

1. Buat backup database PostgreSQL dan volume `/app/storage`.
2. Pastikan branch `main` berisi seluruh source versi 0.10.9, termasuk `scripts/migrations/012-integrations-promotions.sql`.
3. Deploy melalui Coolify. Jangan mengubah atau menghapus `DATABASE_URL`, `PLATFORM_ORIGIN`, atau volume persisten yang sudah dipakai.
4. Setelah container sehat, jalankan migrasi satu kali dari terminal container aplikasi:

```bash
IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 012-integrations-promotions.sql
```

Perintah tersebut menjalankan hanya migrasi 012 sehingga tidak mengulang trigger dari migrasi lama. Pastikan output menampilkan `Applied 012-integrations-promotions.sql`. Jangan jalankan terhadap database yang salah. Backup wajib dilakukan lebih dahulu.

## Konfigurasi integrasi tanpa redeploy

1. Masuk sebagai akun pemilik platform (`super_admin`).
2. Buka **Admin > Pengaturan > Integrasi eksternal**.
3. Masukkan Moota API token, secret webhook, ID rekening, dan path Create Terima Uang sesuai dokumentasi API aktif Moota. Jangan menebak path endpoint.
4. Masukkan Device API key StarSender dan endpoint yang benar.
5. Simpan dan tes koneksi Moota. API key dan secret tidak akan ditampilkan lagi. Kolom secret yang dibiarkan kosong mempertahankan nilai tersimpan. Gunakan kotak hapus hanya jika ingin menghapus secret.
6. URL webhook tetap menggunakan `PLATFORM_ORIGIN` dan berakhiran `/api/webhooks/moota`.

Secret disimpan dengan AES-256-GCM dan kunci diturunkan dari `DATABASE_URL`, yang hanya tersedia di server. Jika `DATABASE_URL` dirotasi, secret tersimpan sebelumnya tidak dapat didekripsi dan perlu dimasukkan ulang dari halaman admin. `DATABASE_URL` dan `PLATFORM_ORIGIN` tetap konfigurasi dasar Coolify. Nilai API Moota dan StarSender tidak perlu diubah di Coolify setelah dikelola melalui dashboard.

## Mengelola promo pusat

1. Buka **Admin > Pengaturan > Promo Family Test & Year-End Workshop**.
2. Periksa tanggal mulai dan akhir. Nilai awal: 28 Oktober sampai 31 Desember 2026.
3. Aktifkan/nonaktifkan Family Test dan Year-End Workshop.
4. Atur skema Family Test. Minimum per tes berbayar tidak dapat diturunkan di bawah Rp500.000.
5. Periksa harga WSL 1, WSL 2, dan WST.
6. Simpan. Halaman publik membaca konfigurasi database terbaru tanpa redeploy.

Skema bawaan: 3 tes berbayar + 1 gratis (minimum Rp1.500.000), 4 + 1 (minimum Rp2.000.000), dan 7 + 2 (minimum Rp3.500.000). Harga minimum dihitung dari jumlah tes berbayar, bukan total peserta termasuk bonus.

## Pengujian pascadeploy

- Buka `/api/health`, pastikan layanan sehat.
- Buka `/admin/pengaturan`, pastikan panel integrasi dan promo dapat dimuat.
- Tes Moota setelah memasukkan path endpoint yang telah diverifikasi.
- Uji pengiriman StarSender ke nomor internal yang memberi izin.
- Buka `/` dan `/tes-stifin`, pastikan promo pusat tampil sesuai periode.
- Ajukan Family Test dan pastikan catatan promo tersimpan pada lead di `/admin/leads`.
- Uji `/jadi-promotor#year-end-workshop`, pastikan harga WSL 1, WSL 2, dan WST sesuai konfigurasi.
- Uji formulir layanan: layanan yang sudah dipilih harus terkunci; hanya nama, WhatsApp, dan kota yang wajib diisi. Email dan catatan tambahan harus tetap opsional.

Jangan menganggap integrasi Moota siap produksi hanya karena halaman pengaturan dapat menyimpan kredensial. Kontrak endpoint Create Terima Uang dan webhook harus diuji menggunakan dokumentasi aktif Moota.
