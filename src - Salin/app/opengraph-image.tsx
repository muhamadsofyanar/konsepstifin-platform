import { brandOgSize, createBrandOgImage } from './brand-og-image';

export const alt = 'Konsep STIFIn — Kenali Cara Alami Anda Berpikir dan Bertumbuh';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'KONSEP STIFIn', title: 'Kenali cara alami Anda.', description: 'Mulai dari tes, belajar menerapkan hasil, lalu tumbuh lebih terarah.' });
}
