/** Public services use internal request pages; payment is confirmed by the admin team. */
export const platformLinks = {
  publicWebsite: 'https://konsepstifin.com/',
  affiliateRegistration: '/affiliate#program',
} as const;

export const productLinks = {
  tesPersonal: '/tes-stifin#layanan',
  tesPasangan: '/tes-stifin#layanan',
  paketKeluarga: '/tes-stifin#layanan',
  paketKeluargaPlus: '/tes-stifin#layanan',
  sekolahKomunitas: '/tes-stifin#layanan',
  previewPromotor: '/jadi-promotor#tahapan',
  wsl1: '/jadi-promotor#tahapan',
  wsl2: '/jadi-promotor#tahapan',
  idDanAlat: '/jadi-promotor#tahapan',
  paketPromotor: '/jadi-promotor#tahapan',
  affiliateUmum: '/affiliate#program',
  affiliatePromotor: '/affiliate#program',
} as const;

/** Only implemented public service pages are valid article destinations. */
export function isInternalServiceUrl(value: string) {
  if (!value || value.includes('\\')) return false;
  if (!value.startsWith('/') && !value.startsWith('https://')) return false;
  try {
    const url = new URL(value, 'https://konsepstifin.com');
    return url.origin === 'https://konsepstifin.com' && !url.username && !url.password
      && ['/tes-stifin', '/jadi-promotor', '/affiliate', '/kontak'].includes(url.pathname.replace(/\/$/, ''));
  } catch {
    return false;
  }
}

export type ProductKey = keyof typeof productLinks;

export type PublicProduct = {
  category: string;
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  bonuses: string[];
  linkKey: ProductKey;
  featured?: boolean;
  action: string;
};

export const publicProducts: PublicProduct[] = [
  {
    category: 'PERSONAL',
    title: 'Tes STIFIn Personal',
    description: 'Untuk Anda yang ingin memahami cara alami diri sendiri dan mendapat penjelasan hasil secara langsung.',
    price: 'Rp650.001',
    priceNote: '1 peserta · termasuk sesi penjelasan hasil',
    features: [
      'Pemindaian sidik jari secara offline',
      'Hasil tipe mesin kecerdasan',
      'Penjelasan hasil bersama promotor',
      'Arahan praktis pengembangan diri',
    ],
    bonuses: ['E-book panduan awal mengenal hasil STIFIn', 'Ringkasan arahan praktis setelah tes'],
    linkKey: 'tesPersonal',
    featured: true,
    action: 'Pesan tes personal',
  },
  {
    category: 'PASANGAN',
    title: 'Tes STIFIn Pasangan',
    description: 'Untuk pasangan yang ingin memahami perbedaan cara berpikir, merespons, dan berkomunikasi tanpa saling menyalahkan.',
    price: 'Rp1.100.000',
    priceNote: '2 peserta · lebih hemat dibandingkan tes terpisah',
    features: [
      'Dua kali Tes STIFIn Personal',
      'Penjelasan hasil masing-masing',
      'Pembahasan pola komunikasi pasangan',
      'Arahan praktis untuk diterapkan bersama',
    ],
    bonuses: ['E-book komunikasi pasangan', 'Panduan percakapan untuk memahami perbedaan pasangan'],
    linkKey: 'tesPasangan',
    action: 'Pilih paket pasangan',
  },
  {
    category: 'KELUARGA',
    title: 'Tes STIFIn Keluarga',
    description: 'Untuk pasangan, orang tua, dan anak yang ingin memahami mengapa cara berpikir dan berkomunikasi di rumah bisa berbeda.',
    price: 'Rp1.550.000',
    priceNote: '3 peserta · cocok untuk ayah, ibu, dan anak',
    features: [
      'Seluruh fasilitas tes personal',
      'Jadwal tes keluarga terkoordinasi',
      'Pembahasan pola komunikasi keluarga',
      'Rekomendasi tindak lanjut praktis',
    ],
    bonuses: ['E-book komunikasi keluarga', 'Ringkasan penerapan hasil untuk keluarga'],
    linkKey: 'paketKeluarga',
    action: 'Lihat paket keluarga',
  },
  {
    category: 'KELUARGA PLUS',
    title: 'Tes STIFIn Keluarga Plus',
    description: 'Untuk keluarga yang ingin memetakan kecenderungan alami hingga lima anggota sekaligus dalam satu rangkaian layanan.',
    price: 'Rp2.499.999',
    priceNote: '5 peserta · satu rangkaian layanan keluarga',
    features: [
      'Lima kali Tes STIFIn Personal',
      'Penjelasan hasil setiap anggota',
      'Peta sederhana dinamika keluarga',
      'Sesi pembahasan keluarga terkoordinasi',
    ],
    bonuses: ['E-book komunikasi keluarga', 'Panduan penerapan 30 hari bersama keluarga'],
    linkKey: 'paketKeluargaPlus',
    action: 'Pilih keluarga plus',
  },
  {
    category: 'INSTITUSI',
    title: 'Tes STIFIn Sekolah & Komunitas',
    description: 'Untuk sekolah, lembaga, komunitas, atau tim yang ingin menjalankan tes bersama dengan jadwal dan pendampingan yang terkoordinasi.',
    price: 'Gratis',
    priceNote: 'program sekolah & komunitas · harga dan jadwal dikonfirmasi admin',
    features: [
      'Pelaksanaan tes kelompok terjadwal',
      'Koordinasi promotor dan peserta',
      'Rekap pelaksanaan program',
      'Sesi edukasi sesuai kesepakatan',
    ],
    bonuses: ['Materi pengantar peserta', 'Sesi orientasi koordinator'],
    linkKey: 'sekolahKomunitas',
    action: 'Minta penawaran',
  },
];

export const promoterSteps = [
  {
    number: '01',
    label: 'KENALI PROFESINYA',
    title: 'Preview Promotor',
    price: 'Konfirmasi jadwal',
    priceNote: 'sesi pengenalan gratis atau sesuai agenda aktif',
    description: 'Dengarkan gambaran peran, peluang, tanggung jawab, biaya, dan perjalanan belajar sebelum Anda memutuskan.',
    benefits: ['Gambaran profesi secara utuh', 'Penjelasan tahapan dan kebutuhan biaya', 'Ruang tanya jawab sebelum memutuskan'],
    linkKey: 'previewPromotor' as ProductKey,
    action: 'Ikuti preview',
  },
  {
    number: '02',
    label: 'FONDASI',
    title: 'Workshop STIFIn Level 1 (WSL 1)',
    price: 'Rp749.999',
    priceNote: 'program offline · 1 hari pelatihan',
    description: 'Bangun pemahaman dasar yang diperlukan untuk melanjutkan perjalanan sebagai calon promotor.',
    benefits: ['Fondasi konsep dan cara kerja STIFIn', 'Pengenalan 9 personality genetic dan sirkulasi mesin kecerdasan', 'Materi belajar, ujian, dan sertifikat sesuai ketentuan', 'Persiapan terarah menuju WSL 2'],
    linkKey: 'wsl1' as ProductKey,
    action: 'Lihat jadwal WSL 1',
  },
  {
    number: '03',
    label: 'PENDALAMAN',
    title: 'Workshop STIFIn Level 2 (WSL 2)',
    price: 'Rp4.500.000',
    priceNote: 'program offline · 2–3 hari pelatihan',
    description: 'Perdalam materi dan praktik sesuai tahap yang berlaku sebelum masuk ke proses aktivasi.',
    benefits: ['Pendalaman konsep STIFIn tingkat lanjut', 'Praktik membaca dan membahas hasil tes', 'Ujian kompetensi sesuai ketentuan', 'Persiapan menuju aktivasi promotor'],
    linkKey: 'wsl2' as ProductKey,
    action: 'Lihat jadwal WSL 2',
  },
  {
    number: '04',
    label: 'AKTIVASI',
    title: 'ID Aplikasi & Scanner Promotor',
    price: 'Rp4.499.997',
    priceNote: 'setelah lulus WSL 1 dan WSL 2',
    description: 'Setelah tahapan terpenuhi, lanjutkan proses ID dan alat tes sesuai ketentuan yang berlaku.',
    benefits: ['ID aplikasi promotor sesuai ketentuan', 'Scanner sidik jari untuk menjalankan layanan', 'Pendampingan instalasi dan penggunaan awal', 'Langkah aktivasi menuju promotor aktif'],
    linkKey: 'idDanAlat' as ProductKey,
    action: 'Informasi ID & alat',
  },
  {
    number: '05',
    label: 'PAKET TERPADU',
    title: 'Paket Lengkap Menjadi Promotor STIFIn',
    price: 'Rp8.499.999',
    priceNote: 'paket lengkap · harga dan jadwal dikonfirmasi admin',
    description: 'Pilihan praktis untuk Anda yang sudah mantap menempuh perjalanan lengkap dari fondasi belajar hingga kesiapan aktivasi sebagai promotor.',
    benefits: [
      'Workshop STIFIn Level 1 (WSL 1)',
      'Workshop STIFIn Level 2 (WSL 2)',
      'ID aplikasi promotor sesuai ketentuan',
      'Scanner sidik jari dan pendampingan instalasi awal',
      'Alur belajar lebih terarah dari awal hingga aktivasi',
    ],
    linkKey: 'paketPromotor' as ProductKey,
    action: 'Pilih paket lengkap',
  },
];

export const affiliatePrograms = [
  {
    eyebrow: 'JALUR TERBUKA',
    title: 'Program Affiliate Konsep STIFIn',
    price: 'Gratis',
    priceNote: 'konsultasi awal · ketentuan dikonfirmasi tim',
    description: 'Untuk Anda yang ingin mulai merekomendasikan layanan sambil belajar membangun komunikasi dan jaringan.',
    points: ['Konsultasi cara merekomendasikan layanan', 'Ketentuan kerja sama disepakati bersama tim', 'Informasi materi promosi dari tim', 'Peluang bertumbuh menuju jalur promotor'],
    linkKey: 'affiliateUmum' as ProductKey,
    action: 'Minta informasi affiliate',
  },
  {
    eyebrow: 'KHUSUS JARINGAN',
    title: 'Program Affiliate Promotor STIFIn',
    price: 'Gratis',
    priceNote: 'khusus promotor aktif yang memenuhi syarat',
    description: 'Untuk promotor aktif yang ingin memperluas jangkauan dan merapikan pencatatan transaksi dari jaringannya.',
    points: ['Konsultasi rekomendasi untuk promotor', 'Koordinasi pencatatan dengan admin', 'Materi kampanye dan produk', 'Dukungan aktivitas jaringan'],
    linkKey: 'affiliatePromotor' as ProductKey,
    action: 'Konsultasikan affiliate promotor',
  },
];

export const faqItems = [
  ['Apakah tes dilakukan secara online?', 'Tidak. Proses pemindaian sidik jari dilakukan secara tatap muka oleh promotor. Website digunakan untuk mengirim permintaan layanan dan mengonfirmasi jadwal bersama tim.'],
  ['Apa yang terjadi setelah formulir dikirim?', 'Nomor referensi ditampilkan setelah permintaan tersimpan. Admin menindaklanjuti kebutuhan, harga, jadwal, dan instruksi pembayaran. Pembayaran transfer diverifikasi admin.'],
  ['Apakah saya bisa langsung membeli ID dan alat tes?', 'Tidak langsung. Calon promotor perlu mengikuti tahapan yang berlaku, termasuk WSL 1 dan WSL 2, sebelum proses ID dan alat.'],
  ['Apa perbedaan affiliate dengan promotor?', 'Affiliate membantu merekomendasikan layanan sesuai kesepakatan dengan tim. Promotor aktif menjalankan tes setelah memenuhi tahap dan ketentuan yang berlaku.'],
  ['Apakah hasil tes merupakan diagnosis?', 'Bukan. Layanan ini digunakan untuk edukasi dan pengembangan diri, bukan diagnosis medis atau psikologis.'],
];
