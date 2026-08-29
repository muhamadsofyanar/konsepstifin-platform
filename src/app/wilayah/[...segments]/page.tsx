import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { childLevel, findWilayahBySegment, getWilayah, levelLabel, type Wilayah, type WilayahLevel, wilayahChainPath } from '@/lib/wilayah';
import { findPromoterMatch } from '@/lib/promoter-store';
import PublicInterestAction from '@/app/public-interest-action';
import JsonLd from '@/app/json-ld';

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
  let served = false;
  try { served = (await findPromoterMatch({ provinceCode: chain[0]?.code ?? '', provinceName: chain[0]?.name ?? '', regencyCode: chain[1]?.code ?? '', regencyName: chain[1]?.name ?? item.name })).candidates.length > 0; } catch { served = false; }
  return { title: `Tes STIFIn ${item.name} | Konsep STIFIn`, description: served ? `Ajukan Tes STIFIn dan bantuan pencarian promotor di ${item.name}.` : `Kirim kebutuhan Tes STIFIn di ${item.name} agar tim membantu mencari jalur layanan yang tersedia.`, alternates: { canonical: wilayahChainPath(chain) }, robots: served && chain.length <= 2 ? { index: true, follow: true } : { index: false, follow: true } };
}

export default async function WilayahPage({ params }: { params: Promise<{ segments: string[] }> }) {
  const chain = await resolveSegments((await params).segments);
  if (!chain) notFound();
  const current = chain.at(-1)!;
  const next = childLevel[current.level];
  let children = [] as Awaited<ReturnType<typeof getWilayah>>;
  try { children = next ? await getWilayah(next, current.code) : []; } catch { children = []; }
  let activePromoters = [] as Awaited<ReturnType<typeof findPromoterMatch>>['candidates'];
  try { activePromoters = (await findPromoterMatch({ provinceCode: chain[0]?.code ?? '', provinceName: chain[0]?.name ?? '', regencyCode: chain[1]?.code ?? '', regencyName: chain[1]?.name ?? current.name })).candidates; } catch { activePromoters = []; }
  const canonical = `https://konsepstifin.com${wilayahChainPath(chain)}`;
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://konsepstifin.com/' },
    { '@type': 'ListItem', position: 2, name: 'Wilayah', item: 'https://konsepstifin.com/wilayah' },
    ...chain.map((item, index) => ({ '@type': 'ListItem', position: index + 3, name: item.name, item: `https://konsepstifin.com${wilayahChainPath(chain.slice(0, index + 1))}` })),
  ];
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems },
      { '@type': 'WebPage', name: `Tes STIFIn di ${current.name}`, url: canonical, inLanguage: 'id-ID' },
      ...(activePromoters.length ? [{ '@type': 'Service', name: `Tes STIFIn di ${current.name}`, areaServed: { '@type': 'AdministrativeArea', name: current.name }, url: canonical, provider: { '@id': 'https://konsepstifin.com/#organization' } }] : []),
    ],
  };
  return <main className="region-page">
    <JsonLd data={schema} />
    <nav className="region-breadcrumb"><Link href="/">Beranda</Link>{chain.map((item) => <span key={item.code}> / {item.name}</span>)}</nav>
    <header className="region-hero"><span>{levelLabel(current.level).toUpperCase()}</span><h1>Tes STIFIn di {current.name}</h1><p>Temukan layanan Tes STIFIn offline, edukasi, dan promotor yang dapat membantu Anda di {current.name}.</p><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan tes →</Link></header>
    <section className="region-section"><span>KOORDINASI LAYANAN</span><h2>Layanan di {current.name}</h2>{activePromoters.length > 0 ? <><p>Berikut maksimum tiga kandidat promotor berdasarkan wilayah administratif. Jadwal dikonfirmasi setelah pembayaran.</p><div className="region-promoters">{activePromoters.map((promoter) => <article key={promoter.code}><h3>{promoter.name}</h3><p>{[promoter.area, promoter.province].filter(Boolean).join(', ') || 'Wilayah layanan dikonfirmasi tim'}</p><small>Kandidat berdasarkan wilayah · jadwal berdasarkan konfirmasi</small></article>)}</div></> : <p>Belum ada kandidat promotor otomatis di area Anda. Checkout tetap tersedia dan tim akan mengatur promotor setelah order.</p>}<PublicInterestAction requirePrecheckout linkKey="tesPersonal" label="Kirim kebutuhan layanan →" service="Tes STIFIn Personal" className="public-cta big" provinceCode={chain[0]?.code} provinceName={chain[0]?.name} regencyCode={chain[1]?.code ?? ''} regencyName={chain[1]?.name ?? current.name} /></section>
    {next && <section className="region-section"><span>JELAJAHI WILAYAH</span><h2>{levelLabel(next)} di {current.name}</h2><div className="region-links">{children.map((child) => <Link href={wilayahChainPath([...chain, child])} key={child.code}>{child.name} <span>→</span></Link>)}</div></section>}
    <section className="region-section region-cta"><h2>Siap mengenali cara alami Anda?</h2><p>Proses tes dilakukan tatap muka bersama promotor. Pilih layanan, lalu sampaikan lokasi Anda.</p><Link className="dark-button" href="/tes-stifin#layanan">Mulai dari layanan tes →</Link></section>
  </main>;
}
