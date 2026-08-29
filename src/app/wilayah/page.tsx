import type { Metadata } from 'next';
import Link from 'next/link';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';
import { getServedRegionCodes } from '@/lib/promoter-store';
import { PublicFooter, PublicHeader } from '../public-site-shell';

export const metadata: Metadata = { title: 'Wilayah Layanan Tes STIFIn | Konsep STIFIn', description: 'Jelajahi layanan Tes STIFIn berdasarkan provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan di Indonesia.', alternates: { canonical: '/wilayah' } };

export default async function WilayahIndexPage() {
  let provinces = [] as Awaited<ReturnType<typeof getWilayah>>;
  let servedCodes: string[] = [];
  try {
    [provinces, servedCodes] = await Promise.all([getWilayah('provinces'), getServedRegionCodes()]);
  } catch {
    provinces = await getWilayah('provinces').catch(() => []);
  }
  const servedProvinces = new Set(servedCodes.map((code) => code.split('.')[0]));
  return <><PublicHeader active="location" announcement="Cari lokasi Tes STIFIn di seluruh Indonesia · Wilayah tanpa promotor lokal tetap dilayani melalui koordinasi nasional" ctaHref="/tes-stifin#layanan" ctaLabel="Pilih layanan" /><main className="region-page"><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Wilayah</span></nav><header className="region-hero"><span>PENCARIAN WILAYAH NASIONAL</span><h1>Temukan Tes STIFIn di wilayah Anda</h1><p>Seluruh provinsi dapat dijelajahi. Wilayah yang belum memiliki pemetaan promotor tetap dapat mengirim permintaan ke koordinasi nasional.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header><section className="region-section"><span>38 PROVINSI INDONESIA</span><h2>Pilih provinsi</h2><div className="region-links">{provinces.map((item) => <Link href={wilayahChainPath([item])} key={item.code}><span><b>{item.name}</b><small>{servedProvinces.has(item.code) ? 'Layanan terpetakan' : 'Koordinasi nasional'}</small></span><i>→</i></Link>)}</div></section></main><PublicFooter /></>;
}
