# Revisi Konsep STIFIn SEO dan Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menjadikan website Konsep STIFIn jelas posisinya di bawah jaringan STIFIn Genetic dan menyediakan cakupan seluruh wilayah untuk pencarian Tes STIFIn serta direktori promotor.

**Architecture:** Wilayah publik memakai daftar administratif lengkap secara dinamis untuk pencarian Tes dan navigasi ke promotor; daftar promotor hanya menampilkan data yang dikembalikan API atau konfigurasi manual. Konten publik memakai funnel terpisah untuk Tes, Affiliate, dan Promotor; halaman legal dan schema memperkuat kepercayaan. Copy homepage mengikuti prinsip KIRIM AI: headline yang menghentikan perhatian, manfaat konkret, bukti/konteks, paragraf pendek, dan CTA yang jelas.

**Tech Stack:** Next.js App Router, TypeScript, PostgreSQL opsional, API Wilayah.id, API STIFIn server-side.

## Global Constraints

- Semua wilayah administratif boleh dijelajahi untuk kebutuhan Tes; status promotor ditampilkan terpisah dan tidak boleh diada-adakan.
- Jangan menampilkan email, saldo voucher, PassID, atau data internal dari API pusat.
- Pertahankan desain dan sistem artikel yang sudah ada.
- Harga publik harus berasal dari katalog/checkout SEJOLI yang aktif.

### Task 1: Gate SEO Wilayah Berdasarkan Layanan Nyata

**Files:**
- Modify: `src/lib/promoter-store.ts`
- Modify: `src/app/wilayah/page.tsx`
- Modify: `src/app/wilayah/[...segments]/page.tsx`
- Modify: `src/app/sitemap.ts`

- [ ] Tambahkan sumber promotor publik manual melalui `STIFIN_PROMOTERS_JSON` agar sistem dapat berjalan tanpa operasi pusat.
- [ ] Bentuk daftar kode wilayah dari mapping yang tersimpan/terkonfigurasi.
- [ ] Tampilkan dan masukkan sitemap hanya untuk provinsi/kabupaten yang memiliki mapping layanan.
- [ ] Uji TypeScript dan ESLint.

### Task 2: Positioning STIFIn Genetic dan Halaman Kepercayaan

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/tentang/page.tsx`
- Create: `src/app/kontak/page.tsx`
- Create: `src/app/privasi/page.tsx`
- Create: `src/app/ketentuan/page.tsx`
- Modify: `src/app/public-site-shell.tsx`

- [ ] Tegaskan bahwa Konsep STIFIn adalah layanan/brand yang beroperasi dalam jaringan STIFIn Genetic, tanpa mengklaim sebagai pusat.
- [ ] Tambahkan link footer dan internal link ke halaman kepercayaan.
- [ ] Tambahkan metadata canonical dan schema organisasi/contact point.

### Task 3: Copy dan Funnel Berbasis KIRIM AI

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/tes-stifin/page.tsx`
- Modify: `src/app/affiliate/page.tsx`
- Modify: `src/app/jadi-promotor/page.tsx`

- [ ] Ubah headline menjadi problem → curiosity → outcome yang spesifik.
- [ ] Pastikan setiap funnel memiliki satu CTA utama dan CTA sekunder yang tidak bercampur.
- [ ] Gunakan feature → manfaat → konteks nyata pada kartu layanan.
- [ ] Pertahankan paragraf pendek, bullet list, dan visual yang sudah ada.

### Task 4: Audit Harga, Schema, Sitemap, dan Verifikasi

**Files:**
- Modify: `src/app/site-config.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `README.md`

- [ ] Tandai harga yang belum tervalidasi dari checkout sebagai perlu konfirmasi, bukan angka final.
- [ ] Perbarui schema Service/Organization dan breadcrumb untuk halaman legal/wilayah nyata.
- [ ] Jalankan `tsc --noEmit`, ESLint, dan build; catat error runtime lingkungan bila build tidak dapat berjalan.
