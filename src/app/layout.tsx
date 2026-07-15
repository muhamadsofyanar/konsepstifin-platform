import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://konsepstifin.com'),
  title: 'Konsep STIFIn — Tes, Promotor, dan Affiliate',
  description: 'Pusat layanan Tes STIFIn offline, program keluarga dan institusi, jalur promotor, serta affiliate Konsep STIFIn Indonesia.',
  openGraph: {
    title: 'Konsep STIFIn — Tes, Promotor, dan Affiliate',
    description: 'Pusat layanan Tes STIFIn offline, edukasi umum, jalur promotor, dan affiliate Konsep STIFIn Indonesia.',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
