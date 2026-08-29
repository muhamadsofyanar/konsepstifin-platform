# Panduan Pustaka STIFIn

Pustaka menyimpan PDF dan PNG secara privat. PDF faktual dapat diubah menjadi
potongan data untuk generator artikel. PNG disimpan sebagai referensi visual
internal dan tidak diekstrak menjadi fakta. File tidak disimpan di folder
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
3. Tekan **Pilih PDF / PNG**. Beberapa file dapat dipilih sekaligus.
4. Tunggu sampai seluruh file selesai dibaca.
5. Buka setiap sumber dan periksa tujuan, judul, kategori, tahun, akses, risiko, serta
   pratinjau teks.
6. Aktifkan **Izinkan sebagai landasan faktual AI** hanya untuk PDF fakta
   STIFIn yang sudah diverifikasi.

Sistem menolak format selain PDF/PNG, file di atas batas ukuran, dan file duplikat.

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

### Tujuan sumber

- **Fakta STIFIn (`stifin_factual`)**: satu-satunya tujuan yang dapat menjadi
  landasan klaim dan isi faktual AI setelah diaktifkan admin.
- **Panduan Copywriting (`copywriting_internal`)**: hanya untuk aturan turunan
  mengenai headline, manfaat, struktur, dan CTA.
- **Referensi Kampanye (`campaign_reference`)**: contoh kampanye internal yang
  tidak boleh menjadi sumber fakta.
- **Dibatasi (`restricted`)**: tidak boleh digunakan AI tanpa perubahan tujuan,
  hak akses, dan pemeriksaan manusia yang sah.

### Pemisahan materi STIFIn dan materi pemasaran

- Workbook STIFIn digunakan sebagai dasar isi hanya setelah kategori, akses,
  dan risikonya diperiksa.
- File yang namanya mengandung `C3H`, `BenBi`, atau `FSP` otomatis masuk
  **Panduan Copywriting**, akses **Terbatas**, risiko **Tinggi**, dan AI mentah
  nonaktif. Aturan turunannya dipakai secara internal untuk cara penyampaian,
  tetapi dokumen asli tidak dikirim dan tidak menjadi sumber klaim STIFIn.
- Materi yang memakai istilah manipulatif seperti *membius*, *trance*,
  *hypnotic*, atau *covert* otomatis menjadi **Terbatas**, risiko tinggi, dan
  tidak aktif untuk AI.
- Klasifikasi otomatis adalah pagar awal. Admin tetap wajib membuka pratinjau
  dan mengoreksi metadata bila nama file tidak cukup jelas.

## 4. Menggunakan pustaka pada artikel AI

1. Buka `/admin/artikel` lalu **Buat dengan AI**.
2. Aktifkan **Gunakan sumber faktual STIFIn**.
3. Pilih **Otomatis** agar sistem mencari sumber berdasarkan topik, atau klik
   satu atau beberapa sumber tertentu.
4. Buat artikel seperti biasa.
5. Setelah draf tersimpan, bagian **Sumber pustaka yang dipakai** menampilkan
   judul dan nomor halaman untuk pemeriksaan admin.

Generator hanya menerima beberapa potongan dari PDF bertujuan **Fakta STIFIn**,
bukan seluruh PDF. Panduan Copywriting, Referensi Kampanye, sumber Dibatasi,
dan PNG tidak masuk pencarian faktual.
Sumber dan nomor halaman disimpan bersama artikel untuk pemeriksaan admin.
Daftar rujukan tidak ditampilkan pada halaman artikel publik. Klasifikasi
**Rujukan artikel**, **Internal**, dan **Terbatas** tetap digunakan untuk
menentukan sumber mana yang boleh dikirim ke generator AI.

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
- volume `/app/storage`, karena menyimpan PDF dan PNG asli.

Backup database saja tidak memulihkan PDF asli. Backup file saja tidak
memulihkan indeks dan pengaturan sumber.
