# KonsepSTIFIn 0.10.22 — WhatsApp Group Broadcast & Scheduling

## Fokus rilis

Rilis ini melanjutkan WhatsApp Command Center 0.10.21. Fokusnya adalah jadwal pengiriman yang transparan, pengelolaan grup StarSender, preset grup yang dapat diedit, dan broadcast grup dengan antrean terpantau.

## Perubahan

1. Tab **Grup & Broadcast** pada WhatsApp Command Center.
2. Sinkronisasi daftar grup dari StarSender Device API melalui `GET /api/whatsapp/groups`.
3. Group allowlist. Grup hasil sinkronisasi tidak otomatis boleh menerima broadcast. Admin harus mengaktifkan izin per grup.
4. Preset grup. Admin dapat membuat, mengedit, menduplikasi, mengaktifkan, dan menonaktifkan preset berisi target grup serta pesan default.
5. Broadcast grup terjadwal. Admin dapat mengirim secepatnya atau memilih tanggal dan jam Asia/Jakarta.
6. Antrean pengiriman grup diproses worker satu per satu melalui `POST /api/send/grup`.
7. Riwayat broadcast menampilkan jadwal, jumlah grup, terkirim, menunggu, gagal, status tidak pasti, dan aksi jeda/lanjutkan/batalkan.
8. Group Inbox untuk mencatat pesan masuk jika add-on StarSender Webhook Group aktif.
9. Jadwal mulai drip campaign personal ditampilkan secara eksplisit. Riwayat juga menampilkan jadwal pengiriman berikutnya.
10. Pengiriman grup dihentikan untuk grup yang izin broadcast-nya dinonaktifkan sebelum job dikirim.

## Batas kemampuan StarSender yang harus dipahami

- Daftar grup menggunakan Device API key. Dokumentasi endpoint: `GET https://api.starsender.online/api/whatsapp/groups`.
- Pengiriman pesan grup menggunakan Device API key. Dokumentasi endpoint: `POST https://api.starsender.online/api/send/grup`. Field utama: `messageType`, `to`, `body`, `delay`, dan `schedule`.
- Pengiriman pada rilis ini dijadwalkan oleh worker KonsepSTIFIn. Kolom waktu memakai `Asia/Jakarta`; job dikirim setelah waktu jadwal tercapai. Antrean mengirim satu grup per siklus worker, bukan serentak.
- **Webhook Premium personal tidak otomatis mencakup pesan masuk grup.** Pesan masuk grup membutuhkan add-on **Webhook Group** StarSender. URL endpoint KonsepSTIFIn adalah `/api/webhooks/starsender/group?token=...` dan ditampilkan di tab Grup & Broadcast untuk super admin.
- Dokumentasi Webhook Group menjamin contoh field `device`, `from` (JID grup), `message`, `file`, `group_name`, dan `timestamp`. Payload yang didokumentasikan tidak menjamin daftar anggota atau status admin grup. KonsepSTIFIn hanya menampilkan nama/ID pengirim atau status admin jika provider benar-benar mengirimkannya.
- Status `Terkirim` berarti StarSender menerima permintaan pengiriman. Status `Dibaca` atau `Diterima` tidak boleh disimpulkan jika provider tidak mengirim event status tersebut.
- Broadcast grup pada rilis ini berupa teks. Media grup belum termasuk.

## Migrasi database

Backup database terlebih dahulu. Setelah source 0.10.22 berhasil dideploy, jalankan satu kali dari terminal container aplikasi:

```bash
IDENTITY_ADMIN_CONFIRM=yes node scripts/apply-migration.mjs 016-whatsapp-groups-broadcast.sql
```

Migrasi 016 menambahkan:
- `whatsapp_groups`
- `whatsapp_group_presets`
- `whatsapp_group_preset_items`
- `whatsapp_group_broadcasts`
- `whatsapp_group_broadcast_jobs`
- `whatsapp_group_messages`
- `whatsapp_drip_campaigns.scheduled_at`

## Konfigurasi StarSender

1. Pastikan Device API key StarSender tersimpan di Admin → Pengaturan → Integrasi eksternal.
2. Webhook Premium personal tetap diarahkan ke endpoint personal yang sudah berjalan.
3. Untuk membaca pesan grup, aktifkan add-on Webhook Group pada akun StarSender dan pasang URL Group Webhook yang ditampilkan di WhatsApp Command Center.
4. Sinkronkan grup dari StarSender.
5. Aktifkan izin broadcast hanya pada grup yang memang dikelola atau mengizinkan informasi KonsepSTIFIn.
6. Buat preset grup dan uji broadcast pada satu grup internal terlebih dahulu.

## Pengujian produksi

1. Sinkronkan daftar grup. Pastikan nama dan JID muncul.
2. Pastikan grup baru berstatus **Diblokir** sampai admin mengaktifkannya.
3. Buat preset, edit preset, duplikat preset, lalu uji perubahan target grup.
4. Buat broadcast dengan jadwal 10 menit ke depan. Pastikan jadwal tampil dengan zona WIB.
5. Jeda broadcast sebelum jadwal. Pastikan tidak ada pesan yang dikirim. Lanjutkan dan periksa antrean.
6. Uji pengiriman ke satu grup internal dan cocokkan hasilnya dengan Send Item Report StarSender.
7. Nonaktifkan izin salah satu grup yang masih menunggu. Pastikan worker tidak mengirim ke grup itu.
8. Jika add-on Webhook Group aktif, kirim pesan uji ke grup dan pastikan pesan masuk tampil di Group Inbox.
9. Uji drip campaign personal dengan tanggal mulai yang akan datang. Pastikan riwayat menampilkan waktu mulai dan waktu pengiriman berikutnya.

## Catatan keamanan operasional

- Admin wajib mengonfirmasi bahwa grup memang boleh menerima pesan.
- Batas 100 grup per broadcast diterapkan pada aplikasi.
- Jangan melakukan spam, blast agresif, atau pengiriman tanpa izin. StarSender bukan WhatsApp Business Platform resmi dan penggunaan gateway pihak ketiga tetap memiliki risiko pembatasan akun.
- Timeout pengiriman ditandai `unknown`, bukan dikirim ulang otomatis, untuk menghindari pesan ganda ketika StarSender mungkin sudah menerima pesan.
