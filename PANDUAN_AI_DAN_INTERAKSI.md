# Panduan AI, Komentar, Like, Share, dan Statistik

Versi ini menambahkan fitur berikut ke dashboard artikel:

- pembuatan draf artikel dengan AI;
- komentar publik yang harus diperiksa admin;
- tombol **Tandai bermanfaat**;
- berbagi ke WhatsApp, Facebook, LinkedIn, X, salin tautan, dan menu berbagi perangkat;
- statistik dilihat, bermanfaat, dibagikan, dan komentar;
- moderasi komentar melalui tab **Interaksi**.

## 1. Variabel tambahan di Coolify

Buka aplikasi `konsepstifin-platform`, lalu pilih **Environment Variables**.
Tambahkan:

```text
OPENAI_API_KEY=<API key OpenAI Anda>
AI_MODEL=gpt-5.6-luna
```

Aturan penting:

- aktifkan **Available at Runtime**;
- **Available at Buildtime** tidak perlu diaktifkan;
- aktifkan **Is Literal**;
- jangan aktifkan **Is Multiline**;
- jangan menaruh API key di GitHub, gambar, atau pesan;
- jika API key pernah terlihat orang lain, segera hapus/rotasi key tersebut.

`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan
`ADMIN_SESSION_SECRET` yang sudah ada tetap digunakan.

Setelah variabel disimpan, tekan **Redeploy**.

## 2. Membuat artikel dengan AI

1. Masuk ke `https://konsepstifin.com/admin/login`.
2. Buka tab **Artikel & AI**.
3. Tekan **Buat dengan AI**.
4. Isi topik, pembaca, tujuan, kategori, kata kunci, panjang, dan nada tulisan.
5. Masukkan catatan sumber apabila artikel memakai fakta internal atau klaim khusus.
6. Tekan **Buat draf artikel**.
7. Periksa judul, ringkasan, isi, inti artikel, dan catatan pemeriksaan.
8. Simpan sebagai **Draf** terlebih dahulu.
9. Pilih **Terbitkan** hanya setelah seluruh isi diperiksa manusia.

AI tidak menerbitkan artikel secara otomatis. Hasil AI selalu dimasukkan ke
form sebagai draf baru.

## 3. Moderasi komentar

Komentar publik tidak langsung tampil.

1. Buka tab **Interaksi** pada dashboard.
2. Pilih filter **Menunggu**.
3. Tekan **Terbitkan**, **Tolak**, **Spam**, atau **Hapus**.
4. Email pembaca hanya terlihat oleh admin dan tidak ditampilkan di website.

Jika `OPENAI_API_KEY` tersedia, pemeriksaan keamanan otomatis dilakukan
sebelum komentar masuk antrean. Keputusan akhir tetap berada pada admin.

## 4. Arti statistik

- **Dilihat**: satu perangkat dihitung maksimal sekali per artikel per hari.
- **Bermanfaat**: jumlah perangkat yang menandai artikel bermanfaat.
- **Dibagikan**: klik pada kanal berbagi, bukan jaminan kiriman benar-benar selesai.
- **Komentar terbit**: komentar yang sudah disetujui admin.
- **Menunggu**: komentar yang perlu diperiksa.

Website menggunakan cookie anonim untuk mencegah like dan view terhitung
berulang. Alamat IP tidak disimpan ke tabel statistik.

## 5. Tabel database

Tabel komentar, like, dan statistik dibuat otomatis saat fitur pertama kali
diakses. Tidak perlu menjalankan SQL manual. Artikel lama tetap dipertahankan.

