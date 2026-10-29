# KonsepSTIFIn 0.10.10

Rilis ini menambahkan kebijakan WhatsApp inbound-first untuk mengurangi pesan keluar yang tidak diharapkan dan menunggu pelanggan memulai percakapan terlebih dahulu.

## Perubahan utama

- Webhook StarSender V3 untuk mencatat pesan masuk dari pelanggan secara idempoten.
- Outbox WhatsApp hanya mengirim setelah nomor pelanggan mengirim pesan dalam 24 jam terakhir. Jika belum, pesan berstatus `awaiting_inbound` dan akan dilepas ke antrean saat pelanggan mengirim pesan.
- Kata `STOP`, `BERHENTI`, atau `UNSUBSCRIBE` menghentikan antrean pesan untuk nomor tersebut. `MULAI` atau `START` membuka kembali pesan layanan, tetapi tidak otomatis memberikan persetujuan marketing.
- Kampanye marketing tetap mensyaratkan persetujuan promosi eksplisit dan memeriksanya kembali saat pengiriman.
- Secret webhook StarSender bisa dibuat dari Admin > Pengaturan > Integrasi Eksternal dan disimpan terenkripsi, tanpa redeploy.
- Integrasi Moota, promo Family Test, Year-End Workshop, dan formulir lead dari 0.10.9 tetap disertakan.

## Konfigurasi Moota

Buat Personal Token bernama `KonsepSTIFIn Production`. Untuk integrasi yang menggunakan endpoint API, panduan Moota menyebut scope `API`, `User_read`, `Bank_read`, dan `Mutation_read`. Scope `API` memiliki akses luas. Simpan token hanya pada Admin > Pengaturan > Integrasi Eksternal. Konfigurasikan webhook Moota memakai URL yang ditampilkan admin dan secret yang sama dengan kolom Secret webhook. Path pembuatan Terima Uang masih harus dicocokkan dengan dokumentasi endpoint aktif Moota, jangan mengisi path berdasarkan tebakan.

## Upgrade

1. Backup database dan file sebelum deployment.
2. Deploy source 0.10.10 dari branch `main`.
3. Setelah backup, jalankan migrasi satu kali: `IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 013-whatsapp-inbound-first.sql`. Migrasi 012 harus sudah diterapkan dari rilis 0.10.9.
4. Buka Admin > Pengaturan > Integrasi Eksternal. Isi Device API Key StarSender, buat secret webhook, simpan, lalu salin URL webhook pesan masuk ke pengaturan webhook device StarSender.
5. Pastikan webhook StarSender mengirim event pesan masuk ke URL tersebut. Kirim chat uji dari nomor pribadi ke nomor resmi KonsepSTIFIn. Pesan keluar tidak dikirim sebelum event inbound tercatat.
6. Tes pembayaran dan promo di staging sebelum penggunaan produksi.

## Batasan dan keamanan

Inbound-first mengurangi pesan yang tidak diminta, tetapi tidak menjamin nomor bebas pemblokiran. Dokumentasi StarSender menyatakan penggunaan yang tidak wajar dapat berisiko menyebabkan pemblokiran. Untuk kebutuhan produksi dengan jaminan kebijakan yang lebih jelas, evaluasi WhatsApp Business Platform resmi. Pesan marketing tetap memerlukan consent dan opt-out harus dihormati.

Build produksi, typecheck penuh, dan test suite belum dapat diverifikasi di lingkungan kerja ini karena instalasi dependensi timeout. Jangan menganggap rilis tervalidasi sebelum build Coolify dan uji staging berhasil.
