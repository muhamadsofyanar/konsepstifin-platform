import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicPromoters } from '@/lib/promoter-store';
import { getWilayah, wilayahChainPath, type Wilayah } from '@/lib/wilayah';

export const metadata: Metadata = { title: 'Jaringan Promotor STIFIn | Konsep STIFIn', description: 'Lihat cakupan layanan promotor dan ajukan bantuan koordinasi berdasarkan wilayah di Indonesia.', alternates: { canonical: '/promotor' } };
export const dynamic = 'force-dynamic';

async function regionLabel(code: string) {
  const parts = code.split('.');
  try {
    const province = (await getWilayah('provinces')).find((item) => item.code === parts[0]);
    if (!province) return null;
    let current: Wilayah = province;
    const chain = [province];
    const levels = ['regencies', 'districts', 'villages'] as const;
    for (let index = 1; index < parts.length && index <= 3; index += 1) {
      const next = (await getWilayah(levels[index - 1], current.code)).find((item) => item.code === parts.slice(0, index + 1).join('.'));
      if (!next) break;
      chain.push(next); current = next;
    }
    return { name: current.name, path: wilayahChainPath(chain) };
  } catch { return null; }
}

export default async function PromoterDirectoryPage() {
  let promoters = [] as Awaited<ReturnType<typeof getPublicPromoters>>;
  try { promoters = (await getPublicPromoters()).filter((promoter) => promoter.active); } catch { promoters = []; }
  const withLocations = await Promise.all(promoters.map(async (promoter) => ({ promoter, regions: await Promise.all(promoter.regionCodes.map(regionLabel)) })));
  return <main className="region-page promoter-directory"><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Jaringan Promotor</span></nav><header className="region-hero"><span>JARINGAN PROMOTOR STIFIN</span><h1>Temukan jalur layanan di wilayah Anda</h1><p>Lihat cakupan promotor aktif, lalu kirim kebutuhan melalui Konsep STIFIn agar jadwal dapat dikoordinasikan dengan aman.</p><Link className="public-cta big" href="/wilayah">Cari layanan di wilayah saya →</Link></header><section className="region-section"><span>CAKUPAN PROMOTOR</span><h2>Promotor yang terdata</h2>{withLocations.length ? <div className="region-promoters">{withLocations.map(({ promoter, regions }) => <article key={promoter.code}><h3>{promoter.name}</h3><p>Kode promotor: {promoter.code}</p>{regions.filter((region): region is { name: string; path: string } => Boolean(region)).map((region) => <Link href={region.path} key={region.path}>{region.name}</Link>)}<small>{promoter.menerimaKunjungan ? 'Menerima kunjungan' : 'Jadwal berdasarkan konfirmasi'}</small></article>)}</div> : <p>Daftar promotor sedang diperbarui. Gunakan halaman wilayah atau formulir layanan untuk menyampaikan kota Anda.</p>}</section></main>;
}
