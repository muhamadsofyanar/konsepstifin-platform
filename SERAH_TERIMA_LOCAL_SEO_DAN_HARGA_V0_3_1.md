# Serah Terima Local SEO dan Harga v0.3.1

## Ringkasan

Versi 0.3.1 menyelesaikan implementasi lanjutan dari audit API promotor,
Wilayah.id, strategi halaman wilayah, dan katalog SEJOLI. Halaman wilayah yang
boleh diindeks sekarang mengikuti pemetaan layanan nyata, bukan seluruh daftar
administratif Indonesia.

## Perubahan utama

- `STIFIN_PROMOTERS_JSON` memakai `regionCodes` dari setiap item.
- Pencocokan wilayah bekerja dua arah antara provinsi, kabupaten, kecamatan,
  dan desa sehingga promotor kabupaten dapat muncul pada halaman provinsi.
- Status promotor dan kesediaan kunjungan tidak lagi otomatis dianggap aktif
  saat field sumber tidak tersedia.
- Respons API promotor dibatasi ukuran dan jumlah baris sebelum disanitasi.
- `/wilayah` menampilkan provinsi yang memiliki pemetaan layanan.
- Metadata wilayah tanpa layanan memakai `noindex`; sitemap hanya berisi
  provinsi dan kabupaten/kota yang terpetakan.
- Schema `Service` hanya diterbitkan bila ada promotor aktif yang melayani area.
- Breadcrumb schema ditambahkan ke halaman wilayah dan halaman kepercayaan.
- Dashboard `/admin/promotor` menyediakan editor pemetaan kode wilayah.
- Harga bawaan diselaraskan dengan checkout SEJOLI aktif pada 29 Agustus 2026.
- Diskon campaign Meta 10% dihapus karena tidak diterapkan pada checkout yang
  diuji.

## Validasi wajib setelah deployment

1. Buka `/admin/promotor` dan petakan minimal satu promotor aktif.
2. Pastikan provinsi terkait muncul di `/wilayah`.
3. Pastikan sitemap hanya memuat provinsi/kabupaten yang terpetakan.
4. Uji satu halaman wilayah terlayani dan satu wilayah kosong; halaman kosong
   harus memiliki `noindex` dan tidak boleh memuat schema `Service`.
5. Uji setiap checkout lagi bila harga di SEJOLI berubah.
