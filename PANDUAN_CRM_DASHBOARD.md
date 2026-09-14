# Pelengkapan dashboard Konsep STIFIn — CRM

Dashboard lama tetap digunakan. Modul Artikel & AI, Produk & Harga, Pustaka,
Content Intelligence, dan direktori nasional tidak dihapus. Menu portal bersama
menambahkan akses Klien & Promotor di `/admin/leads`. Login masuk ke CRM.

## Yang sudah ditambahkan

- Empat kelompok: Calon Klien, Klien, Calon Promotor, Promotor Jaringan.
- Input manual dengan nama, WhatsApp, email, domisili, layanan/program, catatan,
  dan konfirmasi persetujuan oleh admin. Tidak membuat persetujuan secara otomatis.
- Edit nama, kontak, domisili, status, PIC/penugasan, dan catatan internal.
- Riwayat pembuatan manual mencatat admin; perubahan kontak masuk audit trail.
- Formulir publik yang sudah ada tetap mengalir ke calon klien/calon promotor.
- Sejoli tetap menjadi tujuan checkout, bukan dianggap sudah dimigrasikan.
- Perbaikan konfigurasi `npm test` agar memakai konfigurasi Vitest yang lengkap.

## Definisi kelompok

| Kelompok | Data sumber | Status |
| --- | --- | --- |
| Calon Klien | Layanan tes | Selain selesai, termasuk prospek ditutup |
| Klien | Layanan tes | Selesai |
| Calon Promotor | Rekrutmen promotor | Selain selesai, termasuk prospek ditutup |
| Promotor Jaringan | Rekrutmen promotor | Selesai |

Pada versi ini satu baris adalah satu proses layanan/rekrutmen, bukan master
orang lintas semua transaksi. Orang yang mengikuti tes dan juga mendaftar
promotor dapat memiliki dua proses. Nomor telepon tidak dipakai untuk menggabung
orang secara otomatis karena satu keluarga dapat memakai kontak yang sama.

Status pembayaran tidak mengubah kelompok. Klien di sini berarti layanan sudah
selesai, bukan sekadar telah membayar. Status aktivasi masih berarti calon
promotor; ubah menjadi selesai setelah aktivasi benar-benar terverifikasi.
Pencatatan Promotor Jaringan tidak menerbitkan/mengaktifkan ID resmi STIFIn dan
tidak menambahkan orang ke direktori nasional secara otomatis.

Gunakan filter Ditutup untuk prospek yang tidak berlanjut. Jangan menghapus data
lama. Pembatalan perubahan status dapat dilakukan melalui dropdown status;
riwayat tetap tercatat. Perubahan domisili mengosongkan kode wilayah lama untuk
mencegah informasi yang tidak konsisten; periksa lagi penugasan promotor.

## Deploy

1. Backup PostgreSQL dan persistent volume yang ada sebelum deploy.
2. Unggah isi folder proyek ke repository yang sama, pertahankan environment
   dan volume produksi. Jangan unggah node_modules, .next, atau .env.
3. Redeploy melalui Coolify menggunakan Dockerfile lama.
4. Buka `/admin/login`. Setelah login, buka Klien & Promotor.
5. Uji tambah calon klien, edit kontak, tutup-buka detail, lalu reload halaman.
6. Ubah status calon klien ke selesai; periksa tab Klien dan riwayat.
7. Uji calon promotor sampai selesai; periksa Promotor Jaringan.
8. Pastikan artikel lama dan tautan checkout Sejoli tetap bekerja.

Tidak ada penghapusan tabel atau migrasi destruktif dalam perubahan ini.
Menggunakan tabel public_interest_leads dan lead_status_history yang sudah ada.

## Batas versi dan tahap ATM Sejoli selanjutnya

Ini melengkapi CRM, bukan pengganti penuh Sejoli. Belum mencakup migrasi akun,
invoice otomatis, payment gateway baru, komisi affiliate, refund, atau SSO.
Status bayar/ID order di detail layanan masih dicatat manual oleh admin setelah
dicocokkan dengan Sejoli. Jangan menonaktifkan Sejoli sebelum penggantinya diuji.

Untuk memindahkan data, siapkan ekspor resmi pelanggan/member, produk, order,
affiliate dan komisi berikut penjelasan kolom serta aturan perhitungan komisi.
Jangan kirim password, token gateway, atau database mentah berisi secret.
Pemetaan dan impor harus diuji pada salinan database sebelum produksi.

Hak akses masih akun admin tunggal sesuai fondasi proyek lama; jangan memberikan
akun ini kepada promotor. Portal login promotor individual perlu RBAC terpisah.
Dashboard memuat maksimal 500 proses terbaru dan menampilkan peringatan batas;
angka/filter adalah untuk data yang dimuat, bukan total seluruh database.

## Verifikasi

Production build dan pemeriksaan TypeScript berhasil di lingkungan kerja.
ESLint dan suite unit/UI/API dijalankan. Tes integrasi PostgreSQL dilewati bila
TEST_DATABASE_URL tidak tersedia. Koneksi database produksi, transaksi Sejoli,
dan perilaku browser di server Anda harus diuji setelah deploy.
