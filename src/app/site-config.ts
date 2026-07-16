/**
 * PUSAT PENGATURAN LINK SEJOLI
 *
 * Tempel URL checkout/landing page SEJOLI di antara tanda petik.
 * Selama URL masih kosong, tombol akan membuka formulir minat agar calon
 * pelanggan tidak menemukan tautan rusak.
 */
export const sejoliLinks = {
  tesPersonal: '',
  paketKeluarga: '',
  sekolahKomunitas: '',
  previewPromotor: '',
  wsl1: '',
  wsl2: '',
  idDanAlat: '',
  affiliateUmum: '',
  affiliatePromotor: '',
} as const;

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
    price: 'Rp599.000',
    priceNote: 'per peserta',
    features: [
      'Pemindaian sidik jari secara offline',
      'Hasil tipe mesin kecerdasan',
      'Penjelasan hasil bersama promotor',
      'Arahan praktis pengembangan diri',
    ],
    bonuses: ['E-book panduan membaca hasil', 'Video penjelasan dasar'],
    linkKey: 'tesPersonal',
    featured: true,
    action: 'Pesan tes personal',
  },
  {
    category: 'KELUARGA',
    title: 'Paket Tes Keluarga',
    description: 'Untuk pasangan, orang tua, dan anak yang ingin memahami mengapa cara berpikir dan berkomunikasi di rumah bisa berbeda.',
    price: 'Harga paket',
    priceNote: 'tersedia di checkout',
    features: [
      'Seluruh fasilitas tes personal',
      'Jadwal tes keluarga terkoordinasi',
      'Pembahasan pola komunikasi keluarga',
      'Rekomendasi tindak lanjut praktis',
    ],
    bonuses: ['E-book komunikasi keluarga', 'Ringkasan hasil keluarga'],
    linkKey: 'paketKeluarga',
    action: 'Lihat paket keluarga',
  },
  {
    category: 'INSTITUSI',
    title: 'Sekolah & Komunitas',
    description: 'Untuk sekolah, lembaga, komunitas, atau tim yang ingin menjalankan tes bersama dengan jadwal dan pendampingan yang terkoordinasi.',
    price: 'Penawaran khusus',
    priceNote: 'sesuai jumlah peserta',
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
    description: 'Dengarkan gambaran peran, peluang, tanggung jawab, biaya, dan perjalanan belajar sebelum Anda memutuskan.',
    linkKey: 'previewPromotor' as SejoliLinkKey,
    action: 'Ikuti preview',
  },
  {
    number: '02',
    label: 'FONDASI',
    title: 'WSL 1',
    description: 'Bangun pemahaman dasar yang diperlukan untuk melanjutkan perjalanan sebagai calon promotor.',
    linkKey: 'wsl1' as SejoliLinkKey,
    action: 'Lihat jadwal WSL 1',
  },
  {
    number: '03',
    label: 'PENDALAMAN',
    title: 'WSL 2',
    description: 'Perdalam materi dan praktik sesuai tahapan resmi sebelum masuk ke proses aktivasi.',
    linkKey: 'wsl2' as SejoliLinkKey,
    action: 'Lihat jadwal WSL 2',
  },
  {
    number: '04',
    label: 'AKTIVASI',
    title: 'ID & Alat Tes',
    description: 'Setelah tahapan terpenuhi, lanjutkan proses ID dan alat tes sesuai ketentuan yang berlaku.',
    linkKey: 'idDanAlat' as SejoliLinkKey,
    action: 'Informasi ID & alat',
  },
];

export const affiliatePrograms = [
  {
    eyebrow: 'JALUR TERBUKA',
    title: 'Affiliate Umum',
    description: 'Untuk Anda yang ingin mulai merekomendasikan layanan sambil belajar membangun komunikasi dan jaringan.',
    points: ['Mendapat tautan referral pribadi', 'Komisi berdasarkan transaksi valid', 'Materi promosi siap pakai', 'Peluang bertumbuh menuju jalur promotor'],
    linkKey: 'affiliateUmum' as SejoliLinkKey,
    action: 'Daftar affiliate umum',
  },
  {
    eyebrow: 'KHUSUS JARINGAN',
    title: 'Affiliate Promotor Resmi',
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
