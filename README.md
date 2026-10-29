# KonsepSTIFIn 0.10.9

Rilis ini berfokus pada pengurangan friksi calon klien, penerapan promo pusat, dan pengelolaan kredensial integrasi dari dashboard admin.

## Perubahan utama

- Formulir calon klien disederhanakan menjadi nama, WhatsApp, dan kota sebagai isian utama. Layanan yang sudah dipilih tidak perlu dipilih ulang. Email dan catatan tambahan berada di bagian opsional.
- Beranda mengutamakan dua jalur utama: Tes STIFIn serta Workshop/Kemitraan.
- Promo Family Test periode 28 Oktober sampai 31 Desember 2026 mendukung skema 3+1, 4+1, 7+2, dan skema tambahan yang ditentukan pemilik melalui admin. Harga jual minimal tetap Rp500.000 per tes berbayar.
- Year-End Workshop menampilkan WSL 1 Rp500.000, WSL 2 Rp2.500.000, dan WST Rp1.000.000 selama promo aktif.
- Promo yang dipilih dicatat ke catatan lead setelah server memvalidasi skema dan periode. Harga akhir tetap dikonfirmasi admin.
- API token Moota, secret webhook, dan API key StarSender dapat dikelola melalui Admin > Pengaturan. Secret disimpan terenkripsi di database dan tidak dikembalikan ke browser. Perubahan kredensial berlaku tanpa redeploy.
- Pengaturan promo pusat dapat diubah dari Admin > Pengaturan tanpa redeploy.

## Upgrade

Baca [panduan upgrade 0.10.9](docs/UPGRADE-0.10.9.md) sebelum deployment. Migration `012-integrations-promotions.sql` perlu dijalankan satu kali pada database produksi setelah backup menggunakan `IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 012-integrations-promotions.sql`. Jangan menghapus database atau volume file yang sudah ada.

## Pengujian

26 file TypeScript/TSX yang berubah berhasil diparse tanpa kesalahan sintaks. Build Next.js, typecheck penuh, lint, dan seluruh test suite belum terverifikasi di lingkungan pengembangan ini karena `npm ci` tidak selesai dalam batas waktu yang tersedia. Coolify harus menunjukkan build sukses sebelum rilis dianggap tervalidasi.
