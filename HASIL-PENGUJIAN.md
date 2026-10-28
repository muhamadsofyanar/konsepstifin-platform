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
