import { brandOgSize, createBrandOgImage } from '../brand-og-image';

export const alt = 'Jalur Promotor STIFIn — Preview, WSL 1, WSL 2, dan Aktivasi';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'JALUR PROMOTOR', title: 'Dari manfaat pribadi menjadi jalan profesi.', description: 'Kenali perannya, ikuti Preview dan WSL, lalu aktivasi sesuai ketentuan.', accent: '#d09531' });
}
