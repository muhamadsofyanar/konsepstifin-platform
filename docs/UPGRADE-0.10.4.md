# KonsepSTIFIn 0.10.4: pengajuan layanan dari tautan affiliate

Paket source lengkap, melanjutkan 0.10.3. Perbaikan ini berfokus pada pengajuan layanan, termasuk ID & Alat, WSL, dan jalur calon promotor. Optimasi performa hasil perbandingan Averion belum diterapkan pada rilis ini.

## Penyebab pada sumber sebelumnya

Tautan /r/khu-abu-10?product=idDanAlat&kind=service memang diarahkan ke /produk/layanan/idDanAlat. Sumber referral diteruskan melalui cookie terverifikasi server, sehingga alias tidak perlu berada di URL produk.

ID & Alat diklasifikasikan sebagai jalur calon promotor. Persetujuan berbagi kontak untuk jalur ini bersifat opsional. Namun versi sebelumnya menghapus sumber referral apabila persetujuan tersebut tidak diberikan. Akibatnya pengajuan bisa tersimpan di CRM admin tanpa terhubung ke affiliate pengundang.

## Perubahan

- Sumber referral yang terverifikasi disimpan terpisah dari izin berbagi kontak.
- Tanpa persetujuan berbagi, pengajuan tidak otomatis ditugaskan kepada promotor pengundang dan data kontak tidak dibuka ke akun promotor.
- Tab Aktivitas referral menampilkan daftar pengajuan layanan dengan nomor KSF, layanan, tanggal, dan status. Nama, email, telepon, domisili dan catatan kebutuhan klien tidak disertakan dalam daftar ini.
- Konfirmasi pengiriman menampilkan nomor KSF serta alias referral yang benar-benar tersimpan. Jika sumber referral tidak terverifikasi, konfirmasi menjelaskannya.
- Respons tanpa nomor referensi tidak lagi ditampilkan sebagai pengajuan yang berhasil tersimpan.
- Detail CRM admin menampilkan affiliate pengundang secara terpisah dari sumber kampanye dan promotor yang ditugaskan.
- Kebijakan privasi dan keterangan formulir menjelaskan pemisahan atribusi dan pembagian kontak.

## Pemasangan

1. Backup database dan volume penyimpanan seperti biasa.
2. Unggah isi folder konsepstifin-0.10.4 ke root repository aplikasi yang sama dan redeploy.
3. Pertahankan DATABASE_URL, PLATFORM_ORIGIN, semua akun, alias, harga, transaksi, dan volume file yang sudah dipakai.
4. Jika migrasi 009 pada 0.10.3 sudah berhasil, tidak ada migrasi tambahan. Jika masih dari 0.10.2 atau migrasi 009 belum dilakukan, jalankan di terminal container versi baru:

```sh
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

5. Refresh browser dengan Ctrl + Shift + R. Periksa /api/health, version harus 0.10.4.

Paket ini sudah mencakup 0.10.3. Tidak perlu memasang dan redeploy 0.10.3 terlebih dahulu. Tidak perlu provision ulang akun atau import ulang jaringan.

## Uji kasus ID & Alat

1. Gunakan jendela privat agar tidak ada cookie kunjungan pertama dari mitra lain.
2. Buka https://konsepstifin.com/r/khu-abu-10?product=idDanAlat&kind=service. Mitra tersebut harus sudah aktif.
3. Setelah menuju detail produk, klik Ajukan layanan ini. Klik ini baru membuka formulir, belum mencatat pengajuan.
4. Isi data dan beri persetujuan kontak untuk tim admin. Untuk menguji perbaikannya, biarkan persetujuan berbagi kepada promotor tidak dicentang.
5. Kirim sampai muncul nomor KSF dan Asal referral tercatat: /r/khu-abu-10. Catat nomor KSF.
6. Masuk sebagai mitra terkait, buka /akun/mitra?tab=activity dan klik Perbarui data. Nomor KSF harus muncul pada Pengajuan layanan dari referral Anda.
7. Admin dapat mencari pengajuan di /admin/leads pada kelompok calon promotor dan memeriksa Affiliate pengundang di detailnya. Pengajuan ini tidak otomatis masuk sebagai layanan tes personal.

Pengajuan belum merupakan pembelian atau komisi. Komisi tetap mengikuti kebijakan produk dan pesanan/pembayaran yang diverifikasi. Nomor KSF dan nomor pesanan KS merupakan catatan yang berbeda.

## Data dan batas atribusi

Perbaikan berlaku untuk pengajuan baru. Pengajuan lama yang sumber referralnya sudah kosong tidak diisi ulang secara otomatis. Gunakan nomor KSF lama untuk pemeriksaan admin berdasarkan bukti yang tersedia.

Cookie tetap mengikuti kunjungan pertama yang valid selama 30 hari. Jika klien pernah membuka tautan mitra lain dan cookie itu masih berlaku, alias yang tercatat dapat mengikuti mitra pertama. Sumber yang terikat saat pendaftaran juga tetap mempunyai prioritas dalam jangka atribusi awal sebagaimana 0.10.3. Konfirmasi baru membantu melihat alias yang digunakan.

Pengujian dilakukan pada data sintetis. Pekerjaan ini tidak memeriksa isi database produksi dan belum menerapkan paket ke server pengguna.
