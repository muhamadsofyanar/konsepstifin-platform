# Rancangan UI/UX KonsepSTIFIn 0.10.18

## Prinsip

- Kebutuhan pengunjung lebih dulu daripada navigasi internal.
- Beri pilihan yang mudah dipahami, bukan daftar istilah produk yang terlalu teknis.
- Setiap pilihan memiliki penjelasan, tujuan, dan CTA yang konsisten.
- Kumpulkan data minimum yang diperlukan untuk menindaklanjuti permintaan.
- Gunakan dokumentasi kegiatan nyata, bukan statistik atau testimoni yang tidak terverifikasi.
- Animasi harus singkat, tidak menghalangi pembacaan, dan mengikuti `prefers-reduced-motion`.

## Alur beranda

1. Hero: jelaskan nilai layanan dan dua CTA utama.
2. Promo pusat: tampil hanya saat aktif dan mengambil sumber data dari pengaturan.
3. Pemilih jalur: personal, keluarga, kelompok, mencari promotor, calon promotor, atau edukasi.
4. Kartu layanan: jelaskan empat jalur utama.
5. Situasi pengguna: hubungkan layanan dengan kebutuhan sehari-hari tanpa menjanjikan hasil berlebihan.
6. Proses: jelaskan dari pengajuan sampai konfirmasi.
7. Dokumentasi: tunjukkan aktivitas nyata dengan keterangan yang jelas.
8. Persiapan: kota/wilayah, jumlah peserta, tujuan. Data sensitif tidak diminta pada tahap awal.
9. Batasan dan privasi: jelaskan apa yang dikonfirmasi, bagaimana data digunakan, dan batas penggunaan hasil.
10. Edukasi, FAQ, akses akun, dan CTA akhir.

## Pemilih jalur pengunjung

Komponen `src/app/visitor-path-finder.tsx` menyediakan enam pilihan. Pilihan aktif ditandai secara visual dan semantik menggunakan `aria-pressed`. Panel rekomendasi diperbarui tanpa reload dan mengumumkan perubahan melalui `aria-live="polite"`. Semua CTA menggunakan tautan internal yang sudah ada. Jika Meta Pixel telah dikonfigurasi, pilihan dan klik rekomendasi mengirim event `VisitorPathSelected` dan `VisitorPathCTA` tanpa mengirim data pribadi.

## Gerak dan aksesibilitas

- Animasi masuk hanya untuk memperhalus pemuatan, bukan untuk menyembunyikan konten.
- Hover mengangkat kartu secara ringan dan tidak memindahkan layout secara signifikan.
- Animasi visual dan transisi utama dinonaktifkan jika pengguna memilih reduced motion.
- Fokus keyboard tetap terlihat.
- Tidak ada dependensi animasi eksternal baru.

## Data yang perlu diukur setelah rilis

- Klik pada tiap jalur kebutuhan melalui event Meta Pixel `VisitorPathSelected` jika Pixel aktif.
- Klik dari jalur rekomendasi melalui event `VisitorPathCTA` jika Pixel aktif.
- Form dimulai dan form berhasil dikirim.
- Pengunjung menuju login/daftar.
- Perangkat, sumber kampanye, dan halaman masuk melalui analitik yang sudah disetujui.

Baseline perlu dikumpulkan terlebih dahulu. Jangan menetapkan target konversi tanpa data awal.
