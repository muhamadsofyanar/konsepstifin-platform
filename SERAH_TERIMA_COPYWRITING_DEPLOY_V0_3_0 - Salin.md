# Serah Terima v0.3.0

## Hasil utama

Versi ini memperbaiki dua masalah yang terlihat setelah deployment v0.2.6:

1. halaman dapat tampil seperti HTML polos ketika stylesheet `/_next/static`
   tidak sampai ke browser;
2. materi KIRIM AI dapat tercampur dengan sumber faktual STIFIn.

## Copywriting homepage dan funnel

Copy pada homepage, Tes STIFIn, Jadi Promotor, dan Affiliate disusun ulang dengan
kerangka turunan berikut:

- headline menarik perhatian, menimbulkan rasa ingin tahu yang relevan, dan
  menyaring pembaca sesuai kebutuhan;
- fitur terverifikasi diterjemahkan menjadi manfaat yang konkret;
- paragraf dipadatkan, judul bagian dibuat spesifik, dan CTA menjelaskan langkah
  berikutnya;
- tidak ada janji hasil, klaim medis, atau klaim penghasilan yang dibuat-buat.

Materi C3H, BenBi, dan FSP tidak disalin panjang serta tidak ditampilkan sebagai
referensi publik.

## Pustaka v0.3.0

- Tujuan sumber baru: `stifin_factual`, `copywriting_internal`,
  `campaign_reference`, dan `restricted`.
- Nama C3H, BenBi, dan FSP otomatis menjadi Panduan Copywriting, akses terbatas,
  risiko tinggi, dan AI mentah nonaktif.
- Pencarian landasan artikel memiliki pagar database
  `purpose = 'stifin_factual'`.
- FSP MindMap PNG dapat diunggah serta dipratinjau sebagai referensi internal.
- PNG tidak diubah menjadi fakta dan tidak masuk konteks AI.
- Migrasi kolom dan koreksi klasifikasi sumber lama berjalan otomatis saat
  Pustaka pertama kali dibuka.

## API promotor STIFIn

Integrasi daftar promotor mengikuti pola aman yang sudah dipakai plugin voucher:

- endpoint `GET /proGetCab/pro/{kode-cabang}`;
- timeout dapat diatur;
- redirect tidak diikuti;
- header autentikasi opsional dibaca dari environment secret;
- respons `data` dinormalisasi;
- nomor telepon tetap tidak dipublikasikan kecuali diaktifkan secara eksplisit.

Environment opsional:

```text
STIFIN_API_TIMEOUT_MS=10000
STIFIN_API_AUTH_HEADER=Authorization
STIFIN_API_AUTH_VALUE=Bearer_TOKEN_RESMI
```

Jangan menulis token pada source, commit, log, atau screenshot.

## Perbaikan tampilan setelah deploy

- `public/site.css` dibuat otomatis dari source CSS sebelum build.
- Layout memuat `/site.css` sebagai fallback di samping CSS chunk Next.js.
- Build gagal jika standalone server, logo, CSS fallback, CSS chunk, atau JS
  chunk tidak tersedia.
- Docker health check memanggil `/api/health` dan memeriksa aset CSS sebelum
  container dianggap sehat.

## Cara deploy di Coolify

1. Timpa source repository dengan isi paket v0.3.0 tanpa menyalin
   `node_modules`, `.next`, `.env`, atau folder `storage` lokal.
2. Commit dan push ke branch `main`.
3. Pastikan Build Pack menggunakan **Dockerfile** dan port aplikasi `3000`.
4. Pertahankan Persistent Storage pada `/app/storage`.
5. Tambahkan environment baru hanya bila autentikasi resmi STIFIn tersedia.
6. Redeploy lalu tunggu health check berstatus sehat.
7. Buka `/api/health`. Hasil yang benar:

```json
{"ok":true,"version":"0.3.0","assets":"ready"}
```

8. Buka `/site.css` dan pastikan respons HTTP 200.
9. Lakukan hard refresh pada homepage. Footer harus kembali berwarna hijau tua,
   navigasi rapi, dan hero menampilkan layout dua kolom pada desktop.

Jika `/api/health` dan `/site.css` berhasil tetapi tampilan tetap polos, periksa
rule domain/path pada proxy Coolify dan cache CDN. Pastikan seluruh path pada
`konsepstifin.com`, termasuk `/_next/*`, mengarah ke container yang sama.

## Validasi paket

- ESLint lulus tanpa error.
- TypeScript dan production build Next.js lulus.
- 22 halaman statis selesai dibuat.
- Route `/api/health` tersedia.
- Smoke test standalone memberi HTTP 200 untuk homepage, `/site.css`, dan CSS
  chunk `/_next/static`.
