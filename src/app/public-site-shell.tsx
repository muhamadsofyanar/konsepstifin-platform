import './public-refresh.css';
import Image from 'next/image';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import MobileNavigation, { type MobileNavigationLink } from './mobile-navigation';
import PublicAccountLink from './public-account-link';

type PublicPage = 'home' | 'test' | 'location' | 'education' | 'promoter' | 'affiliate' | 'catalog';

type PublicHref = LinkProps['href'];

const navigation: Array<{ page: PublicPage; href: PublicHref; label: string }> = [
  { page: 'catalog', href: '/belajar?tab=catalog', label: 'Kelas & Ebook' },
  { page: 'test', href: '/tes-stifin', label: 'Tes STIFIn' },
  { page: 'location', href: '/wilayah', label: 'Cari Lokasi' },
  { page: 'education', href: '/edukasi', label: 'Edukasi' },
  { page: 'promoter', href: '/jadi-promotor', label: 'Promotor' },
  { page: 'affiliate', href: '/affiliate', label: 'Affiliate' },
];

export function PublicHeader({
  active,
  announcement,
  ctaHref = '/tes-stifin#layanan',
  ctaLabel = 'Pilih layanan tes',
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
    <a className="public-skip-link" href="#main-content">Lewati navigasi</a>
    <div className="announcement">{announcement}</div>
    <header className="public-nav journey-nav">
      <Link className="public-brand logo-brand" href="/" aria-label="STIFIn Konsep - kembali ke beranda">
        <Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority />
      </Link>
      <nav aria-label="Navigasi utama">
        {navigation.map((item) => <Link className={item.page === active ? 'active' : ''} href={item.href} key={item.page} aria-current={item.page === active ? 'page' : undefined}>{item.label}</Link>)}
      </nav>
      <div>
        <MobileNavigation links={mobileLinks} ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <PublicAccountLink />
        <Link className="public-cta" href={ctaHref}>{ctaLabel}</Link>
      </div>
    </header>
  </>;
}

export function PublicFooter() {
  return <footer className="journey-footer">
    <div className="footer-brand-block">
      <Link className="public-brand logo-brand footer-logo" href="/" aria-label="KonsepSTIFIn, kembali ke beranda">
        <Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} />
      </Link>
      <p>Layanan Tes STIFIn, pembelajaran, dan pengembangan mitra dalam satu platform. Mulai dari kebutuhan Anda, lalu ikuti langkah yang sesuai.</p>
    </div>
    <nav className="footer-links" aria-label="Navigasi footer">
      <section aria-labelledby="footer-start-title">
        <h2 id="footer-start-title">Jelajahi</h2>
        <Link href="/tes-stifin">Layanan Tes STIFIn</Link>
        <Link href="/edukasi">Artikel edukasi</Link>
        <Link href="/wilayah">Cari lokasi</Link>
        <Link href="/belajar?tab=catalog">Kelas &amp; ebook</Link>
      </section>
      <section aria-labelledby="footer-grow-title">
        <h2 id="footer-grow-title">Berkembang bersama</h2>
        <Link href="/jadi-promotor">Menjadi promotor</Link>
        <Link href="/promotor">Cari promotor</Link>
        <Link href="/affiliate">Program affiliate</Link>
        <Link href="/akun/mitra">Pusat mitra</Link>
      </section>
      <section aria-labelledby="footer-account-title">
        <h2 id="footer-account-title">Akun &amp; bantuan</h2>
        <Link href="/akun/login">Masuk akun</Link>
        <Link href="/akun/daftar">Daftar akun</Link>
        <Link href="/kontak">Hubungi tim</Link>
        <Link href="/tentang">Tentang kami</Link>
        <Link href="/privasi">Privasi</Link>
        <Link href="/ketentuan">Ketentuan</Link>
      </section>
    </nav>
    <small className="footer-legal">Informasi di website bersifat edukatif. Permintaan layanan dicatat di platform. Harga, promo, cakupan, dan jadwal mengikuti informasi yang berlaku serta dikonfirmasi sebelum pembayaran. Pembayaran dinyatakan lunas setelah verifikasi. Tes STIFIn bukan diagnosis medis atau psikologis.</small>
  </footer>;
}
