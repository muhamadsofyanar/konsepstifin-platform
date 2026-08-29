import type { Metadata } from 'next';
import Link from 'next/link';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';
import { getServedRegionCodes } from '@/lib/promoter-store';
import JsonLd from '../json-ld';

export const metadata: Metadata = { title: 'Wilayah Layanan Tes STIFIn | Konsep STIFIn', description: 'Jelajahi layanan Tes STIFIn berdasarkan provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan di Indonesia.', alternates: { canonical: '/wilayah' } };
export const dynamic = 'force-dynamic';

export default async function WilayahIndexPage() {
  let provinces = [] as Awaited<ReturnType<typeof getWilayah>>;
  let servedCodes: string[] = [];
  try {
    [provinces, servedCodes] = await Promise.all([getWilayah('provinces'), getServedRegionCodes()]);
  } catch { provinces = []; servedCodes = []; }
  const servedProvinceCodes = new Set(servedCodes.map((code) => code.split('.')[0]));
  const servedProvinces = provinces.filter((province) => servedProvinceCodes.has(province.code));
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://konsepstifin.com/' }, { '@type': 'ListItem', position: 2, name: 'Wilayah Layanan', item: 'https://konsepstifin.com/wilayah' }] },
      { '@type': 'CollectionPage', name: 'Wilayah Layanan Tes STIFIn', url: 'https://konsepstifin.com/wilayah', inLanguage: 'id-ID' },
    ],
  };
  return <main className="region-page"><JsonLd data={schema} /><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Wilayah</span></nav><header className="region-hero"><span>SELURUH INDONESIA</span><h1>Temukan Tes STIFIn di wilayah Anda</h1><p>Wilayah di bawah ini sudah memiliki pemetaan layanan. Jika kota Anda belum tercantum, kirim kebutuhan agar tim membantu pencarian promotor.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header><section className="region-section"><span>WILAYAH TERPETAKAN</span><h2>Pilih provinsi layanan</h2>{servedProvinces.length ? <div className="region-links">{servedProvinces.map((item) => <Link href={wilayahChainPath([item])} key={item.code}>{item.name} <span>→</span></Link>)}</div> : <p>Pemetaan wilayah promotor sedang diperbarui. Anda tetap dapat mengirim kebutuhan kota melalui formulir layanan nasional.</p>}</section></main>;
}
