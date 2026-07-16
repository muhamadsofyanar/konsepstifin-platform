import { brandOgSize, createBrandOgImage } from '../brand-og-image';

export const alt = 'Tes STIFIn Offline — Personal, Keluarga, dan Institusi';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'TES STIFIn OFFLINE', title: 'Pilih layanan sesuai kebutuhan Anda.', description: 'Personal, keluarga, sekolah, komunitas, dan institusi.', accent: '#0b7655' });
}
