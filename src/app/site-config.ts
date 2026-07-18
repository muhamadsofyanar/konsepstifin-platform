/**
 * PEMBAGIAN PLATFORM
 *
 * konsepstifin.com     = website publik, edukasi, SEO, dan landing page.
 * app.konsepstifin.com = checkout SEJOLI, member area, dan affiliate.
 *
 * Semua URL transaksi disimpan di file ini agar tidak tersebar di komponen.
 * Selama URL produk masih kosong, tombol akan membuka formulir minat agar
 * calon pelanggan tidak menemukan tautan rusak.
 */
export const platformLinks = {
  publicWebsite: 'https://konsepstifin.com/',
  sejoliApp: 'https://app.konsepstifin.com/',
  affiliateRegistration: 'https://app.konsepstifin.com/product/program-affiliate-konsep-stifin/',
  affiliateDashboard: 'https://app.konsepstifin.com/member-area/home/lead-affiliasi/',
  memberArea: 'https://app.konsepstifin.com/member-area/',
} as const;

export const sejoliLinks = {
  tesPersonal: 'https://app.konsepstifin.com/product/tes-stifin-personal/',
  tesPasangan: 'https://app.konsepstifin.com/product/tes-stifin-pasangan/',
  paketKeluarga: 'https://app.konsepstifin.com/product/tes-stifin-keluarga/',
  paketKeluargaPlus: 'https://app.konsepstifin.com/product/tes-stifin-keluarga-plus/',
  sekolahKomunitas: 'https://app.konsepstifin.com/product/tes-stifin-sekolah-komunitas/',
  previewPromotor: '',
  wsl1: 'https://app.konsepstifin.com/product/workshop-stifin-level-1-wsl-1/',
  wsl2: 'https://app.konsepstifin.com/product/workshop-stifin-level-2-wsl-2/',
  idDanAlat: 'https://app.konsepstifin.com/product/id-aplikasi-scanner-promotor/',
  paketPromotor: 'https://app.konsepstifin.com/product/paket-lengkap-menjadi-promotor-stifin/',
  affiliateUmum: 'https://app.konsepstifin.com/product/program-affiliate-konsep-stifin/',
  affiliatePromotor: 'https://app.konsepstifin.com/product/program-affiliate-konsep-stifin/',
} as const;

export function isOfficialSejoliUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'app.konsepstifin.com';
  } catch {
    return false;
  }
}

export type SejoliLinkKey = keyof typeof sejoliLinks;

export type PublicProduct = {
  category: string;
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  bonuses: string[];
  linkKey: SejoliLinkKey;
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
    priceNote: 'program sekolah & komunitas · ketentuan mengikuti checkout SEJOLI',
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
    linkKey: 'previewPromotor' as SejoliLinkKey,
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
    linkKey: 'wsl1' as SejoliLinkKey,
    action: 'Lihat jadwal WSL 1',
  },
  {
    number: '03',
    label: 'PENDALAMAN',
    title: 'Workshop STIFIn Level 2 (WSL 2)',
    price: 'Rp4.500.000',
    priceNote: 'program offline · 2–3 hari pelatihan',
    description: 'Perdalam materi dan praktik sesuai tahapan resmi sebelum masuk ke proses aktivasi.',
    benefits: ['Pendalaman konsep STIFIn tingkat lanjut', 'Praktik membaca dan membahas hasil tes', 'Ujian kompetensi sesuai ketentuan', 'Persiapan menuju aktivasi promotor'],
    linkKey: 'wsl2' as SejoliLinkKey,
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
    linkKey: 'idDanAlat' as SejoliLinkKey,
    action: 'Informasi ID & alat',
  },
  {
    number: '05',
    label: 'PAKET PALING HEMAT',
    title: 'Paket Lengkap Menjadi Promotor STIFIn',
    price: 'Rp8.499.999',
    priceNote: 'paket lengkap · ketentuan mengikuti checkout SEJOLI',
    description: 'Pilihan praktis untuk Anda yang sudah mantap menempuh perjalanan lengkap dari fondasi belajar hingga kesiapan aktivasi sebagai promotor.',
    benefits: [
      'Workshop STIFIn Level 1 (WSL 1)',
      'Workshop STIFIn Level 2 (WSL 2)',
      'ID aplikasi promotor sesuai ketentuan',
      'Scanner sidik jari dan pendampingan instalasi awal',
      'Alur belajar lebih terarah dari awal hingga aktivasi',
    ],
    linkKey: 'paketPromotor' as SejoliLinkKey,
    action: 'Pilih paket lengkap',
  },
];

export const affiliatePrograms = [
  {
    eyebrow: 'JALUR TERBUKA',
    title: 'Program Affiliate Konsep STIFIn',
    price: 'Gratis',
    priceNote: 'pendaftaran awal · komisi diatur di SEJOLI',
    description: 'Untuk Anda yang ingin mulai merekomendasikan layanan sambil belajar membangun komunikasi dan jaringan.',
    points: ['Mendapat tautan referral pribadi', 'Komisi berdasarkan transaksi valid', 'Materi promosi siap pakai', 'Peluang bertumbuh menuju jalur promotor'],
    linkKey: 'affiliateUmum' as SejoliLinkKey,
    action: 'Daftar affiliate umum',
  },
  {
    eyebrow: 'KHUSUS JARINGAN',
    title: 'Program Affiliate Promotor STIFIn',
    price: 'Gratis',
    priceNote: 'khusus promotor aktif yang memenuhi syarat',
    description: 'Untuk promotor aktif yang ingin memperluas jangkauan dan merapikan pencatatan transaksi dari jaringannya.',
    points: ['Tautan referral khusus promotor', 'Pelacakan transaksi lebih rapi', 'Materi kampanye dan produk', 'Dukungan aktivitas jaringan'],
    linkKey: 'affiliatePromotor' as SejoliLinkKey,
    action: 'Aktifkan affiliate promotor',
  },
];

export const faqItems = [
  ['Apakah tes dilakukan secara online?', 'Tidak. Proses pemindaian sidik jari dilakukan secara tatap muka oleh promotor. Website digunakan untuk memilih layanan, pembayaran, dan pengaturan jadwal.'],
  ['Apa yang terjadi setelah pembayaran?', 'Tim menghubungi peserta melalui WhatsApp untuk mencocokkan kota, promotor, dan waktu pelaksanaan tes.'],
  ['Apakah saya bisa langsung membeli ID dan alat tes?', 'Tidak langsung. Calon promotor perlu mengikuti tahapan yang berlaku, termasuk WSL 1 dan WSL 2, sebelum proses ID dan alat.'],
  ['Apa perbedaan affiliate dengan promotor?', 'Affiliate membantu merekomendasikan layanan melalui tautan referral. Promotor resmi menjalankan tes dan harus memenuhi tahapan serta ketentuan resmi.'],
  ['Apakah hasil tes merupakan diagnosis?', 'Bukan. Layanan ini digunakan untuk edukasi dan pengembangan diri, bukan diagnosis medis atau psikologis.'],
];
