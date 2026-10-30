# Upgrade KonsepSTIFIn 0.10.16

## Fokus rilis

Rilis ini memoles pengalaman visual dan interaksi tanpa mengubah alur bisnis, API, kredensial integrasi, maupun skema database.

## Perubahan UI/UX

- Menyatukan palet hijau hutan, tipografi, garis, radius, bayangan, dan state hover/focus.
- Merapikan hero publik, kartu jalur layanan, katalog produk, promo pusat, FAQ, formulir, dan footer.
- Memperbaiki hierarki visual halaman publik agar CTA utama lebih jelas.
- Menambah responsivitas untuk navigasi, grid, modal, footer, kartu, tabel, dan dashboard pada layar kecil.
- Memperhalus halaman akun anggota, dashboard admin, tombol, field input, tabel, dan kartu statistik.
- Menjaga focus-visible, tap target, dan prefers-reduced-motion.

## Deployment

1. Backup source dan database produksi.
2. Masukkan seluruh isi paket ke repository `muhamadsofyanar/konsepstifin-platform`, branch `main`.
3. Commit semua perubahan sebagai satu rilis.
4. Jalankan satu deployment melalui Coolify.
5. Pastikan container `healthy`, lalu periksa `/api/health` untuk versi `0.10.16`.
6. Uji homepage, halaman produk, modal permintaan, halaman akun, dashboard admin, dan halaman voucher di desktop serta HP.

## Database dan environment

- Tidak ada migrasi database baru.
- Tidak ada perubahan nama environment variable.
- Kredensial integrasi tidak perlu dimasukkan ulang.

## Batas verifikasi

Paket berisi perubahan CSS dan metadata versi. Build Next.js produksi perlu tetap diverifikasi oleh Coolify sebelum dianggap siap produksi.
