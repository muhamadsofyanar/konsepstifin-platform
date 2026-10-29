import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';
import { PublicFooter, PublicHeader } from './public-site-shell';
import PublicPromotionBanner from './public-promotion-banner';
import ActivityGallery from './activity-gallery';
import PublicInterestAction from './public-interest-action';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tes STIFIn untuk Diri, Keluarga & Sekolah | KonsepSTIFIn',
  description: 'Bandingkan layanan Tes STIFIn personal, pasangan, keluarga, dan institusi. Ajukan kebutuhan Anda untuk dikonfirmasi bersama tim dan promotor.',
  alternates: { canonical: '/' },
};

const journeys = [
  { number: '01', eyebrow: 'UNTUK DIRI & KELUARGA', title: 'Tes STIFIn', description: 'Mulai dari kebutuhan tes Anda. Tim membantu memastikan jumlah peserta, promo yang sesuai, wilayah, dan jadwal.', href: '/tes-stifin', action: 'Pilih layanan tes', tone: 'forest' },
  { number: '02', eyebrow: 'UNTUK CABANG & CALON MITRA', title: 'Workshop & Kemitraan', description: 'Lihat program workshop pusat, pelajari jalur promotor, atau tanyakan kerja sama affiliate.', href: '/jadi-promotor#year-end-workshop', action: 'Lihat workshop & kemitraan', tone: 'sand' },
];

export default async function Home() {
  const latestArticles = await getPublishedArticles(3);


  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Tes STIFIn personal, pasangan, keluarga, dan institusi · Jadwal dikonfirmasi bersama tim" />
    <main id="main-content">
      <section className="hub-hero">
        <div className="hub-hero-copy">
          <span className="eyebrow">KONSEP STIFIN · DALAM JARINGAN STIFIN GENETIC</span>
          <h1>Tes STIFIn untuk memahami diri dan keluarga.<br/><em>Mulai dari kebutuhan Anda.</em></h1>
          <p>Bandingkan layanan personal, pasangan, keluarga, atau sekolah. Tim membantu mengonfirmasi pilihan, wilayah, jadwal, dan biaya sebelum Anda berkomitmen.</p>
          <div className="hub-actions"><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan Tes STIFIn →</Link><PublicInterestAction className="public-cta big home-help-cta" linkKey="tesPersonal" label="Bantu saya memilih" service="Bantuan memilih layanan STIFIn" leadType="test_service" /></div><div className="public-proof-strip"><span>✓ Tes tatap muka</span><span>✓ Pembahasan bersama promotor</span><span>✓ Jadwal dikonfirmasi</span></div>
        </div>
        <figure className="journey-hero-media home-hero-media">
          <Image src="/images/hero-home-v3.webp" alt="Keluarga Muslim Indonesia berbincang dan saling mendengarkan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload />
          <figcaption className="media-story-card"><small>PERJALANAN ANDA</small><b>Kenali diri</b><span>Pahami perbedaan · Tumbuh bersama</span></figcaption>
        </figure>
      </section>

      <PublicPromotionBanner />

      <section className="life-situations" aria-label="Kebutuhan calon peserta Tes STIFIn">
        <article><small>DI RUMAH</small><p>“Sudah dijelaskan berkali-kali, kenapa cara menangkapnya tetap berbeda?”</p><span>Pahami cara belajar dan berkomunikasi.</span></article>
        <article><small>DALAM DIRI</small><p>“Saya bisa banyak hal, tetapi mana yang paling alami untuk saya?”</p><span>Kenali pola kerja yang terasa lebih mengalir.</span></article>
        <article><small>DI TEMPAT KERJA</small><p>“Mengapa satu cara memotivasi tidak cocok untuk semua orang?”</p><span>Lihat perbedaan sebagai petunjuk, bukan hambatan.</span></article>
      </section>

      <section className="hub-purpose">
        <div><span>PERNAH MERASAKANNYA?</span><h2>Sering kali bukan kurang usaha. Kita hanya belum memahami cara kerjanya.</h2></div>
        <p>Ada yang datang karena ingin lebih paham dirinya. Ada yang sedang mencari cara berkomunikasi dengan pasangan atau anak. Ada pula yang ingin menjadikan STIFIn sebagai jalan belajar dan profesi. Mulailah dari kebutuhan yang paling dekat dengan Anda.</p>
      </section>

      <section className="journey-grid home-primary-journeys" aria-label="Mulai dari kebutuhan Anda">
        {journeys.map((item) => <article className={`journey-card ${item.tone}`} key={item.href}>
          <header><span>{item.eyebrow}</span><b>{item.number}</b></header>
          <h2>{item.title}</h2><p>{item.description}</p>
          <Link href={item.href}>{item.action} <span>→</span></Link>
        </article>)}
      </section>

      <ActivityGallery />

      <section className="hub-foundation">
        <div className="hub-foundation-copy"><span>SETELAH TAHU HASILNYA</span><h2>Tes memberi nama pada pola. Pemahaman membuatnya berguna.</h2><p>Hasil STIFIn adalah awal percakapan tentang cara Anda menyerap informasi, mengambil keputusan, bergerak, dan bertumbuh. Nilainya terasa ketika hasil dibahas dengan baik lalu diterapkan sesuai situasi nyata, bukan ketika dipakai untuk membatasi diri.</p><Link href="/edukasi">Lihat cara menerapkannya →</Link></div>
        <div className="hub-principles">
          <article><b>01</b><div><h3>Kenali Mesin Kecerdasan</h3><p>Pahami kecenderungan dominan yang ditemukan melalui proses tes.</p></div></article>
          <article><b>02</b><div><h3>Bahas, jangan hanya membaca</h3><p>Promotor membantu menerjemahkan hasil ke dalam bahasa yang lebih mudah dipahami.</p></div></article>
          <article><b>03</b><div><h3>Coba dalam kehidupan nyata</h3><p>Mulai dari perubahan kecil dalam belajar, bekerja, dan berkomunikasi.</p></div></article>
        </div>
      </section>

      {latestArticles.length > 0 && <section className="section home-education hub-education">
        <div className="education-section-head"><div><span>ARTIKEL TERBARU</span><h2>Belajar dari situasi yang dekat dengan keseharian.</h2></div><div><p>Pahami konsep STIFIn melalui contoh tentang diri, keluarga, pendidikan, pekerjaan, dan organisasi.</p><Link href="/edukasi">Lihat semua artikel →</Link></div></div>
        <div className="home-article-grid">{latestArticles.map((article, index) => <article key={article.slug}>
          <Link className={`article-cover ${article.tone}`} href={`/edukasi/${article.slug}`}><span>{article.category}</span><b>{String(index + 1).padStart(2, '0')}</b><small>{article.readTime}</small></Link>
          <div><span>{article.category}</span><h3><Link href={`/edukasi/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link href={`/edukasi/${article.slug}`}>Baca artikel →</Link></div>
        </article>)}</div>
      </section>}

      <section className="hub-final">
        <div><span>PILIH SATU LANGKAH</span><h2>Tidak perlu memahami semua pilihan sekaligus. Pilih kebutuhan utama Anda, lalu tim membantu langkah berikutnya.</h2></div>
        <div><Link className="public-cta big" href="/tes-stifin">Saya ingin tes STIFIn →</Link><Link href="/jadi-promotor#year-end-workshop">Saya dari cabang / ingin bermitra</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
