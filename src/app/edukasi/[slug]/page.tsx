import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bodyToBlocks, getPublishedArticleBySlug, getPublishedArticles } from '@/lib/article-store';
import ArticleEngagement from './article-engagement';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Konsep STIFIn`,
    description: article.excerpt,
    openGraph: { title: article.title, description: article.excerpt, type: 'article', publishedTime: article.publishedAt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();
  const related = (await getPublishedArticles(4)).filter((item) => item.slug !== article.slug).slice(0, 3);
  const blocks = bodyToBlocks(article.body);

  return <main className="article-main">
    <section className="article-heading"><Link href="/edukasi">← Kembali ke pusat edukasi</Link><div><span>{article.category}</span><span>{article.readTime}</span><time dateTime={article.publishedAt}>{article.publishedLabel}</time></div><h1>{article.title}</h1><p>{article.excerpt}</p></section>
    <div className={`article-hero-cover article-cover ${article.tone}`}><span>{article.category}</span><b>WAWASAN<br/>UNTUK<br/>BERTUMBUH</b><small>KONSEP STIFIn · EDUKASI</small></div>
    <div className="article-layout">
      <article className="article-body">
        {blocks.map((block) => <section key={block.heading}><h2>{block.heading}</h2>{block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{block.bullets && <ul>{block.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
        <aside className="article-takeaway"><span>INTI ARTIKEL</span><p>{article.takeaway}</p></aside>
        <div className="article-disclaimer"><b>Catatan edukasi</b><p>Artikel ini bersifat umum dan tidak dimaksudkan sebagai diagnosis atau pengganti layanan medis, psikologis, pendidikan, maupun profesional lainnya.</p></div>
        <ArticleEngagement slug={article.slug} title={article.title} />
      </article>
      <aside className="article-side"><div><span>TENTANG EDUKASI</span><p>Kami menyajikan materi sebagai bahan refleksi dan percakapan yang dapat disesuaikan dengan konteks pembaca.</p></div><Link className="public-cta" href="/#produk">Pilih layanan →</Link></aside>
    </div>

    <section className="related-articles"><div className="education-section-head"><div><span>BACA SELANJUTNYA</span><h2>Artikel terkait.</h2></div><Link href="/edukasi">Lihat semua artikel →</Link></div><div className="related-grid">{related.map((item) => <Link href={`/edukasi/${item.slug}`} key={item.slug}><span>{item.category}</span><h3>{item.title}</h3><small>{item.readTime} →</small></Link>)}</div></section>
  </main>;
}
