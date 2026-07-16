import { brandOgSize, createBrandOgImage } from './brand-og-image';

export const alt = 'Konsep STIFIn — Tes, Edukasi, dan Jalur Promotor';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'KONSEP STIFIn', title: 'Kenali diri. Tumbuh lebih terarah.', description: 'Pilih layanan tes, jelajahi edukasi, atau pahami jalur promotor.' });
}
