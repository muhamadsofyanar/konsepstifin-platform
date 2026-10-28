# Hasil terbaru KonsepSTIFIn 0.8.0

Tanggal: 28 Oktober 2026. Fitur baru: alias referral mitra, atribusi lead dari cookie yang divalidasi server, cek saldo riil, pesanan voucher yang terhubung ke ledger pembayaran, dan worker pengisian otomatis setelah lunas.

| Pemeriksaan 0.8.0 | Hasil aktual |
| --- | --- |
| npm test | 213 lulus; 6 integrasi lama dilewati karena TEST_DATABASE_URL khusus uji tidak tersedia |
| npm run test:identity | 78 lulus |
| npm run test:network | 7 lulus |
| npm run test:unit:node | 45 lulus; cakupan sebagian berulang dengan identity |
| TypeScript | Typecheck dan build TypeScript lulus |
| npm run lint | Lulus |
| npm run build | Build produksi berhasil |
| npm run test:smoke | Lulus pada paket standalone, termasuk server dan worker Node 24 bersamaan |
| Native runtime | Impor langsung service/API voucher lulus tanpa transform TypeScript eksperimental |
| Review independen | Dua temuan worker/antrean diperbaiki dan diverifikasi |
| git diff --check | Lulus |

Smoke menjalankan migrasi/provision/verify dan impor jaringan sintetis, aktivasi sekali pakai, login promotor, penolakan akses admin, alias baru dan lama, registrasi publik dengan referral, sumber dan penugasan lead, saldo tiruan dengan format API riil, checkout idempoten, isolasi pemilik pesanan, pembayaran lunas menuju test_success, serta halaman privat. Pengujian pemulihan worker mencatat pembayaran sintetis langsung ke ledger dan membuktikan worker native mengambil pesanan pending tanpa bantuan handler pembayaran.

Cakupan voucher meliputi pembayaran sebagian/penuh, harga snapshot, jumlah bebas bilangan bulat, pesanan ganda, klaim bersamaan, mode test/off/live, timeout tanpa pengiriman ulang, penolakan API HTTP 2xx, pemeriksaan delta saldo, refund sebelum klaim dan pemblokiran sesudah klaim, profil berubah/nonaktif, rekonsiliasi dan pemulihan proses terhenti. Regresi antrean memastikan puluhan pesanan tertahan satu promotor tidak menghalangi promotor lain. Adapter postgres.js diuji lewat PostgreSQL wire untuk snapshot JSON, transaksi, dan binding parameter.

Cakupan referral meliputi benturan alias, nama terlarang, alias resmi/historis, first-touch 30 hari, token kedaluwarsa/palsu, akun nonaktif, cookie HttpOnly/Secure, CSRF, izin akun sendiri, persetujuan pembagian kontak, atribusi dari server, idempotensi registrasi dan sumber yang tetap setelah penugasan berubah. Trigger database menolak perubahan sumber referral.

Satu pembacaan GET ke saldo resmi memverifikasi bentuk respons `Pesan`, `totalF`, `totalV`; nilai saldo tidak disalin ke source. Semua pengujian POST pengisian menggunakan API tiruan. Tidak ada pengisian voucher riil, perubahan database produksi, pesan kepada promotor, push GitHub, atau deployment yang dilakukan oleh rilis ini.

Batas validasi: Docker Alpine dan inspeksi visual Chromium belum dijalankan. Database PGlite memakai satu backend; ini bukan bukti seluruh interleaving PostgreSQL multi-transaksi independen. Pengisian produksi belum diuji. Gunakan panduan **MITRA-DAN-VOUCHER.md** untuk konfigurasi dan pemeriksaan operasional.

---

# Arsip pengujian rilis sebelumnya

## Arsip hasil KonsepSTIFIn 0.7.0

Tanggal: 28 Oktober 2026. Fitur baru: Kepala Cabang dan sepuluh akun promotor, keanggotaan cabang, undangan, aktivasi, dan portal promotor. Data resmi dibaca untuk pencocokan; akun produksi belum dibuat dari lingkungan pengerjaan.

| Pemeriksaan 0.7.0 | Hasil |
| --- | --- |
| npm test | 175 lulus; 6 integrasi lama dilewati karena TEST_DATABASE_URL khusus uji tidak tersedia |
| npm run test:network | 7 lulus, 0 gagal: SQL, operator, dan actual postgres.js wire |
| npm run test:identity | 78 lulus, 0 gagal |
| npm run test:unit:node | 45 lulus, 0 gagal; sebagian duplikat cakupan identity |
| npm run typecheck | Lulus |
| npm run lint | Lulus |
| npm run build | Build produksi berhasil |
| npm run test:smoke | Lulus termasuk paket operator baru dan portal promotor |
| Review independen | Tidak ditemukan P1/P2 pada fitur jaringan/aktivasi |
| git diff --check | Lulus |

Smoke test menyiapkan data sintetis sebelas identitas berkode sesuai format jaringan, bukan data pribadi promotor. Akun kepala yang sudah ada dipakai kembali, sepuluh akun baru menunggu aktivasi, pengulangan impor tidak menggandakan akun, aktivasi hanya sekali, promotor berhasil login dan membaca lead sendiri, serta akses API admin ditolak.

Uji native mencakup penolakan kode/cabang/jumlah tidak sesuai, data resmi nonaktif, benturan email/kode/mapping, anggota tambahan tidak dikenal, owner nonaktif, rollback atomik, hash token, expiry/reissue, perlindungan akun admin, pencabutan sesi, serta keunikan satu cabang per kode kabupaten/kota.

Perbaikan melalui RED/GREEN juga mencakup penolakan sumber nonaktif dan pemeriksaan token sebelum scrypt. Halaman portal menginisialisasi tabel lead lama agar akun yang baru diimpor tidak bergantung pada admin lebih dahulu membuka CRM.

Meta Pixel tidak dimuat atau dipanggil pada halaman admin/akun. Tautan dari halaman publik menuju portal menggunakan navigasi dokumen penuh agar tracker publik tidak terbawa. Halaman aktivasi memakai token fragment, no-referrer, no-store, noindex, dan CSP pembatas koneksi pihak ketiga.

Batas validasi tetap: tidak menjalankan Docker Alpine sebenarnya atau inspeksi visual Chromium. Database uji PGlite memakai satu backend sehingga bukan bukti seluruh interleaving PostgreSQL multi-transaksi independen. Enam tes integrasi lama tetap opt-in pada database khusus uji. Periksa staging sebelum memakai produksi.

Saldo, harga, stok dan transaksi voucher belum dibangun. Tidak ada saldo nol fiktif, refill, email/WhatsApp, maupun perubahan database produksi yang dilakukan oleh pembuatan paket ini.

Lihat AKUN-PROMOTOR.md untuk perintah migrasi dan import pada Coolify.

---

## Catatan pengujian rilis sebelumnya

# Hasil pengujian KonsepSTIFIn 0.6.0

Tanggal: 28 Oktober 2026. Pengujian menggunakan source paket ini dan data sintetis. Tidak mengakses database produksi, mengunggah GitHub, atau redeploy Coolify.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `npm test` | 153 tes lulus; 6 tes integrasi lama dilewati pada 3 berkas karena `TEST_DATABASE_URL` khusus uji tidak disediakan |
| `npm run test:identity` | 78 tes lulus, 0 gagal |
| `npm run test:unit:node` | 45 tes lulus, 0 gagal; sebagian policy/session juga diperiksa suite identity, jadi jangan menjumlahkan sebagai cakupan unik |
| `npm run typecheck` | Lulus: `next typegen` dan `tsc --noEmit` |
| `npm run lint` | Lulus, tanpa error |
| `npm run build` | Build produksi Next.js 16.2.10 berhasil; halaman admin/API dinamis dan Proxy terdaftar |
| `npm run test:smoke` | Lulus: paket Next standalone, operator, login, CSRF, rekening, CRM, pesanan, pembayaran, SSR privat, dan logout |
| Pemeriksaan reviewer | Dua temuan material diperbaiki dan diuji; detail di bawah |
| `git diff --check` | Lulus |

Suite Vitest membatasi pekerja menjadi dua karena beberapa tes memulai PostgreSQL berbasis WASM. Batas tes/hook 20 detik mencakup inisialisasi tersebut. Ini bukan pengujian performa produksi.

## Skenario yang dibuktikan

- Login admin menggunakan akun database dan sesi opaque yang dapat dicabut. Cookie/kredensial environment lama tidak membuka portal.
- Akun nonaktif, sesi kedaluwarsa/cabut, peran non-admin, dan permintaan lintas origin ditolak.
- Pengubahan sandi/nonaktif akun mencabut sesi; admin terakhir tidak dapat dinonaktifkan. Admin biasa tidak dapat mengubah akun pemilik.
- Pengujian SQL memeriksa bahwa penerbitan sesi sudah mengunci baris akun sebelum INSERT. Ini menyelaraskan urutan lock dengan penggantian sandi.
- Tes actual-wire memakai postgres.js dan PGliteSocketServer, sehingga serializer driver ikut diuji, tidak hanya SQL langsung.
- CRM memeriksa 529 baris sintetis untuk pencarian, pagination, opsi, dan jumlah penuh; bukan hanya 500 data pertama.
- Riwayat CRM dan perubahan kontak ditulis atomik. Kegagalan audit membatalkan perubahan. Keuangan lama tetap utuh dan tidak dapat ditimpa melalui payload kontak.
- Katalog yang diedit admin tetap utuh setelah initializer/seed dijalankan ulang.
- Form publik tidak membuka checkout lama, termasuk jika resolver/response lama memuat URL eksternal.
- CTA artikel hanya memakai tujuan layanan internal dan tetap membawa UTM.
- Pesanan menyimpan snapshot item dan harga. Nominal negatif, pecahan, total tidak sah, penerimaan berlebih, dan refund berlebih ditolak.
- Pengulangan kunci idempotensi tidak menggandakan pesanan/penerimaan. Kunci sama dengan data berbeda ditolak.
- Koreksi mempertahankan entri asal dan menulis pembalik dengan alasan. Kegagalan audit membatalkan perubahan uang.
- Navigasi pesanan dari CRM menyaring lead yang dipilih dan mempertahankan filter ketika berpindah halaman.
- Detail pesanan membaca ledger dan saldo dalam satu transaksi dengan lock berbagi.

## Perbaikan setelah reviewer dan uji paket

1. **Race penggantian sandi/login.** Sebelumnya INSERT sesi tidak mengunci akun. Sekarang satu CTE `FOR UPDATE` dan INSERT menyelaraskan penerbitan sesi dengan reset/nonaktif akun. Tes trigger SQL gagal pada implementasi lama dan lulus setelah perbaikan.
2. **Filter pesanan terkait.** Halaman awalnya tidak meneruskan `leadId` ke query dan tautan pagination. Tes reproduksi gagal lalu lulus setelah filter serta validasi diperbaiki.
3. **Encoding JSON driver.** Uji paket menemukan JSON string diserialisasi lagi oleh postgres.js ketika parameter langsung bertipe jsonb. Parameter serialisasi kini melewati `text::jsonb`. Tes actual-wire meliputi role akun, item pesanan, dan objek audit pengaturan.

## Apa yang dilakukan smoke test

Script menyalin hasil Next standalone dan file operator sesuai susunan runner Docker ke direktori sementara. Ia membuat database sintetis terisolasi melalui PostgreSQL wire protocol, menjalankan migrasi/provision/verify dari paket itu, lalu menguji HTTP server produksi.

Alur HTTP: penolakan origin asing → login → ringkasan → simpan rekening → tambah lead → buat/edit draf → terbitkan → catat penerimaan → kirim ulang penerimaan identik → periksa ledger satu entri → buka halaman privat → logout → tolak sesi yang dicabut.

Script mengganti URL database hanya bagi proses uji dan tidak memakai `DATABASE_URL` milik lingkungan pemanggil. Perintah dapat dijalankan setelah build dengan dev dependencies terpasang.

## Batas pemeriksaan yang harus dipahami

- Docker tidak tersedia pada lingkungan pengerjaan. Susunan runner dan command standalone diuji, tetapi image Alpine sebenarnya belum dijalankan.
- Browser Chromium tidak dapat diunduh dengan lengkap pada lingkungan pengerjaan. Pengujian komponen dan HTTP/SSR berjalan, tetapi inspeksi visual desktop/ponsel di browser belum dilakukan. Periksa tampilan pada staging sebelum cutover.
- PGlite memakai satu backend dan mengantrekan query. Tes idempotensi/SQL/locking tidak membuktikan seluruh interleaving beberapa transaksi PostgreSQL independen. Periksa kembali dengan PostgreSQL staging nyata sebelum memakai transaksi uang produksi.
- Enam tes integrasi lama bersifat opt-in. Jangan memberikan URL produksi untuk mengaktifkannya karena fixture dapat membersihkan tabel.
- Backup/restore dan perpindahan domain produksi harus diverifikasi pada Coolify Anda. Paket source tidak memuat kredensial maupun data/file produksi.

## Keputusan implementasi

- Tetap satu aplikasi dan satu database; modul dikerjakan terpisah untuk membatasi benturan file, lalu digabungkan dan diuji bersama.
- ID/referensi SEJOLI lama dipertahankan untuk histori, tetapi diabaikan untuk pemesanan baru. Risiko yang dihindari: penghapusan histori atau pencatatan penerimaan ganda.
- Pembayaran memakai transfer manual sesuai rancangan yang disetujui. Fitur gateway/komisi otomatis/voucher/LMS tidak diaktifkan.
- Script migrasi dan provisioning tetap eksplisit. Tidak ada reset admin atau migrasi otomatis pada setiap request/startup.
- Initializer lama untuk modul konten/lead masih dipertahankan agar kompatibel dengan source awal; skema akun, transaksi, dan pengaturan baru memakai migrasi operator bernomor. Jangan memakai akun database read-only untuk deployment ini.
