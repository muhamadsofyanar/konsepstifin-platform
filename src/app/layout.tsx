import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Konsep STIFIn — Tes, Promotor, dan Affiliate',
  description: 'Pusat layanan Tes STIFIn offline, program keluarga dan institusi, jalur promotor, serta affiliate Konsep STIFIn Indonesia.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
