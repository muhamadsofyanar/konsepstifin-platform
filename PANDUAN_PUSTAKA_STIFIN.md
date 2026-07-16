# Panduan Pustaka STIFIn

Pustaka STIFIn menyimpan PDF secara privat dan mengubah teksnya menjadi potongan
data yang dapat dicari oleh generator artikel. PDF tidak disimpan di folder
`public` dan tidak boleh dimasukkan ke GitHub.

## 1. Menyiapkan Persistent Storage Coolify

1. Buka aplikasi `konsepstifin-platform` di Coolify.
2. Pilih **Persistent Storage**.
3. Tambahkan penyimpanan dengan destination path:

```text
/app/storage
```

4. Simpan pengaturan.
5. Buka **Environment Variables** dan, jika ingin mengubah batas ukuran, tambahkan:

```text
KNOWLEDGE_MAX_FILE_MB=25
```

Aktifkan **Available at Runtime** dan **Is Literal**. Buildtime dan Multiline
tidak diperlukan. Setelah itu tekan **Redeploy**.

Tanpa Persistent Storage, file dapat hilang saat container diganti walaupun data
teksnya masih tersimpan di PostgreSQL.

## 2. Mengunggah materi

1. Masuk ke `/admin/login`.
2. Buka **Pustaka STIFIn** dari dashboard artikel.
3. Tekan **Pilih PDF**. Beberapa PDF dapat dipilih sekaligus.
4. Tunggu sampai seluruh file selesai dibaca.
5. Buka setiap sumber dan periksa judul, kategori, tahun, akses, risiko, serta
   pratinjau teks.
6. Aktifkan **Izinkan dipakai generator AI** hanya untuk materi yang memang
   boleh dikirim sebagai potongan konteks ke penyedia AI.

Sistem menolak file non-PDF, file di atas batas ukuran, dan PDF duplikat.

## 3. Arti klasifikasi

- **Rujukan artikel**: dapat dipakai untuk artikel umum setelah ditinjau.
- **Internal**: materi dasar atau operasional yang tidak untuk dipublikasikan
  secara utuh.
- **Terbatas**: materi berlisensi, sensitif, kesehatan, finansial, politik, atau
  dewasa. Secara bawaan tidak aktif untuk AI.
- **Risiko rendah**: dapat dipakai dengan pemeriksaan editorial biasa.
- **Perlu ditinjau**: memiliki teori, data lama, atau interpretasi yang perlu
  diperiksa.
- **Risiko tinggi**: jangan dipakai otomatis tanpa izin dan validasi tambahan.

### Pemisahan materi STIFIn dan materi pemasaran

- Workbook STIFIn digunakan sebagai dasar isi hanya setelah kategori, akses,
  dan risikonya diperiksa.
- Modul copywriting, landing page, funnel, headline, dan kampanye otomatis
  diklasifikasikan sebagai **Internal** serta tidak aktif untuk AI. Materi ini
  boleh dipakai secara sengaja untuk membantu gaya atau struktur pemasaran,
  tetapi tidak boleh menjadi sumber klaim tentang ilmu STIFIn.
- Materi yang memakai istilah manipulatif seperti *membius*, *trance*,
  *hypnotic*, atau *covert* otomatis menjadi **Terbatas**, risiko tinggi, dan
  tidak aktif untuk AI.
- Klasifikasi otomatis adalah pagar awal. Admin tetap wajib membuka pratinjau
  dan mengoreksi metadata bila nama file tidak cukup jelas.

## 4. Menggunakan pustaka pada artikel AI

1. Buka `/admin/artikel` lalu **Buat dengan AI**.
2. Aktifkan **Gunakan Pustaka STIFIn**.
3. Pilih **Otomatis** agar sistem mencari sumber berdasarkan topik, atau klik
   satu atau beberapa sumber tertentu.
4. Buat artikel seperti biasa.
5. Setelah draf tersimpan, bagian **Sumber pustaka yang dipakai** menampilkan
   judul dan nomor halaman untuk pemeriksaan admin.

Generator hanya menerima beberapa potongan yang cocok, bukan seluruh PDF.
Sumber dan nomor halaman disimpan bersama artikel. Hanya sumber berstatus
**Rujukan artikel** yang ditampilkan kepada pembaca; sumber **Internal** dan
**Terbatas** hanya terlihat oleh admin.

## 5. Urutan impor 15 workbook awal

Disarankan mengunggah terlebih dahulu:

1. STIFIn Level 1;
2. Learning;
3. Parenting;
4. Teaching;
5. Profesi;
6. Human Resource dan Leadership;
7. Marketing dan Bisnis.

Level 2, Couple, Finansial, Politik, Suri Rumah, dan Health akan dikenali sebagai
materi terbatas atau berisiko tinggi. Periksa klasifikasinya sebelum mengaktifkan
penggunaan AI.

## 6. Pencadangan

Cadangkan dua komponen:

- database PostgreSQL, karena menyimpan metadata dan teks hasil ekstraksi;
- volume `/app/storage`, karena menyimpan PDF asli.

Backup database saja tidak memulihkan PDF asli. Backup file saja tidak
memulihkan indeks dan pengaturan sumber.
