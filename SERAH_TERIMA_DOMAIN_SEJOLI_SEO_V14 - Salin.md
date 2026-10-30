# SERAH TERIMA UPGRADE V14 — DOMAIN, SEJOLI, AFFILIATE, DAN SEO

Tanggal: 18 Juli 2026  
Versi aplikasi: 0.1.3  
Domain publik: `https://konsepstifin.com`  
Sistem transaksi: `https://app.konsepstifin.com`

## 1. Arsitektur yang ditetapkan

| Domain | Fungsi |
|---|---|
| `konsepstifin.com` | Website publik, edukasi, SEO, artikel, katalog, bukti kegiatan, dan landing page |
| `app.konsepstifin.com` | Checkout SEJOLI, pembayaran, member area, affiliate, referral, komisi, bonus, dan administrasi transaksi |

`tes.konsepstifin.com` tidak digunakan lagi. Jangan membuat salinan website publik di subdomain lain karena dapat membagi sinyal SEO dan membuat konten duplikat.

## 2. Perubahan v14

- Semua tautan checkout dikendalikan dari `src/app/site-config.ts`.
- URL checkout yang disimpan admin wajib menggunakan `https://app.konsepstifin.com/`.
- Tautan transaksi lama yang tidak memakai domain resmi tidak akan dibuka oleh tombol publik.
- Halaman affiliate memiliki tombol pendaftaran SEJOLI dan tombol masuk dashboard affiliate.
- Footer menjelaskan pemisahan website publik dan aplikasi transaksi.
- Ditambahkan `robots.txt` dinamis dan sitemap resmi.
- Panel `/admin` dan endpoint `/api` tidak diizinkan untuk dirayapi.
- Panel admin mempunyai metadata `noindex`.
- Ditambahkan JSON-LD Organization, WebSite, Service, Offer, Article, dan BreadcrumbList.
- Harga pada structured data diambil dari katalog yang sama dengan kartu layanan.

## 3. URL terpusat

File: `src/app/site-config.ts`

- Website publik: `https://konsepstifin.com/`
- Aplikasi SEJOLI: `https://app.konsepstifin.com/`
- Pendaftaran affiliate: `https://app.konsepstifin.com/product/program-affiliate-konsep-stifin/`
- Dashboard affiliate: `https://app.konsepstifin.com/member-area/home/lead-affiliasi/`
- Member area: `https://app.konsepstifin.com/member-area/`

URL produk individual tetap berada dalam objek `sejoliLinks` di file yang sama.

## 4. Upload ke GitHub

1. Ekstrak ZIP upgrade.
2. Buka folder hasil ekstrak sampai terlihat `package.json`, `Dockerfile`, `src`, dan `public`.
3. Unggah **isi folder tersebut** ke root repository `muhamadsofyanar/konsepstifin-platform` branch `main`.
4. Jangan mengunggah `.env`, `node_modules`, `.next`, database, atau isi `/app/storage`.
5. Commit dengan pesan: `Upgrade v14 domain utama, SEJOLI, affiliate, dan SEO`.

## 5. Coolify setelah resource tes dihapus

Jika belum ada Application untuk website utama:

1. Buka project `konsep` dan environment `production`.
2. Pilih **+ New** lalu **Application**.
3. Pilih repository publik `muhamadsofyanar/konsepstifin-platform`.
4. Branch: `main`.
5. Build Pack: gunakan `Dockerfile`.
6. Nama aplikasi yang disarankan: `konsepstifin-web`.
7. Pasang domain `https://konsepstifin.com` dan, bila dipakai, `https://www.konsepstifin.com`.
8. Jangan memasang kembali `tes.konsepstifin.com`.
9. Salin environment variables produksi dari aplikasi sebelumnya.
10. Pasang persistent volume yang sama ke `/app/storage`; jangan membuat volume kosong jika dokumen pustaka lama masih diperlukan.
11. Klik **Deploy**.

Environment variables penting:

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `AI_PROVIDER`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `SEJOLI_AFFILIATE_PARAM` (opsional, default `ref`)

Jangan memasukkan credential WordPress atau SEJOLI ke source GitHub.

## 6. Pemeriksaan setelah deploy

- `https://konsepstifin.com/` membuka website publik.
- `https://konsepstifin.com/robots.txt` dapat dibuka.
- `https://konsepstifin.com/sitemap.xml` dapat dibuka.
- Tombol Tes Personal membuka halaman produk di `app.konsepstifin.com`.
- Tombol affiliate membuka pendaftaran di `app.konsepstifin.com`.
- Tombol Masuk Affiliate membuka `/member-area/home/lead-affiliasi/`.
- Harga kartu tetap sama dengan kartu produk SEJOLI.
- `/admin/produk` menolak URL checkout dari domain selain `app.konsepstifin.com`.
- Persistent volume `/app/storage` tetap terpasang dan pustaka lama dapat dibaca.

## 7. Hasil verifikasi source

- ESLint: lulus.
- TypeScript: lulus.
- Next.js 16.2.10 production build: lulus.
- Route `robots.txt`: berhasil dibuat.
- Route `sitemap.xml`: berhasil dibuat.

Catatan lingkungan pemeriksaan: server lokal tidak dapat dibuka karena pembatasan pembacaan interface jaringan pada sandbox, tetapi proses kompilasi, pemeriksaan TypeScript, pengumpulan page data, dan pembuatan seluruh route produksi selesai tanpa error.
