# Mitra dan voucher KonsepSTIFIn 0.8.0

Pembaruan ini tetap satu aplikasi Next.js dan satu database PostgreSQL. Sumber plugin SEJOLI STIFIn Voucher digunakan sebagai referensi kontrak API, tanpa memasang WordPress atau SEJOLI.

## Setelah upload ke GitHub dan redeploy Coolify

Jangan provision atau impor ulang akun yang sudah aktif. Pertahankan DATABASE_URL, PLATFORM_ORIGIN, dan konfigurasi sebelumnya. Jalankan sekali pada terminal aplikasi:

```sh
cd /app
IDENTITY_ADMIN_CONFIRM=yes node scripts/identity-admin.mjs migrate
```

Migrasi juga aman dijalankan ulang. Data akun, pembayaran, dan cabang yang sudah ada dipertahankan. ENV ADMIN_PASSWORD dan ADMIN_SESSION_SECRET tidak digunakan sistem akun database ini; password tidak diganti oleh redeploy.

Tambahkan konfigurasi voucher berikut:

```dotenv
STIFIN_VOUCHER_MODE=test
STIFIN_VOUCHER_USER_ID=user
```

`test` tidak mengisi voucher riil. Pesanan uji ditandai sebagai uji dan tidak berubah menjadi pengiriman riil ketika mode diganti. Jangan transfer uang sungguhan untuk pesanan uji.

Untuk operasional riil, setelah konfigurasi akun API cabang benar, ubah `STIFIN_VOUCHER_MODE=live` dan redeploy. Gunakan UserID yang diizinkan API STIFIn; nilai `user` mengikuti nilai bawaan plugin sumber dan bukan jaminan otorisasi akun Anda. Jika API memerlukan autentikasi, isi STIFIN_API_AUTH_HEADER dan STIFIN_API_AUTH_VALUE pada ENV Coolify. Jangan masukkan secret ke GitHub. `off` menonaktifkan pembelian/pengiriman baru.

Worker antrean berjalan otomatis bersama server menggunakan Dockerfile bawaan. Command container harus menggunakan `node scripts/start-with-worker.mjs`; hapus override Coolify lama yang hanya menjalankan `node server.js`, jika ada. Jalankan migrasi sebelum menerima pesanan voucher. Untuk pengembangan dengan `npm run dev`, jalankan `npm run voucher:worker` pada terminal kedua dengan ENV yang sama.

## Penggunaan

Mitra membuka `/akun/tautan` untuk mengatur alias referral, lalu membagikan tautan `/r/alias`. Alias resmi kode promotor tetap tersedia; alias lama tetap dimiliki akun yang sama. Kode promotor STIFIn tidak berubah. Pendaftar yang menyetujui pembagian kontak masuk ke lead mitra asal. Sumber referral disimpan terpisah dari penugasan lead, sehingga tetap tercatat ketika admin memindahkan penanganan. Atribusi ini belum merupakan pencairan komisi atau pengikatan komisi pelanggan seumur hidup.

Mitra membuka `/akun/voucher` untuk melihat saldo riil miliknya, menentukan jumlah, membuat pesanan dan melihat instruksi transfer. Harga awal Rp165.000/voucher dan batas jumlah dapat diubah admin di `/admin/voucher`. Harga pesanan yang telah dibuat tetap mengikuti snapshot saat checkout.

Admin memeriksa mutasi bank, lalu mencatat pembayaran diterima pada pesanan. Pembayaran sebagian belum memicu pengisian. Setelah lunas, antrean mengirim permintaan pengisian satu kali, lalu memeriksa saldo. Status berhasil baru diberikan setelah saldo terbaca sesuai hasil yang diharapkan. Tidak ada konfirmasi otomatis dari rekening bank atau payment gateway dalam versi ini.

## Jika pengiriman perlu diperiksa

Timeout dapat terjadi setelah STIFIn menerima pengisian. Karena itu sistem tidak mengirim ulang permintaan yang hasilnya belum pasti. Pesanan masuk pemeriksaan admin, termasuk proses yang terputus setelah pengiriman dimulai. Periksa riwayat resmi STIFIn dan gunakan rekonsiliasi dengan catatan serta referensi yang dapat ditelusuri. Jangan membuat pembayaran/pesanan pengganti untuk memaksa pengiriman ulang.

Pembatalan, refund dan koreksi pembayaran dibatasi ketika pengisian telah diklaim atau diproses. Penanganan setelah pengiriman memerlukan pemeriksaan operasional cabang. Saldo API yang tidak tersedia ditampilkan sebagai tidak tersedia, tidak dianggap nol.

## Batas pengujian

Pengujian pengisian menggunakan API tiruan. Tidak ada POST pengisian voucher ke layanan STIFIn produksi dalam proses pembuatan rilis ini. Verifikasi pengisian riil perlu dilakukan operator pada satu transaksi yang sah setelah live dikonfigurasi. Sistem tidak mengasumsikan Dispos sebagai jaminan idempotensi dari layanan STIFIn.
