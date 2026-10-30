# Konsep STIFIn — Implementasi 02: akun mandiri dan akses baca CRM

Tanggal: 14 September 2026. Log 012, melanjutkan Log 011 pada paket Access Policy.

## Hasil pemeriksaan dan keputusan pelaksanaan

Sumber yang diperiksa: `konsepstifin-platform-main.zip` (package versi 0.5.1) dan `KONSEPSTIFIN_IMPLEMENTASI_01_ACCESS_POLICY.zip`. Arsip sumber bukan bukti kondisi deployment. Tidak ada akses atau perubahan produksi, SEJOLI, maupun repository remote.

Paket 01 berisi 45 tes dan dua modul murni yang belum terintegrasi. Sumber utama masih memakai login admin environment/HMAC serta tautan checkout SEJOLI. Rujukan SEJOLI ditemukan pada 22 berkas di src, termasuk konfigurasi tautan, produk dan pencatatan order. Menghapus tautan tidak menggantikan fungsi transaksi.

Kelanjutan ini menggabungkan fondasi akun Fase 1 dengan akses baca CRM Fase 2. Keputusan bisnis sebelumnya tidak dibuka ulang. Jalur akun baru bersifat opt-in dan terpisah; login admin lama tidak diubah arti atau kewenangannya. Ini kandidat integrasi staging, belum rilis mandiri penuh.

## Perubahan yang sudah dikerjakan

- Memasukkan access policy dan session resolver dari Paket 01 ke sumber utama beserta tesnya.
- Migrasi aditif 001: akun, peran, pemetaan kode promotor, sesi dan pembatas percobaan login. Tidak memodifikasi tabel lead lama.
- Password scrypt dengan salt acak, biaya tetap, pembatasan panjang input dan pembandingan timing-safe. Password mentah tidak disimpan.
- Adapter SQL berparameter: provisioning akun atomik, login, penerbitan token sesi acak 32 byte, logout/revoke, pembacaan ulang peran/akun/pemetaan pada setiap pemeriksaan sesi.
- Token mentah hanya dikirim melalui cookie; database menyimpan SHA-256 token. Masa sesi 8 jam.
- Pembatas login database per email ternormalisasi: enam percobaan per 15 menit, termasuk percobaan berhasil. Tidak bergantung pada Map per proses atau IP dari header yang bisa dipalsukan. Proteksi trafik global/proxy masih merupakan gate staging.
- API login/logout memeriksa Origin terhadap PLATFORM_ORIGIN, JSON dibatasi 8 KiB, cookie HttpOnly/SameSite=Strict/Secure pada production, respons privat no-store. Error database menghasilkan penolakan, tanpa fallback admin.
- API CRM baca daftar/detail: scope SQL berdasarkan assignment dan consent, DTO hanya id/name/phone/email/city/status, pencarian nama/kota, pageSize 1–100 dan urutan created_at DESC, id DESC. Total dan halaman dibaca dalam satu statement/snapshot.
- Memperbaiki command Vitest agar memilih `vitest.config.mts`; `vitest.config.ts` bawaan merupakan tombstone kosong yang sebelumnya terpilih. Tes native Node dipisahkan dari Vitest.
- Menambahkan command operator untuk migrasi/provisioning. Tidak ada bootstrap otomatis pada login.

## Endpoint baru

| Endpoint | Fungsi |
|---|---|
| POST /api/account/login | JSON email/password; mengatur cookie jika benar |
| POST /api/account/logout | Mencabut sesi server dan menghapus cookie |
| GET /api/account/me | Identitas dan peran sesi saat ini |
| GET /api/account/leads?page=1&pageSize=25&q=Bandung | Daftar dan jumlah lead sesuai akses |
| GET /api/account/leads/123 | Detail aman; 404 untuk ID di luar scope |

Semua endpoint memakai runtime Node. Akun tanpa izin CRM mendapat daftar kosong/detail 404. Belum ada endpoint mutasi CRM baru. Tabel `public_interest_leads` harus sudah tersedia dari aplikasi sumber; kegagalan skema tidak memicu pembuatan tabel otomatis dari API ini.

## Status fase berdasarkan hasil nyata

| Fase | Status setelah paket ini | Syarat kelanjutan |
|---|---|---|
| 0 — data/backup | Belum diverifikasi produksi | Ekspor, pemetaan ID dan bukti restore staging |
| 1 — satu akun | Parsial: backend login/sesi/RBAC tersedia | UI login, undangan/aktivasi/reset, audit provisioning, pengelolaan akun, uji PostgreSQL server dan cutover admin |
| 2 — CRM | Parsial: baca daftar/detail terisolasi tersedia | Dashboard empat kelompok, histori aman, mutasi/assignment atomik dan audit |
| 3 — order/pembayaran | Belum dikerjakan | Order internal, DP/cicilan, gateway dan webhook idempotent, rekonsiliasi |
| 4 — voucher | Belum dikerjakan | Aturan penerbitan/pemakaian terikat transaksi |
| 5 — LMS | Belum dikerjakan | Enrollment, entitlement, materi dan progres |
| 6 — CMS/SEO | Fungsi sumber dipertahankan | Integrasi peran baru dan regresi halaman nasional |
| 7 — komisi/migrasi akhir | Belum dikerjakan | Ledger komisi, saldo awal, rekonsiliasi dan cutover |

Urutan percepatan: tuntaskan jalur pengguna akun+CRM → order/pembayaran+hak akses → voucher/LMS → komisi+migrasi akhir. Order internal adalah prasyarat berhenti memakai checkout SEJOLI. Jangan menggabungkan transaksi lama secara otomatis berdasarkan email kontak keluarga. Persetujuan/peraturan akses DP, cicilan dan komisi tetap mengacu master handoff.

## Pemasangan di salinan sumber/staging

ZIP ini hanya berisi berkas baru/berubah, bukan website lengkap. Ekstrak sumber utama, lalu timpa dari root ZIP patch ini. Paket 01 tidak perlu ditempel terpisah karena dua modul dan tesnya sudah disertakan. Root tujuan adalah folder yang memuat package.json.

Baseline SHA-256 ZIP sumber:
`e7b27cef9a09ad9ebd0ba4570c6fd84840baddfcc1dfe16bf6af3b2d6a90861d`

1. Gunakan Node 24, jalankan `npm ci`.
2. Jalankan `npm run test:identity`, `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
3. Sediakan database staging terpisah. Set DATABASE_URL melalui secret/environment, lalu set IDENTITY_ADMIN_CONFIRM=yes untuk menjalankan `npm run identity:migrate`. Command ini mengubah database yang ditunjuk; periksa target sebelum menjalankan.
4. Buat akun hanya setelah operator memverifikasi pemilik email dan kode promotor. `npm run identity:provision` membaca satu objek JSON dari stdin: email, password, roles (array), promoterCode (opsional). Jangan menulis password di command line/log atau memasukkan fixture tes. Gunakan stdin dari pengelola secret yang sesuai. Akun provisioning langsung aktif; ini bukan alur undangan/aktivasi pengguna akhir.
5. Set PLATFORM_IDENTITY_ENABLED=true dan PLATFORM_ORIGIN ke origin staging persis, tanpa slash akhir. Origin wajib sesuai halaman yang mengirim request. Gunakan HTTPS pada production. Default flag false menjaga endpoint belum aktif sebelum konfigurasi.
6. Uji login/logout/me serta daftar/detail lewat klien same-origin dengan cookie. Belum ada halaman login/dashboard baru pada paket ini.
7. Uji ulang pada PostgreSQL server sesungguhnya: transaksi lintas koneksi, konkurensi, tipe timestamp, SSL/pool, akun nonaktif, perubahan peran, audit dan isolasi data. Pemetaan promoter_code saat ini unik tetapi belum FK ke katalog promotor; validasi operator wajib.

Tidak ada instruksi menghentikan SEJOLI atau mengganti cookie admin lama pada tahap ini. Setelah akun admin terverifikasi dan regresi lolos, cutover admin harus menghapus jalur legacy secara terkontrol.

Rollback kode: nonaktifkan PLATFORM_IDENTITY_ENABLED dan kembalikan berkas baseline. Jangan drop tabel baru secara otomatis; simpan sesi/akun untuk investigasi. Flag nonaktif menolak akses endpoint, bukan menghapus record sesi; cabut sesi bila dibutuhkan sebelum mengaktifkan kembali.

## Hasil pengujian aktual

| Pemeriksaan | Hasil |
|---|---|
| Native Node akun/CRM | 69 lulus, 0 gagal |
| Vitest regresi sumber | 66 lulus, 6 dilewati; 19 file lulus, 3 dilewati |
| TypeScript noEmit | Lulus |
| ESLint | Lulus |
| Next.js production build | Lulus |
| PostgreSQL server eksternal | Belum dijalankan |
| Browser end-to-end/produksi | Belum dijalankan |

Tes SQL baru menggunakan PGlite (PostgreSQL embedded/WASM), data sintetis dan 527 lead untuk menguji pagination, assignment, consent dan query berparameter. Ini lebih dari repository double, tetapi bukan bukti konkurensi jaringan multi-instance PostgreSQL produksi. Enam tes lama dilewati karena memerlukan database uji khusus. Log hasil tersedia di `verification/`.

Tes password, store, HTTP dan CRM ditulis sebelum implementasi; stub gagal pada jalur fitur utama lalu implementasi dilengkapi sampai lulus. Beberapa tes penolakan sudah lulus pada stub, sehingga tidak diklaim semua kasus memiliki siklus red-green individual. Peringatan Node MODULE_TYPELESS_PACKAGE_JSON muncul pada suite native; tidak mengubah type seluruh proyek hanya untuk menghilangkan warning.

## Batas yang harus dilanjutkan, bukan dianggap selesai

Belum ada UI dashboard/login baru, undangan/aktivasi/reset password, audit provisioning/perubahan akun, pencabutan semua sesi per pengguna melalui UI, mutasi CRM/assignment/history scoped, filter empat kelompok di API baru, indeks performa CRM baru, pembayaran, LMS, voucher atau migrasi data SEJOLI. API baru belum menggantikan API admin lama. Jangan membuka layanan pengguna nyata hanya berdasarkan build berhasil.

Tugas berikutnya: selesaikan undangan/reset+audit akun dan dashboard menggunakan API ini; lanjutkan mutasi CRM dengan locking/audit dalam satu transaksi, uji dua promotor bersamaan. Baru setelah itu majukan order/pembayaran, tanpa mengulang implementasi login/sesi yang sudah ada.
