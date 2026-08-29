import type { Metadata } from 'next';
import Link from 'next/link';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';

export const metadata: Metadata = { title: 'Wilayah Layanan Tes STIFIn | Konsep STIFIn', description: 'Jelajahi layanan Tes STIFIn berdasarkan provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan di Indonesia.', alternates: { canonical: '/wilayah' } };

export default async function WilayahIndexPage() {
  let provinces = [] as Awaited<ReturnType<typeof getWilayah>>;
  try { provinces = await getWilayah('provinces'); } catch { provinces = []; }
  return <main className="region-page"><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Wilayah</span></nav><header className="region-hero"><span>SELURUH INDONESIA</span><h1>Temukan Tes STIFIn di wilayah Anda</h1><p>Jelajahi informasi layanan, edukasi, dan promotor berdasarkan wilayah administratif.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header><section className="region-section"><span>PROVINSI</span><h2>Pilih provinsi</h2>{provinces.length ? <div className="region-links">{provinces.map((item) => <Link href={wilayahChainPath([item])} key={item.code}>{item.name} <span>→</span></Link>)}</div> : <p>Data wilayah sedang diperbarui. Gunakan formulir layanan untuk menyampaikan kota Anda.</p>}</section></main>;
}
