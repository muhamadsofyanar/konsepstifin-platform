import { PublicFooter, PublicHeader } from '@/app/public-site-shell';

export default function WilayahLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-site journey-site">
    <PublicHeader active="location" announcement="Cari layanan dan promotor STIFIn berdasarkan wilayah di Indonesia" ctaHref="/tes-stifin#layanan" ctaLabel="Pilih layanan" />
    {children}
    <PublicFooter />
  </div>;
}
