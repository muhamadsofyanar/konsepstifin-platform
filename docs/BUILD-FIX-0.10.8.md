# Build Fix KonsepSTIFIn 0.10.8

## Masalah yang diperbaiki

Deployment Coolify gagal saat pemeriksaan TypeScript pada `src/app/admin/marketing/page.tsx` karena variabel `contacts` dan `campaigns` diinisialisasi dengan `[]`, sementara tipe hasil fungsi query PostgreSQL mencakup metadata hasil query selain elemen array.

## Perubahan

Tipe elemen array sekarang diturunkan dari hasil fungsi query:

- `MarketingContact = (Awaited<ReturnType<typeof listMarketingContacts>>)[number]`
- `MarketingCampaign = (Awaited<ReturnType<typeof listMarketingCampaigns>>)[number]`

Variabel lokal menggunakan `MarketingContact[]` dan `MarketingCampaign[]`. Ini mempertahankan pemeriksaan tipe tanpa mengubah query database, perilaku marketing, atau konfigurasi produksi.

## Validasi

Perbaikan kode sudah diterapkan. Build produksi belum dapat dijalankan di lingkungan penyusunan paket karena pemasangan dependensi lokal tidak selesai dalam batas waktu. Setelah source diperbarui di repository, validasi tetap harus dijalankan oleh Coolify melalui `npm ci` dan `npm run build`.
