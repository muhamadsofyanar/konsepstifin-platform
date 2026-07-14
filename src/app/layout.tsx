import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Konsep STIFIn — Kenali Potensi Diri',
  description: 'Platform edukasi, layanan tes STIFIn offline, dan pengembangan jaringan promotor Indonesia.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
