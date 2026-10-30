# KonsepSTIFIn 0.10.21 — WhatsApp Command Center

## Ringkasan

Rilis ini mengembangkan integrasi StarSender menjadi pusat komunikasi pelanggan. StarSender tetap menjadi gateway WhatsApp. KonsepSTIFIn menyimpan percakapan, mengatur hak akses, menjalankan chatbot internal, dan menjadwalkan drip campaign.

## Fitur

1. WhatsApp Inbox dengan riwayat pesan masuk dan keluar dari StarSender Webhook Premium.
2. Balasan admin dan promotor melalui dashboard. Promotor hanya dapat membaca lead yang ditugaskan kepadanya dan memiliki `consent_to_share=true`.
3. Status percakapan: bot, petugas, selesai.
4. Chatbot internal melalui OpenAI API dengan retrieval dari pustaka STIFIn dan katalog produk/promo live. Jika API key belum diatur, worker memakai jawaban dasar yang dibatasi.
5. Pengambilalihan otomatis ke petugas untuk permintaan admin/manusia, keluhan, refund, atau masalah pembayaran.
6. Balasan cepat pada Inbox.
7. Drip campaign bertahap dengan personalisasi `{{nama}}`, persetujuan marketing, pemeriksaan opt-out, dan pemeriksaan jendela 24 jam.
8. Template balasan cepat yang dapat diedit admin dan digunakan admin/promotor.
9. Ringkasan Inbox: total percakapan, belum dibaca, menunggu petugas, dan percakapan yang ditangani bot.
8. Pause dan aktifkan kembali drip campaign.
9. Sinkronisasi pesan keluar melalui Webhook Premium dan pencatatan pesan yang dikirim melalui antrean internal.
11. OpenAI API key dan model dapat diatur dari Admin → Pengaturan → Integrasi eksternal. API key disimpan terenkripsi dan tidak ditampilkan kembali. Admin harus menyetujui pemrosesan isi percakapan oleh OpenAI sebelum mengaktifkan AI.

## Prasyarat

- PostgreSQL aktif.
- Migrasi 001–014 sudah diterapkan pada database yang digunakan.
- StarSender Device API key aktif.
- StarSender Webhook Premium aktif.
- Webhook device diarahkan ke URL webhook KonsepSTIFIn yang menampilkan secret token dari Pengaturan Admin.
- OpenAI API key opsional. Chatbot menggunakan jawaban dasar jika API key belum tersedia.

## Urutan upgrade

1. Cadangkan database dan direktori penyimpanan sebelum upgrade.
2. Deploy source code 0.10.21.
3. Dari terminal container aplikasi, jalankan migrasi satu kali:

   ```bash
   IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 015-whatsapp-command-center.sql
   ```

   `DATABASE_URL` harus sudah tersedia di environment container. Jangan menyalin nilainya ke dokumen atau chat.
4. Buka Admin → Pengaturan → Integrasi eksternal.
5. Masukkan OpenAI API key (opsional) dan pilih model yang tersedia pada akun API.
6. Buka StarSender, pastikan webhook Premium mengarah ke URL webhook KonsepSTIFIn yang tampil di pengaturan.
7. Buka Admin → WhatsApp. Aktifkan chatbot setelah menguji Inbox dan memastikan API StarSender siap.

## Cara kerja Inbox

- Pesan masuk membuat atau memperbarui percakapan.
- Pesan keluar dari perangkat StarSender juga disimpan jika event Premium diterima.
- Pesan yang dikirim dari Inbox masuk ke `notification_outbox`, lalu worker mengirimkannya.
- Pengiriman manual dibatasi pada jendela 24 jam sejak pesan pelanggan terakhir.
- Pengiriman berhenti jika kontak mengirim STOP sampai pelanggan mengirim MULAI.
- Admin dapat mengambil alih percakapan. Promotor dibatasi pada lead yang ditugaskan dan telah memberi izin berbagi data.

## Chatbot

- Chatbot aktif secara global melalui tab Chatbot & Automasi.
- Bot hanya merespons pesan masuk baru ketika bot global aktif dan mode percakapan `bot`.
- Ketika admin/promotor mengambil alih, mode berubah menjadi `human` dan job bot berikutnya dilewati.
- Bot tidak memberikan harga, jadwal, ketersediaan, atau status pembayaran yang tidak terverifikasi.
- API key disimpan pada konfigurasi integrasi terenkripsi. Jangan menaruh API key di browser atau repository.

## Drip campaign

- Hanya kontak dengan `whatsapp_marketing_consent=true` yang dapat didaftarkan.
- Setiap langkah memiliki jeda dalam menit dan isi pesan.
- Worker memeriksa persetujuan, status lead, opt-out, dan jendela 24 jam sebelum mengirim.
- Jika jendela berakhir, enrollment dijeda sampai pelanggan memulai chat kembali.
- Admin dapat menjeda dan mengaktifkan kembali campaign.

## Pengujian produksi

1. Kirim pesan dari nomor pelanggan ke nomor WhatsApp resmi. Pastikan percakapan muncul pada Inbox.
2. Balas dari Inbox. Pastikan antrean berubah menjadi sent dan pesan tampil di riwayat.
3. Balas dari aplikasi WhatsApp yang terhubung ke StarSender. Pastikan pesan keluar tersinkronisasi melalui Webhook Premium.
4. Aktifkan chatbot dan kirim pertanyaan umum. Pastikan bot membalas satu kali.
5. Ambil alih percakapan. Pastikan pesan berikutnya tidak memicu bot.
6. Buat drip campaign hanya dengan kontak yang memiliki persetujuan promosi. Pastikan status antrean dan jeda berjalan sesuai pengaturan.
7. Kirim STOP. Pastikan campaign dihentikan dan pesan promosi tidak lagi dikirim.

## Batasan yang diketahui

- Status delivery webhook StarSender bergantung pada event yang benar-benar dikirim provider. Status API send disimpan, tetapi status delivered/read tidak boleh dianggap tersedia jika provider tidak mengirim event status tersebut.
- Inbox melakukan polling berkala sekitar 5 detik; sinkronisasi bergantung pada Webhook Premium StarSender.
- Bot dan balasan manual masuk antrean notification outbox yang sama agar pesan keluar tersimpan sebagai queued/sent/failed dan tidak menggandakan pesan ketika event webhook keluar tiba.
- Pengiriman WhatsApp tetap memakai gateway StarSender dan bukan WhatsApp Business Platform resmi. Hindari blast tidak diminta, volume agresif, dan pesan tanpa persetujuan.
- Jendela 24 jam diterapkan sebagai kontrol pengiriman internal. Campaign tidak mengirim pesan ketika jendela berakhir.
- Pencarian promotor dan harga harus mengambil data dari database yang telah diverifikasi; chatbot tidak diberi izin membuat keputusan atau mengubah transaksi.
