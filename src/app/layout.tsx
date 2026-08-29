import type { Metadata } from 'next';
import './globals.css';
import JsonLd from './json-ld';
import MetaPixel from './meta-pixel';

export const metadata: Metadata = {
  metadataBase: new URL('https://konsepstifin.com'),
  title: 'Konsep STIFIn — Tes, Promotor, dan Affiliate dalam Jaringan STIFIn Genetic',
  description: 'Layanan Tes STIFIn offline, daftar promotor, edukasi, dan jalur affiliate Konsep STIFIn dalam jaringan STIFIn Genetic.',
  openGraph: {
    title: 'Konsep STIFIn — Tes dan Promotor dalam Jaringan STIFIn Genetic',
    description: 'Temukan layanan Tes STIFIn offline, promotor berdasarkan wilayah, edukasi, dan jalur affiliate.',
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
      description: 'Brand layanan edukasi dan Tes STIFIn offline dalam ekosistem jaringan STIFIn Genetic.',
      memberOf: { '@type': 'Organization', name: 'STIFIn Genetic' },
      url: 'https://konsepstifin.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://konsepstifin.com/stifin-konsep-wordmark.png',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'layanan pelanggan',
        url: 'https://konsepstifin.com/kontak',
        areaServed: 'ID',
        availableLanguage: 'id-ID',
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
  return <html lang="id"><body><JsonLd data={siteSchema} /><MetaPixel />{children}</body></html>;
}
