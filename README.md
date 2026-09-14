# Konsep STIFIn — Paket Implementasi 01: Access Policy

Status: modul TypeScript murni sudah dibuat dan diuji, BELUM terintegrasi ke Next.js.
Ini paket tambahan untuk developer/AI, bukan ZIP website lengkap dan bukan plugin WordPress.

## Isi

- `src/lib/identity/access-policy.ts`: resolver scope, pemeriksaan lead, proyeksi field aman, validasi perubahan promotor.
- `tests/access.test.mjs`: 29 tes memakai runner bawaan Node, tanpa dependensi eksternal.
- `KONSEPSTIFIN_MASTER_ROADMAP_AI_HANDOFF.md`: salinan konteks sebelum paket implementasi ini. Catatan status di README ini lebih baru.

## Pengujian

Dari folder paket, pada Node 24 (lingkungan verifikasi: 24.19.0):

```sh
node --test tests/access.test.mjs
```

Hasil aktual: 29 lulus, 0 gagal. Tes mula-mula gagal karena modul belum tersedia, lalu lulus setelah implementasi. Belum menjalankan pemeriksaan TypeScript, lint/build Next.js, database, browser atau integrasi gateway. Tidak memakai credentials/data produksi.

## Kontrak integrasi wajib

1. Salin modul ke path yang sama pada source Next.js setelah memeriksa bahwa tidak ada file pengguna yang tertimpa.
2. Principal hanya dibentuk dari sesi dan akun yang telah diverifikasi SERVER. active/sessionValid bukan bukti kriptografis dan tidak boleh diterima dari body request.
3. `accessScope` mengembalikan none/all/assigned. Store SQL wajib menegakkan scope untuk daftar, count, detail, history dan mutation SEBELUM data dibaca/diubah. Tidak boleh membaca semua lead dan memfilternya di browser.
4. Scope assigned memerlukan kecocokan kode promotor dan consent berbagi. Reassignment dan pencabutan consent harus menghapus akses pada request berikutnya.
5. `projectPromoterLead` membatasi field yang dikirim. Jangan mengirim objek row mentah atau history admin, yang dapat mengandung data internal/keuangan.
6. `validatePromoterPatch` hanya memvalidasi payload, bukan memberikan izin. Daftar status harus ditentukan server berdasarkan funnel dan transisi yang sah. Pemeriksaan assignment, status saat ini, perubahan dan audit dilakukan dalam satu transaksi dengan locking.
7. Jangan mengganti arti `isAdminAuthenticated()` menjadi semua user login; API konten/pustaka/produk masih bergantung pada fungsi itu sebagai batas admin.
8. Test di paket menggunakan Node native TS stripping; test ini sengaja berekstensi .mjs dan dijalankan terpisah dari suite Vitest lama. Pada integrasi final tambahkan adaptor tes Vitest atau command test terpisah yang terdokumentasi di CI.

## Langkah AI berikutnya — langsung teknis, jangan kembali bertanya bisnis

- Baca Bagian 34 handoff dan source terbaru. Terapkan paket ini hanya sebagai pure policy module.
- Implementasikan penyimpanan akun/sesi, aktivasi, pencabutan sesi dan resolver principal; uji dengan database khusus testing.
- Integrasikan scoped queries dan DTO ke endpoint/halaman CRM, disertai uji penolakan URL langsung dan injection field.
- Tambah pagination server-side; pertahankan empat kelompok dan checkout SEJOLI.
- Jalankan unit/integration, typecheck, lint, build dan browser tests sebelum rilis.

## Log 010

Tanggal 14 September 2026. Implementasi pertama: access policy. 29 tes unit lulus.
Fase 1 parsial; Fase 2 belum selesai. Tidak mengubah arsip asli, route Next.js, login lama, database, repository remote, SEJOLI atau produksi.
Dependensi Next.js belum terpasang pada ekstraksi; paket tidak memakai API framework, sehingga tidak memerlukan perubahan Next.js pada tahap ini.
