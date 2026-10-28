import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import JsonLd from '../json-ld';
import { platformLinks } from '../site-config';
import { getPublicManagedProducts } from '@/lib/product-store';

export const metadata: Metadata = {
  title: 'Affiliate Konsep STIFIn — Cara Kerja dan Ketentuan',
  description: 'Kenali program Affiliate Umum dan Affiliate Promotor, manfaat, cara kerja, pencatatan transaksi, serta jalur pendaftarannya.',
  alternates: { canonical: '/affiliate' },
};
export const dynamic = 'force-dynamic';

const benefits = [
  ['01', 'Mulai tanpa menjalankan tes', 'Anda berfokus mengenalkan layanan dan mengarahkan calon peserta ke halaman produk yang tepat.'],
  ['02', 'Diskusikan bentuk rekomendasi', 'Tim menjelaskan cara menyampaikan rekomendasi dan mencatat sumber permintaan sesuai kesepakatan.'],
  ['03', 'Transaksi tercatat lebih rapi', 'Admin mencatat pesanan dan meninjau kerja sama secara manual sesuai ketentuan yang disepakati.'],
  ['04', 'Materi promosi terarah', 'Gunakan materi kampanye, artikel edukasi, dan halaman produk tanpa harus menulis semuanya dari awal.'],
  ['05', 'Belajar membangun komunikasi', 'Latih cara menjelaskan manfaat secara jujur tanpa memaksa atau membuat janji berlebihan.'],
  ['06', 'Punya jalur untuk bertumbuh', 'Affiliate dapat menjadi langkah awal sebelum mempelajari jalur promotor lebih jauh.'],
];

export default async function AffiliateLandingPage() {
  const affiliatePrograms = await getPublicManagedProducts('affiliate');
  const affiliateSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://konsepstifin.com/affiliate#service',
    name: 'Program Affiliate Konsep STIFIn',
    description: 'Informasi kerja sama rekomendasi layanan STIFIn dan konsultasi ketentuan bersama tim.',
    url: 'https://konsepstifin.com/affiliate',
    provider: { '@id': 'https://konsepstifin.com/#organization' },
    areaServed: { '@type': 'Country', name: 'Indonesia' },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      url: platformLinks.affiliateRegistration,
      availability: 'https://schema.org/InStock',
    },
  };
  return <div className="public-site journey-site affiliate-landing">
    <JsonLd data={affiliateSchema} />
    <PublicHeader active="affiliate" announcement="Program rekomendasi layanan STIFIn · Ketentuan dikonfirmasi bersama tim" ctaHref={platformLinks.affiliateRegistration} ctaLabel="Pelajari program" />
    <main>
      <section className="affiliate-hero">
        <div><span className="eyebrow">PROGRAM AFFILIATE KONSEP STIFIn</span><h1>Pahami cara merekomendasikan layanan dan ketentuan kerja sama bersama tim.</h1><p>Program ini memperkenalkan kerja sama rekomendasi layanan. Bentuk rekomendasi, pencatatan, dan ketentuan imbalan perlu dibicarakan langsung dengan tim; tidak ada jaminan transaksi atau penghasilan.</p><div className="hub-actions"><Link className="public-cta big" href="#program">Bandingkan program affiliate →</Link><Link href="/kontak">Hubungi tim untuk informasi kerja sama →</Link></div></div>
        <figure className="journey-hero-media affiliate-hero-media"><Image src="/images/hero-promotor-v3.webp" alt="Komunitas Muslim Indonesia belajar membangun komunikasi dan jaringan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload /><figcaption className="media-story-card"><small>ALUR SEDERHANA</small><b>Pelajari → Diskusikan → Sepakati</b><span>Edukasi yang baik lebih penting daripada sekadar menyebar tautan</span></figcaption></figure>
      </section>

      <section className="section affiliate-benefits"><div className="section-heading"><span>MANFAAT PROGRAM</span><h2>Bukan hanya mendapat tautan. Anda mendapat cara kerja yang lebih terarah.</h2><p>Program ini dirancang untuk membantu affiliate mengedukasi calon peserta, mengarahkan mereka ke produk yang sesuai, dan membangun kepercayaan secara bertahap.</p></div><div className="benefit-grid">{benefits.map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section id="program" className="section affiliate-section standalone-affiliate"><div className="section-heading"><span>PROGRAM & KETENTUAN</span><h2>Pilih jalur yang sesuai dengan posisi Anda sekarang.</h2><p>Ketersediaan program, biaya, produk, serta ketentuan imbalan dikonfirmasi bersama admin. Website ini belum menyediakan akun affiliate atau pembayaran komisi otomatis.</p></div><div className="affiliate-grid">{affiliatePrograms.map((program) => <article className={program.featured ? 'affiliate-card official' : 'affiliate-card'} key={program.title}><small>{program.eyebrow}</small><h3>{program.title}</h3><div className="affiliate-price"><b>{program.price}</b><span>{program.priceNote}</span></div><p>{program.description}</p><ul>{program.features.map((point) => <li key={point}>✓ {point}</li>)}</ul><Link href="/kontak">Diskusikan kerja sama dengan tim →</Link></article>)}</div></section>

      <section id="cara-kerja" className="process-section affiliate-process"><div><span>CARA KERJA</span><h2>Mulai dari informasi dan kesepakatan yang jelas.</h2><p>Affiliate tetap perlu menjelaskan dengan jujur. Jangan menjanjikan hasil tes, diagnosis, penghasilan, atau manfaat yang tidak dapat dibuktikan.</p></div><ol><li><b>01</b><div><h3>Pelajari program</h3><p>Baca informasi program dan tentukan kebutuhan konsultasi.</p></div></li><li><b>02</b><div><h3>Diskusikan ketentuan</h3><p>Bicarakan produk, cara rekomendasi, dan ketentuan imbalan dengan tim.</p></div></li><li><b>03</b><div><h3>Bagikan dengan edukasi</h3><p>Hubungkan produk dengan kebutuhan nyata calon peserta, bukan dengan tekanan.</p></div></li><li><b>04</b><div><h3>Tinjau bersama admin</h3><p>Pencatatan dan ketentuan kerja sama ditinjau admin sesuai kesepakatan.</p></div></li></ol></section>

      <section className="affiliate-ethics"><div><span>PROMOSI YANG MENJAGA KEPERCAYAAN</span><h2>Lebih baik relevan daripada ramai.</h2></div><ul><li>Gunakan informasi harga dan fasilitas yang sama dengan halaman produk.</li><li>Nyatakan hubungan affiliate dengan terbuka saat membagikan rekomendasi.</li><li>Jangan menjadikan hasil STIFIn sebagai diagnosis atau jaminan masa depan.</li><li>Jaga data calon peserta dan jangan meminta data sidik jari secara online.</li></ul></section>

      <section className="final-cta"><div><span>MULAI DARI JALUR YANG PALING RINGAN</span><h2>Kenali programnya, pahami aturannya, lalu mulai berbagi dengan cara yang baik.</h2><p>Hubungi tim untuk membicarakan ketersediaan dan ketentuan kerja sama.</p></div><div><Link className="public-cta big" href="/kontak">Hubungi tim →</Link><Link href="/jadi-promotor">Bandingkan dengan jalur promotor</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
