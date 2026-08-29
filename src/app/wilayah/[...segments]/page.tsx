import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { childLevel, findWilayahBySegment, getWilayah, levelLabel, type Wilayah, type WilayahLevel, wilayahChainPath } from '@/lib/wilayah';
import { getPublicPromoters } from '@/lib/promoter-store';
import PublicInterestAction from '@/app/public-interest-action';

const levels: WilayahLevel[] = ['provinces', 'regencies', 'districts', 'villages'];
export const dynamic = 'force-dynamic';

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
  return { title: `Tes STIFIn ${item.name} | Konsep STIFIn`, description: `Ajukan Tes STIFIn dan bantuan pencarian promotor di ${item.name}.`, alternates: { canonical: wilayahChainPath(chain) }, robots: chain.length <= 2 ? { index: true, follow: true } : { index: false, follow: true } };
}

export default async function WilayahPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const chain = await resolveSegments((await params).segments);
  if (!chain) notFound();
  const current = chain.at(-1)!;
  const next = childLevel[current.level];
  let children = [] as Awaited<ReturnType<typeof getWilayah>>;
  try { children = next ? await getWilayah(next, current.code) : []; } catch { children = []; }
  let promoters = [] as Awaited<ReturnType<typeof getPublicPromoters>>;
  try { promoters = await getPublicPromoters(current.code); } catch { promoters = []; }
  const canonical = `https://konsepstifin.com${wilayahChainPath(chain)}`;
  return <main className="region-page">
    <nav className="region-breadcrumb"><Link href="/">Beranda</Link>{chain.map((item) => <span key={item.code}> / {item.name}</span>)}</nav>
    <header className="region-hero"><span>{levelLabel(current.level).toUpperCase()}</span><h1>Tes STIFIn di {current.name}</h1><p>Temukan layanan Tes STIFIn offline, edukasi, dan promotor yang dapat membantu Anda di {current.name}.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header>
    <section className="region-section"><span>KOORDINASI LAYANAN</span><h2>Layanan di {current.name}</h2>{promoters.filter((promoter) => promoter.active).length > 0 ? <><p>Kami menemukan promotor yang melayani area Anda. Kirim kebutuhan agar tim membantu mengonfirmasi jadwal.</p><div className="region-promoters">{promoters.filter((promoter) => promoter.active).map((promoter) => <article key={promoter.code}><h3>{promoter.name}</h3><p>Kode promotor: {promoter.code}</p><small>{promoter.menerimaKunjungan ? 'Menerima kunjungan' : 'Jadwal berdasarkan konfirmasi'}</small></article>)}</div></> : <p>Belum ada promotor aktif yang terdata di area Anda. Anda tetap dapat menjadi konsumen Konsep STIFIn. Tim akan membantu mencari jadwal atau jalur layanan yang memungkinkan.</p>}<PublicInterestAction linkKey="tesPersonal" label="Kirim kebutuhan layanan →" service="Tes STIFIn Personal" className="public-cta big" provinceCode={chain[0]?.code} provinceName={chain[0]?.name} regencyCode={chain[1]?.code ?? ''} regencyName={chain[1]?.name ?? current.name} /></section>
    {next && <section className="region-section"><span>JELAJAHI WILAYAH</span><h2>{levelLabel(next)} di {current.name}</h2><div className="region-links">{children.map((child) => <Link href={wilayahChainPath([...chain, child])} key={child.code}>{child.name} <span>→</span></Link>)}</div></section>}
    <section className="region-section region-cta"><h2>Siap mengenali cara alami Anda?</h2><p>Proses tes dilakukan tatap muka bersama promotor. Pilih layanan, lalu sampaikan lokasi Anda.</p><Link className="dark-button" href="/tes-stifin#layanan">Mulai dari layanan tes →</Link></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: `Tes STIFIn di ${current.name}`, areaServed: { '@type': 'AdministrativeArea', name: current.name }, url: canonical, provider: { '@type': 'Organization', name: 'Konsep STIFIn', url: 'https://konsepstifin.com' } }) }} />
  </main>;
}
