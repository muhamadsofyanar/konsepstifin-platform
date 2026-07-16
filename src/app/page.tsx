import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';
import { PublicFooter, PublicHeader } from './public-site-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Konsep STIFIn — Tes, Edukasi, dan Jalur Promotor',
  description: 'Beranda Konsep STIFIn untuk memilih layanan Tes STIFIn offline, membaca edukasi, atau memahami tahapan menjadi promotor.',
  alternates: { canonical: '/' },
};

const journeys = [
  {
    number: '01', eyebrow: 'LAYANAN PESERTA', title: 'Tes STIFIn',
    description: 'Pilih layanan personal, keluarga, atau institusi. Pemindaian tetap dilakukan offline bersama promotor.',
    href: '/tes-stifin', action: 'Lihat layanan tes', tone: 'forest',
  },
  {
    number: '02', eyebrow: 'PUSAT PENGETAHUAN', title: 'Artikel & Edukasi',
    description: 'Baca materi ringan yang bersumber dari Pustaka STIFIn dan tetap ditinjau manusia sebelum diterbitkan.',
    href: '/edukasi', action: 'Mulai membaca', tone: 'mint',
  },
  {
    number: '03', eyebrow: 'JALUR PROFESI', title: 'Jadi Promotor',
    description: 'Kenali profesinya, ikuti Preview, WSL 1, WSL 2, lalu aktivasi sesuai ketentuan resmi.',
    href: '/jadi-promotor', action: 'Pelajari tahapannya', tone: 'sand',
  },
];

export default async function Home() {
  const latestArticles = await getPublishedArticles(3);

  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Satu pintu untuk layanan Tes STIFIn, edukasi, dan perjalanan promotor" />
    <main>
      <section className="hub-hero">
        <div className="hub-hero-copy">
          <span className="eyebrow">KONSEP STIFIn</span>
          <h1>Kenali diri.<br/>Bangun hubungan.<br/><em>Tumbuh lebih terarah.</em></h1>
          <p>Pilih jalan yang sesuai dengan kebutuhan Anda—mengikuti tes, belajar melalui artikel, atau memahami profesi promotor secara bertahap.</p>
          <div className="hub-actions"><Link className="public-cta big" href="/tes-stifin">Mulai dari Tes STIFIn →</Link><Link href="/edukasi">Jelajahi edukasi</Link></div>
        </div>
        <div className="hub-hero-visual" aria-label="Tiga perjalanan di Konsep STIFIn">
          <div className="hub-orbit hub-orbit-one"/><div className="hub-orbit hub-orbit-two"/>
          <article className="hub-visual-card"><small>PILIH PERJALANAN</small><b>01</b><h2>Tes & pembahasan</h2><p>Offline · Terjadwal · Didampingi</p></article>
          <article className="hub-mini-card first"><b>02</b><span>Edukasi berbasis Pustaka</span></article>
          <article className="hub-mini-card second"><b>03</b><span>Jalur promotor bertahap</span></article>
        </div>
      </section>

      <section className="hub-purpose">
        <div><span>RUANG YANG JELAS</span><h2>Tiga kebutuhan, tiga halaman yang lebih fokus.</h2></div>
        <p>Informasi tidak lagi bercampur dalam satu halaman panjang. Setiap pengunjung dapat langsung menuju tujuan yang paling relevan.</p>
      </section>

      <section className="journey-grid" aria-label="Pilihan perjalanan">
        {journeys.map((item) => <article className={`journey-card ${item.tone}`} key={item.href}>
          <header><span>{item.eyebrow}</span><b>{item.number}</b></header>
          <h2>{item.title}</h2><p>{item.description}</p>
          <Link href={item.href}>{item.action} <span>→</span></Link>
        </article>)}
      </section>

      <section className="hub-foundation">
        <div className="hub-foundation-copy"><span>LANDASAN KAMI</span><h2>Informasi untuk membuka percakapan, bukan memberi label.</h2><p>Konsep STIFIn menyajikan layanan dan materi sebagai alat bantu refleksi. Pengalaman, konteks, kompetensi, dan keputusan seseorang tetap tidak dapat disederhanakan menjadi satu hasil.</p><Link href="/edukasi">Baca prinsip edukasi →</Link></div>
        <div className="hub-principles">
          <article><b>01</b><div><h3>Proses yang transparan</h3><p>Tahapan, batasan, dan tindak lanjut dijelaskan sejak awal.</p></div></article>
          <article><b>02</b><div><h3>Sumber yang dapat ditelusuri</h3><p>Artikel AI diarahkan oleh Pustaka STIFIn dan menyimpan jejak materi rujukan.</p></div></article>
          <article><b>03</b><div><h3>Tetap ditinjau manusia</h3><p>AI membantu menyiapkan draf; keputusan menerbitkan tetap berada pada editor.</p></div></article>
        </div>
      </section>

      {latestArticles.length > 0 && <section className="section home-education hub-education">
        <div className="education-section-head"><div><span>ARTIKEL TERBARU</span><h2>Belajar dari materi yang lebih terarah.</h2></div><div><p>Wawasan praktis untuk personal, keluarga, pendidikan, dan organisasi.</p><Link href="/edukasi">Lihat semua artikel →</Link></div></div>
        <div className="home-article-grid">{latestArticles.map((article, index) => <article key={article.slug}>
          <Link className={`article-cover ${article.tone}`} href={`/edukasi/${article.slug}`}><span>{article.category}</span><b>{String(index + 1).padStart(2, '0')}</b><small>{article.readTime}</small></Link>
          <div><span>{article.category}</span><h3><Link href={`/edukasi/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link href={`/edukasi/${article.slug}`}>Baca artikel →</Link></div>
        </article>)}</div>
      </section>}

      <section className="hub-final">
        <div><span>PILIH LANGKAH BERIKUTNYA</span><h2>Mulai dari kebutuhan yang paling nyata hari ini.</h2></div>
        <div><Link className="public-cta big" href="/tes-stifin">Pilih layanan tes →</Link><Link href="/jadi-promotor">Pelajari jalur promotor</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
