# Audit KonsepSTIFIn 0.10.11

## Perubahan
- Menambahkan webhook inbound StarSender yang memvalidasi secret URL, mengabaikan pesan grup/keluar, menormalkan nomor, dan mencegah event duplikat.
- Menambahkan tabel sesi inbound dan event webhook melalui migrasi 013.
- Worker notifikasi memeriksa sesi pelanggan 24 jam terakhir dan opt-out sebelum mengirim.
- Pesan menunggu dalam status `awaiting_inbound` sampai pelanggan memulai chat.
- Kampanye memeriksa ulang persetujuan marketing saat pengiriman.
- Admin dapat membuat secret webhook StarSender dan menyalin URL webhook tanpa menyimpan secret ke environment Coolify.
- Perubahan mempertahankan konfigurasi promo pusat, lead acquisition, dan Moota dari 0.10.9.

## Batasan pengujian
- `npm ci` tidak selesai dalam batas waktu yang tersedia. Karena itu, build Next.js, TypeScript, lint, dan test suite tidak dapat dinyatakan lulus.
- Route webhook memerlukan migrasi 013 dan URL `PLATFORM_ORIGIN` HTTPS yang benar.
- StarSender dapat mengubah bentuk payload; uji webhook real di staging wajib dilakukan.
- Inbound-first bukan jaminan anti-ban. StarSender sendiri menyebut penggunaan yang tidak wajar berisiko menyebabkan pemblokiran; pertimbangkan WhatsApp Business Platform resmi.
