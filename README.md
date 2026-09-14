# Konsep STIFIn — Paket Implementasi 01: Access Policy

## Status terbaru — Log 011, 14 September 2026

Paket diperbarui dengan `src/lib/identity/session.ts` dan `tests/session.test.mjs`.
Resolver menerima token opaque 64 karakter hex, menghitung SHA-256 untuk pencarian,
memeriksa masa berlaku/pencabutan sesi serta akun aktif, lalu membentuk principal
dari data server. Data peran dibaca ulang, bukan dipercaya dari cookie. Kegagalan
storage diteruskan sebagai error; integrasi wajib menolak akses tanpa fallback admin.

Hasil aktual terbaru: **45 tes unit lulus, 0 gagal** (29 policy + 16 sesi).
Jalankan seluruhnya dengan `node --test tests/*.test.mjs` pada Node 24.
Tes sesi ditulis sebelum implementasi, dijalankan terhadap stub yang mengembalikan
null (3 gagal, 13 lulus), lalu dijalankan kembali setelah implementasi (16 lulus).
Tes penolakan yang sudah lulus pada stub bukan bukti individual red-green.

### Batas implementasi yang harus dipahami AI berikutnya

- `SessionReader` adalah kontrak adapter, BELUM adapter PostgreSQL. Tes memakai
  repository double deterministik, bukan database sungguhan.
- Belum ada penerbitan token, penyimpanan akun/password, login/logout, aktivasi,
  reset password, cookie, CSRF, migrasi SQL atau query CRM scoped.
- `expiresAt`/`revokedAt` memakai epoch UTC milidetik. Adapter wajib mengonversi
  timestamp database, membaca akun/peran terkini, dan tidak menyimpan token mentah.
- Integrasi login harus menghasilkan token acak kriptografis 32 byte menjadi hex;
  jangan menggunakan token fixture tes. Penerbitan sesi hanya setelah autentikasi.
- Jangan memasukkan resolver ini ke client bundle. Impor tipe `.ts` memerlukan
  pemeriksaan konfigurasi TypeScript saat integrasi; tes Node bukan typecheck.
- Belum menjalankan typecheck/lint/build Next.js, pengujian SQL atau browser.
- Fase 1 masih parsial dan Fase 2 belum selesai. Tidak ada perubahan produksi.

### Urutan kelanjutan konkret

1. Siapkan dependensi source Next.js dan database khusus tes; baca dokumentasi
   lokal Next.js sesuai AGENTS.md sebelum perubahan framework.
2. Buat migrasi aditif akun/peran/pemetaan promotor/sesi dan adapter PostgreSQL
   untuk SessionReader. Uji expiry, revocation, deactivate dan role change di DB.
3. Implementasikan penerbitan sesi setelah verifikasi password, logout/revoke,
   cookie HttpOnly/Secure, perlindungan CSRF dan rate limit bersama.
4. Integrasikan principal ke query daftar/count/detail CRM dengan scope pada SQL,
   bukan filter browser; mutasi harus memakai transaksi, locking dan audit.
5. Uji lintas promotor, pagination >500 lead, admin legacy dan halaman publik.

Bagian di bawah dan master handoff merupakan riwayat tahap sebelumnya; Log 011
ini menjadi rujukan status implementasi terbaru. Jangan menganggap rencana telah
diimplementasikan. Tidak perlu mengulang pertanyaan keputusan bisnis.

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
