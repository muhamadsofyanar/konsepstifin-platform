# Panduan AI, Komentar, Like, Share, dan Statistik

Versi ini menambahkan fitur berikut ke dashboard artikel:

- pembuatan 1, 3, atau 5 artikel dengan AI;
- pilihan kategori dengan satu klik serta hasil draf atau terjadwal;
- mode edukasi, rekomendasi produk, dan affiliate SEJOLI;
- komentar publik yang harus diperiksa admin;
- tombol **Tandai bermanfaat**;
- berbagi ke WhatsApp, Facebook, LinkedIn, X, salin tautan, dan menu berbagi perangkat;
- statistik dilihat, bermanfaat, dibagikan, klik produk, dan komentar;
- moderasi komentar melalui tab **Interaksi**.

## 1. Mengaktifkan Gemini gratis

1. Buka [Google AI Studio](https://aistudio.google.com/) dengan akun Google.
2. Pilih **Get API key**, buat API key pada project yang akan dipakai, lalu salin
   key tersebut. Jangan tampilkan key di GitHub atau tangkapan layar.
3. Buka aplikasi `konsepstifin-platform` di Coolify, lalu pilih
   **Environment Variables**.
4. Tambahkan tiga variabel berikut satu per satu:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=<API key Gemini Anda>
GEMINI_MODEL=gemini-3.1-flash-lite
```

Tingkat gratis Gemini memiliki batas permintaan. Generator membuat paket secara
berurutan dengan jeda singkat agar lebih ramah batas tersebut. Jika batas gratis
tercapai, artikel yang sudah selesai tetap tersimpan dan dashboard akan meminta
Anda menunggu sebelum melanjutkan.

Untuk setiap variabel:

- aktifkan **Available at Runtime**;
- **Available at Buildtime** tidak perlu diaktifkan;
- aktifkan **Is Literal**;
- jangan aktifkan **Is Multiline**.

Tekan **Redeploy** setelah semua variabel tersimpan. Dashboard akan menampilkan
`AI aktif: Gemini` dan nama model jika konfigurasi sudah terbaca.

### Opsional: tetap memakai OpenAI

Jika ingin beralih kembali ke OpenAI, gunakan:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=<API key OpenAI Anda>
OPENAI_MODEL=gpt-5.6-luna
```

Variabel lama `AI_MODEL` masih dibaca sebagai cadangan untuk OpenAI, tetapi
`OPENAI_MODEL` lebih jelas dan disarankan. Jika Gemini dipilih, kuota OpenAI yang
habis tidak memengaruhi pembuatan artikel.

### Aturan keamanan

- jangan menaruh API key di GitHub, gambar, atau pesan;
- jika API key pernah terlihat orang lain, segera hapus/rotasi key tersebut.
- jangan memasukkan nama peserta, hasil tes, sidik jari, nomor WhatsApp, kata
  sandi, atau data rahasia ke generator;
- tingkat gratis Gemini dapat memakai konten untuk peningkatan produk. Gunakan
  hanya topik edukasi umum dan catatan sumber yang aman dibagikan.

`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan
`ADMIN_SESSION_SECRET` yang sudah ada tetap digunakan.

Untuk affiliate, variabel berikut tetap opsional:

```text
SEJOLI_AFFILIATE_PARAM=ref
```

## 2. Membuat artikel dengan AI

1. Masuk ke `https://konsepstifin.com/admin/login`.
2. Buka tab **Artikel & AI**.
3. Tekan **Buat dengan AI**.
4. Pilih jenis artikel: **Edukasi umum**, **Edukasi + produk**, atau
   **Affiliate SEJOLI**.
5. Isi topik dan klik satu atau beberapa kategori.
6. Pilih jumlah **1**, **3**, atau **5 artikel**.
7. Pilih hasil **Draf** atau **Terjadwal**. Untuk jadwal, tentukan jam artikel
   pertama dan jarak hari antarartikel.
8. Untuk produk/affiliate, masukkan nama produk, URL checkout SEJOLI, dan teks
   tombol.
9. Buka **Pengaturan lanjutan** jika ingin menentukan pembaca, tujuan, kata
   kunci, panjang, nada, atau catatan sumber.
10. Tekan tombol pembuatan artikel dan tunggu seluruh antrean selesai. Untuk
    lima artikel, setiap hasil dibuat dan disimpan satu per satu; jangan menutup
    halaman selama proses berjalan.
11. Periksa judul, ringkasan, isi, inti artikel, tautan, dan catatan AI sebelum
    menerbitkan.

Hasil tidak langsung diterbitkan tanpa pilihan admin. Mode terjadwal akan
menyimpan artikel sebagai **Terjadwal**, bukan langsung tampil.

## 3. Artikel affiliate SEJOLI

- Gunakan URL produk atau checkout SEJOLI yang benar.
- Halaman artikel otomatis menampilkan keterbukaan bahwa tautan dapat bersifat
  affiliate.
- Kode rujukan dari URL artikel dapat diteruskan, misalnya
  `/edukasi/judul?ref=kodepromotor`.
- Nama parameter keluar dikendalikan oleh `SEJOLI_AFFILIATE_PARAM`. Nilainya
  harus disesuaikan dengan format URL affiliate yang benar-benar dipakai oleh
  akun SEJOLI Anda; jangan menebak jika formatnya berbeda.
- Kode rujukan yang valid disimpan maksimal 30 hari pada browser pengunjung.

## 4. Moderasi komentar

Komentar publik tidak langsung tampil.

1. Buka tab **Interaksi** pada dashboard.
2. Pilih filter **Menunggu**.
3. Tekan **Terbitkan**, **Tolak**, **Spam**, atau **Hapus**.
4. Email pembaca hanya terlihat oleh admin dan tidak ditampilkan di website.

Jika `OPENAI_API_KEY` tersedia, pemeriksaan keamanan otomatis terhadap komentar
tetap dilakukan oleh layanan moderasi OpenAI. Tanpa key OpenAI, komentar masih
aman masuk status **Menunggu** dan harus diperiksa manual oleh admin. Pemilihan
Gemini untuk menulis artikel tidak mengubah alur moderasi ini.

## 5. Arti statistik

- **Dilihat**: satu perangkat dihitung maksimal sekali per artikel per hari.
- **Bermanfaat**: jumlah perangkat yang menandai artikel bermanfaat.
- **Dibagikan**: klik pada kanal berbagi, bukan jaminan kiriman benar-benar selesai.
- **Klik produk**: perangkat membuka tombol produk/checkout pada artikel.
- **Komentar terbit**: komentar yang sudah disetujui admin.
- **Menunggu**: komentar yang perlu diperiksa.

Website menggunakan cookie anonim untuk mencegah like dan view terhitung
berulang. Alamat IP tidak disimpan ke tabel statistik.

## 6. Tabel database

Tabel komentar, like, dan statistik dibuat otomatis saat fitur pertama kali
diakses. Tidak perlu menjalankan SQL manual. Artikel lama tetap dipertahankan.
