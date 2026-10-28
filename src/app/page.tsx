import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';
import { PublicFooter, PublicHeader } from './public-site-shell';
import { getPublicManagedProducts } from '@/lib/product-store';
import ActivityGallery from './activity-gallery';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Konsep STIFIn | Tes, Kelas, Ebook & Affiliate',
  description: 'Temukan layanan Tes STIFIn, kelas, ebook, serta jalur promotor dan affiliate dalam satu platform KonsepSTIFIn.',
  alternates: { canonical: '/' },
};

const journeys = [
  {
    number: '01', eyebrow: 'LAYANAN PESERTA', title: 'Tes STIFIn',
    description: 'Ingin mengenali Mesin Kecerdasan Anda? Pilih layanan personal, keluarga, atau institusi. Tes dilakukan langsung bersama promotor.',
    href: '/tes-stifin', action: 'Saya ingin ikut tes', tone: 'forest',
  },
  {
    number: '02', eyebrow: 'PUSAT PENGETAHUAN', title: 'Kelas & Ebook',
    description: 'Pilih materi yang sesuai kebutuhan. Akses kelas, video, ebook, dan progres belajar melalui satu akun.',
    href: '/belajar?tab=catalog', action: 'Jelajahi kelas & ebook', tone: 'mint',
  },
  {
    number: '03', eyebrow: 'JALUR CALON PROMOTOR', title: 'Calon Promotor',
    description: 'Ingin memahami peran promotor? Pelajari Preview, WSL, aktivasi, tanggung jawab layanan, dan kebutuhan biayanya sebelum berkomitmen.',
    href: '/jadi-promotor', action: 'Saya ingin mengenal profesinya', tone: 'sand',
  },
  {
    number: '04', eyebrow: 'JALUR REKOMENDASI', title: 'Program Affiliate',
    description: 'Belum siap menjadi promotor? Pelajari cara merekomendasikan layanan dan diskusikan ketentuan kerja sama dengan tim.',
    href: '/affiliate', action: 'Saya ingin mengenal affiliate', tone: 'leaf',
  },
];

export default async function Home() {
  const latestArticles = await getPublishedArticles(3);
  const [publicProducts, promoterSteps, affiliatePrograms] = await Promise.all([
    getPublicManagedProducts('test'), getPublicManagedProducts('promoter'), getPublicManagedProducts('affiliate'),
  ]);

  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Tes STIFIn, kelas, ebook, dan aktivitas mitra dalam satu platform" />
    <main id="main-content">
      <section className="hub-hero">
        <div className="hub-hero-copy">
          <span className="eyebrow">KONSEP STIFIN · DALAM JARINGAN STIFIN GENETIC</span>
          <h1>Kenali diri.<br/><em>Temukan langkah berikutnya.</em></h1>
          <p>Mulai dari kebutuhan yang paling dekat: memahami diri dan keluarga, belajar melalui kelas dan ebook, atau bertumbuh bersama jaringan promotor dan affiliate.</p>
          <div className="hub-actions"><Link className="public-cta big" href="/belajar?tab=catalog">Jelajahi produk & layanan →</Link><Link href="/tes-stifin#layanan">Bandingkan paket tes ↗</Link></div><div className="public-proof-strip"><span>✓ Tes tatap muka</span><span>✓ Kelas & ebook</span><span>✓ Satu akun</span></div>
        </div>
        <figure className="journey-hero-media home-hero-media">
          <Image src="/images/hero-home-v3.webp" alt="Keluarga Muslim Indonesia berbincang dan saling mendengarkan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload />
          <figcaption className="media-story-card"><small>PERJALANAN ANDA</small><b>Kenali diri</b><span>Pahami perbedaan · Tumbuh bersama</span></figcaption>
        </figure>
      </section>

      <section className="life-situations" aria-label="Situasi yang sering dialami">
        <article><small>DI RUMAH</small><p>“Sudah dijelaskan berkali-kali, kenapa cara menangkapnya tetap berbeda?”</p><span>Pahami cara belajar dan berkomunikasi.</span></article>
        <article><small>DALAM DIRI</small><p>“Saya bisa banyak hal, tetapi mana yang paling alami untuk saya?”</p><span>Kenali pola kerja yang terasa lebih mengalir.</span></article>
        <article><small>DI TEMPAT KERJA</small><p>“Mengapa satu cara memotivasi tidak cocok untuk semua orang?”</p><span>Lihat perbedaan sebagai petunjuk, bukan hambatan.</span></article>
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

      <section className="section home-catalog" aria-label="Ringkasan produk dan harga">
        <div className="section-heading"><span>PILIHAN & HARGA</span><h2>Apa yang sedang Anda butuhkan sekarang?</h2><p>Bandingkan layanan tes, tahap calon promotor, atau program affiliate. Harga yang tampil berasal dari katalog dan diperiksa kembali sebelum transaksi.</p></div>
        <div className="journey-grid catalog-overview">
          <article className="journey-card forest"><header><span>LAYANAN TES</span><b>01</b></header><h2>Personal & Keluarga</h2><ul className="catalog-price-list">{publicProducts.map(p=><li key={p.productKey}><Link href={'/produk/layanan/'+p.productKey}><span>{p.title}</span><strong>{p.price}</strong></Link></li>)}</ul><Link href="/tes-stifin">Bandingkan semua paket <span>→</span></Link></article>
          <article className="journey-card sand"><header><span>JALUR PROFESI</span><b>02</b></header><h2>Tahapan Promotor</h2><ul className="catalog-price-list">{promoterSteps.filter(p=>['wsl1','wsl2','idDanAlat','paketPromotor'].includes(p.productKey)).map(p=><li key={p.productKey}><Link href={'/produk/layanan/'+p.productKey}><span>{p.title}</span><strong>{p.price}</strong></Link></li>)}</ul><Link href="/jadi-promotor">Pahami tahap dan biayanya <span>→</span></Link></article>
          <article className="journey-card mint"><header><span>RUANG BELAJAR</span><b>03</b></header><h2>Kelas & Ebook</h2><p>Pilih topik yang ingin Anda pelajari. Video, materi, dan ebook yang dimiliki tersedia di Akses saya, dengan progres belajar yang tersimpan.</p><div className="catalog-digital-tags"><span>Video pembelajaran</span><span>Ebook privat</span><span>Progres belajar</span></div><Link href="/belajar?tab=catalog">Jelajahi katalog terbaru <span>→</span></Link></article>
          <article className="journey-card leaf"><header><span>JALUR REKOMENDASI</span><b>04</b></header><h2>Produk & Affiliate</h2><p>Bagikan tautan produk yang relevan. Akun mitra yang sudah diaktifkan dapat melihat produk promosi, komisi, dan pengajuan pencairan dalam satu pusat mitra.</p><ul className="catalog-program-list">{affiliatePrograms.map(p=><li key={p.productKey}>{p.title}</li>)}</ul><Link href="/affiliate">Lihat cara kerja affiliate <span>→</span></Link></article>
        </div>
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
        <div><span>PILIH SATU LANGKAH</span><h2>Mulai dari tujuan Anda, lalu ikuti alur yang memang dibuat untuk tujuan itu.</h2></div>
        <div><Link className="public-cta big" href="/tes-stifin">Bandingkan layanan tes →</Link><Link href="/jadi-promotor">Pelajari jalur calon promotor</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
