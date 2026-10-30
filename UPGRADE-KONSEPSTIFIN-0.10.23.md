# KonsepSTIFIn 0.10.23: Jadwal Personal dan Percakapan Grup

## Hasil audit sumber 0.10.22

1. Form Marketing langsung memasukkan pesan ke antrean tanpa input tanggal atau jam. Penyimpanan kampanye belum memiliki jadwal sendiri.
2. Webhook utama mengembalikan respons sukses untuk event grup tetapi membuang event tersebut. Ini menjelaskan mengapa pesan grup tidak tersimpan lewat URL Premium.
3. Dokumentasi aplikasi sebelumnya keliru menyatakan Premium tidak mencakup grup. Dokumentasi resmi StarSender menyebut pesan masuk dan keluar personal maupun grup.
4. Parser nama grup mengandalkan beberapa kolom tertentu. Nilai kosong bisa mengalahkan kolom nama lain. Sinkronisasi atau webhook tanpa nama dapat menimpa nama yang telah terbaca dengan ID grup.
5. Aplikasi memasang aturan inbound-first 24 jam pada worker, bukan sekadar menampilkannya sebagai keterangan.

## Perubahan dan cara pakai

### Pesan personal terjadwal

Buka **Admin > WhatsApp > Broadcast & persetujuan** atau halaman **Marketing**. Pilih satu kontak untuk pesan personal. Pilih beberapa kontak untuk kampanye, maksimal 100 kontak dengan persetujuan aktif. Isi pesan, lalu pilih tanggal dan jam WIB. Placeholder `{{nama}}` tetap tersedia.

Mode **Kirim ke kontak berizin tanpa menunggu chat masuk** memakai StarSender Device API. Worker mengambil pesan setelah jadwal tiba, lalu memeriksa ulang persetujuan dan STOP. Ini memungkinkan kampanye baru untuk kontak berizin yang belum pernah mengirim chat. Mode **Tunggu chat pelanggan dalam 24 jam terakhir** tetap tersedia.

Jadwal disimpan sebagai UTC dan ditampilkan sebagai WIB. Contoh 1 Januari 2099 pukul 09.30 WIB tersimpan sebagai 02.30 UTC. Worker berjalan berkala, sehingga jadwal merupakan waktu mulai kelayakan antrean. Beban antrean, koneksi, dan respons StarSender dapat menambah jeda.

Mode outbound pada rilis ini berlaku untuk kampanye baru di Marketing. Balasan manual pada inbox, chatbot, drip campaign, dan antrean lama tetap mengikuti aturan sebelumnya. Untuk pesan personal proaktif, gunakan satu penerima pada Marketing. Status diterima API tidak membuktikan pesan telah dibaca pelanggan.

### Nama grup

Klik **Sinkronkan grup dari StarSender**. Parser kini membaca alias nama yang tidak kosong, metadata bersarang, dan daftar berbentuk objek berindeks JID. Nama valid tidak lagi ditimpa ID ketika nama tidak tersedia pada event berikutnya.

Jika nama tetap hanya berupa ID, klik **Atur nama**. Nama tersebut menjadi nama tampilan lokal dan tetap bertahan saat sinkronisasi. Kosongkan untuk kembali memakai nama dari StarSender. Ini tidak mengganti nama grup asli di WhatsApp.

Tanpa payload API asli perangkat, nama kolom yang menyebabkan masalah pada akun produksi belum dapat dipastikan. Fallback nama manual tetap tersedia jika provider tidak mengirim nama.

### Percakapan grup

Webhook Premium utama sekarang meneruskan event grup ke penyimpanan grup, dengan pemeriksaan token yang sama. Pada StarSender, pastikan Webhook Premium aktif dan terpasang ke:

`https://DOMAIN-ANDA/api/webhooks/starsender?token=SECRET-YANG-SUDAH-DIKONFIGURASI`

Gunakan domain dan secret milik instalasi. Jangan membagikan URL bertoken. Jika memakai Webhook Group terpisah, URL `/api/webhooks/starsender/group` tetap didukung. Anda tidak perlu membeli add-on Group tambahan hanya berdasarkan teks aplikasi versi lama. Periksa paket dan pengaturan event akun StarSender terlebih dahulu.

Minta seorang anggota mengirim satu pesan baru, kemudian buka **Grup & Broadcast > Percakapan grup**. Pilih grup pada filter. Tampilan memuat maksimal 100 pesan terakhir untuk grup terpilih dan memperbarui setiap 10 detik saat tab terlihat. Tombol perbarui juga tersedia.

Tidak perlu mengirim pesan lebih dahulu untuk menerima pesan baru grup. Namun nomor perangkat harus menjadi anggota grup dan StarSender harus mengirim event tersebut. Riwayat lama dari WhatsApp Web tidak diimpor melalui webhook. Rilis ini menampilkan percakapan grup; pengiriman grup tetap melalui formulir broadcast yang sudah tersedia. Identitas anggota hanya tampil jika provider menyertakannya. `push_name` pada payload grup Premium dipakai sebagai nama grup, bukan otomatis sebagai nama anggota.

## Pemasangan dari versi 0.10.22

1. Cadangkan database dan simpan konfigurasi lingkungan instalasi saat ini.
2. Pastikan migrasi 001 sampai 016 sudah diterapkan. Terapkan migrasi 017 sebelum mengaktifkan aplikasi baru karena query baru membutuhkan kolom tambahan. Migrasi bersifat aditif dan dapat dijalankan ulang.
3. Dari direktori aplikasi yang memuat sumber rilis baru dan memiliki `DATABASE_URL`:

```bash
IDENTITY_ADMIN_CONFIRM=yes node --env-file-if-exists=.env.local scripts/apply-migration.mjs 017-whatsapp-personal-schedule.sql
```

4. Build dan deploy sumber 0.10.23 dengan proses hosting yang biasa digunakan. Restart aplikasi dan worker. Container bawaan menjalankan worker melalui `scripts/start-with-worker.mjs`.
5. Periksa jadwal personal, sinkronkan grup, dan lakukan satu uji pesan baru dari anggota grup. Belum ada perubahan pada server produksi dari pekerjaan ini.

## Validasi

Lihat `HASIL-PENGUJIAN-0.10.23.md`. Pengujian menggunakan data sintetis dan server penerima lokal. Tidak ada pesan yang dikirim ke pelanggan atau grup nyata selama pengujian.

## Dokumentasi resmi yang diperiksa

- Premium: https://docs.starsender.online/docs/webhook/webhook_premium/
- Webhook Group: https://docs.starsender.online/docs/webhook/webhook_group/
- Daftar grup: https://docs.starsender.online/docs/whatsapp-api/list-group-whatsapp/
- Kirim personal: https://docs.starsender.online/docs/message-api/kirim-pesan/

Tanggal pemeriksaan: 30 Oktober 2026. Dokumentasi provider tidak membuktikan status paket atau konfigurasi perangkat pada akun produksi.
