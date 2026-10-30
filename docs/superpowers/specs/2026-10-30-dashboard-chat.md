# Chat dashboard dan WhatsApp pusat

Kesepakatan percakapan: admin berkomunikasi dengan member/promotor di dashboard. WhatsApp pelanggan memakai satu nomor pusat; promotor hanya menangani pelanggan yang ditugaskan kepadanya. Bandingan: nomor per promotor memerlukan integrasi per perangkat; chat internal tidak bergantung pada StarSender. Pilihan pengguna: satu nomor pusat.

Implementasi versi pertama: satu percakapan pribadi per akun dengan tim admin, teks maksimal 4000 karakter, riwayat bertahap, indikator belum dibaca, pencarian akun untuk admin dan polling 10 detik saat tab aktif. Member dan promotor dapat memulai pesan. Semua admin aktif dapat melayani percakapan. Akun non-admin hanya membaca dan menulis percakapannya sendiri. Profil kontak menyediakan nama dan nomor WhatsApp yang dinyatakan belum diverifikasi. Tidak mengirim pesan WhatsApp otomatis saat profil/chat disimpan.

Gunakan Next.js/PostgreSQL yang ada. Migrasi 019 eksplisit, idempoten, tanpa dijalankan otomatis saat build atau startup. Pertahankan scope WhatsApp pelanggan; chat internal terpisah dari inbox WhatsApp. Tidak menyediakan lampiran, chat antar-member, atau sinkronisasi chat dashboard ke WhatsApp pada versi ini. Tampilan mengikuti warna dan navigasi portal yang ada dan mendukung layar ponsel. Sumber dasar 0.10.25 mempertahankan perbaikan deploy.
