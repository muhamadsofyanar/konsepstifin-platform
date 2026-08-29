# Operasional Promotor Nasional dan Pra-checkout

## Konfigurasi produksi di Coolify

1. Buka Coolify → aplikasi `konsepstifin-platform` → **Environment Variables**.
2. Isi:

```env
STIFIN_API_BASE=https://apro.stifin.id/api
STIFIN_PROMOTER_MODE=national
```

3. Hapus `STIFIN_BRANCH_CODES` dari deployment nasional. `STIFIN_BRANCH_CODE` boleh disimpan sebagai catatan rollback, tetapi tidak dibaca dalam mode `national`.
4. Pastikan `DATABASE_URL`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` tersedia melalui Environment Variables, bukan repository.
5. Redeploy dan tunggu health check berhasil.
6. Uji satu kabupaten/kota yang mempunyai kandidat dan satu wilayah tanpa kandidat.

## Pemeriksaan setelah deployment

- `/tes-stifin`: tombol produk tes membuka modal sebelum checkout.
- Submit invalid tetap berada di modal dan tidak menampilkan link checkout.
- Submit valid menampilkan referensi `KSF-ID`, kandidat atau pesan fallback, lalu menuju `app.konsepstifin.com` pada tab yang sama.
- `/api/promotor`: respons hanya memuat `code`, `name`, `branchCode`, `area`, `province`, `active`, `menerimaKunjungan`, dan `regionCodes`.
- `/wilayah`: menampilkan maksimum tiga kandidat administratif tanpa nomor telepon atau email.
- `/admin/leads`: hanya dapat diakses setelah login.
- Affiliate dan jalur jadi-promotor tetap mengikuti alur sebelumnya.

## Rekonsiliasi manual SEJOLI

1. Buka order SEJOLI.
2. Cocokkan lead berdasarkan email atau WhatsApp.
3. Buka referensi lead di `/admin/leads`.
4. Isi ID order, status pembayaran, nilai penjualan, bagian promotor, biaya lain, promotor final, dan jadwal.
5. Periksa margin yang dihitung sebagai `nilai penjualan - bagian promotor - biaya lain`.
6. Simpan perubahan. Sistem mencatat audit perubahan tanpa menyalin email, WhatsApp, atau catatan internal ke history.

Promotor di luar `JML-CAB-62` memakai voucher miliknya sendiri. Jangan menambahkan voucher lintas cabang melalui plugin. Rekonsiliasi, payout, dan penetapan promotor tetap manual pada MVP.

## Privasi

- Jangan menyalin respons mentah API pusat ke log, tiket, atau spreadsheet.
- Jangan menyimpan nomor telepon, email, PassID, tanggal lahir, atau kolom mentah API promotor pada cache atau database publik.
- Istilah publik adalah “kandidat promotor berdasarkan wilayah”, bukan “promotor terdekat”.

## Rollback ke mode branch

1. Ubah Environment Variables:

```env
STIFIN_PROMOTER_MODE=branch
STIFIN_BRANCH_CODE=JML-CAB-62
```

2. Redeploy.
3. Uji `/api/promotor`, `/tes-stifin`, dan satu halaman `/wilayah`.
4. Kembalikan `STIFIN_PROMOTER_MODE=national` setelah sumber nasional stabil.
