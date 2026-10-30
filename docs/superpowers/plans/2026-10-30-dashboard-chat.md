# Dashboard Chat Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Kirim/balas pesan admin dan akun non-admin melalui dashboard dan simpan profil kontak.
**Architecture:** Service SQL dengan transaksi; API memakai sesi akun server dan pemeriksaan origin. UI bersama untuk admin/member dengan polling dan riwayat cursor.
**Tech Stack:** Next.js 16.2.10, React 19.2.4, PostgreSQL, Vitest/PGlite.
**Spec:** docs/superpowers/specs/2026-10-30-dashboard-chat.md

## Global Constraints
- Satu nomor WhatsApp pusat, scope pelanggan promotor tetap.
- Pesan maksimal 4000 karakter; polling 10 detik hanya saat tab aktif.
- Migrasi 019 eksplisit dan idempoten.

## Review Focus
- ID akun milik orang lain: akses ditolak di service dan API.
- Akun nonaktif/sesi tidak valid: akses ditolak.
- Pengulangan kirim akibat gangguan jaringan: tidak menduplikasi pesan.
- Pesan datang saat riwayat dibaca: read cursor hanya menandai ID yang ditampilkan.
- Pergantian percakapan saat request masih berlangsung: respons lama tidak masuk percakapan baru.

## Task 1 — Database dan service
- [x] Tulis tes PGlite untuk isolasi, balasan dua arah, validasi, idempotensi, cursor dan baca.
- [x] Jalankan tes sebelum service tersedia dan pastikan gagal.
- [x] Tambah scripts/migrations/019-dashboard-chat.sql dan src/lib/dashboard-chat-service.ts.
- [x] Jalankan tes service sampai lolos.

## Task 2 — API dan antarmuka
- [x] Tambah store adapter dan /api/account/chat serta /api/account/contact.
- [x] Lindungi dengan sesi server, origin, batas ukuran dan rate limit per akun.
- [x] Tambah /akun/pesan dan /admin/pesan dengan UI bersama; tambahkan navigasi.
- [x] Uji API untuk autentikasi, origin dan ID target; uji UI kirim dan error.

## Task 3 — Verifikasi dan rilis
- [x] Typecheck, build produksi, tes terkait fitur dan scope WhatsApp.
- [x] Dokumentasikan batas uji dan cara migrasi 019; naikkan versi 0.10.26.
- [x] Buat ZIP lengkap tanpa dependensi/build, simpan dan berikan tautan.
