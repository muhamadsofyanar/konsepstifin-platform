import Image from 'next/image';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import MobileNavigation, { type MobileNavigationLink } from './mobile-navigation';

type PublicPage = 'home' | 'test' | 'education' | 'promoter' | 'affiliate';

type PublicHref = LinkProps['href'];

const navigation: Array<{ page: PublicPage; href: PublicHref; label: string }> = [
  { page: 'home', href: '/', label: 'Beranda' },
  { page: 'test', href: '/tes-stifin', label: 'Tes STIFIn' },
  { page: 'education', href: '/edukasi', label: 'Edukasi' },
  { page: 'promoter', href: '/jadi-promotor', label: 'Jadi Promotor' },
  { page: 'affiliate', href: '/affiliate', label: 'Affiliate' },
];

export function PublicHeader({
  active,
  announcement,
  ctaHref = '/tes-stifin#layanan',
  ctaLabel = 'Pilih layanan',
}: {
  active: PublicPage;
  announcement: string;
  ctaHref?: PublicHref;
  ctaLabel?: string;
}) {
  const mobileLinks: MobileNavigationLink[] = [
    ...navigation.map((item) => ({ ...item, active: item.page === active })),
  ];

  return <>
    <div className="announcement">{announcement}</div>
    <header className="public-nav journey-nav">
      <Link className="public-brand logo-brand" href="/" aria-label="STIFIn Konsep - kembali ke beranda">
        <Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority />
      </Link>
      <nav aria-label="Navigasi utama">
        {navigation.map((item) => <Link className={item.page === active ? 'active' : ''} href={item.href} key={item.page}>{item.label}</Link>)}
      </nav>
      <div>
        <MobileNavigation links={mobileLinks} ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <Link className="text-button" href="/admin/login">Masuk tim</Link>
        <Link className="public-cta" href={ctaHref}>{ctaLabel}</Link>
      </div>
    </header>
  </>;
}

export function PublicFooter() {
  return <footer className="journey-footer">
    <div className="public-brand logo-brand footer-logo"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} /></div>
    <div className="footer-links">
      <Link href="/">Beranda</Link>
      <Link href="/tes-stifin">Tes STIFIn</Link>
      <Link href="/edukasi">Edukasi</Link>
      <Link href="/jadi-promotor">Promotor</Link>
      <Link href="/affiliate">Affiliate</Link>
    </div>
    <p>Platform edukasi, layanan Tes STIFIn offline, dan pengembangan jaringan promotor Indonesia.</p>
    <small>Informasi di website bersifat edukatif. Harga, fasilitas, komisi, dan persyaratan final mengikuti checkout serta kebijakan resmi yang berlaku. Tes STIFIn bukan diagnosis medis atau psikologis.</small>
  </footer>;
}
