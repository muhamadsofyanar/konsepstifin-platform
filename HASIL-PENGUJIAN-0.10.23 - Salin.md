# Hasil pengujian KonsepSTIFIn 0.10.23

Tanggal: 30 Oktober 2026. Sumber pembanding: ZIP proyek 0.10.22.

## Pemeriksaan yang lolos

- Pengujian StarSender personal dan grup, formulir penjadwalan, serta integrasi database dan worker: 4 berkas, 10 pengujian lolos.
- Pengujian antarmuka pesanan: 3 pengujian lolos. Fixture lama memakai properti `bank` yang sudah tidak didukung komponen. Fixture diperbarui untuk memeriksa tautan pembayaran Moota yang dipakai aplikasi saat ini. Tidak ada perubahan fitur pembayaran.
- `npm run typecheck`: lolos.
- `npm run build`: lolos, termasuk kompilasi, TypeScript, dan generasi halaman.
- ESLint terhadap seluruh berkas kode yang berubah pada pembaruan ini: lolos.

## Perilaku yang diuji

1. Jadwal 09.30 WIB disimpan sebagai 02.30 UTC dan tidak dikirim sebelum waktunya.
2. Satu penerima mendapatkan pesan dengan personalisasi nama.
3. Worker mengirim mode `consented_outbound` tanpa pesan masuk sebelumnya.
4. Mode `inbound_first` tetap menunggu pesan pelanggan.
5. STOP dan pencabutan persetujuan mencegah pengiriman.
6. Jadwal tidak valid dan jadwal lampau ditolak.
7. Webhook Premium utama menyimpan pesan grup dan mengabaikan event duplikat.
8. Event tanpa nama tidak menimpa nama grup yang sudah tersimpan.
9. Nama tampilan lokal muncul pada percakapan dan filter grup memilih pesan yang sesuai.
10. Migrasi 017 dapat dijalankan kembali tanpa kegagalan.

## Batas validasi

Pengujian menggunakan PostgreSQL kompatibel PGlite, payload sintetis, dan server penerima lokal. Tidak ada pesan dikirim ke pelanggan atau grup nyata. Paket dan pengaturan webhook akun produksi belum diverifikasi. Riwayat lama WhatsApp tidak diimpor.

Lint seluruh repositori masih melaporkan 3 error lama pada `whatsapp-workspace.tsx` (2 aturan effect React) dan `moota-store.ts` (1 tipe any), serta 5 warning. Ketiga error tersebut juga ada pada sumber 0.10.22 dan berada di luar perubahan rilis ini. Build produksi berhasil. Pengujian seluruh repositori di luar cakupan pembaruan belum dijalankan.

Belum ada deploy, migrasi, atau perubahan pada database produksi.
