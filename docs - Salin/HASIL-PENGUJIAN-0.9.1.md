# Verifikasi rilis UI/UX 0.9.1

Tanggal: 28 Oktober 2026. Baseline 0.9.0 dan tiga screenshot produksi yang diberikan pengguna. Tidak ada perubahan server atau database produksi yang dilakukan dari workspace ini.

## Hasil akhir

- `npm test`: 250 tes lulus, 6 dilewati. 60 file lulus, 3 file dilewati.
- `npm run typecheck`: lulus.
- `npm run lint`: lulus tanpa warning.
- `npm run build`: lulus menggunakan Node 24 dan Next.js 16.2.10. Sama seperti 0.9.0, statistik memori lingkungan lokal memerlukan preload di luar paket release; tidak dimasukkan ke Dockerfile/source.
- Smoke standalone: lulus. Termasuk login admin/member, diagnostik readiness, penolakan pencarian akun oleh member, pencarian email admin, menu peran di SSR, isolasi class heading, checkout, pembayaran, akses file, komisi, pencairan, voucher dan pemulihan kedua worker.

## Skenario UI yang diuji

1. Menu peserta tidak menampilkan voucher, referral, komisi atau ruang admin yang tidak sesuai peran.
2. Menu promotor mempertahankan voucher, referral dan komisi; tautan admin hanya muncul pada peran admin.
3. Admin mulai dari ringkasan dan dapat berpindah ke workspace produk tanpa menampilkan semua formulir dari bagian lain.
4. Peserta dapat berpindah ke Pembelian dan tidak sekaligus melihat semua bagian lain.
5. Gagal membaca data tidak menampilkan empty state yang seolah menandakan akun tidak punya kelas.
6. Instruksi migrasi admin tidak ditampilkan sebagai pesan kegagalan member.
7. Pencarian email menemukan peserta lama di luar daftar akun yang dimuat pertama kali.
8. Form gagal simpan menampilkan alert, bukan pesan keberhasilan.
9. CSS heading ringkas tetap `display:flex` dan `min-height:0px` ketika stylesheet hero publik yang bermasalah juga dimuat.
10. Status dan kondisi akses dilokalkan; kelas expired/ditangguhkan tetap tidak aktif pada tampilan.
11. Pesanan dibatalkan/refund tidak diperlakukan sebagai tagihan belum dibayar.
12. Gabungan grant renewal memakai masa akses terpanjang dan awal akses aktif paling awal untuk jadwal materi, sesuai pemeriksaan server.
13. Endpoint readiness dan pencarian akun ditolak untuk member.

## Pemeriksaan independen

Reviewer terpisah menemukan risiko renewal mengunci materi lama dan selector akun yang terbatas pada 300 akun terbaru. Keduanya direproduksi sebelum perbaikan dan memiliki tes regresi. Tidak ada temuan penting reviewer yang sengaja dibiarkan tanpa perbaikan.

## Batas bukti

Pengujian UI memakai React Testing Library/jsdom dan computed CSS. Ini menguji interaksi serta akar benturan CSS, bukan layout browser penuh. Chromium lokal tidak dapat dijalankan di lingkungan ini (SIGTRAP), dan browser cloud tidak dapat mengakses localhost pengujian. Tidak ada klaim screenshot/browser desktop-mobile setelah redeploy, serta tidak ada klaim tampilan produksi sudah berubah.

Enam tes lama yang memerlukan sumber/konfigurasi eksternal tetap dilewati. Smoke memakai akun, dokumen dan transaksi sintetis pada PGliteSocket, bukan PostgreSQL produksi atau transfer bank riil. Lihat UPGRADE-0.9.1.md untuk pemasangan dan pemeriksaan setelah deploy.
