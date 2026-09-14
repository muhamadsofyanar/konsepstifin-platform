'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/admin/leads', 'Klien & Promotor'], ['/admin/artikel', 'Artikel & AI'],
  ['/admin/produk', 'Produk & Harga'], ['/admin/promotor', 'Direktori Nasional'],
  ['/admin/intelligence', 'Content Intelligence'], ['/admin/pustaka', 'Pustaka STIFIn'],
];
export default function PortalNavigation() {
  const pathname = usePathname();
  if (pathname === '/admin/login') return null;
  return <nav className="crm-portal-nav" aria-label="Menu portal tim"><strong>Portal Konsep STIFIn</strong>{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}>{label}</Link>)}</nav>;
}
