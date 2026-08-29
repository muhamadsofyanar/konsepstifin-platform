import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';
import { PublicFooter, PublicHeader } from './public-site-shell';
import { getPublicManagedProducts } from '@/lib/product-store';
import ActivityGallery from './activity-gallery';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tes STIFIn dan Promotor di Indonesia | Konsep STIFIn',
  description: 'Kenali Mesin Kecerdasan melalui Tes STIFIn offline, temukan promotor berdasarkan wilayah, dan pelajari jalur affiliate atau profesi.',
  alternates: { canonical: '/' },
};

const journeys = [
  {
    number: '01', eyebrow: 'LAYANAN PESERTA', title: 'Tes STIFIn',
    description: 'Berhenti menebak cara yang cocok. Pilih paket personal, pasangan, keluarga, atau kelompok, lalu lakukan tes offline bersama promotor.',
    href: '/tes-stifin', action: 'Bandingkan paket tes', tone: 'forest',
  },
  {
    number: '02', eyebrow: 'PUSAT PENGETAHUAN', title: 'Artikel & Edukasi',
    description: 'Belum ingin mengambil tes? Mulai dari bacaan yang membantu Anda memahami istilah, proses, manfaat, dan batas penggunaan STIFIn.',
    href: '/edukasi', action: 'Pelajari STIFIn dulu', tone: 'mint',
  },
  {
    number: '03', eyebrow: 'JALUR PROFESI', title: 'Jadi Promotor',
    description: 'Ingin mendampingi peserta dan membangun layanan STIFIn? Lihat peran, tahapan belajar, biaya, dan syarat sebelum memutuskan.',
    href: '/jadi-promotor', action: 'Lihat jalur promotor', tone: 'sand',
  },
  {
    number: '04', eyebrow: 'JALUR REKOMENDASI', title: 'Program Affiliate',
    description: 'Belum siap menjalankan tes? Rekomendasikan layanan yang relevan melalui tautan referral dengan transaksi tercatat di SEJOLI.',
    href: '/affiliate', action: 'Lihat jalur affiliate', tone: 'leaf',
  },
];

export default async function Home() {
  const latestArticles = await getPublishedArticles(3);
  const [publicProducts, promoterSteps, affiliatePrograms] = await Promise.all([
    getPublicManagedProducts('test'), getPublicManagedProducts('promoter'), getPublicManagedProducts('affiliate'),
  ]);

  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Tes STIFIn dilakukan offline bersama promotor · Tersedia untuk peserta di berbagai kota" />
    <main>
      <section className="hub-hero">
        <div className="hub-hero-copy">
          <span className="eyebrow">TES STIFIn OFFLINE · UNTUK DIRI, KELUARGA, DAN PROFESI</span>
          <h1>Sudah berusaha keras, tetapi cara belajar, bekerja, atau berkomunikasi masih terasa <em>tidak pas?</em></h1>
          <p>Berhenti menebak-nebak. Kenali Mesin Kecerdasan melalui Tes STIFIn offline, bahas hasilnya bersama promotor, lalu pilih penyesuaian yang paling relevan untuk situasi Anda.</p>
          <div className="hub-actions"><Link className="public-cta big" href="/tes-stifin#layanan">Bandingkan paket tes →</Link><Link href="/tes-stifin#proses">Lihat proses tes</Link></div>
        </div>
        <figure className="journey-hero-media home-hero-media">
          <Image src="/images/hero-home-v3.webp" alt="Keluarga Muslim Indonesia berbincang dan saling mendengarkan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload />
          <figcaption className="media-story-card"><small>PERJALANAN ANDA</small><b>Kenali diri</b><span>Pahami perbedaan · Tumbuh bersama</span></figcaption>
        </figure>
      </section>

      <section className="life-situations" aria-label="Situasi yang sering dialami">
        <article><small>DI RUMAH</small><p>Penjelasan yang sama sudah diulang, tetapi anak atau pasangan tetap menangkapnya secara berbeda.</p><span>Dapatkan bahasa awal untuk membahas perbedaan cara menerima informasi.</span></article>
        <article><small>DALAM DIRI</small><p>Anda mampu melakukan banyak hal, tetapi belum tahu aktivitas mana yang terasa paling alami.</p><span>Gunakan hasil sebagai bahan refleksi, bukan sebagai label yang membatasi.</span></article>
        <article><small>DI TEMPAT KERJA</small><p>Satu cara memberi arahan ternyata tidak menghasilkan respons yang sama pada setiap orang.</p><span>Mulai menyesuaikan komunikasi tanpa harus terus menebak.</span></article>
      </section>

      <section className="hub-purpose">
        <div><span>MULAI DARI MASALAH YANG NYATA</span><h2>Satu cara tidak selalu cocok untuk semua orang. Kenali polanya sebelum mengubah strateginya.</h2></div>
        <p>Pilih jalur sesuai kebutuhan Anda sekarang. Ikuti tes bila ingin mengetahui hasil pribadi, mulai dari edukasi bila masih ingin memahami konsep, atau pelajari jalur promotor dan affiliate bila tujuan Anda adalah membangun layanan.</p>
      </section>

      <section className="journey-grid" aria-label="Pilihan perjalanan">
        {journeys.map((item) => <article className={`journey-card ${item.tone}`} key={item.href}>
          <header><span>{item.eyebrow}</span><b>{item.number}</b></header>
          <h2>{item.title}</h2><p>{item.description}</p>
          <Link href={item.href}>{item.action} <span>→</span></Link>
        </article>)}
      </section>

      <section className="section home-catalog" aria-label="Ringkasan produk dan harga">
        <div className="section-heading"><span>PRODUK & HARGA SEJOLI</span><h2>Bandingkan pilihan tanpa membuka banyak halaman.</h2><p>Lihat jenis layanan dan kisaran biaya terlebih dahulu. Rincian manfaat, syarat, fasilitas, dan harga final tetap ditampilkan kembali sebelum pembayaran di SEJOLI.</p></div>
        <div className="journey-grid catalog-overview">
          <article className="journey-card forest"><header><span>LAYANAN TES</span><b>01</b></header><h2>Personal & Keluarga</h2><p>{publicProducts.map((product) => `${product.title}: ${product.price}`).join(' · ')}</p><Link href="/tes-stifin">Lihat seluruh paket tes <span>→</span></Link></article>
          <article className="journey-card sand"><header><span>JALUR PROFESI</span><b>02</b></header><h2>Tahapan Promotor</h2><p>{promoterSteps.slice(1).map((product) => `${product.title}: ${product.price}`).join(' · ')}</p><Link href="/jadi-promotor">Lihat tahapan promotor <span>→</span></Link></article>
          <article className="journey-card leaf"><header><span>JALUR REKOMENDASI</span><b>03</b></header><h2>Program Affiliate</h2><p>{affiliatePrograms.map((product) => `${product.title}: ${product.price}`).join(' · ')}</p><Link href="/affiliate">Lihat program affiliate <span>→</span></Link></article>
        </div>
      </section>

      <ActivityGallery />

      <section className="hub-foundation">
        <div className="hub-foundation-copy"><span>SETELAH TAHU HASILNYA</span><h2>Jangan berhenti pada nama tipe. Bawa hasilnya ke situasi yang benar-benar Anda hadapi.</h2><p>Gunakan pembahasan hasil untuk menyusun pertanyaan, mencoba penyesuaian kecil, dan melihat respons dalam keseharian. Hasil tes menjadi lebih berguna ketika dipahami bersama konteks, bukan dipakai sebagai cap permanen.</p><Link href="/edukasi">Lihat contoh penerapannya →</Link></div>
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
        <div><span>LANGKAH PERTAMA</span><h2>Pilih kebutuhan Anda, lihat rincian biayanya, lalu lanjutkan hanya ketika sudah yakin.</h2></div>
        <div><Link className="public-cta big" href="/tes-stifin#layanan">Bandingkan paket tes →</Link><Link href="/jadi-promotor#tahapan">Lihat tahapan promotor</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
