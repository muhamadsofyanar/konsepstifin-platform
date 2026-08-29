import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Artikel dan Edukasi STIFIn | Konsep STIFIn',
  description: 'Baca materi tentang penggunaan hasil secara bertanggung jawab, komunikasi keluarga, proses belajar, dan kolaborasi.',
  alternates: { canonical: '/edukasi' },
};

export default async function EducationPage() {
  const [featured, ...otherArticles] = await getPublishedArticles();

  if (!featured) return <main className="education-main"><section className="education-empty"><span>PUSAT EDUKASI</span><h1>Artikel sedang disiapkan.</h1><p>Tim kami sedang menyiapkan materi edukasi terbaru. Silakan kembali lagi dalam beberapa waktu.</p><Link className="public-cta" href="/">Kembali ke beranda</Link></section></main>;

  return <main className="education-main">
    <section className="education-hero">
      <div><span>PUSAT EDUKASI</span><h1>Cari bacaan sesuai pertanyaan yang sedang Anda hadapi.</h1><p>Pilih materi tentang penggunaan hasil, komunikasi keluarga, proses belajar, atau kolaborasi. Setiap artikel diposisikan sebagai bahan refleksi, bukan diagnosis atau keputusan tunggal.</p></div>
      <aside><b>Prinsip kami</b><p>Informasi menjadi pembuka percakapan dan refleksi, bukan label yang membatasi seseorang.</p></aside>
    </section>

    <section className="featured-article">
      <div className={`article-cover ${featured.tone}`}><span>{featured.category}</span><b>01</b><small>ARTIKEL PILIHAN</small></div>
      <div className="featured-copy"><span>{featured.category} · {featured.readTime}</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><div><time dateTime={featured.publishedAt}>{featured.publishedLabel}</time><Link href={`/edukasi/${featured.slug}`}>Baca artikel →</Link></div></div>
    </section>

    <section className="education-library">
      <div className="education-section-head"><div><span>ARTIKEL TERBARU</span><h2>Wawasan yang dapat diterapkan sehari-hari.</h2></div><p>Topik akan terus ditambah untuk kebutuhan personal, keluarga, pendidikan, dan organisasi.</p></div>
      <div className="article-grid">{otherArticles.map((article, index) => <article className="article-card" key={article.slug}>
        <Link className={`article-cover ${article.tone}`} href={`/edukasi/${article.slug}`}><span>{article.category}</span><b>{String(index + 2).padStart(2, '0')}</b><small>{article.readTime}</small></Link>
        <div><span>{article.category}</span><h3><Link href={`/edukasi/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><div className="article-card-meta"><time dateTime={article.publishedAt}>{article.publishedLabel}</time><Link href={`/edukasi/${article.slug}`} aria-label={`Baca ${article.title}`}>→</Link></div></div>
      </article>)}</div>
    </section>

    <section className="education-cta"><div><span>SUDAH SIAP MEMBANDINGKAN LAYANAN?</span><h2>Lihat paket tes tanpa meninggalkan konteks penggunaannya.</h2><p>Formulir layanan mencatat kebutuhan dan kota untuk pencocokan promotor. Jadwal tetap berdasarkan konfirmasi.</p></div><Link className="public-cta big" href="/tes-stifin#layanan">Bandingkan layanan tes →</Link></section>
  </main>;
}
