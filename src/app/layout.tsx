import type { Metadata } from 'next';
import './globals.css';
import JsonLd from './json-ld';
import MetaPixel from './meta-pixel';
import { Suspense } from 'react';
import NavigationProgress from './navigation-progress';

export const metadata: Metadata = {
  metadataBase: new URL('https://konsepstifin.com'),
  title: 'KonsepSTIFIn | Tes, Kelas, Ebook & Affiliate',
  description: 'Temukan layanan Tes STIFIn offline, kelas, ebook, serta jalur promotor dan affiliate melalui satu platform KonsepSTIFIn.',
  openGraph: {
    title: 'KonsepSTIFIn | Layanan, Pembelajaran & Mitra',
    description: 'Layanan tes, kelas dan ebook, serta aktivitas promotor dan affiliate dalam satu platform.',
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
      parentOrganization: { '@type': 'Organization', name: 'STIFIn Genetic' },
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
  return <html lang="id"><body><JsonLd data={siteSchema} /><MetaPixel /><Suspense fallback={null}><NavigationProgress/></Suspense>{children}</body></html>;
}
