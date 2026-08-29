# Audit copywriting publik v0.5.1

Audit ini mencakup seluruh template halaman publik, navigasi, dan CTA bersama. Materi `KIRIM AI.zip` hanya dipakai sebagai inspirasi struktur masalah → konteks → tindakan. Tidak ada statistik, manfaat, penghasilan, urgensi, atau klaim lain dari materi tersebut yang diperlakukan sebagai fakta.

| Route | Judul lama | Judul baru | CTA lama | CTA baru | Masalah yang diperbaiki | Status |
|---|---|---|---|---|---|---|
| `/` | Pilih jalur Anda: ikut Tes STIFIn atau pelajari peran promotor. | Ingin menjalani Tes STIFIn, atau sedang mempertimbangkan jalur promotor? | Saya ingin ikut tes | Bandingkan layanan Tes STIFIn | Tujuan pengguna belum dinyatakan sebagai dua funnel terpisah. | Selesai |
| `/tes-stifin` | Ingin memahami hasil tes tanpa berhenti pada sebuah label? | Sebelum memilih paket, pahami dulu proses dan batas penggunaan hasilnya. | Lihat pilihan layanan | Bandingkan layanan tes | Copy berangkat dari manfaat abstrak, belum dari keputusan dan batas penggunaan. | Selesai |
| `/jadi-promotor` | Pahami perannya sebelum Anda berkomitmen pada tahap belajar berikutnya. | Sebelum mendaftar, lihat pekerjaan, tahap belajar, dan komitmen biayanya. | Saya ingin tahu tahapannya | Bandingkan tahap calon promotor | Jalur konsultasi belum cukup tegas dibedakan dari transaksi tes. | Selesai |
| `/affiliate` | Mulai dari berbagi manfaat. Biarkan sistem membantu mencatat hasilnya. | Pahami cara kerja referral, pencatatan transaksi, dan komisi sebelum mendaftar. | Pilih jalur affiliate | Bandingkan program affiliate | Judul metadata mengandung implikasi penghasilan dan hero terlalu abstrak. | Selesai |
| `/edukasi` | Belajar memahami diri, hubungan, dan cara bertumbuh. | Cari bacaan sesuai pertanyaan yang sedang Anda hadapi. | Lihat pilihan layanan | Bandingkan layanan tes | Nilai halaman belum menjelaskan cara memilih bacaan dan batas materi. | Selesai |
| `/edukasi/[slug]` | Judul artikel dinamis | Judul artikel dinamis | Pilih layanan | Bandingkan layanan tes | CTA sidebar terlalu umum dan tidak menyebut tujuan berikutnya. | Selesai |
| `/promotor` | Temukan promotor aktif di wilayah Anda | Cari data promotor aktif tanpa membuka kontak pribadi. | Cari promotor | Tampilkan hasil | Copy dapat dibaca sebagai janji akses langsung, bukan direktori data aman. | Selesai |
| `/promotor/[slug-promotor]` | Nama promotor | Nama promotor | Ajukan koordinasi tes | Ajukan kebutuhan tes | Profil belum cukup menjelaskan fungsi data dan batas jadwal. | Selesai |
| `/wilayah` | Temukan Tes STIFIn di wilayah Anda | Periksa cakupan promotor sebelum mengajukan jadwal tes. | Pilih layanan tes | Bandingkan layanan tes | Cakupan dapat disalahartikan sebagai ketersediaan jadwal. | Selesai |
| `/wilayah/[...segments]` | Tes STIFIn di wilayah | Periksa cakupan Tes STIFIn di wilayah | Mulai dari layanan tes | Bandingkan layanan tes | Template wilayah belum membedakan bukti cakupan dan konfirmasi jadwal. | Selesai |
| `/tes-stifin/[kota]` | Tes STIFIn di kota | Tes STIFIn di kota | Ajukan layanan tes | Ajukan kebutuhan tes | CTA lebih tepat bila menyatakan permintaan, bukan ketersediaan. | Selesai |
| `/promotor-stifin/[kota]` | Promotor STIFIn di kota | Promotor STIFIn di kota | Minta koordinasi promotor | Ajukan kebutuhan kepada promotor | Menjelaskan bahwa tindakan pengguna adalah mengirim kebutuhan tes. | Selesai |
| `/tentang` | Layanan lokal, jaringan nasional, komunikasi yang jelas. | Kami membantu Anda memilih jalur, bukan menggantikan ketentuan jaringan. | Pilih layanan tes | Pilih kebutuhan Anda | Posisi dan batas peran brand belum menjadi pesan utama. | Selesai |
| `/kontak` | Anda ingin ikut tes atau memahami jalur promotor? | Pilih tujuan Anda agar permintaan masuk ke tim dan alur yang tepat. | Pilih kebutuhan | Pilih kebutuhan | Perbedaan hasil akhir masing-masing formulir dipertegas. | Selesai |
| `/privasi` | Data Anda digunakan seperlunya. | Kami hanya meminta data yang diperlukan untuk menindaklanjuti permintaan. | Navigasi default | Bandingkan layanan tes | Jenis data dan tujuan penggunaannya belum cukup konkret. | Selesai |
| `/ketentuan` | Gunakan informasi ini dengan konteks yang tepat. | Ketahui apa yang dikonfirmasi sekarang dan apa yang masih perlu dikonfirmasi. | Navigasi default | Bandingkan layanan tes | Batas antara formulir, jadwal, dan transaksi belum dinyatakan langsung. | Selesai |

## Elemen bersama

- Label navigasi `Promotor` di footer diubah menjadi `Calon Promotor`.
- CTA header default diubah dari `Pilih layanan` menjadi `Bandingkan layanan tes`.
- Footer memisahkan edukasi, layanan tes offline, dan informasi jalur calon promotor.
- Copy lokal tetap memakai `Jadwal berdasarkan konfirmasi` dan tidak mengklaim promotor menerima kunjungan.
- Funnel tes memakai istilah layanan, kebutuhan, pencocokan, dan checkout.
- Funnel calon promotor memakai istilah tahap, konsultasi, komitmen, dan tindak lanjut tanpa checkout tes.
