# Panduan Promotor Nasional dan Lead

Dokumen ini adalah runbook deployment dan operasi `konsepstifin.com` versi 0.5.1. Source WordPress/SEJOLI pada `app.konsepstifin.com` tidak termasuk ruang lingkup deployment ini.

## Checklist fokus copy publik

| Halaman | Audiens dan masalah | Manfaat yang didukung | Konteks nyata | CTA utama | CTA sekunder |
|---|---|---|---|---|---|
| Homepage | Pengunjung belum tahu harus ikut tes atau mempelajari profesi | Memilih funnel yang tepat sejak awal | Konsumen dan calon promotor datang dengan tujuan berbeda | Saya ingin ikut tes | Saya ingin jadi promotor |
| Tes | Konsumen belum memahami proses dan ketersediaan wilayah | Memahami urutan form, matching, checkout, tes, dan pembahasan | Jadwal bergantung kota serta konfirmasi promotor | Lihat pilihan layanan | Bagaimana proses tesnya? |
| Calon Promotor | Kandidat belum memahami peran, tahap, biaya, dan tanggung jawab | Menilai kesiapan sebelum konsultasi | Preview, WSL, aktivasi, privasi peserta, dan biaya katalog | Saya ingin tahu tahapannya | Pelajari affiliate |
| Direktori | Konsumen perlu menemukan promotor aktif tanpa membuka kontak pribadi | Pencarian nama/KodeID dan wilayah berbasis data aman | Koordinasi awal melalui formulir; jadwal berdasarkan konfirmasi | Cari promotor | Ajukan koordinasi tes |

Acceptance ringkas: **Homepage: choose Tes or Calon Promotor. Tes: understand process and find a serviceable city. Calon Promotor: understand stages before checkout. Directory: find an active promoter without exposing contact data.**

## 1. Arsitektur domain

| Domain | Tanggung jawab |
|---|---|
| `konsepstifin.com` | Website Next.js, direktori promotor, formulir lead, halaman lokal, edukasi, dan dashboard admin |
| `app.konsepstifin.com` | Checkout SEJOLI, pembayaran, member area, dan affiliate |

Next.js hanya mengarahkan transaksi ke domain app melalui URL HTTPS yang lolos allowlist hostname. Jangan menyalin source atau database domain app ke repository ini.

## 2. Environment Coolify

Konfigurasi aplikasi Coolify:

- Build pack: Dockerfile.
- Port: `3000`.
- Healthcheck path: `/api/health`.
- Persistent storage bila modul pustaka dipakai: `/app/storage/stifin-sources`.
- Domain: `https://konsepstifin.com`.

Environment wajib:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=PASSWORD_MINIMAL_12_KARAKTER
ADMIN_SESSION_SECRET=RAHASIA_ACAK_MINIMAL_32_KARAKTER
STIFIN_API_BASE=https://apro.stifin.id/api
STIFIN_PROMOTER_MODE=national
STIFIN_PROMOTER_NATIONAL_PATH=/proGet/pro/PRO
STIFIN_API_TIMEOUT_MS=15000
```

Opsional bila API memakai autentikasi:

```env
STIFIN_API_AUTH_HEADER=Authorization
STIFIN_API_AUTH_VALUE=Bearer TOKEN_RAHASIA
```

`DATABASE_URL`, password admin, session secret, dan nilai autentikasi adalah secret. Masukkan langsung melalui Environment Variables Coolify. Jangan menaruh nilainya di build argument, Dockerfile, log deployment, atau repository.

Mode alternatif:

```env
# Satu cabang
STIFIN_PROMOTER_MODE=branch
STIFIN_BRANCH_CODE=KODE_CABANG
STIFIN_PROMOTER_BRANCH_PATH=/proGet/pro/{branch}

# Pemulihan manual sementara
STIFIN_PROMOTER_MODE=manual
STIFIN_PROMOTERS_JSON=[{"code":"PRO-001","name":"Nama Aman","branchCode":"ABC-CAB-1","area":"Kota Contoh","province":"Provinsi Contoh","active":true,"regionCodes":["12.71"]}]
```

Gunakan mode manual hanya untuk pemulihan terkontrol. Isi JSON tetap harus bebas email, telepon, PassID, tanggal lahir, saldo, dan PII lain.

## 3. Status API promotor

Buka `/admin/promotor` setelah login. Panel status harus menampilkan:

- mode dan source;
- HTTP upstream terakhir;
- `rawRows`, `safeRows`, `activeRows`, dan `inactiveRows`;
- jumlah cabang;
- mapping automatic dan unresolved;
- `lastSuccessAt` dan waktu pembaruan katalog;
- status stale;
- kategori error yang sudah disanitasi.

Arti cache:

- **Fresh**: snapshot berumur maksimal 15 menit.
- **Stale fallback**: fetch baru gagal, tetapi snapshot sukses terakhir masih berumur maksimal 24 jam. Direktori dapat tetap melayani snapshot itu sambil admin memeriksa upstream.
- **Tidak tersedia**: tidak ada snapshot valid atau umur snapshot melewati 24 jam. Jangan menganggap daftar kosong sebagai kondisi normal.

## 4. Privasi data publik

Field promotor yang boleh keluar dari `GET /api/promotor`:

```text
code
name
branchCode
area
province
active
regionCodes
```

Metadata publik dibatasi pada total, halaman, ukuran halaman, total halaman, dan waktu pembaruan. Field yang dilarang antara lain email, telepon, PassID, tanggal lahir, saldo, alamat pribadi, username, transaksi, konfigurasi upstream, header autentikasi, dan pesan error mentah.

Kontak lead hanya tersedia setelah autentikasi admin. Log server tidak boleh berisi payload formulir atau header autentikasi.

## 5. Mapping dan CSV

Format impor:

```csv
promoterCode,regionCodes
PRO-001,12.71
PRO-002,32.73;32.04
```

Aturan:

- `promoterCode` harus cocok dengan KodeID promotor.
- Beberapa kode Wilayah.id dipisahkan titik koma.
- Mapping manual PostgreSQL mengalahkan mapping otomatis.
- Ekspor melindungi formula injection; jangan menghapus prefix proteksi saat membuka dan menyimpan ulang CSV.
- Catatan bukti cakupan harus 10–500 karakter untuk status serviceable.

Setelah impor, periksa jumlah baris diterima/ditolak dan sampling beberapa KodeID melalui `/admin/promotor` serta `/api/promotor`.

## 6. Pipeline lead

### Tes STIFIn (`test_service`)

```text
baru → mencari_promotor → ditawarkan → diklaim → dijadwalkan → selesai/ditutup
```

Lead tes memerlukan consent kontak dan consent berbagi terbatas kepada promotor yang ditugaskan. Sistem melakukan matching wilayah, menyimpan idempotency key dan atribusi, kemudian baru dapat memberikan URL checkout `app.konsepstifin.com`.

### Calon promotor (`promoter_candidate`)

```text
baru → dihubungi → konsultasi → mengikuti_preview → mengikuti_wsl → aktivasi → selesai/ditutup
```

Lead calon promotor masuk antrean rekrutmen dan ditangani PIC. Lead ini tidak dicocokkan otomatis ke promotor publik dan tidak boleh menerima checkout layanan tes.

Setiap perubahan admin menghasilkan riwayat. Data pembayaran dan margin hanya dikelola untuk funnel layanan tes.

## 7. Halaman lokal dan sitemap

Kota indexable bila mempunyai setidaknya satu promotor aktif terpetakan atau override serviceable dengan catatan bukti. Kota tanpa bukti dan seluruh desa/kelurahan memakai `noindex, follow`.

Periksa:

```text
/sitemap-index.xml
/sitemaps/static.xml
/sitemaps/articles.xml
/sitemaps/regions.xml
/sitemaps/promoters.xml
```

Sitemap wilayah tidak boleh memuat kota tanpa bukti. `lastModified` harus berasal dari waktu pembaruan produk, sumber promotor, mapping, artikel, atau override—bukan waktu request.

## 8. Deployment dan smoke test

Urutan aman:

1. Buat backup database PostgreSQL.
2. Simpan commit/image deployment aktif sebagai target rollback.
3. Isi environment Coolify dan deploy image baru.
4. Tunggu healthcheck hijau.
5. Jalankan smoke test berikut dari mesin yang dapat mengakses domain.

Versi 0.5.1 memperbaiki inferensi partial unique index idempotency PostgreSQL. Tidak ada migrasi destruktif, tetapi backup tetap wajib karena pengujian form menyentuh database produksi.

```bash
curl -fsS https://konsepstifin.com/api/health
curl -fsS 'https://konsepstifin.com/api/promotor?page=1'
curl -fsS https://konsepstifin.com/sitemap-index.xml
curl -fsS https://konsepstifin.com/sitemaps/regions.xml
```

Pemeriksaan privasi respons promotor dengan `jq`:

```bash
curl -fsS 'https://konsepstifin.com/api/promotor?page=1' \
  | jq -e '[.data[] | keys_unsorted - ["code","name","branchCode","area","province","active","regionCodes"]] | all(length == 0)'
```

Smoke test browser:

- `/promotor` menampilkan maksimal 24 kartu.
- Query `/promotor?q=...` memiliki canonical `/promotor` dan `noindex, follow`.
- `/admin/promotor` menampilkan status upstream lengkap.
- Form Tes menyimpan lead, melakukan matching, lalu hanya menawarkan checkout domain app.
- Form calon promotor menyimpan lead tanpa checkout.
- Pengulangan request Tes dengan idempotency key yang sama tidak membuat lead duplikat.
- Error penyimpanan tidak menampilkan SQL, nama constraint, atau detail PostgreSQL di browser.
- `/admin/leads` memisahkan kedua tab dan statusnya.
- Satu kota berbukti indexable; satu kota tanpa bukti noindex dan tidak ada di sitemap.
- Tidak ada kontak pribadi promotor pada HTML atau JSON publik.

## 9. Trigger rollback

Rollback ke image/commit terakhir yang lulus bila salah satu kondisi berikut terjadi setelah deploy dan tidak dapat diperbaiki melalui environment:

- healthcheck gagal berulang;
- migrasi database gagal atau dashboard tidak dapat membaca tabel;
- API publik mengekspos PII atau konfigurasi upstream;
- lead calon promotor menerima URL checkout;
- URL checkout mengarah selain `https://app.konsepstifin.com`;
- sitemap memasukkan banyak halaman kota tanpa bukti;
- snapshot promotor melewati batas stale 24 jam tanpa sumber pengganti yang tervalidasi.

Rollback aplikasi tidak otomatis membalik migrasi aditif. Karena migrasi menggunakan `CREATE TABLE IF NOT EXISTS` dan `ADD COLUMN IF NOT EXISTS`, pertahankan tabel baru; pulihkan database hanya bila ada korupsi data yang telah diverifikasi.
