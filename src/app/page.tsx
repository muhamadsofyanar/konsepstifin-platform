import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';
import { PublicFooter, PublicHeader } from './public-site-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Konsep STIFIn — Kenali Cara Alami Anda Berpikir dan Bertumbuh',
  description: 'Kenali Mesin Kecerdasan melalui Tes STIFIn offline, pelajari penerapannya, dan temukan jalur belajar atau promotor yang sesuai.',
  alternates: { canonical: '/' },
};

const journeys = [
  {
    number: '01', eyebrow: 'LAYANAN PESERTA', title: 'Tes STIFIn',
    description: 'Ingin mengenali Mesin Kecerdasan Anda? Pilih layanan personal, keluarga, atau institusi. Tes dilakukan langsung bersama promotor.',
    href: '/tes-stifin', action: 'Saya ingin ikut tes', tone: 'forest',
  },
  {
    number: '02', eyebrow: 'PUSAT PENGETAHUAN', title: 'Artikel & Edukasi',
    description: 'Belum ingin tes? Mulai dari bacaan tentang belajar, keluarga, pekerjaan, dan cara menerapkan konsep STIFIn dalam keseharian.',
    href: '/edukasi', action: 'Saya ingin belajar dulu', tone: 'mint',
  },
  {
    number: '03', eyebrow: 'JALUR PROFESI', title: 'Jadi Promotor',
    description: 'Sudah merasakan manfaatnya dan ingin mendampingi lebih banyak orang? Kenali dulu peran serta tahapan resmi seorang promotor.',
    href: '/jadi-promotor', action: 'Saya ingin mengenal profesinya', tone: 'sand',
  },
];

export default async function Home() {
  const latestArticles = await getPublishedArticles(3);

  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Tes STIFIn dilakukan offline bersama promotor · Tersedia untuk peserta di berbagai kota" />
    <main>
      <section className="hub-hero">
        <div className="hub-hero-copy">
          <span className="eyebrow">MULAI DARI DIRI SENDIRI</span>
          <h1>Kenapa cara belajar, bekerja, dan berkomunikasi setiap orang bisa <em>begitu berbeda?</em></h1>
          <p>STIFIn membantu Anda mengenali Mesin Kecerdasan dominan melalui pemindaian sepuluh sidik jari. Bukan untuk memberi label, tetapi untuk memberi peta awal agar Anda lebih paham cara alami diri sendiri.</p>
          <div className="hub-actions"><Link className="public-cta big" href="/tes-stifin">Saya ingin ikut tes →</Link><Link href="/edukasi">Saya ingin belajar dulu</Link></div>
        </div>
        <div className="hub-hero-visual" aria-label="Tiga perjalanan di Konsep STIFIn">
          <div className="hub-orbit hub-orbit-one"/><div className="hub-orbit hub-orbit-two"/>
          <article className="hub-visual-card"><small>KENALI CARA ALAMI ANDA</small><b>01</b><h2>Tes & pembahasan</h2><p>Offline · Terjadwal · Didampingi</p></article>
          <article className="hub-mini-card first"><b>02</b><span>Belajar menerapkan hasil</span></article>
          <article className="hub-mini-card second"><b>03</b><span>Bertumbuh bersama jaringan</span></article>
        </div>
      </section>

      <section className="hub-purpose">
        <div><span>PERNAH MERASAKANNYA?</span><h2>Sering kali bukan kurang usaha. Kita hanya belum memahami cara kerjanya.</h2></div>
        <p>Ada yang datang karena ingin lebih paham dirinya. Ada yang sedang mencari cara berkomunikasi dengan pasangan atau anak. Ada pula yang ingin menjadikan STIFIn sebagai jalan belajar dan profesi. Mulailah dari kebutuhan yang paling dekat dengan Anda.</p>
      </section>

      <section className="journey-grid" aria-label="Pilihan perjalanan">
        {journeys.map((item) => <article className={`journey-card ${item.tone}`} key={item.href}>
          <header><span>{item.eyebrow}</span><b>{item.number}</b></header>
          <h2>{item.title}</h2><p>{item.description}</p>
          <Link href={item.href}>{item.action} <span>→</span></Link>
        </article>)}
      </section>

      <section className="hub-foundation">
        <div className="hub-foundation-copy"><span>SETELAH TAHU HASILNYA</span><h2>Tes memberi nama pada pola. Pemahaman membuatnya berguna.</h2><p>Hasil STIFIn adalah awal percakapan tentang cara Anda menyerap informasi, mengambil keputusan, bergerak, dan bertumbuh. Nilainya terasa ketika hasil dibahas dengan baik lalu diterapkan sesuai situasi nyata—bukan ketika dipakai untuk membatasi diri.</p><Link href="/edukasi">Lihat cara menerapkannya →</Link></div>
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
        <div><span>LANGKAH PERTAMA</span><h2>Tidak harus memahami semuanya hari ini. Mulai saja dari pertanyaan yang sedang Anda bawa.</h2></div>
        <div><Link className="public-cta big" href="/tes-stifin">Pilih layanan tes →</Link><Link href="/jadi-promotor">Kenali jalur promotor</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
