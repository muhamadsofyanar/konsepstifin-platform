# Serah Terima Upgrade Konsep STIFIn — 16 Juli 2026

Dokumen ini menjadi pegangan bila pekerjaan dilanjutkan dari akun atau
percakapan lain.

## Status versi

- Sumber awal: repository GitHub `muhamadsofyanar/konsepstifin-platform`.
- Basis commit saat upgrade dimulai: `41d9e8904ebf9345857a9745b1619a1ed8ee33d8`.
- Versi framework: Next.js `16.2.10`.
- Pemeriksaan selesai: `npm run lint` dan `npm run build` berhasil tanpa error.
- Materi PDF privat tidak dimasukkan ke GitHub atau paket source code.

## Upgrade yang sudah dikerjakan

### Website publik

- `/` menjadi beranda/pintu masuk yang ringkas.
- `/tes-stifin` menjadi landing page khusus layanan tes.
- `/jadi-promotor` menjadi landing page khusus Preview, WSL, aktivasi, dan
  affiliate.
- `/edukasi` tetap menjadi pusat artikel.
- Navigasi desktop dan ponsel telah disatukan serta diperbaiki.
- Setiap landing page memiliki metadata dan gambar Open Graph sendiri.
- Sitemap memuat ketiga halaman utama baru.
- Hero beranda, Tes STIFIn, dan promotor memakai foto editorial berbeda agar
  halaman tidak lagi didominasi teks.
- Copy bagian hero dipadatkan agar manfaat, visual, dan CTA dapat dipahami
  dalam satu pandangan, termasuk pada layar ponsel.
- Aset hero tersimpan di `public/images` dalam format WebP yang ringan.

### Formulir minat

- Bila tautan checkout SEJOLI belum diisi, tombol membuka formulir minat.
- Data formulir tersimpan ke PostgreSQL pada tabel `public_interest_leads`.
- Tabel dibuat otomatis saat formulir pertama kali digunakan.
- Jangan menganggap formulir sebagai pengganti notifikasi WhatsApp; integrasi
  notifikasi dapat ditambahkan pada tahap berikutnya.

### Artikel AI

- Panjang artikel dinaikkan menjadi sekitar 1.000–3.000 kata sesuai pilihan.
- Struktur diminta 5–9 bagian dengan beberapa paragraf di setiap bagian.
- Prompt melarang heading dan paragraf menyatu serta melarang penanda Markdown
  di dalam field hasil AI.
- Waktu baca dihitung dari jumlah kata yang benar-benar diterima.
- Pencarian Pustaka menggunakan konteks lebih luas dan tetap menyimpan halaman
  rujukan.
- Pencarian menyeimbangkan konteks topik dengan fondasi STIFIn serta membatasi
  jumlah potongan dari setiap dokumen agar satu workbook tidak mendominasi.
- Prompt mewajibkan hubungan yang konkret antara konsep STIFIn, contoh
  perilaku, dan langkah penerapan; artikel generik tidak lagi menjadi pola yang
  diminta sistem.
- Nama workbook dan nomor halaman tetap tersimpan untuk pemeriksaan admin,
  tetapi daftar rujukan tidak ditampilkan pada artikel publik.

### Copy halaman publik

- Copy beranda, landing Tes STIFIn, dan landing promotor ditulis ulang dengan
  struktur persona, masalah-solusi, manfaat, proses, dan CTA yang jujur.
- Bahasa dibuat lebih percakapan dan berpusat pada kebutuhan pengunjung.
- Materi copywriting dipakai untuk struktur komunikasi, bukan untuk klaim
  palsu, kelangkaan buatan, atau teknik manipulatif.

### Pustaka dan keamanan materi

- Workbook STIFIn tetap dapat dipakai sebagai sumber setelah ditinjau.
- Modul copywriting, landing page, funnel, headline, dan kampanye otomatis
  menjadi materi internal serta nonaktif untuk AI.
- Materi dengan istilah manipulatif seperti `membius`, `trance`, `hypnotic`,
  atau `covert` otomatis menjadi terbatas, risiko tinggi, dan nonaktif.
- Materi Health, Finansial, Politik, Couple, Level 2, dan materi sensitif tetap
  perlu pemeriksaan khusus sebelum diaktifkan.
- Saat aplikasi terbaru membaca skema Pustaka, data lama yang jelas salah
  diklasifikasikan sebagai rujukan umum akan diamankan secara otomatis.

## Yang tidak boleh dihapus di Coolify

Pertahankan Environment Variables yang sudah ada:

```text
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
AI_PROVIDER
GEMINI_API_KEY
GEMINI_MODEL
KNOWLEDGE_MAX_FILE_MB
SEJOLI_AFFILIATE_PARAM
```

`OPENAI_API_KEY` dan `OPENAI_MODEL` bersifat opsional jika tetap ingin memakai
OpenAI. Jangan menaruh nilai rahasia ke GitHub, ZIP, dokumentasi, atau gambar.

Pertahankan Persistent Storage aplikasi:

```text
/app/storage
```

Database PostgreSQL dan volume `/app/storage` harus dicadangkan terpisah.

## Cara memasang upgrade

1. Ekstrak ZIP source code.
2. Unggah seluruh isinya ke root repository GitHub yang sama. Jangan membuat
   folder proyek bertingkat di dalam repository.
3. Pastikan `package.json`, `Dockerfile`, `src`, dan `public` terlihat di root.
4. Commit ke branch `main`.
5. Buka aplikasi yang sama di Coolify, lalu tekan **Redeploy**.
6. Jangan membuat database baru dan jangan mengganti `DATABASE_URL`.
7. Pantau log sampai muncul **Rolling update completed**.

## Pemeriksaan setelah deployment

1. Buka `/`, `/tes-stifin`, `/jadi-promotor`, dan `/edukasi`; pastikan ketiga
   foto hero tampil dan tidak memotong wajah pada desktop maupun ponsel.
2. Periksa menu hamburger pada lebar ponsel.
3. Buka `/admin/pustaka`; pastikan sumber dan jumlah halaman tetap ada.
4. Periksa klasifikasi modul copywriting dan materi berisiko.
5. Buat satu artikel AI berstatus **Draf** dengan satu sumber Pustaka.
6. Pastikan isi memiliki heading, paragraf terpisah, dan waktu baca yang masuk
   akal.
7. Terbitkan artikel uji lalu periksa Open Graph, komentar, like, dan share.
8. Uji satu tombol SEJOLI. Jika link belum diisi, kirim formulir minat uji.

## Konfigurasi yang masih perlu dilengkapi pemilik

- Isi URL checkout asli pada `src/app/site-config.ts` bagian `sejoliLinks`.
- Periksa kembali harga, bonus, komisi, jadwal, dan syarat program.
- Tambahkan notifikasi lead ke WhatsApp/email bila dibutuhkan.
- Tinjau serta aktifkan PDF satu per satu sesuai izin dan tingkat risiko.
- Jangan menerbitkan draf AI tanpa pemeriksaan manusia.
