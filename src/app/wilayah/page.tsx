import type { Metadata } from 'next';
import Link from 'next/link';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';

export const metadata: Metadata = { title: 'Cari Cakupan Tes STIFIn Berdasarkan Wilayah | Konsep STIFIn', description: 'Pilih wilayah untuk memeriksa informasi cakupan dan promotor aktif. Jadwal layanan tetap berdasarkan konfirmasi.', alternates: { canonical: '/wilayah' } };
export const dynamic = 'force-dynamic';

export default async function WilayahIndexPage() {
  let provinces = [] as Awaited<ReturnType<typeof getWilayah>>;
  try { provinces = await getWilayah('provinces'); } catch { provinces = []; }
  return <main className="region-page"><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Wilayah</span></nav><header className="region-hero"><span>CAKUPAN WILAYAH</span><h1>Periksa cakupan promotor sebelum mengajukan jadwal tes.</h1><p>Pilih provinsi dan kabupaten/kota untuk melihat informasi layanan yang mempunyai bukti cakupan. Halaman wilayah tidak menjanjikan ketersediaan waktu.</p><Link className="public-cta big" href="/tes-stifin#layanan">Bandingkan layanan tes →</Link></header><section className="region-section"><span>PROVINSI</span><h2>Mulai dari provinsi Anda</h2>{provinces.length ? <div className="region-links">{provinces.map((item) => <Link href={wilayahChainPath([item])} key={item.code}>{item.name} <span>→</span></Link>)}</div> : <p>Data wilayah sedang diperbarui. Gunakan formulir layanan untuk menyampaikan kota Anda.</p>}</section></main>;
}
