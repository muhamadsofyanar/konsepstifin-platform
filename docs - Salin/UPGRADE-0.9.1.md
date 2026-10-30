# KonsepSTIFIn 0.9.1: perbaikan UI/UX

Tanggal: 28 Oktober 2026. Baseline: paket 0.9.0 yang dibuat pada percakapan ini. Log deployment pengguna menunjukkan build Docker dan healthcheck berhasil. Screenshot menunjukkan dua hal yang berbeda: benturan CSS heading dan layanan learning yang belum tersedia. Penyebab kegagalan data produksi belum dapat dipastikan tanpa pemeriksaan database/log server.

## Apa yang berubah

- CSS learning memakai namespace `learning-app` dan `lr-*`. Heading tidak lagi memakai `.hero` milik halaman publik yang memaksakan grid dua kolom, tinggi 650 piksel dan padding besar.
- Heading lebih ringkas, tombol utama jelas, jarak antarbagian konsisten, dan tabel memiliki area scroll tersendiri pada layar kecil.
- Menu utama admin menampilkan Kelas & Mitra secara langsung.
- Workspace kelas admin dipisah: Ringkasan, Produk digital, Modul & materi, Peserta & akses, Kupon, Komisi & pencairan, Sertifikat, Bantuan, Status sistem. Hanya satu bagian tampil, dan formulir bagian lain tetap menyimpan input ketika berpindah menu.
- Ringkasan menampilkan jumlah dari data yang berhasil dimuat dan panduan tiga langkah menyiapkan kelas. Kegagalan data tidak ditampilkan sebagai angka nol yang seolah valid.
- Form peserta menggunakan pencarian email dan pilihan akun. Pencarian menjangkau semua akun, termasuk akun lama di luar daftar 300 akun terbaru. Endpoint pencarian hanya tersedia bagi admin, maksimal 50 hasil per pencarian.
- Komisi/payout/tiket dapat dipilih dari daftar yang diberi label. Persentase komisi diisi sebagai persen biasa, dengan konversi ke basis point di server request. Tarif tidak diaktifkan otomatis.
- Status, uang dan tanggal ditampilkan dengan label Indonesia. Pesanan yang dibatalkan atau direfund tidak ditampilkan sebagai tagihan baru yang harus ditransfer.
- Kegagalan simpan ditampilkan sebagai alert; keberhasilan dan kegagalan mempunyai warna dan pesan berbeda.
- Menu member menyesuaikan peran. Peserta mendapat kelas, pembelian dan bantuan. Promotor mendapat tambahan referral, voucher dan komisi. Admin mendapat tautan ruang admin. Menu tidak menggantikan pemeriksaan izin di server.
- Halaman akun memberi akses cepat ke pekerjaan utama. Menu yang sama tersedia di ruang belajar, referral, voucher dan komisi.
- Ruang belajar dipisah menjadi Kelas saya, Katalog, Pembelian, Sertifikat dan Bantuan. Katalog dapat dicari. Pendaftaran menampilkan formulir konfirmasi, lalu mengarahkan ke pembelian atau kelas setelah berhasil.
- Kartu kelas menampilkan progres dan tombol mulai/lanjut. Materi terakhir dapat dilanjutkan. Jadwal materi mengikuti awal grant aktif paling awal agar renewal tidak mengunci kembali materi yang sudah berhak diakses.
- Pembelian menampilkan total, uang terverifikasi, sisa tagihan yang memang masih perlu dibayar, instruksi transfer dan salin rekening. Sertifikat serta bantuan memiliki layar tersendiri.
- Pemeriksaan kesiapan database melalui endpoint admin `view=setup`. Admin mendapat instruksi migrasi ketika tabel learning belum lengkap. Peserta mendapat pesan layanan yang lebih sederhana tanpa instruksi infrastruktur.

## Cara memasang

1. Backup database dan volume yang sedang digunakan.
2. Unggah isi folder source 0.9.1 ke repository aplikasi yang sama. Pertahankan ENV dan volume lama.
3. Redeploy satu kali memakai Dockerfile yang disertakan. Tidak ada dependency aplikasi baru, ENV baru, atau migrasi data baru dari 0.9.0 ke 0.9.1.
4. Periksa `/api/health`: versi 0.9.1.
5. Buka `/admin/kelas` dan `/belajar`. Jika browser masih memuat tampilan lama, lakukan hard refresh.

### Jika learning masih belum tersedia

Migrasi 007 dari rilis 0.9 tetap diperlukan. Healthcheck container menguji server web, bukan seluruh tabel fitur. Jika migrasi belum dijalankan setelah upgrade 0.8, buka terminal container aplikasi di Coolify dan jalankan:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Perintah memakai DATABASE_URL container dan menjalankan file migrasi 001–007 secara berurutan. Perintah ini tetap eksplisit, tidak dijalankan otomatis dari browser atau startup. Setelah selesai, klik Muat ulang di admin. Tidak perlu redeploy lagi hanya untuk membaca tabel yang baru selesai dimigrasikan.

Jika migrasi sudah lengkap tetapi layanan masih gagal, periksa DATABASE_URL, hak akses database, dan log container. Status sistem admin membedakan tabel belum lengkap dari error umum, tetapi tidak menampilkan kredensial atau error SQL mentah. Jangan menghapus volume/database untuk memperbaiki tampilan.

## Batas dan pengujian

Hak akses, pembayaran, komisi, voucher, dan worker 0.9 tetap memakai backend yang sama. Keterbatasan fitur bisnis 0.9 masih berlaku; lihat UPGRADE-0.9.md. Halaman publik lama tetap dipertahankan.

Perbaikan diverifikasi dengan tes interaksi React/jsdom, computed CSS, kebijakan menu, API, integrasi SQL, typecheck, lint, build dan smoke HTTP standalone. Browser Chromium lokal gagal berjalan di lingkungan pengujian; browser cloud tidak dapat mengakses localhost pengujian. Oleh sebab itu, hasil ini bukan klaim pengujian visual browser desktop/mobile atau pemeriksaan tampilan produksi setelah redeploy.

Checklist setelah pemasangan: heading admin dan peserta ringkas; menu bekerja pada desktop/ponsel; anggota biasa tidak melihat menu promotor; promotor masih dapat menggunakan voucher/referral; produk/materi dapat disimpan; pembayaran lama tetap terbaca; lanjut belajar dan unduhan berfungsi.
