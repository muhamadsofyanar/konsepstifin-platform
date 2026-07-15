# Panduan Mengaktifkan Dashboard Artikel di Coolify

Dashboard tersedia di:

```text
https://konsepstifin.com/admin/login
```

Website tetap dapat berjalan tanpa database. Namun, fitur tambah, edit, hapus,
draf, dan terbitkan artikel memerlukan PostgreSQL.

## 1. Membuat PostgreSQL

1. Buka project Konsep STIFIn di Coolify.
2. Pilih **New Resource** atau **Add Resource**.
3. Pilih **PostgreSQL**.
4. Gunakan nama database yang mudah dikenali, misalnya
   `konsepstifin_content`.
5. Gunakan username dan password kuat yang dibuat Coolify.
6. Jalankan/deploy database sampai statusnya **Running**.
7. Salin **Internal Connection URL** PostgreSQL. Gunakan koneksi internal
   apabila database dan aplikasi berada pada server/project Coolify yang sama.

Format koneksi biasanya seperti berikut:

```text
postgresql://username:password@hostname:5432/database
```

## 2. Menambahkan Environment Variables

Buka aplikasi `konsepstifin-platform`, lalu pilih **Environment Variables**.
Tambahkan empat variabel berikut:

```text
DATABASE_URL=<internal-connection-url-postgresql>
ADMIN_EMAIL=<email-admin>
ADMIN_PASSWORD=<kata-sandi-panjang-dan-unik>
ADMIN_SESSION_SECRET=<string-acak-minimal-32-karakter>
```

Untuk membuat `ADMIN_SESSION_SECRET` melalui terminal Linux:

```bash
openssl rand -base64 48
```

Jangan menyimpan nilai asli variabel tersebut di GitHub, dokumen publik, atau
pesan grup.

## 3. Redeploy aplikasi

1. Simpan seluruh Environment Variables.
2. Tekan **Redeploy** pada aplikasi.
3. Setelah deployment berhasil, buka `/admin/login`.
4. Masuk menggunakan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` yang telah disimpan.

Tabel database dan lima artikel awal akan dibuat otomatis saat database pertama
kali diakses. Tidak perlu menjalankan SQL secara manual.

## 4. Cara menulis artikel

Editor menggunakan format sederhana:

```text
## Judul bagian

Isi paragraf artikel.

- Poin pertama.
- Poin kedua.
```

- Pilih **Draf** untuk menyimpan tanpa menampilkannya kepada publik.
- Pilih **Terbitkan** agar artikel muncul di `/edukasi`.
- Aktifkan **Jadikan artikel pilihan** untuk menempatkan artikel lebih atas.
- Artikel yang dihapus tidak dapat dipulihkan dari dashboard.

## 5. Perilaku pengaman

- Jika PostgreSQL belum dipasang, website menampilkan artikel bawaan.
- Jika PostgreSQL sedang bermasalah, website publik kembali menggunakan
  artikel bawaan agar halaman edukasi tetap tersedia.
- Sesi login menggunakan cookie `HttpOnly`, `Secure`, dan `SameSite=Strict`.
- Login dibatasi setelah beberapa percobaan gagal berulang.

