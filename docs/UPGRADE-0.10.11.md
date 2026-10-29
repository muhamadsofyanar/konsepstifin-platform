# Upgrade KonsepSTIFIn 0.10.11

## Perubahan
- Memperbaiki badge status Moota/StarSender agar tidak memakai gaya alert berukuran besar.
- Membuat daftar status integrasi lebih rapi dan responsif.
- Menumpuk kartu Family Test dan Year-End Workshop dalam satu kolom jika lebar konten sempit.
- Tidak menambah migrasi database. Migrasi yang diperlukan dari versi sebelumnya tetap harus sudah diterapkan.

## Deployment
Deployment terakhir pengguna gagal saat Docker mencoba mengambil metadata `node:24-alpine` dari Docker Hub dan DNS `8.8.8.8` mengalami timeout. Itu adalah masalah jaringan/DNS server, bukan kegagalan TypeScript pada source.
1. Retry deployment setelah koneksi DNS server pulih.
2. Jika tetap gagal, periksa resolusi `registry-1.docker.io` dari host Coolify dan konfigurasi DNS Docker.
3. Setelah build sukses, pastikan `/api/health` menunjukkan `0.10.11`.
4. Uji halaman Admin > Pengaturan > Integrasi Eksternal dan beranda pada viewport mobile.

Tidak ada klaim bahwa build produksi berhasil diuji dalam lingkungan pembuatan arsip ini.
