import { PublicFooter, PublicHeader } from '@/app/public-site-shell';

export default function WilayahLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-site journey-site">
    <PublicHeader active="location" announcement="Cakupan wilayah dan jadwal adalah dua hal berbeda · Jadwal berdasarkan konfirmasi" ctaHref="/tes-stifin#layanan" ctaLabel="Bandingkan layanan tes" />
    {children}
    <PublicFooter />
  </div>;
}
