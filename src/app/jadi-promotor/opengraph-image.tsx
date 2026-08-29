import { brandOgSize, createBrandOgImage } from '../brand-og-image';

export const alt = 'Jalur Promotor STIFIn — Preview, WSL 1, WSL 2, dan Aktivasi';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'JALUR CALON PROMOTOR', title: 'Pahami peran, tahap belajar, dan biayanya.', description: 'Bandingkan Preview, WSL, serta aktivasi ID dan alat sebelum berkomitmen.', accent: '#d09531' });
}
