import { brandOgSize, createBrandOgImage } from '../brand-og-image';

export const alt = 'Tes STIFIn Offline — Kenali Mesin Kecerdasan Anda';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'TES STIFIn OFFLINE', title: 'Kenali Mesin Kecerdasan Anda.', description: 'Pemindaian sepuluh sidik jari dan pembahasan langsung bersama promotor.', accent: '#0b7655' });
}
