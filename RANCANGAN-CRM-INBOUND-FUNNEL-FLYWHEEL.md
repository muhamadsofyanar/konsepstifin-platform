# Pengembangan CRM dan Marketing KonsepSTIFIn

Dokumen ini membedakan fitur yang tersedia dalam sumber 0.10.24 dari usulan lanjutan. Belum ada perubahan status lead atau otomasi lintas modul dari dokumen ini.

## Dasar yang sudah tersedia

Sumber memiliki inbox personal, chatbot, drip campaign, persetujuan promosi, broadcast grup, pencatatan sumber UTM/referral, batas respons lead, dan status lead. Rilis 0.10.24 menambah bank konten berkategori, lampiran, pilihan massal, dan dedup nomor dalam satu kampanye Marketing.

Status layanan tes yang sudah tersedia: baru, mencari_promotor, ditawarkan, diklaim, dijadwalkan, selesai, ditutup. Status calon promotor: baru, dihubungi, konsultasi, mengikuti_preview, mengikuti_wsl, aktivasi, selesai, ditutup. Jangan mengganti status ini dengan satu funnel umum tanpa pemetaan karena kedua proses berbeda.

## Prioritas berikutnya, belum diimplementasikan

| Urutan | Pengembangan | Rancangan konkret | Pengukuran |
|---|---|---|---|
| 1 | Kendali jadwal personal | Batalkan, jeda, dan ubah jadwal sebelum worker mengambil pesan; tampilkan rincian penerima dan lampiran | Salah kirim, pembatalan berhasil, antrean terlambat |
| 2 | Segmentasi dan profil kontak | Filter layanan, domisili, status lead, sumber UTM, persetujuan, dan aktivitas terakhir; simpan segmen; tinjau duplikat sebelum menggabungkan | Kontak unik, kelengkapan data, respons per segmen |
| 3 | Tindak lanjut yang terukur | Daftar tugas hari ini/terlambat, pemilik tugas, catatan hasil; hubungkan batas respons yang sudah ada | Median respons pertama, lead lewat SLA, penyelesaian tugas |
| 4 | Funnel layanan dan promotor | Dashboard terpisah memakai status yang ada; catat waktu masuk tiap tahap, alasan ditutup, serta kaitkan booking/pembayaran yang terverifikasi | Konversi antar tahap, waktu per tahap, alasan kehilangan prospek |
| 5 | Atribusi inbound | Hubungkan tautan konten, UTM, formulir, sumber grup dan referral dengan lead; hindari menyimpulkan semua klik menjadi lead | Lead unik per sumber, booking dan pelanggan per sumber |
| 6 | Nurturing berbasis kejadian | Rangkaian edukasi setelah permintaan informasi; berhenti saat pelanggan menjawab, petugas mengambil alih, booking terkonfirmasi, atau STOP | Respons, booking, opt-out, pesan per kontak |
| 7 | Pendampingan setelah layanan | Pesan terima kasih, kesempatan bertanya, survei pengalaman, dan tindak lanjut keluhan | Tingkat respons survei, penyelesaian keluhan, kepuasan |
| 8 | Referral dan reaktivasi | Ajakan rekomendasi setelah layanan selesai, tautan referral individual, dan sapaan kembali untuk kontak berizin | Referral yang menjadi pelanggan, reaktivasi, opt-out |

## Penerapan funnel dan flywheel

Funnel memeriksa perpindahan prospek menuju hasil layanan. Flywheel menambahkan pendampingan dan rekomendasi pelanggan setelah layanan selesai. HubSpot memakai tiga tahap inbound: Attract, Engage, Delight. Kategori Convert, Referral, dan Reaktivasi di bank konten adalah kategori operasional aplikasi, bukan tambahan tahap resmi model HubSpot.

| Fokus | Contoh aktivitas KonsepSTIFIn | Konten bank yang relevan | Ukuran awal |
|---|---|---|---|
| Attract | Artikel, informasi grup yang relevan, materi edukasi yang dapat diminta | Edukasi layanan | Permintaan informasi dan lead unik |
| Engage | Jawab kebutuhan, bantu mencari promotor, tindak lanjuti pertanyaan | Kenali kebutuhan, tindak lanjut, booking | Waktu respons dan booking terkonfirmasi |
| Delight | Bantu memahami penjelasan layanan, tangani pertanyaan setelah layanan | Pendampingan, umpan balik | Respons survei dan penyelesaian keluhan |
| Referral | Pelanggan membagikan tautan resmi kepada pihak yang membutuhkan | Ajakan rekomendasi | Lead dan pelanggan dari referral |

Pelanggan membalas pesan bukan bukti pembayaran atau layanan selesai. Status terkirim berarti provider menerima pengiriman, bukan bukti pesan dibaca. Funnel memerlukan kejadian bisnis yang tercatat dan definisi periode yang konsisten.

Untuk awal, gunakan alur: permintaan informasi dicatat, petugas merespons, kebutuhan dikonfirmasi, jadwal dikonfirmasi, layanan selesai, pelanggan mendapat kesempatan memberi umpan balik, lalu dapat merekomendasikan layanan. Hindari langsung membuat rangkaian otomatis panjang sebelum hasil setiap tahap dapat dicatat.

Sumber kerangka: https://www.hubspot.com/flywheel (diperiksa 30 Oktober 2026). Rekomendasi di atas merupakan rancangan untuk aplikasi ini berdasarkan peninjauan sumber, bukan klaim hasil implementasi atau jaminan peningkatan penjualan.
