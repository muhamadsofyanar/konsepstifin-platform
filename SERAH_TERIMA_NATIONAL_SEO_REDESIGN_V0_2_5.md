# Serah Terima National SEO Redesign v0.2.5

## Ringkasan

Versi ini memosisikan Konsep STIFIn sebagai layanan dalam jaringan STIFIn Genetic. Website memisahkan perjalanan peserta Tes STIFIn, pembaca edukasi, calon promotor, dan affiliate. Direktori wilayah hanya mempromosikan lokasi yang memiliki pemetaan layanan nyata.

## Perubahan utama

- Halaman wilayah dinamis untuk provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan.
- Indeks wilayah dan sitemap dibatasi pada pemetaan promotor aktif.
- URL wilayah tanpa pemetaan diberi `noindex, follow` untuk mencegah local SEO yang tidak dapat dibuktikan.
- Data promotor manual dapat dikonfigurasi melalui `STIFIN_PROMOTERS_JSON`.
- `regionCodes` dari konfigurasi manual digabung dengan `STIFIN_PROMOTER_REGION_MAP` atau pemetaan database.
- Field internal seperti email, saldo voucher, dan PassID tidak diteruskan ke endpoint publik.
- Halaman Tentang, Kontak, Privasi, dan Ketentuan tersedia untuk memperjelas identitas dan tata kelola layanan.
- Homepage, Tes STIFIn, Jadi Promotor, dan Affiliate memakai funnel yang terpisah.

## Konfigurasi minimum

```env
STIFIN_PROMOTERS_JSON=[{"code":"KODE-ID","name":"Nama Promotor","active":true,"menerimaKunjungan":true,"regionCodes":["31.74"]}]
STIFIN_PUBLIC_WHATSAPP=false
```

Alternatifnya, gunakan `STIFIN_BRANCH_CODE` untuk sinkronisasi server-side dan `STIFIN_PROMOTER_REGION_MAP` untuk pemetaan wilayah.

## Verifikasi

- ESLint: lulus.
- TypeScript `tsc --noEmit`: lulus.
- Next.js production compilation: lulus.
- Build menghasilkan `.next/BUILD_ID`.

## Catatan deploy

Jangan memasukkan token, password, atau data peserta ke repository. Setelah deploy, uji halaman `/wilayah`, `/promotor`, `/tes-stifin`, sitemap, serta semua tautan checkout pada desktop dan ponsel.
