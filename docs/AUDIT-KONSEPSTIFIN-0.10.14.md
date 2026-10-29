# Audit KonsepSTIFIn 0.10.14

## Temuan

Log Coolify 0.10.13 menunjukkan kompilasi Next.js berhasil, kemudian TypeScript gagal di `src/app/belajar/portal.tsx:68` karena ekspresi `p.moota_invoice_error && <p ...>` bertipe `unknown` tidak dapat digunakan sebagai `ReactNode`.

## Perbaikan

- Kondisi render menggunakan `Boolean(p.moota_invoice_error)` eksplisit.
- Versi `package.json`, `package-lock.json`, dan label versi admin diperbarui menjadi `0.10.14`.
- Tidak ada perubahan pada logika pembayaran, webhook, antrean StarSender, atau konfigurasi Mailketing dalam patch build fix ini.

## Batas verifikasi

Perbaikan sesuai langsung dengan error yang terlihat pada log. Build produksi, typecheck penuh, dan tes API live belum dinyatakan lulus karena instalasi dependensi lokal mengalami timeout.
