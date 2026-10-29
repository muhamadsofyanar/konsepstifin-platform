# Audit akuisisi klien KonsepSTIFIn 0.10.8

## Tujuan

Membantu promotor mendapatkan calon klien dengan tautan yang lebih relevan, pesan yang siap digunakan, atribusi kampanye yang tetap terbawa, dan akses cepat ke status referral. Halaman publik diarahkan lebih tegas ke layanan Tes STIFIn tanpa menghilangkan jalur kelas, ebook, calon promotor, dan affiliate.

## Perubahan sumber

- `src/app/akun/mitra/growth-center.tsx`: pusat akuisisi dengan tautan layanan, pesan siap salin, tombol WhatsApp, dan ringkasan aktivitas.
- `src/app/akun/mitra/hub.tsx`: tab Dapatkan klien ditambahkan dan menjadi tab awal.
- `src/app/r/[alias]/route.ts`: meneruskan lima parameter UTM yang diizinkan ke tujuan internal.
- `src/lib/referral-service.ts`: allowlist destinasi referral diperluas ke halaman layanan yang diizinkan, dengan perlindungan open redirect.
- `src/app/page.tsx`: hero berorientasi calon klien, CTA ke layanan, dan formulir bantuan memilih layanan.
- `src/app/belajar/learning.css`: layout responsif untuk pusat akuisisi.
- Test ditambahkan untuk tautan kampanye dan preservasi UTM.

## Perilaku yang harus dipertahankan

- Identitas mitra diambil dari cookie referral server-side, bukan dari nilai atribusi yang dikirim browser.
- Parameter UTM hanya digunakan untuk pelaporan kampanye dan tidak menentukan pemilik referral.
- Tujuan redirect dibatasi pada halaman internal yang dikenal.
- Pesan promosi tidak menjanjikan pendapatan, hasil tes, diagnosis, atau manfaat yang tidak dapat dibuktikan.
- Kontak calon klien hanya dibagikan sesuai persetujuan yang diberikan pada formulir.

## Status validasi

- Pemeriksaan manual struktur kode dan konsistensi route telah dilakukan.
- Unit test untuk helper tautan kampanye dan redirect UTM telah ditambahkan.
- Build, typecheck, lint, suite tes penuh, dan pengujian browser belum dapat dinyatakan lulus karena dependensi proyek belum terpasang pada lingkungan kerja ini.
- Tidak ada klaim bahwa konversi bisnis meningkat sebelum data penggunaan nyata dianalisis.
