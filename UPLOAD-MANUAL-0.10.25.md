# KonsepSTIFIn 0.10.25 — perbaikan deploy

Paket sumber lengkap, berdasarkan ZIP 0.10.24. Bukan image Docker atau hasil build.

## Upload manual ke GitHub dan deploy lewat Coolify

1. Ekstrak ZIP ini ke folder kosong. package.json, Dockerfile, tsconfig.json dan src berada langsung di akar ZIP.
2. Buka repositori muhamadsofyanar/konsepstifin-platform, branch main.
3. Hapus folder lama `src - Salin` dari repositori jika masih ada. Paket ini juga mengecualikannya dari TypeScript dan konteks build Docker.
4. Unggah seluruh isi hasil ekstraksi ke akar repositori, bukan sebagai subfolder. Ganti file lama yang namanya sama. Pastikan .dockerignore dan .gitignore ikut diperbarui; keduanya mungkin tersembunyi pada pengelola file.
5. Commit perubahan. Pastikan package.json dan package-lock.json pada commit terbaru menunjukkan versi 0.10.25.
6. Di Coolify, deploy commit terbaru dari main menggunakan Dockerfile pada akar repositori.
7. Periksa log: versi build harus 0.10.25. Jika masih 0.10.23, commit/sumber yang dipilih belum sesuai.

Jika mengunggah langsung ke folder proyek pada server, salin seluruh isi paket ke akar proyek dan jalankan proses build/deploy yang biasa dipakai. Pertahankan konfigurasi .env dan data storage yang sudah ada. Paket tidak berisi kredensial produksi.

## Perubahan

- learningFailure memeriksa SyntaxError dan LearningError dalam cabang terpisah.
- tsconfig.json mengecualikan src - Salin dari pemeriksaan TypeScript.
- .dockerignore dan .gitignore mengecualikan folder src - Salin.
- Versi package dan lockfile menjadi 0.10.25.
- Pengujian respons error disertakan dalam src/lib/learning-http.test.ts.

Pemeriksaan TypeScript tetap diaktifkan. Tidak ada perubahan skema database atau migrasi tambahan untuk perbaikan ini. Petunjuk migrasi fitur dari versi sebelumnya tetap berlaku bila fitur tersebut belum dipasang.

Lihat HASIL-PENGUJIAN-0.10.25.md untuk hasil verifikasi dan batasannya.
