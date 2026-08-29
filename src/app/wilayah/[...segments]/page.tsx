import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { childLevel, findWilayahBySegment, getWilayah, levelLabel, type Wilayah, type WilayahLevel, wilayahChainPath } from '@/lib/wilayah';
import { getPromotersForRegion, getPublicPromoters } from '@/lib/promoter-store';
import PublicInterestAction from '@/app/public-interest-action';

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
  const base: Metadata = {
    title: `Tes STIFIn ${item.name} | Konsep STIFIn`,
    description: `Temukan informasi Tes STIFIn, layanan, dan promotor yang dapat membantu di ${item.name}. Jika belum ada promotor lokal, Konsep STIFIn menerima permintaan melalui koordinasi nasional.`,
    alternates: { canonical: wilayahChainPath(chain) },
  };
  if (item.level === 'districts' || item.level === 'villages') {
    try {
      const checkCtx = {
        provinceCode: chain.find((w) => w.level === 'provinces')?.code,
        regencyCode: chain.find((w) => w.level === 'regencies')?.code,
      };
      const { available } = await getPromotersForRegion(checkCtx);
      if (!available) {
        base.robots = { index: false, follow: true, noarchive: true };
      }
    } catch {
      base.robots = { index: false, follow: true, noarchive: true };
    }
  }
  return base;
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

  const province = chain.find((w) => w.level === 'provinces');
  const regency = chain.find((w) => w.level === 'regencies');
  const ctx = {
    provinceCode: province?.code,
    provinceName: province?.name,
    regencyCode: regency?.code,
    regencyName: regency?.name,
  };
  let direct = promoters.filter((p) => p.active);
  let candidates: typeof promoters = [];
  let available = direct.length > 0;
  try {
    const match = await getPromotersForRegion(ctx);
    direct = [...direct, ...match.direct.filter((d) => !promoters.some((p) => p.code === d.code))];
    candidates = match.candidates.filter((c) => !direct.some((d) => d.code === c.code));
    available = direct.length > 0 || candidates.length > 0;
  } catch { /* ignore */ }

  const canonical = `https://konsepstifin.com${wilayahChainPath(chain)}`;
  const refCode = `KSF-${current.code}`;

  return <main className="region-page">
    <nav className="region-breadcrumb">
      <Link href="/">Beranda</Link>
      <Link href="/wilayah"> / Wilayah</Link>
      {chain.map((item) => <span key={item.code}> / {item.name}</span>)}
    </nav>

    <header className="region-hero">
      <span>{levelLabel(current.level).toUpperCase()}</span>
      <h1>Tes STIFIn di {current.name}</h1>
      <p>Temukan layanan Tes STIFIn offline dan promotor yang dapat membantu Anda di {current.name}.
        {' '}Jika belum ada promotor lokal, Konsep STIFIn akan membantu mencari jalur layanan melalui koordinasi nasional.</p>
      <Link className="public-cta big" href="#permintaan-layanan">
        {available ? 'Minta jadwal melalui Konsep STIFIn →' : 'Sampaikan kebutuhan Anda →'}
      </Link>
    </header>

    {available ? (
      <section className="region-section region-promotor-available">
        <span>✓ PROMOTOR TERSEDIA</span>
        <h2>Ada promotor yang dapat melayani area Anda</h2>
        <p style={{ maxWidth: 680 }}>
          Kami menemukan promotor yang terdata dan aktif di wilayah ini (atau kandidat terdekat yang dapat menjangkau {current.name}).
          Kirim kebutuhan Anda agar tim Konsep STIFIn membantu mengonfirmasi jadwal bersama promotor.
          Nomor WhatsApp Anda tidak ditampilkan di halaman ini dan hanya dibagikan hanya setelah promotor ditetapkan secara resmi.
        </p>
        {direct.length > 0 && <div className="region-promoters">
          {direct.map((promoter) => (
            <article key={promoter.code}>
              <h3>{promoter.name}</h3>
              <p>Kode promotor: {promoter.code}</p>
              {promoter.wilayahTeks && <small>{promoter.wilayahTeks}</small>}
              <small>{promoter.menerimaKunjungan ? 'Menerima kunjungan' : 'Jadwal berdasarkan konfirmasi'}</small>
            </article>
          ))}
        </div>}
        {candidates.length > 0 && <>
          <h3 style={{ marginTop: 24 }}>Kandidat promotor terdekat (berdasarkan wilayah layanan)</h3>
          <div className="region-promoters">
            {candidates.slice(0, 6).map((promoter) => (
              <article key={promoter.code} style={{ opacity: 0.9 }}>
                <h3>{promoter.name}</h3>
                <p>Kode: {promoter.code} · {promoter.branchCode}</p>
                {promoter.wilayahTeks && <small>Berdasarkan data layanan: {promoter.wilayahTeks}</small>}
              </article>
            ))}
          </div>
        </>}
      </section>
    ) : (
      <section className="region-section region-promotor-unavailable">
        <span>○ BELUM ADA PROMOTOR LOKAL</span>
        <h2>Belum ada promotor aktif yang terdata di {current.name}</h2>
        <p style={{ maxWidth: 680 }}>
          Anda tetap dapat menjadi konsumen Konsep STIFIn. Tim kami akan menerima permintaan Anda,
          membantu mencari jadwal atau jalur layanan yang memungkinkan melalui koordinasi nasional,
          lalu menghubungi Anda kembali melalui WhatsApp.
        </p>
        <div className="privacy-note" style={{ marginTop: 12 }}>
          <b>Catatan:</b> Permintaan dari wilayah tanpa promotor aktif menjadi prioritas untuk pengembangan jaringan STIFIn di daerah Anda.
        </div>
      </section>
    )}

    <section id="permintaan-layanan" className="region-section region-cta-form">
      <div className="section-heading compact">
      <span>PERMINTAAN LAYANAN</span>
      <h2>Sampaikan kebutuhan Tes STIFIn Anda</h2>
      <p>
        Data Anda tetap dilayani melalui Konsep STIFIn. Pilih provinsi dan kabupaten/kota agar pencocokan lebih akurat —
        wilayah Anda saat ini terdeteksi <b>{current.name}</b> ({refCode}).
      </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PublicInterestAction
          linkKey="tesPersonal"
          label={available ? 'Kirim permintaan jadwal →' : 'Ajukan permintaan layanan →'}
          service="Tes STIFIn Personal"
          className="public-cta big"
          defaultProvinceCode={province?.code}
          defaultProvinceName={province?.name}
          defaultRegencyCode={regency?.code}
          defaultRegencyName={regency?.name}
        />
      </div>
    </section>

    {next && (
      <section className="region-section">
        <span>JELAJAHI WILAYAH</span>
        <h2>{levelLabel(next)} di {current.name}</h2>
        <div className="region-links">
          {children.map((child) => (
            <Link href={wilayahChainPath([...chain, child])} key={child.code}>
              {child.name} <span>→</span>
            </Link>
          ))}
        </div>
      </section>
    )}

    <section className="region-section region-cta">
      <h2>Siap mengenali cara alami Anda?</h2>
      <p>Proses tes dilakukan tatap muka bersama promotor. Pilih layanan, lalu sampaikan lokasi Anda.</p>
      <Link className="dark-button" href="/tes-stifin#layanan">Mulai dari layanan tes →</Link>
    </section>

    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: `Tes STIFIn di ${current.name}`,
          areaServed: { '@type': 'AdministrativeArea', name: current.name },
          url: canonical,
          provider: { '@type': 'Organization', name: 'Konsep STIFIn', url: 'https://konsepstifin.com' },
          description: available
            ? `Promotor Tes STIFIn tersedia di ${current.name}. Permintaan jadwal melalui Konsep STIFIn.`
            : `Koordinasi nasional untuk Tes STIFIn di ${current.name} melalui Konsep STIFIn.`,
        }),
      }}
    />
  </main>;
}
