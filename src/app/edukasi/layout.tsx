import Image from 'next/image';
import Link from 'next/link';
import MobileNavigation from '../mobile-navigation';

export default function EducationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-site education-site">
    <div className="announcement">Edukasi untuk pengembangan diri, keluarga, belajar, dan kolaborasi</div>
    <header className="public-nav education-nav">
      <Link className="public-brand logo-brand" href="/" aria-label="STIFIn Konsep - kembali ke beranda">
        <Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority />
      </Link>
      <nav><Link href="/#manfaat">Manfaat</Link><Link href="/#produk">Produk</Link><Link href="/#proses">Cara Tes</Link><Link href="/#promotor">Jadi Promotor</Link><Link className="active" href="/edukasi">Edukasi</Link></nav>
      <div><MobileNavigation links={[{ href: '/', label: 'Beranda' }, { href: '/#manfaat', label: 'Manfaat' }, { href: '/#produk', label: 'Produk' }, { href: '/#proses', label: 'Cara Tes' }, { href: '/#promotor', label: 'Jadi Promotor' }, { href: '/edukasi', label: 'Edukasi', active: true }]} /><Link className="text-button" href="/">Beranda</Link><Link className="public-cta" href="/#produk">Pilih layanan</Link></div>
    </header>
    {children}
    <footer><div className="public-brand logo-brand footer-logo"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} /></div><div className="footer-links"><Link href="/">Beranda</Link><Link href="/#produk">Produk</Link><Link href="/#promotor">Promotor</Link><Link href="/edukasi">Edukasi</Link></div><p>Artikel umum untuk membantu pembaca membuat percakapan dan langkah pengembangan diri yang lebih sadar.</p><small>Konten bersifat edukatif dan tidak menggantikan diagnosis, pemeriksaan, konseling, atau layanan profesional yang sesuai dengan kebutuhan pembaca.</small></footer>
  </div>;
}
