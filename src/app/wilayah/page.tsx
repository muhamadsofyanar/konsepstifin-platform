import type { Metadata } from 'next';
import Link from 'next/link';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';
import { getServedRegionCodes } from '@/lib/promoter-store';

export const metadata: Metadata = { title: 'Wilayah Layanan Tes STIFIn | Konsep STIFIn', description: 'Jelajahi layanan Tes STIFIn berdasarkan provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan di Indonesia.', alternates: { canonical: '/wilayah' } };

export default async function WilayahIndexPage() {
  let provinces = [] as Awaited<ReturnType<typeof getWilayah>>;
  try {
    const [allProvinces, servedCodes] = await Promise.all([getWilayah('provinces'), getServedRegionCodes()]);
    const servedProvinces = new Set(servedCodes.map((code) => code.split('.')[0]));
    provinces = allProvinces.filter((province) => servedProvinces.has(province.code));
  } catch { provinces = []; }
  return <main className="region-page"><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Wilayah</span></nav><header className="region-hero"><span>WILAYAH LAYANAN</span><h1>Temukan Tes STIFIn di wilayah Anda</h1><p>Jelajahi wilayah yang sudah memiliki pemetaan promotor dan layanan aktif.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header><section className="region-section"><span>PROVINSI TERLAYANI</span><h2>Pilih provinsi</h2>{provinces.length ? <div className="region-links">{provinces.map((item) => <Link href={wilayahChainPath([item])} key={item.code}>{item.name} <span>→</span></Link>)}</div> : <p>Wilayah layanan sedang diperbarui. Gunakan formulir layanan untuk menyampaikan kota Anda.</p>}</section></main>;
}
