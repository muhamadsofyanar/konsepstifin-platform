# Konsep STIFIn Platform

Platform tes STIFIn dan pengembangan jaringan promotor Indonesia.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Aplikasi berjalan pada `http://localhost:3000`.

## Deployment

Repository ini sudah dilengkapi `Dockerfile` untuk deployment melalui Coolify.
Port aplikasi: `3000`.

Domain staging: `https://tes.konsepstifin.com`.

## Keamanan

Jangan menyimpan password, token, API key, atau data peserta dalam repository.
Gunakan Environment Variables di Coolify untuk seluruh informasi rahasia.
