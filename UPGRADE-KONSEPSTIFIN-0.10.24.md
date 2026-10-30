# KonsepSTIFIn 0.10.24: Bank Konten, Lampiran, dan Pilihan Massal

Rilis ini melanjutkan 0.10.23. Perubahan mencakup aplikasi dan worker, bukan hanya tampilan.

## Pemasangan dari 0.10.23

Migrasi 017 yang telah berhasil tidak perlu dijalankan kembali. Pesan NOTICE `already exists, skipping` saat pengulangan merupakan perilaku normal.

1. Cadangkan database dan pertahankan konfigurasi lingkungan instalasi.
2. Masukkan seluruh sumber rilis 0.10.24 ke repositori lalu deploy melalui proses Coolify yang digunakan saat ini.
3. Pada Terminal aplikasi baru di direktori `/app`, jalankan:

```bash
IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 018-whatsapp-content-media.sql
```

4. Restart aplikasi dan worker. Container bawaan menjalankan worker melalui `scripts/start-with-worker.mjs`. Selama migrasi 018 belum diterapkan, sebagian halaman/fitur baru belum siap digunakan. Jika proses deploy mendukung pre-deploy migration dengan sumber baru, terapkan migrasi sebelum mengalihkan trafik.
5. Pastikan `/api/health` menampilkan versi `0.10.24`, lalu muat ulang halaman admin.
6. Uji unggah PDF kecil ke kontak uji milik sendiri. Setelah lolos, uji satu grup yang diizinkan. Tidak ada pesan nyata yang dikirim saat pengembangan paket ini.

Migrasi 018 menambah kolom lampiran, tabel file, dan delapan draf konten awal. Migrasi dapat dijalankan ulang tanpa menggandakan draf dengan judul yang sama.

## Bank template dan konten

Buka Admin > WhatsApp > Bank konten. Buat, cari, edit, salin, atau nonaktifkan template. Konten dapat menyimpan teks dan satu lampiran opsional. Tersedia kategori Attract, Engage, Convert, Delight, Referral, dan Reaktivasi, selain kategori lama.

Delapan draf awal mencakup edukasi, konsultasi, tindak lanjut, booking, pendampingan, umpan balik, rekomendasi, dan sapaan kembali. Sesuaikan naskah dengan layanan dan kebutuhan penerima sebelum dipakai. Draf tidak otomatis mengirim pesan.

Template aktif tersedia di balasan cepat inbox dan pemilih Bank konten di Marketing serta broadcast grup. Inbox dan Marketing mendukung `{{nama}}`, `{{kota}}`, dan `{{referensi}}`. Pada grup, `{{nama}}` berarti nama tampilan grup. Ganti `{{kota}}` dan `{{referensi}}` dengan teks sebelum memakai konten pada grup; server menolak kedua variabel tersebut agar tidak terkirim mentah.

## Kirim file personal dan grup

Buka Lampiran opsional, pilih file dari perangkat, atau isi URL HTTPS file yang dapat diakses StarSender. Unggahan maksimal 10 MB. Format unggahan: PDF, JPG/JPEG, PNG, WebP, MP4, MP3, DOCX, XLSX, dan PPTX. Format dan batas akhir pengiriman juga mengikuti kemampuan perangkat/provider. URL eksternal tidak diunduh aplikasi untuk diperiksa ukuran atau isinya.

Lampiran tersedia pada balasan personal di inbox, kampanye personal terjadwal, dan broadcast grup. Pilih satu grup untuk mengirim ke satu grup. Caption boleh kosong jika lampiran tersedia. Satu pengiriman mendukung satu file. File tidak dikirim melalui worker chatbot atau tiap tahap drip campaign dalam rilis ini. Preset grup tetap menyimpan teks dan penerima; untuk naskah beserta file gunakan Bank konten.

File unggahan disimpan pada database PostgreSQL, bukan filesystem container, sehingga tetap tersedia setelah redeploy selama database tetap sama. Pertumbuhan kapasitas database mengikuti jumlah file. Tombol Hapus lampiran melepas lampiran dari formulir, tidak menghapus bytes lama dari database.

Tautan file menggunakan ID acak dan dapat diakses tanpa cookie admin agar StarSender dapat mengambil file. Siapa pun yang memperoleh tautan dapat mengunduhnya. Gunakan brosur dan materi yang memang ditujukan untuk dibagikan. Link file belum memiliki masa kedaluwarsa atau fitur pencabutan akses. `PLATFORM_ORIGIN` harus berisi domain HTTPS publik instalasi.

## Pilihan massal

- Daftar grup: Izinkan semua grup yang ditampilkan dan Blokir semua grup yang ditampilkan mengikuti pencarian, maksimal 500 grup yang dimuat. Tidak ada pesan yang langsung dikirim oleh tindakan izin ini.
- Preset dan target broadcast: Pilih semua dan Kosongkan pilihan. Hanya grup yang telah diizinkan yang dapat dipilih, maksimal 100 per preset/broadcast.
- Marketing: Pilih semua kontak berizin mengikuti pencarian, maksimal 100 kontak. Kosongkan pilihan menghapus seluruh pilihan, termasuk pilihan yang sedang tidak terlihat karena pencarian.
- Drip: Pilih semua penerima yang sesuai pencarian dan Kosongkan pilihan, maksimal 100 penerima.

Pilih semua mengganti pilihan sebelumnya dengan daftar yang memenuhi syarat pada formulir tersebut. Izin grup berbeda dari persetujuan promosi personal. Tombol pilih semua kontak tidak mengaktifkan persetujuan promosi.

Nomor personal dinormalisasi dan dideduplikasi pada pembuatan kampanye Marketing. Jika beberapa lead berizin memakai nomor yang sama, kampanye memakai lead ber-ID paling kecil di antara kontak terpilih untuk personalisasi dan pemeriksaan persetujuan. Setiap kampanye terpisah tetap dapat mengirim ke nomor yang sama. Dedup ini belum menggabungkan rekam CRM dan belum berlaku untuk enrollment drip lama.

STOP dan pemeriksaan persetujuan saat pengiriman tetap berlaku. Balasan inbox dan drip tetap memakai jendela inbound 24 jam. Kampanye personal menyediakan mode outbound berizin seperti pada 0.10.23.

## Validasi

Lihat HASIL-PENGUJIAN-0.10.24.md. Build produksi dan pemeriksaan TypeScript berhasil. Integrasi diuji memakai data sintetis serta penerima HTTP lokal, bukan akun StarSender produksi. Pengujian langsung provider tetap diperlukan untuk format file yang akan dipakai.

## Sumber resmi

- https://docs.starsender.online/docs/message-api/kirim-pesan/
- https://docs.starsender.online/docs/grup-api/kirim-pesan/

Dokumentasi diperiksa 30 Oktober 2026. API mendukung messageType media dan parameter file berupa URL.
