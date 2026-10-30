# Upgrade KonsepSTIFIn 0.10.20

## Tujuan
Memperbaiki langkah setelah formulir publik berhasil disimpan. Pengunjung langsung mendapat tombol WhatsApp dengan pesan konfirmasi yang sudah terisi, bukan instruksi manual untuk mencari nomor dan menyalin nomor referensi.

## Perubahan
- Modal sukses selalu menampilkan tombol **Konfirmasi melalui WhatsApp**.
- Tujuan WhatsApp resmi: `https://wa.me/6281333362649`.
- Pesan otomatis diisi dengan nama layanan, nama pemohon, nomor WhatsApp, kota/domisili, dan nomor referensi `KSF-...`.
- Permintaan calon promotor meminta panduan tahapan pendaftaran, persyaratan, biaya, dan langkah selanjutnya.
- Permintaan layanan umum meminta konfirmasi kebutuhan, harga, jadwal, dan langkah selanjutnya.
- Tombol membuka WhatsApp di tab baru. Pengunjung tetap harus menekan **Kirim** di WhatsApp.
- Tidak ada perubahan database, migrasi, Moota, StarSender, Mailketing, harga, maupun pengaturan promo.

## Catatan operasional
Pastikan nomor `+62 813-3336-2649` memang nomor WhatsApp bisnis yang dikelola tim KonsepSTIFIn dan terhubung dengan StarSender. Pesan yang sudah terisi belum dianggap terkirim sampai pengunjung menekan tombol Kirim di WhatsApp. Webhook inbound baru dapat memproses percakapan setelah pesan benar-benar masuk.

## Deployment
1. Backup source dan database.
2. Ganti source repository dengan isi paket ini pada branch deployment.
3. Jalankan deployment Coolify.
4. Pastikan build dan healthcheck berhasil.
5. Uji satu pengajuan paket promotor dan satu pengajuan layanan umum.
6. Periksa pesan yang terisi di WhatsApp sebelum menekan Kirim.

## Verifikasi
Tes otomatis ditambahkan untuk memastikan tombol WhatsApp selalu tersedia walaupun API tidak mengembalikan `whatsappContact`, dan memastikan pesan memuat layanan, pemohon, kota, serta nomor referensi.
