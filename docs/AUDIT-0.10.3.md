# Audit sumber dan hasil verifikasi KonsepSTIFIn 0.10.3

## Masalah yang diperbaiki

1. API daftar peserta sebelumnya membuat akun tanpa membaca cookie referral. Kini sumber referral disimpan secara atomik ketika akun dibuat, dengan jangka atribusi kunjungan aslinya.
2. Dashboard affiliate sebelumnya hanya menunjukkan produk, komisi, dan tautan. Kini tab Aktivitas referral memisahkan kunjungan, akun baru, permintaan layanan, serta pembelian. Peserta disamarkan dan data disaring berdasarkan akun mitra yang masuk.
3. Checkout sebelumnya memerlukan cookie pada browser yang dipakai membeli. Sekarang pendaftaran yang terhubung dapat menjadi sumber saat akun digunakan dari perangkat lain, selama batas atribusi awal belum habis.
4. Formulir layanan saat pengguna masuk juga dapat memakai sumber pendaftaran. Persetujuan pembagian dan pencatatan penugasan awal tetap mengikuti aturan formulir yang sudah ada.
5. Admin dapat memeriksa hubungan pendaftar dan affiliate melalui bagian Peserta dan hak akses. Hak melihat email ini tetap khusus admin.
6. Pemutar materi sebelumnya ditambahkan di bawah kartu kelas. Kini ruang materi memakai URL tersendiri, tanpa kartu katalog atau formulir pembelian pada layar yang sama.
7. Pelajaran memiliki navigasi sebelumnya/berikutnya, tautan materi yang dapat dibuka kembali, proteksi hasil permintaan yang datang tidak berurutan, serta tombol simpan progres dengan hasil yang jelas.
8. Menu materi di ponsel dapat dibuka/tutup, ukuran video mengikuti layar, dan navigasi kembali ke akses saya tersedia langsung.
9. Tab ruang belajar dan affiliate mendukung riwayat kembali/maju browser. Menu akun di ruang belajar diringkas agar tidak mengulang tab pembelian dan bantuan.
10. Halaman tautan referral lama dialihkan ke pusat mitra. Tautan khusus mengundang pendaftaran ditambahkan. Alias lama tetap dimiliki akun yang sama.
11. Tautan referral yang tidak valid sekarang memberi halaman 404 dengan penjelasan, bukan mengarahkan diam-diam tanpa mencatat referral.
12. Formulir daftar membedakan kegagalan dan keberhasilan, memvalidasi email serta JSON, mencegah pengiriman ulang setelah sukses, dan menyediakan tombol masuk dengan tujuan semula.
13. Keterangan lead di ringkasan promotor diperjelas agar pendaftaran akun tidak dikira sama dengan kontak layanan yang ditugaskan. Judul akun berlaku bagi peserta maupun mitra.
14. Kesiapan modul admin memeriksa keberadaan tabel referral pendaftaran. Kebijakan privasi menjelaskan catatan referral dan identitas tersamar.

## Pengujian

- Suite Vitest: 295 lulus, 6 dilewati, 67 file lulus dan 3 file dilewati. Uji baru mencakup transaksi atomik, rollback, sumber tidak boleh diubah, undangan kedaluwarsa/tidak aktif, sumber lintas perangkat, prioritas asal pendaftaran, batas 30 hari, isolasi data mitra, akses admin, ruang materi, perlombaan permintaan, dan status formulir.
- Suite identity Node: 78 lulus. Login, hashing, sesi, perubahan peran, deactivation, provisioning idempotent, dan adapter postgres.js tetap berjalan.
- Uji terarah tambahan API daftar dan formulir layanan: 10 lulus.
- ESLint, TypeScript, dan build produksi Next.js selesai tanpa kesalahan.
- Smoke paket standalone memakai migrasi 001–009 dan data sintetis. Menguji pendaftaran melalui cookie, tampil di aktivitas, checkout lintas perangkat tanpa cookie, tautan daftar, penolakan tautan invalid, redirect masuk halaman kelas, serta jalur transaksi dan akses dari rilis sebelumnya.
- Pemeriksaan browser menggunakan Chromium: ruang materi pada desktop, 390px, 320px, daftar akses tanpa iframe, pusat affiliate dan aktivitas, admin produk, sertifikat, detail produk, serta sembilan halaman publik pada desktop/ponsel.

## Batas verifikasi

Pada salah satu pengulangan smoke, antrean voucher sintetis gagal pulih dalam batas waktu uji. Pengulangan akhir selesai lulus. Beberapa pembacaan browser juga sempat mendapat 503 pada adapter pengujian, sementara tampilan akun dan pemeriksaan berikutnya berhasil. Temuan ini dicatat sebagai batas pengujian, bukan klaim bahwa server produksi sudah diverifikasi.

Pengujian database memakai PGlite dan adapter PostgreSQL wire, bukan database produksi pengguna. Ini bukan sertifikasi kondisi balapan di PostgreSQL produksi. Pemeriksaan video memastikan iframe/elemen video inline, URL penyematan, dan layout. Pemutaran sumber video eksternal tetap memerlukan koneksi serta izin penyematan dari pemiliknya. Tidak ada pengiriman voucher atau transfer bank riil.

Tidak ada backfill pendaftar lama yang tidak mempunyai bukti hubungan pengundang. Tidak ada perubahan otomatis pada harga, saldo komisi, atribusi transaksi lama, peran pengguna, atau kebijakan pembayaran. Fitur di luar perbaikan alur ini, seperti gateway pembayaran baru, email transaksi, reset password mandiri, booking, bundel, dan konfigurasi penandatangan sertifikat, belum ditambahkan.

Paket source belum dideploy oleh asisten ke server pengguna. Setelah memasang versi baru, migrasi 009 wajib dijalankan dan alur produksi perlu diperiksa menggunakan akun uji.
