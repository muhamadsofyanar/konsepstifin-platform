# SERAH TERIMA UPGRADE V15 — CONTENT INTELLIGENCE

Tanggal: 18 Juli 2026  
Versi aplikasi: 0.2.0  
Website publik: `https://konsepstifin.com`  
Checkout, member, dan affiliate: `https://app.konsepstifin.com`

## 1. Tujuan upgrade

Upgrade ini menerapkan konsep pengelolaan artikel cerdas secara native di
Next.js. Tidak ada WordPress atau plugin pihak ketiga yang dibutuhkan.

Sistem membantu tim membangun topical authority yang konsisten melalui data,
audit, dan hubungan antarartikel. Sistem tidak menjanjikan ranking atau kutipan
AI karena hasil akhir tetap dipengaruhi kualitas informasi, reputasi, kompetisi,
perayapan, dan kebijakan mesin pencari.

## 2. Fitur utama

- Dashboard baru `/admin/intelligence`.
- Skor kesiapan editorial 0–100 untuk setiap artikel.
- Peta pilar, cluster, dan artikel pendukung.
- Deteksi potensi kanibalisasi berdasarkan keyword utama dan kemiripan judul.
- Saran internal link berdasarkan cluster, kategori, dan keterkaitan topik.
- Prioritas perbaikan untuk artikel dengan skor terendah.
- Metadata keyword utama, keyword pendukung, search intent, topic cluster, dan
  content role.
- Kolom experience/evidence untuk mencatat pengalaman atau bukti nyata tanpa
  mengarang klaim.
- Nama reviewer, peran reviewer, dan tanggal pemeriksaan.
- Pemilihan artikel terkait langsung dari editor.
- Trust panel publik berisi evidence, reviewer, tanggal review, dan sumber yang
  berstatus aman dipublikasikan.
- Structured data artikel dilengkapi keyword, article section, dan reviewer.

## 3. Komponen skor

Skor memeriksa hal yang dapat dikerjakan tim:

- keyword utama dan kecocokannya dengan judul;
- panjang judul dan ringkasan;
- struktur subjudul dan kedalaman isi;
- sumber publik;
- pengalaman atau bukti nyata;
- reviewer dan tanggal review;
- internal link;
- topic cluster dan content role;
- freshness artikel;
- potensi kanibalisasi.

Skor bukan hasil pemantauan SERP dan bukan bukti bahwa Google, ChatGPT, Gemini,
Perplexity, atau sistem lain sudah mengutip artikel tersebut.

## 4. Migrasi database

Kolom baru ditambahkan otomatis menggunakan perintah idempotent:

```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ...;
```

Data artikel lama tidak dihapus. Artikel lama akan memperoleh nilai awal yang
lebih rendah sampai metadata Content Intelligence dilengkapi.

Setelah deploy, buka `/admin/intelligence` atau `/admin/artikel` satu kali agar
inisialisasi skema berjalan. Pastikan akun database pada `DATABASE_URL` memiliki
izin `ALTER TABLE`.

## 5. Cara upgrade melalui GitHub

1. Cadangkan database PostgreSQL dan persistent volume `/app/storage`.
2. Ekstrak ZIP upgrade sampai terlihat `package.json`, `Dockerfile`, `src`, dan
   `public`.
3. Unggah isi folder tersebut ke root repository
   `muhamadsofyanar/konsepstifin-platform`, branch `main`.
4. Jangan unggah `.env`, `node_modules`, `.next`, dump database, atau isi volume.
5. Commit dengan pesan `Upgrade v15 Content Intelligence`.
6. Bila auto deploy Coolify aktif, tunggu deployment baru. Jika tidak, buka
   Application `konsepstifin-web` lalu klik **Redeploy**.

Environment variables dan volume produksi harus tetap sama. Domain publik tetap
`konsepstifin.com`; checkout dan affiliate tetap menuju
`app.konsepstifin.com`.

## 6. Langkah setelah redeploy

1. Buka `/admin/artikel` dan pastikan daftar artikel lama tetap muncul.
2. Buka `/admin/intelligence` dan periksa seluruh metrik.
3. Mulai dari daftar **Prioritas editorial**.
4. Tetapkan satu keyword utama yang unik untuk setiap artikel.
5. Kelompokkan artikel ke topic cluster dan pilih satu artikel pilar.
6. Isi evidence hanya dengan pengalaman atau dokumentasi yang benar-benar ada.
7. Isi reviewer dan tanggal review setelah pemeriksaan manusia.
8. Tambahkan artikel terkait yang relevan, lalu simpan.
9. Periksa artikel publik dan pastikan trust panel tidak membuka materi internal.

## 7. Pemeriksaan teknis

- ESLint: lulus tanpa error atau warning.
- TypeScript: lulus.
- Next.js 16.2.10 production build: lulus.
- Route `/admin/intelligence`: berhasil dikompilasi.
- Route artikel publik, API, `robots.txt`, dan `sitemap.xml`: berhasil
  dikompilasi.

## 8. Batasan yang disengaja

Versi ini belum melakukan pelacakan eksternal terhadap ranking keyword, backlink,
Search Console, atau penyebutan merek oleh mesin AI. Integrasi tersebut sebaiknya
menjadi tahap lanjutan setelah metadata artikel konsisten dan akses API resmi
tersedia.
