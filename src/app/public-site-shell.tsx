import Image from 'next/image';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import MobileNavigation, { type MobileNavigationLink } from './mobile-navigation';
import { platformLinks } from './site-config';

type PublicPage = 'home' | 'test' | 'location' | 'education' | 'promoter' | 'affiliate';

type PublicHref = LinkProps['href'];

const navigation: Array<{ page: PublicPage; href: PublicHref; label: string }> = [
  { page: 'home', href: '/', label: 'Beranda' },
  { page: 'test', href: '/tes-stifin', label: 'Tes STIFIn' },
  { page: 'location', href: '/wilayah', label: 'Cari Lokasi' },
  { page: 'education', href: '/edukasi', label: 'Edukasi' },
  { page: 'promoter', href: '/jadi-promotor', label: 'Calon Promotor' },
  { page: 'affiliate', href: '/affiliate', label: 'Affiliate' },
];

export function PublicHeader({
  active,
  announcement,
  ctaHref = '/tes-stifin#layanan',
  ctaLabel = 'Bandingkan layanan tes',
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
        <Link className="text-button" href="/admin/login">Admin</Link>
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
      <Link href="/jadi-promotor">Calon Promotor</Link>
      <Link href="/promotor">Cari Promotor</Link>
      <Link href="/tentang">Tentang</Link>
      <Link href="/kontak">Kontak</Link>
      <Link href="/privasi">Privasi</Link>
      <Link href="/ketentuan">Ketentuan</Link>
      <Link href="/affiliate">Affiliate</Link>
      <a href={platformLinks.affiliateDashboard} target="_blank" rel="noopener noreferrer">Masuk Affiliate ↗</a>
    </div>
    <p>Edukasi, layanan Tes STIFIn offline, dan informasi jalur calon promotor di Indonesia.</p>
    <small>Informasi di website bersifat edukatif. Checkout, akun member, dan affiliate dikelola melalui app.konsepstifin.com. Harga, fasilitas, komisi, dan persyaratan final mengikuti SEJOLI. Tes STIFIn bukan diagnosis medis atau psikologis.</small>
  </footer>;
}
