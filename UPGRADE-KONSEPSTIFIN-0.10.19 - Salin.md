# Upgrade KonsepSTIFIn 0.10.19: Perbaikan antrean instruksi calon promotor

## Temuan sumber
Formulir `/api/interests` menyimpan lead calon promotor, tetapi tidak membuat antrean WhatsApp untuk instruksi tindak lanjut. Webhook StarSender hanya membuka kembali antrean berstatus `awaiting_inbound`; karena itu lead dapat muncul di CRM tanpa pesan instruksi yang menunggu.

## Perbaikan
- Setelah lead calon promotor berhasil tersimpan dan persetujuan kontak diberikan, sistem membuat satu pesan `promoter_candidate_instructions` di `notification_outbox`.
- Kunci deduplikasi memakai ID lead dan nomor telepon, sehingga pengiriman ulang form tidak menggandakan instruksi untuk lead yang sama.
- Worker tetap menahan pesan sebagai `awaiting_inbound` bila calon promotor belum memulai percakapan WhatsApp dalam 24 jam terakhir.
- Ketika webhook inbound menerima pesan valid, antrean yang sesuai diaktifkan kembali. Worker kemudian mengirim instruksi dalam jendela percakapan.
- Untuk lead calon promotor lama yang belum memiliki antrean, webhook membuat instruksi setelah calon tersebut memulai chat, hanya jika persetujuan kontak aktif dan lead belum ditutup/selesai. Ini menutup celah untuk lead yang sudah ada sebelum perbaikan.
- Kegagalan enqueue dicatat di log server dan tidak menghapus atau menggagalkan lead yang sudah tersimpan.
- Harga, promo, database schema, Moota, dan Mailketing tidak diubah. Tidak ada migrasi baru.

## Deploy
1. Backup source dan database.
2. Terapkan seluruh isi ZIP ke branch `main` repository `muhamadsofyanar/konsepstifin-platform`.
3. Commit satu kali dan deploy melalui Coolify.
4. Pastikan `/api/health` menampilkan `0.10.19` dan container `healthy`.

## Uji end-to-end wajib
1. Ajukan Paket Promotor dengan persetujuan kontak.
2. Pastikan lead muncul di CRM dan satu baris `notification_outbox` dibuat dengan event `promoter_candidate_instructions`.
3. Pastikan status menjadi `awaiting_inbound` jika nomor belum memulai chat.
4. Untuk lead lama yang belum mendapat antrean, dari nomor calon promotor kirim pesan ke nomor resmi StarSender. Webhook akan menemukan lead terbuka yang cocok dan membuat instruksi setelah pesan masuk. Untuk lead baru, tautan WhatsApp resmi pada layar sukses tetap menjadi jalur utama.
5. Pastikan webhook mencatat `whatsapp_inbound_sessions.last_inbound_at` untuk nomor yang benar dan antrean berubah ke `pending`.
6. Pastikan worker mengirim pesan, lalu status menjadi `sent`. Jika gagal, periksa `last_error`, log worker, API key, nomor perangkat StarSender, URL webhook, dan migrasi 011/013/014.

## Catatan keamanan
Jangan mengirim pesan proaktif sebelum ada sesi inbound yang sah. Pesan ini adalah tindak lanjut permintaan yang disetujui pengguna, bukan kampanye pemasaran. Kampanye tetap memerlukan persetujuan pemasaran terpisah.
