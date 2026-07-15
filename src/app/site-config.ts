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
    description: 'Untuk individu yang ingin mengenali hasil tes dan mendapatkan penjelasan awal yang mudah diterapkan.',
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
    description: 'Untuk pasangan, orang tua, dan anak yang ingin memiliki bahasa komunikasi yang lebih mudah dipahami bersama.',
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
    description: 'Program terjadwal untuk sekolah, lembaga, komunitas, atau tim dengan kebutuhan dan jumlah peserta khusus.',
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
    description: 'Pahami peran, peluang, tanggung jawab, dan tahapan menjadi Promotor STIFIn sebelum mendaftar.',
    linkKey: 'previewPromotor' as SejoliLinkKey,
    action: 'Ikuti preview',
  },
  {
    number: '02',
    label: 'FONDASI',
    title: 'WSL 1',
    description: 'Ikuti workshop lisensi tahap pertama sebagai fondasi pengetahuan dan proses menuju promotor.',
    linkKey: 'wsl1' as SejoliLinkKey,
    action: 'Lihat jadwal WSL 1',
  },
  {
    number: '03',
    label: 'PENDALAMAN',
    title: 'WSL 2',
    description: 'Lanjutkan pendalaman dan praktik sesuai tahapan resmi yang berlaku sebelum aktivasi.',
    linkKey: 'wsl2' as SejoliLinkKey,
    action: 'Lihat jadwal WSL 2',
  },
  {
    number: '04',
    label: 'AKTIVASI',
    title: 'ID & Alat Tes',
    description: 'Pembelian ID dan alat dilakukan setelah peserta memenuhi tahapan serta ketentuan resmi.',
    linkKey: 'idDanAlat' as SejoliLinkKey,
    action: 'Informasi ID & alat',
  },
];

export const affiliatePrograms = [
  {
    eyebrow: 'JALUR TERBUKA',
    title: 'Affiliate Umum',
    description: 'Cocok untuk masyarakat yang ingin mulai merekomendasikan layanan tanpa harus menjadi promotor resmi terlebih dahulu.',
    points: ['Mendapat tautan referral pribadi', 'Komisi berdasarkan transaksi valid', 'Materi promosi siap pakai', 'Peluang bertumbuh menuju jalur promotor'],
    linkKey: 'affiliateUmum' as SejoliLinkKey,
    action: 'Daftar affiliate umum',
  },
  {
    eyebrow: 'KHUSUS JARINGAN',
    title: 'Affiliate Promotor Resmi',
    description: 'Cocok untuk promotor aktif yang ingin memperluas pemasaran sekaligus menjaga pencatatan penjualan dalam jaringannya.',
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
