'use client';

import Link from 'next/link';
import { useRef } from 'react';

export type MobileNavigationLink = {
  href: string;
  label: string;
  active?: boolean;
};

type MobileNavigationProps = {
  links: MobileNavigationLink[];
  ctaHref?: string;
  ctaLabel?: string;
};

export default function MobileNavigation({
  links,
  ctaHref = '/tes-stifin#layanan',
  ctaLabel = 'Pilih layanan',
}: MobileNavigationProps) {
  const details = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    details.current?.removeAttribute('open');
  }

  return <details className="mobile-navigation" ref={details}>
    <summary aria-label="Buka menu navigasi"><span/><span/><span/></summary>
    <div className="mobile-navigation-panel">
      <nav aria-label="Navigasi mobile">
        {links.map((item) => <Link className={item.active ? 'active' : ''} href={item.href} key={`${item.href}-${item.label}`} onClick={closeMenu}>{item.label}<span>→</span></Link>)}
      </nav>
      <div><Link href="/admin/login" onClick={closeMenu}>Masuk tim</Link><Link className="mobile-menu-cta" href={ctaHref} onClick={closeMenu}>{ctaLabel}</Link></div>
    </div>
  </details>;
}
