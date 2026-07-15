export type ArticleTone = 'forest' | 'leaf' | 'sand' | 'mint' | 'charcoal';

export type ArticleBlock = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  publishedLabel: string;
  readTime: string;
  tone: ArticleTone;
  featured?: boolean;
  blocks: ArticleBlock[];
  takeaway: string;
};

export const articles: Article[] = [
  {
    slug: 'alur-tes-stifin-offline',
    category: 'Dasar STIFIn',
    title: 'Tes STIFIn Dilakukan Offline: Ini Alur yang Perlu Diketahui',
    excerpt: 'Mulai dari memilih layanan, penjadwalan, pemindaian sidik jari, hingga pembahasan hasil bersama promotor.',
    publishedAt: '2026-07-15',
    publishedLabel: '15 Juli 2026',
    readTime: '5 menit baca',
    tone: 'forest',
    featured: true,
    blocks: [
      {
        heading: 'Mengapa prosesnya dilakukan secara tatap muka?',
        paragraphs: [
          'Website digunakan untuk membantu peserta memilih layanan dan menyampaikan kebutuhan awal. Pelaksanaan tes tetap dilakukan secara langsung karena proses pemindaian memerlukan perangkat yang digunakan oleh promotor.',
          'Pertemuan langsung juga memberi ruang bagi peserta untuk mengonfirmasi data, memahami urutan proses, dan mengajukan pertanyaan ketika hasil dibahas.',
        ],
      },
      {
        heading: 'Empat tahap yang akan dilalui peserta',
        paragraphs: ['Secara umum, perjalanan peserta berlangsung melalui tahapan berikut.'],
        bullets: [
          'Memilih layanan yang sesuai untuk personal, keluarga, atau kelompok.',
          'Mengonfirmasi kota, promotor, serta jadwal yang tersedia.',
          'Mengikuti pemindaian sidik jari secara offline.',
          'Menerima hasil dan pembahasan sesuai fasilitas pada paket yang dipilih.',
        ],
      },
      {
        heading: 'Hal yang sebaiknya disiapkan',
        paragraphs: [
          'Sebelum sesi, tentukan tujuan utama Anda mengikuti tes dan siapkan waktu yang cukup agar proses tidak terburu-buru. Catat pertanyaan yang ingin dibahas bersama promotor, terutama yang berkaitan dengan kebiasaan belajar, komunikasi, atau pengembangan diri.',
          'Hasil sebaiknya digunakan sebagai bahan refleksi dan percakapan. Tes STIFIn bukan layanan diagnosis medis atau psikologis dan tidak menggantikan pemeriksaan oleh tenaga profesional.',
        ],
      },
    ],
    takeaway: 'Pilih layanan melalui website, konfirmasikan jadwal, lalu ikuti proses tes dan pembahasan secara langsung bersama promotor.',
  },
  {
    slug: 'mendengar-sebelum-menilai-dalam-keluarga',
    category: 'Keluarga',
    title: 'Komunikasi Keluarga: Mulai dari Mendengar Sebelum Menilai',
    excerpt: 'Percakapan yang sehat tidak selalu dimulai dari jawaban yang tepat, tetapi dari kesediaan memahami kebutuhan orang lain.',
    publishedAt: '2026-07-12',
    publishedLabel: '12 Juli 2026',
    readTime: '6 menit baca',
    tone: 'mint',
    blocks: [
      {
        heading: 'Mengapa percakapan mudah berubah menjadi konflik?',
        paragraphs: [
          'Anggota keluarga dapat melihat kejadian yang sama dari sudut pandang berbeda. Masalah sering membesar ketika seseorang merasa belum selesai menjelaskan, tetapi sudah menerima penilaian, nasihat, atau perbandingan.',
          'Tujuan mendengar bukan berarti selalu setuju. Mendengar membantu kita memahami apa yang sebenarnya sedang dirasakan dan dibutuhkan sebelum menentukan respons.',
        ],
      },
      {
        heading: 'Empat kebiasaan sederhana yang bisa dilatih',
        paragraphs: ['Perubahan kecil yang dilakukan secara konsisten sering lebih berguna daripada aturan komunikasi yang terlalu rumit.'],
        bullets: [
          'Berikan waktu bicara tanpa memotong kalimat.',
          'Ulangi inti pesan dengan kata-kata sendiri untuk memastikan pemahaman.',
          'Gunakan kalimat “saya merasa” dan “saya membutuhkan” daripada menyalahkan.',
          'Tunda pembahasan ketika emosi terlalu tinggi dan sepakati waktu untuk melanjutkan.',
        ],
      },
      {
        heading: 'Gunakan alat pengenalan diri secara bijak',
        paragraphs: [
          'Alat pengenalan diri dapat membantu membuka percakapan, tetapi jangan menjadikannya label yang membatasi seseorang. Perilaku tetap dipengaruhi pengalaman, situasi, relasi, dan proses belajar.',
          'Apabila konflik berlangsung lama, melibatkan kekerasan, atau mengganggu kesehatan mental anggota keluarga, pertimbangkan bantuan dari tenaga profesional yang sesuai.',
        ],
      },
    ],
    takeaway: 'Dengarkan sampai selesai, pastikan pemahaman, lalu respons kebutuhan yang nyata tanpa memberi label pada anggota keluarga.',
  },
  {
    slug: 'memilih-program-pengembangan-diri',
    category: 'Pengembangan Diri',
    title: 'Memilih Program Pengembangan Diri yang Bertanggung Jawab',
    excerpt: 'Gunakan tujuan yang jelas, periksa klaim, pahami privasi data, dan pastikan ada langkah yang dapat diterapkan setelah program.',
    publishedAt: '2026-07-09',
    publishedLabel: '9 Juli 2026',
    readTime: '7 menit baca',
    tone: 'sand',
    blocks: [
      {
        heading: 'Mulai dari kebutuhan, bukan tren',
        paragraphs: [
          'Program yang ramai dibicarakan belum tentu menjadi pilihan terbaik untuk setiap orang. Tentukan terlebih dahulu persoalan atau kemampuan yang ingin dikembangkan, misalnya komunikasi, kebiasaan belajar, kepemimpinan, atau kerja sama.',
          'Tujuan yang jelas memudahkan Anda menilai apakah materi, metode, dan fasilitator program memang sesuai dengan kebutuhan tersebut.',
        ],
      },
      {
        heading: 'Gunakan daftar periksa sebelum mendaftar',
        paragraphs: ['Beberapa pertanyaan berikut dapat membantu Anda membuat keputusan yang lebih tenang.'],
        bullets: [
          'Apakah manfaat program dijelaskan secara realistis tanpa menjanjikan hasil mutlak?',
          'Apakah fasilitator, tahapan, biaya, dan fasilitas diterangkan sejak awal?',
          'Bagaimana data pribadi peserta dikumpulkan, digunakan, dan disimpan?',
          'Apakah peserta memiliki ruang untuk bertanya dan menyampaikan keberatan?',
          'Adakah langkah praktis yang dapat dilakukan setelah program selesai?',
        ],
      },
      {
        heading: 'Waspadai janji yang terlalu pasti',
        paragraphs: [
          'Berhati-hatilah terhadap program yang menjanjikan perubahan instan, mengklaim dapat menjawab seluruh persoalan hidup, atau mendorong peserta mengambil keputusan besar hanya berdasarkan satu hasil pengukuran.',
          'Program pengembangan diri sebaiknya memperluas pilihan dan kesadaran, bukan menghilangkan kebebasan seseorang untuk berpikir kritis.',
        ],
      },
    ],
    takeaway: 'Program yang baik menjelaskan manfaat dan batasannya, menghormati privasi, serta membantu peserta menyusun langkah yang realistis.',
  },
  {
    slug: 'mendampingi-anak-belajar-tanpa-label',
    category: 'Belajar & Anak',
    title: 'Mendampingi Anak Belajar Tanpa Memberi Label',
    excerpt: 'Kenali pola belajar sebagai titik awal observasi, bukan sebagai batas kemampuan anak untuk tumbuh dan mencoba hal baru.',
    publishedAt: '2026-07-06',
    publishedLabel: '6 Juli 2026',
    readTime: '6 menit baca',
    tone: 'leaf',
    blocks: [
      {
        heading: 'Anak berkembang melalui proses',
        paragraphs: [
          'Cara anak belajar dapat berubah sesuai usia, pengalaman, lingkungan, materi, kondisi fisik, dan dukungan yang tersedia. Karena itu, satu pengamatan atau hasil tes tidak seharusnya digunakan untuk membatasi pilihan belajar anak.',
          'Orang tua dapat menggunakan informasi tentang kecenderungan belajar untuk mencoba pendekatan, lalu melihat respons anak secara nyata.',
        ],
      },
      {
        heading: 'Coba, amati, dan sesuaikan',
        paragraphs: ['Pendampingan belajar dapat dimulai melalui siklus sederhana berikut.'],
        bullets: [
          'Pilih satu strategi belajar yang sesuai dengan tugas saat ini.',
          'Amati fokus, pemahaman, dan kenyamanan anak selama proses.',
          'Tanyakan bagian yang terasa membantu atau justru menyulitkan.',
          'Sesuaikan durasi, media, suasana, atau cara menjelaskan.',
        ],
      },
      {
        heading: 'Ganti label dengan bahasa pertumbuhan',
        paragraphs: [
          'Daripada mengatakan “kamu memang tidak bisa”, gunakan kalimat yang lebih terbuka seperti “cara ini belum cocok, mari mencoba cara lain”. Bahasa tersebut membantu anak melihat kesulitan sebagai bagian dari proses belajar.',
          'Jika anak mengalami kesulitan belajar yang menetap dan mengganggu aktivitas sehari-hari, konsultasikan dengan guru atau tenaga profesional yang kompeten.',
        ],
      },
    ],
    takeaway: 'Gunakan informasi sebagai hipotesis yang perlu diamati, bukan label tetap yang menentukan kemampuan dan masa depan anak.',
  },
  {
    slug: 'kolaborasi-tim-dari-perbedaan-cara-kerja',
    category: 'Tim & Organisasi',
    title: 'Membangun Kolaborasi Tim dari Perbedaan Cara Kerja',
    excerpt: 'Perbedaan tidak harus diseragamkan. Tim membutuhkan aturan kerja yang membuat kekuatan setiap anggota dapat saling melengkapi.',
    publishedAt: '2026-07-03',
    publishedLabel: '3 Juli 2026',
    readTime: '6 menit baca',
    tone: 'charcoal',
    blocks: [
      {
        heading: 'Masalahnya sering ada pada aturan kerja yang tidak terlihat',
        paragraphs: [
          'Sebagian orang membutuhkan konteks sebelum mulai bekerja, sedangkan yang lain lebih nyaman memulai dari tindakan. Ada anggota tim yang memproses ide melalui diskusi, tetapi ada pula yang membutuhkan waktu berpikir sendiri.',
          'Tanpa aturan yang disepakati, perbedaan tersebut mudah dianggap sebagai kurang cepat, kurang terbuka, atau tidak kooperatif.',
        ],
      },
      {
        heading: 'Buat kesepakatan kerja yang konkret',
        paragraphs: ['Kesepakatan berikut dapat mengurangi salah paham dan pekerjaan berulang.'],
        bullets: [
          'Jelaskan hasil akhir, penanggung jawab, dan tenggat setiap tugas.',
          'Tentukan kanal komunikasi untuk hal mendesak dan hal yang dapat menunggu.',
          'Berikan agenda sebelum rapat agar setiap orang dapat mempersiapkan diri.',
          'Tutup rapat dengan keputusan tertulis dan langkah berikutnya.',
        ],
      },
      {
        heading: 'Pemetaan bukan pengganti percakapan',
        paragraphs: [
          'Profil atau alat pemetaan dapat menjadi bahan awal untuk memahami anggota tim. Namun, pembagian peran tetap perlu mempertimbangkan kompetensi, pengalaman, minat, beban kerja, dan tujuan organisasi.',
          'Evaluasi kesepakatan secara berkala. Tim yang sehat memberi ruang bagi setiap anggota untuk belajar dan mengembangkan cara kerja baru.',
        ],
      },
    ],
    takeaway: 'Kolaborasi tumbuh ketika perbedaan diterjemahkan menjadi kesepakatan kerja, tanggung jawab, dan komunikasi yang jelas.',
  },
];

export const getArticleBySlug = (slug: string) => articles.find((article) => article.slug === slug);

