# Audit KonsepSTIFIn 0.10.11

## Perubahan UI
- `src/app/admin/pengaturan/integration-panel.tsx`: status konfigurasi memakai `integration-status` dan baris status berlabel.
- `src/app/admin/crm.css`: gaya pill ringkas terpisah dari gaya alert.
- `src/app/public-refresh.css`: container query dan breakpoint untuk kartu promo agar tidak berdampingan pada kolom sempit.

## Deployment
Log Coolify 2026-10-29 14:04:15 gagal pada pengambilan metadata `node:24-alpine`, karena lookup DNS `registry-1.docker.io` melalui `8.8.8.8` timeout. Build aplikasi belum dimulai pada percobaan tersebut. Retry atau perbaiki DNS host/container builder.
