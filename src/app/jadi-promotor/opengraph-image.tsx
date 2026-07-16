import { brandOgSize, createBrandOgImage } from '../brand-og-image';

export const alt = 'Jalur Promotor STIFIn — Preview, WSL 1, WSL 2, dan Aktivasi';
export const size = brandOgSize;
export const contentType = 'image/png';

export default function Image() {
  return createBrandOgImage({ eyebrow: 'JALUR PROMOTOR', title: 'Bangun profesi melalui proses yang jelas.', description: 'Preview, WSL 1, WSL 2, lalu aktivasi sesuai ketentuan.', accent: '#d09531' });
}
