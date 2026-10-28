# KonsepSTIFIn 0.10.2: halaman publik dan konsistensi angka

Paket source lengkap yang melanjutkan 0.10.1. Semua perbaikan video, sertifikat, halaman produk, dan pusat affiliate dari versi sebelumnya tetap disertakan.

## Cara upgrade

1. Backup database dan volume file seperti biasa.
2. Unggah isi folder konsepstifin-0.10.2 ke root repository aplikasi yang sama, lalu redeploy melalui Dockerfile yang disertakan.
3. Pertahankan DATABASE_URL, PLATFORM_ORIGIN, password, alias, dan volume ebook yang sudah digunakan.
4. Jika database sudah berhasil memakai migrasi 008 pada 0.10.0/0.10.1, tidak ada migrasi baru pada rilis ini.
5. Setelah deployment, refresh paksa browser dengan Ctrl + Shift + R.
6. Buka /api/health. Nilai version harus 0.10.2. Respons health menandakan server web berjalan, bukan pemeriksaan lengkap kesiapan database.

Jika migrasi sampai 008 belum pernah berhasil, jalankan di terminal container baru:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Jangan provision ulang akun, mengganti database, atau mengimpor ulang promotor untuk memperbarui tampilan.

## Perubahan yang terlihat

- Beranda menampilkan layanan tes, kelas/ebook, jalur promotor, dan affiliate dengan hierarki tombol yang lebih jelas.
- Daftar harga beranda dipecah menjadi baris yang dapat dibandingkan, dengan tautan detail produk masing-masing.
- Navigasi publik memiliki Kelas & Ebook serta Akun saya. Akses admin tetap ada di footer.
- Halaman affiliate menjelaskan fungsi pusat mitra yang sudah tersedia, dengan jalur masuk ke /akun/mitra.
- Kontak mempunyai pilihan bantuan peserta dan permohonan aktivasi affiliate melalui Bantuan akun.
- Direktori promotor dan halaman layanan kota memakai header/footer yang sama dengan halaman publik lain.
- Font DM Sans dan Manrope disertakan sebagai file lokal, dengan font-display swap. Lisensi font disertakan di public/fonts.
- Halaman produk mempunyai judul, deskripsi, dan canonical yang sesuai dengan produk masing-masing.

## Angka dan harga

Rilis ini tidak mengubah harga pada database, pesanan lama, saldo komisi, atau nilai pembayaran.

- Format Rupiah memakai pemisah ribuan yang konsisten dan tanpa desimal pecahan.
- Layanan yang membutuhkan penawaran tidak dipromosikan sebagai layanan gratis hanya karena nilai tersimpannya nol.
- Angka legacy 0/1 pada program affiliate yang bukan produk checkout ditampilkan sebagai konfirmasi ketentuan. Jika admin secara eksplisit menyimpan teks Gratis, teks tersebut tetap dipertahankan.
- Perhitungan total tahap promotor hanya memakai harga tetap yang berhasil dibaca. Angka tambahan dalam kalimat, rentang harga, atau tahap yang belum lengkap tidak dipaksa menjadi total.
- Biaya gabungan tahap terpisah tidak dipakai sebagai harga paket ketika harga paket masih memerlukan penawaran.
- Label dan catatan publik yang masih menyebut SEJOLI disesuaikan pada lapisan tampilan. Data asli tetap tersimpan untuk pengelolaan dan audit.

Jika harga tersimpan seperti Rp650.001 memang merupakan kesalahan, ubah dari /admin/kelas?section=products. Rilis tidak membulatkan angka tersebut secara diam-diam karena bisa merupakan harga yang sengaja ditetapkan admin. Setelah disimpan, katalog dan landing page membaca data produk yang sama.

## Pemeriksaan setelah deployment

- / : tombol produk, daftar harga, kelas/ebook, dan tautan affiliate.
- /tes-stifin : fasilitas, harga, dan tombol menuju detail layanan yang sama.
- /jadi-promotor : biaya tahap, paket, dan selisih katalog jika seluruh angka valid.
- /affiliate : informasi akun mitra dan tombol masuk pusat mitra.
- /kontak : bantuan peserta dan jalur permohonan affiliate.
- /promotor, /wilayah, dan /edukasi : navigasi serta tampilan ponsel.
- /produk/layanan/paketKeluarga : judul, harga, fasilitas, dan formulir permintaan.
- /akun/mitra : produk promosi, komisi/pencairan, dan tautan affiliate.

Peran affiliate tetap perlu aktivasi admin. Pengajuan melalui Bantuan tidak otomatis memberi akses mitra. Pembayaran dan pencairan tetap melalui verifikasi/transfer manual sesuai alur yang sudah ada.

Paket ini belum dideploy oleh asisten ke server pengguna. Hasil uji menggunakan aplikasi lokal dengan data sintetis.
