# KonsepSTIFIn 0.10.1

Rilis lengkap yang melanjutkan source 0.10.0. Video diputar dalam materi, sertifikat didesain ulang, dan pintu produk serta affiliate disatukan.

## Setelah unggah source dan redeploy

Jika migrasi 008 sudah berhasil pada 0.10.0, rilis 0.10.1 tidak menambah migrasi database, dependency produksi, atau ENV baru. Pertahankan DATABASE_URL, PLATFORM_ORIGIN, password, alias, dan volume file yang sama.

1. Backup database serta volume ebook.
2. Unggah isi folder konsepstifin-0.10.1 ke root repository aplikasi yang sama. Jangan menaruh folder pembungkus di dalam root aplikasi.
3. Redeploy memakai Dockerfile yang disertakan.
4. Buka /admin/kelas?section=products. Gunakan editor ini untuk nama, harga, manfaat/bonus layanan, status, dan komisi. Menu /admin/produk lama diarahkan ke editor tersebut.
5. Buka /akun/mitra sebagai promotor/affiliate. Produk promosi, komisi/pencairan, serta tautan affiliate sekarang berada pada tab di satu halaman.
6. Buka materi video. Tautan YouTube, Vimeo, dan file MP4/WebM/OGV HTTPS akan menggunakan pemutar di dalam materi. Pemilik video harus mengizinkan embed dan akses videonya.
7. Buka sertifikat lama. Desain baru berlaku tanpa menerbitkan ulang data sertifikat. Tombol Cetak / Simpan PDF membuka dialog cetak browser. Gunakan A4 mendatar dan matikan header/footer browser.

Jika belum pernah menjalankan migrasi 008, gunakan terminal container baru:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Jangan menjalankan provision ulang, mengganti database, atau mengimpor ulang akun. Langkah di atas hanya menjalankan migrasi yang sudah disertakan sampai 008. Untuk upgrade dari 0.9.1, baca juga UPGRADE-0.10.0.md terkait volume privat dan konfigurasi komisi.

## Satu tujuan untuk setiap produk

| Pintu masuk | Tujuan produk keluarga |
| --- | --- |
| Kartu pada landing page Tes STIFIn | /produk/layanan/paketKeluarga |
| Katalog layanan dan produk digital | /produk/layanan/paketKeluarga |
| Tombol lihat produk pada dashboard admin | /produk/layanan/paketKeluarga |
| Tombol lihat produk pada pusat affiliate | /produk/layanan/paketKeluarga |
| Tautan promosi /r/ALIAS?product=paketKeluarga&kind=service | Mencatat referral, lalu menuju /produk/layanan/paketKeluarga |
| Tautan lama /belajar?product=paketKeluarga | Dialihkan ke detail produk keluarga yang sama |

Produk digital memakai /produk/SLUG. Layanan lama memakai /produk/layanan/PRODUCT_KEY agar tidak bertabrakan dengan slug ebook atau kelas. Contoh: ebook dengan slug wsl1 berbeda dari layanan WSL 1.

Halaman landing tetap dapat menampilkan beberapa layanan sekaligus. Tombol untuk produk tertentu sekarang menuju satu detail produk. Tombol bantuan umum tetap dapat membuka formulir bantuan.

Tautan affiliate mempunyai identitas tambahan sebelum diarahkan ke detail produk yang sama. Membagikan URL detail biasa tidak otomatis mencatat mitra. Salin tautan promosi dari pusat affiliate. Referral yang sah tetap disimpan melalui cookie, meskipun alias tidak terlihat lagi di alamat detail produk.

Layanan tetap menggunakan formulir CRM untuk mengonfirmasi wilayah, peserta, jadwal, dan harga. Produk digital menggunakan checkout akun di halaman detail. Jalur pembayaran dan komisi tetap memakai ledger yang sama.

## Pemutar video

- YouTube: tautan watch, youtu.be, shorts, live, dan embed dengan ID video yang valid.
- Vimeo: tautan video biasa dan tautan private dengan hash.
- File langsung: MP4, WebM, dan OGV melalui HTTPS. URL bertanda tangan tetap mempertahankan query-nya.
- URL yang tidak dikenal tetap memiliki penjelasan serta pilihan membuka sumber. HTML iframe atau script bebas tidak dijalankan.
- Materi dan URL sumbernya tetap diperiksa melalui hak akses peserta sebelum dikirimkan API. Embed bukan DRM. Pengaturan video unlisted, private, serta domain embed tetap diatur oleh pemilik video.
- Pemutaran tidak otomatis menandai materi selesai. Peserta masih menggunakan tombol Tandai materi selesai.

## Sertifikat

Desain menampilkan nama peserta, judul program, tanggal, penerbit platform, nomor verifikasi, dan status berlaku/dicabut. Tidak ada tanda tangan pejabat atau klaim akreditasi yang dibuat-buat. Sertifikat yang dicabut tetap ditandai tidak berlaku pada halaman dan hasil cetak.

Simpan PDF menggunakan dialog cetak browser. Ini tidak memasang layanan PDF eksternal. Desain berlaku pada sertifikat lama karena datanya tetap dibaca dari database.

## Pemeriksaan operasional

1. Pastikan halaman detail keluarga hanya menampilkan produk keluarga, bukan seluruh katalog.
2. Salin tautan promosi mitra, buka pada profil browser yang bersih, lalu ajukan layanan dengan persetujuan pembagian kontak.
3. Periksa sumber referral pada lead CRM. Buat pesanan dari lead asli dan verifikasi pembayaran. Komisi memerlukan kebijakan atribusi serta persentase yang sudah diaktifkan admin.
4. Untuk ebook/e-course berbayar, login dari halaman detail dan pastikan kembali ke produk yang dipilih. Login tidak otomatis membuat pesanan berbayar.
5. Uji video milik pengelola. Bila embed ditolak, periksa izin video atau gunakan URL yang mendukung pemutar langsung.
6. Periksa hasil cetak sertifikat dengan nama dan judul yang digunakan produksi.

Paket ini belum diunggah ke server Coolify pengguna oleh asisten. Pengujian memakai aplikasi lokal dengan data sintetis.
