> Catatan rilis 0.7.0. Untuk pembaruan referral dan voucher 0.8.0, ikuti **MITRA-DAN-VOUCHER.md**. Akun aktif tidak perlu diimpor ulang.

# Pembaruan 0.7.0: Kepala Cabang dan 10 promotor

## Data yang dicocokkan

Pencarian pada 28 Oktober 2026 mencocokkan direktori KonsepSTIFIn dan endpoint resmi `https://apro.stifin.id/api/proGetCab/pro/JML-CAB-62`. Hasil: 11 promotor aktif dengan `Sub=JML-CAB-62`. Kesebelasnya memiliki email pada data resmi.

| Kode promotor | Nama |
| --- | --- |
| BKS-HRA-40 | Muhamad Sofyan AR |
| KHU-ABU-01 | Fauzi Abdul Rohim M.T. |
| KHU-ABU-02 | Muhammad Galang Rusdiansyah |
| KHU-ABU-03 | Mujahid Ayyasy Alfaqih |
| KHU-ABU-04 | Mochamad Rizki Ismail |
| KHU-ABU-05 | Gunawan Mansur |
| KHU-ABU-06 | Muchamad Luqman |
| KHU-ABU-07 | Ridwan Setiawan |
| KHU-ABU-08 | Fadlan Ahya Imani |
| KHU-ABU-09 | Fitriani |
| KHU-ABU-10 | Yeni Sri Yulianti |

Anda menggunakan akun admin yang sudah ada: `admin@konsepstifin.com`. Akun tersebut dipetakan ke BKS-HRA-40, diberi peran promotor tambahan, dan ditandai sebagai Kepala Cabang. Sandi admin tidak diubah; tidak dibuat akun admin kedua memakai email pribadi dari direktori pusat.

Sepuluh anggota lainnya memakai email yang diambil saat import dari API resmi. Email mereka tidak ditanam pada source. Import tidak memakai atau menyalin PassID/sandi aplikasi STIFIn. Akun baru belum aktif sampai masing-masing menetapkan sandi sendiri.

## Struktur cabang

Cabang Anda: **JML-CAB-62, STIFIn Kabupaten Pekalongan**, kode wilayah 33.26. Wilayah resmi ini mengikuti konteks proyek pemilik. Area layanan Anda pada direktori promotor adalah Sumedang; itu bukan lokasi cabang baru.

Database membatasi satu cabang untuk satu kode kabupaten/kota. Kabupaten Pekalongan berbeda dari Kota Pekalongan. Promotor cabang yang sama tetap boleh memiliki area layanan berbeda sesuai data resmi. Halaman direktori nasional tetap tersedia terpisah.

## Langkah untuk deployment yang sudah memakai 0.6.0

1. Backup database dan file pustaka.
2. Unggah isi ZIP versi 0.7.0 ke root repository, lalu redeploy di Coolify seperti sebelumnya.
3. Pertahankan `DATABASE_URL` dan `PLATFORM_ORIGIN` yang sudah bekerja. Tidak perlu membuat ulang akun admin atau mengganti sandinya.
4. Setelah container baru sehat, buka Terminal aplikasi dan jalankan:

```sh
cd /app
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Sekarang daftar migrasi berakhir dengan:

```text
Applied 004-promoter-network.sql
```

5. Impor jaringan dan siapkan akun:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/promoter-admin.mjs import
```

Pada database Anda yang baru memiliki satu admin dan belum memiliki akun promotor lain, hasil yang diharapkan:

```text
created: 10
total: 11
invitations: 10 tautan
```

Output sebenarnya berupa JSON. `created` menghitung akun baru, bukan total anggota. Jika sebagian email sudah menjadi akun yang sesuai, jumlah akun baru bisa lebih kecil. Import menolak konflik pemetaan; tidak menghapus, mereset sandi, atau menimpa pemetaan secara diam-diam.

**Perintah ini yang membuat akun di database Anda.** Pengerjaan paket hanya menggunakan database sintetis; akun produksi belum dibuat dari sesi pembuatan source ini.

Import dapat diulang. Pengulangan tidak menggandakan akun, tidak mereset akun aktif, dan tidak menerbitkan ulang semua undangan. Bila API tidak lagi mengembalikan set kode 11 orang yang sama, import berhenti agar perubahan anggota ditinjau dahulu.

## Membagikan akses

1. Buka `/admin/jaringan` atau menu **Klien & Promotor → Promotor Cabang**.
2. Periksa total 11, satu Kepala Cabang, dan status setiap akun.
3. Untuk anggota yang menunggu aktivasi, gunakan tombol tautan aktivasi. Tautan baru membatalkan tautan pending sebelumnya untuk orang tersebut.
4. Salin tautan dan sampaikan secara pribadi kepada anggota yang sesuai. Aplikasi tidak mengirim email/WhatsApp otomatis.
5. Anggota membuka tautan, menetapkan sandi minimal 12 karakter, lalu login di `/akun/login` memakai email terdaftarnya.

Tautan berlaku tujuh hari dan hanya dapat dipakai sekali. Token mentah tidak disimpan di database, tidak diletakkan pada query URL, dan halaman aktivasi tidak memuat Meta Pixel. Jangan menaruh output undangan pada repository, artikel, grup umum, atau tangkapan layar publik.

Tautan dapat diterbitkan ulang melalui Terminal untuk anggota pending tertentu:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/promoter-admin.mjs invite KHU-ABU-01
```

Ganti kode sesuai anggota. Perintah tidak dapat dipakai untuk mengambil alih/reset akun admin atau mengganti sandi anggota yang sudah aktif.

## Yang dapat diakses promotor

- Profil, kode resmi, area layanan, dan cabangnya sendiri.
- Lead yang ditugaskan ke kode dirinya dan memiliki persetujuan berbagi kontak.
- Portal menampilkan maksimal 100 lead terbaru serta jumlah total. Admin tetap memakai CRM berhalaman untuk pengelolaan lengkap.
- Promotor tidak dapat membuka API/admin network atau data internal admin.
- Kepala Cabang dapat membuka `/admin` dan `/akun` memakai identitas akun yang sama.

## Voucher

Struktur organisasi mengikuti alur **Cabang → Promotor → Pelanggan tes**. Pembelian voucher promotor berasal dari cabang sendiri.

Versi ini membangun akun dan keanggotaan cabang. **Saldo, harga beli/jual, stok awal, pembelian, dan refill voucher belum diimplementasikan.** Portal menampilkannya sebagai belum terhubung, bukan saldo nol. Tidak ada transaksi atau penambahan voucher yang dilakukan oleh import akun.

Untuk modul voucher berikutnya, diperlukan saldo/stok awal terverifikasi, harga jual cabang, aturan pemenuhan, dan kontrak API resmi bila refill akan otomatis. Jangan menganggap data akun sebagai bukti saldo voucher.

## Validasi setelah import

- Anda tetap bisa login admin dengan sandi sebelumnya.
- Halaman Promotor Cabang menampilkan 11 anggota, termasuk Anda.
- Sebelum aktivasi, login promotor baru ditolak.
- Setelah aktivasi, anggota dapat masuk `/akun`, melihat cabang yang benar, dan tidak dapat membuka admin.
- Anggota A tidak melihat lead anggota B atau lead tanpa persetujuan berbagi.
- Tautan yang sudah digunakan/kedaluwarsa ditolak.
- Tidak ada voucher/saldo yang berubah.

Jika import gagal, kirim hanya pesan error ringkas. Jangan membagikan `DATABASE_URL`, password, atau tautan aktivasi.
