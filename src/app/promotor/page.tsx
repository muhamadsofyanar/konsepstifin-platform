import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicPromoters } from '@/lib/promoter-store';
import { getWilayah, wilayahChainPath, type Wilayah } from '@/lib/wilayah';

export const metadata: Metadata = { title: 'Daftar Promotor STIFIn | Konsep STIFIn', description: 'Cari promotor STIFIn berdasarkan wilayah layanan di Indonesia.', alternates: { canonical: '/promotor' } };

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
  return <main className="region-page promoter-directory"><nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Daftar Promotor</span></nav><header className="region-hero"><span>JARINGAN PROMOTOR STIFIN</span><h1>Temukan promotor di wilayah Anda</h1><p>Pilih promotor berdasarkan wilayah layanan. Tes dilakukan secara offline dengan jadwal yang dikonfirmasi langsung.</p><Link className="public-cta big" href="/wilayah">Jelajahi semua wilayah →</Link></header><section className="region-section"><span>DAFTAR PROMOTOR</span><h2>Promotor yang dapat dihubungi</h2>{withLocations.length ? <div className="region-promoters">{withLocations.map(({ promoter, regions }) => <article key={promoter.code}><h3>{promoter.name}</h3><p>Kode promotor: {promoter.code}</p>{regions.filter((region): region is { name: string; path: string } => Boolean(region)).map((region) => <Link href={region.path} key={region.path}>{region.name}</Link>)}<small>{promoter.menerimaKunjungan ? 'Menerima kunjungan' : 'Jadwal berdasarkan konfirmasi'}</small>{promoter.whatsapp && <a className="promoter-whatsapp" href={`https://wa.me/${promoter.whatsapp.replace(/\D/g, '')}`}>WhatsApp →</a>}</article>)}</div> : <p>Daftar promotor sedang diperbarui. Gunakan halaman wilayah atau formulir layanan untuk menyampaikan kota Anda.</p>}</section></main>;
}
