import type { Metadata } from 'next';
import './globals.css';
import JsonLd from './json-ld';

export const metadata: Metadata = {
  metadataBase: new URL('https://konsepstifin.com'),
  title: 'Konsep STIFIn — Tes, Promotor, dan Affiliate',
  description: 'Pusat layanan Tes STIFIn offline, program keluarga dan institusi, jalur promotor, serta affiliate Konsep STIFIn Indonesia.',
  openGraph: {
    title: 'Konsep STIFIn — Tes, Promotor, dan Affiliate',
    description: 'Pusat layanan Tes STIFIn offline, edukasi umum, jalur promotor, dan affiliate Konsep STIFIn Indonesia.',
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Konsep STIFIn',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

const siteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://konsepstifin.com/#organization',
      name: 'Konsep STIFIn',
      url: 'https://konsepstifin.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://konsepstifin.com/stifin-konsep-wordmark.png',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://konsepstifin.com/#website',
      url: 'https://konsepstifin.com/',
      name: 'Konsep STIFIn',
      inLanguage: 'id-ID',
      publisher: { '@id': 'https://konsepstifin.com/#organization' },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><JsonLd data={siteSchema} />{children}</body></html>;
}
