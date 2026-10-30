# Hasil pengujian KonsepSTIFIn 0.10.24

Tanggal: 30 Oktober 2026. Dasar pembaruan: sumber 0.10.23 yang disiapkan dalam percakapan ini. Sumber proyek unggahan tetap 0.10.22, sehingga paket baru mencakup perbaikan 0.10.23 dan 0.10.24.

## Hasil

- Build produksi Next.js: berhasil, termasuk kompilasi, pemeriksaan TypeScript dan pembuatan halaman.
- `npm run typecheck`: berhasil.
- Pengujian terkait: 20 pengujian unik berhasil. Rangkaian enam berkas berisi 19 pengujian berhasil, lalu pengujian tambahan inbox dan rekonsiliasi media berhasil; berkas integrasi akhir berisi delapan pengujian juga dijalankan lengkap dan seluruhnya berhasil.
- ESLint pada berkas yang berubah: berhasil. Lint seluruh repositori belum bersih karena satu error lama tipe `any` di `src/lib/moota-store.ts`. Warning lama pada berkas lain tercatat di bawah. Dua error effect lama di workspace WhatsApp sudah diperbaiki dengan menghapus pengambilan detail ganda dan menjadwalkan pemuatan otomasi setelah effect terpasang.

## Perilaku terverifikasi

1. Jadwal WIB dikonversi ke UTC dan antrean masa depan tidak dikirim sebelum waktunya.
2. Mode outbound berizin dapat mengirim tanpa chat masuk sebelumnya; mode inbound tetap menunggu.
3. STOP dan pencabutan persetujuan menghentikan pengiriman.
4. Worker pengiriman aktual mengirim payload media dengan URL lampiran ke server penerima lokal.
5. Klien StarSender membentuk payload media personal dan grup dengan benar, termasuk caption kosong.
6. URL non-HTTPS, alamat lokal, kredensial URL, dan file dengan signature yang tidak sesuai ditolak.
7. Unggahan PDF memerlukan akses akun. Unduhan menggunakan ID acak menyajikan bytes yang sama tanpa cookie agar provider dapat mengambil file.
8. Bank konten menyimpan lampiran dan mengisinya kembali ke formulir personal.
9. Nomor yang sama dalam satu kampanye Marketing dideduplikasi setelah normalisasi.
10. Izin massal hanya mengubah grup yang dipilih, diperiksa sebagai admin, dan grup yang diblokir tidak dapat dijadwalkan broadcast baru.
11. Tombol pilih semua mengikuti pencarian dan hanya memilih kontak berizin. Tombol kosongkan menghapus pilihan.
12. Pemilih preset grup mendukung pilih semua dan kosongkan.
13. Migrasi 018 dapat diterapkan ulang tanpa menggandakan draf konten awal.
14. Balasan inbox menyimpan file tanpa caption, tetap memeriksa jendela inbound dan akses, lalu merekonsiliasi webhook media dengan pesan antrean tanpa menambah baris duplikat.
15. Perbaikan penerimaan grup, nama grup dan event duplikat dari rilis sebelumnya tetap lolos.

## Batas pengujian

Data dan file bersifat sintetis. Database uji memakai PGlite melalui protokol PostgreSQL. Pengiriman worker menuju server HTTP lokal, bukan nomor/grup nyata. Pengujian klien grup memeriksa kontrak API; belum ada uji media ke perangkat StarSender produksi. Build Docker di server pengguna belum dijalankan untuk paket 0.10.24. Dockerfile sudah menyertakan helper media yang diimpor worker.

Pengujian seluruh repositori belum dijalankan. Lint global masih memiliki satu error lama di moota-store.ts serta warning lama useEffect di commerce-workspace.tsx dan variabel yang tidak dipakai di public-interest-action.test.tsx. Tidak ada perubahan fitur Moota pada rilis ini.

Belum ada deploy atau migrasi 018 ke database produksi dari pekerjaan ini. Jalankan langkah pemasangan dan uji satu file kecil ke kontak/grup uji sebelum penggunaan operasional.
