import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { childLevel, findWilayahBySegment, getWilayah, levelLabel, type Wilayah, type WilayahLevel, wilayahChainPath } from '@/lib/wilayah';
import { getPublicPromoters, getServedRegionCodes } from '@/lib/promoter-store';
import { PublicFooter, PublicHeader } from '../../public-site-shell';

const levels: WilayahLevel[] = ['provinces', 'regencies', 'districts', 'villages'];

async function resolveSegments(segments: string[]) {
  if (segments.length < 1 || segments.length > 4) return null;
  try {
    const chain: Wilayah[] = [];
    let parent: string | undefined;
    for (let index = 0; index < segments.length; index += 1) {
      const item = await findWilayahBySegment(levels[index], segments[index], parent);
      if (!item) return null;
      chain.push(item); parent = item.code;
    }
    return chain;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ segments: string[] }> }): Promise<Metadata> {
  const chain = await resolveSegments((await params).segments);
  if (!chain) return {};
  const item = chain.at(-1)!;
  const servedCodes = await getServedRegionCodes().catch(() => []);
  const served = servedCodes.some((code) => code === item.code || code.startsWith(`${item.code}.`) || item.code.startsWith(`${code}.`));
  return { title: `Tes STIFIn ${item.name} | Konsep STIFIn`, description: `Temukan informasi Tes STIFIn, layanan, dan promotor di ${item.name}.`, alternates: { canonical: wilayahChainPath(chain) }, ...(!served ? { robots: { index: false, follow: true } } : {}) };
}

export default async function WilayahPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const chain = await resolveSegments((await params).segments);
  if (!chain) notFound();
  const current = chain.at(-1)!;
  const next = childLevel[current.level];
  let children = [] as Awaited<ReturnType<typeof getWilayah>>;
  try {
    const [allChildren, servedCodes] = await Promise.all([next ? getWilayah(next, current.code) : Promise.resolve([]), getServedRegionCodes()]);
    children = allChildren.filter((child) => servedCodes.some((code) => code === child.code || code.startsWith(`${child.code}.`)));
  } catch { children = []; }
  let promoters = [] as Awaited<ReturnType<typeof getPublicPromoters>>;
  try { promoters = await getPublicPromoters(current.code); } catch { promoters = []; }
  const canonical = `https://konsepstifin.com${wilayahChainPath(chain)}`;
  return <><PublicHeader active="location" announcement="Layanan Tes STIFIn offline · Jadwal dan cakupan kunjungan dikonfirmasi sebelum pemesanan" ctaHref="/tes-stifin#layanan" ctaLabel="Pilih layanan" /><main className="region-page">
    <nav className="region-breadcrumb"><Link href="/">Beranda</Link>{chain.map((item) => <span key={item.code}> / {item.name}</span>)}</nav>
    <header className="region-hero"><span>{levelLabel(current.level).toUpperCase()}</span><h1>Tes STIFIn di {current.name}</h1><p>Temukan layanan Tes STIFIn offline, edukasi, dan promotor yang dapat membantu Anda di {current.name}.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header>
    <section className="region-section"><span>PROMOTOR TERSEDIA</span><h2>Promotor di {current.name}</h2>{promoters.filter((promoter) => promoter.active).length > 0 ? <div className="region-promoters">{promoters.filter((promoter) => promoter.active).map((promoter) => <article key={promoter.code}><h3>{promoter.name}</h3><p>Kode promotor: {promoter.code}</p><small>{promoter.menerimaKunjungan ? 'Menerima kunjungan' : 'Jadwal berdasarkan konfirmasi'}</small>{promoter.whatsapp && <a className="promoter-whatsapp" href={`https://wa.me/${promoter.whatsapp.replace(/\D/g, '')}`}>WhatsApp →</a>}</article>)}</div> : <p>Belum ada promotor yang dipetakan untuk wilayah ini. Layanan tetap dapat diajukan melalui formulir pemesanan.</p>}<Link href="/promotor">Lihat daftar promotor →</Link></section>
    {next && <section className="region-section"><span>JELAJAHI WILAYAH</span><h2>{levelLabel(next)} di {current.name}</h2><div className="region-links">{children.map((child) => <Link href={wilayahChainPath([...chain, child])} key={child.code}>{child.name} <span>→</span></Link>)}</div></section>}
    <section className="region-section region-cta"><h2>Siap mengenali cara alami Anda?</h2><p>Proses tes dilakukan tatap muka bersama promotor. Pilih layanan, lalu sampaikan lokasi Anda.</p><Link className="dark-button" href="/tes-stifin#layanan">Mulai dari layanan tes →</Link></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: `Tes STIFIn di ${current.name}`, areaServed: { '@type': 'AdministrativeArea', name: current.name }, url: canonical, provider: { '@type': 'Organization', name: 'Konsep STIFIn', url: 'https://konsepstifin.com' } }) }} />
  </main><PublicFooter /></>;
}
