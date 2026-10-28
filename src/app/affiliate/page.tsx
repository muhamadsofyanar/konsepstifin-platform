import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import JsonLd from '../json-ld';
import { getPublicManagedProducts } from '@/lib/product-store';

export const metadata: Metadata = {
  title: 'Affiliate KonsepSTIFIn | Produk, Tautan & Komisi',
  description: 'Kenali program Affiliate Umum dan Affiliate Promotor, manfaat, cara kerja, pencatatan transaksi, serta jalur pendaftarannya.',
  alternates: { canonical: '/affiliate' },
};
export const dynamic = 'force-dynamic';

const benefits = [
  ['01', 'Mulai tanpa menjalankan tes', 'Anda berfokus mengenalkan layanan dan mengarahkan calon peserta ke halaman produk yang tepat.'],
  ['02', 'Tautan khusus per produk', 'Salin tautan pribadi dari pusat mitra. Pengunjung diarahkan ke detail produk yang sama dengan katalog.'],
  ['03', 'Status komisi yang bisa dipantau', 'Lihat komisi menunggu tinjauan, tersedia, atau sudah dicairkan sesuai transaksi dan persetujuan admin.'],
  ['04', 'Katalog yang terhubung', 'Gunakan halaman produk serta artikel edukasi yang sama saat menjelaskan pilihan kepada calon klien.'],
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

  };
  return <div className="public-site journey-site affiliate-landing">
    <JsonLd data={affiliateSchema} />
    <PublicHeader active="affiliate" announcement="Program rekomendasi layanan STIFIn · Ketentuan dikonfirmasi bersama tim" ctaHref="/akun/mitra" ctaLabel="Pusat mitra" />
    <main id="main-content">
      <section className="affiliate-hero">
        <div><span className="eyebrow">PROGRAM AFFILIATE KONSEP STIFIn</span><h1>Rekomendasikan yang relevan. Pantau hasilnya dalam satu tempat.</h1><p>Pilih produk, bagikan tautan pribadi, dan pantau komisi melalui pusat mitra KonsepSTIFIn. Produk layanan, kelas, dan ebook terhubung dengan pencatatan yang sama. Aktivasi mitra dan aturan komisi dikelola admin.</p><div className="hub-actions"><Link className="public-cta big" href="/akun/mitra">Buka pusat mitra →</Link><Link href="#program">Pelajari program affiliate</Link></div></div>
        <figure className="journey-hero-media affiliate-hero-media"><Image src="/images/hero-promotor-v3.webp" alt="Komunitas Muslim Indonesia belajar membangun komunikasi dan jaringan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload /><figcaption className="media-story-card"><small>ALUR SEDERHANA</small><b>Pilih produk → Bagikan → Pantau</b><span>Edukasi yang baik lebih penting daripada sekadar menyebar tautan</span></figcaption></figure>
      </section>

      <section className="section affiliate-benefits"><div className="section-heading"><span>MANFAAT PROGRAM</span><h2>Bukan hanya mendapat tautan. Anda mendapat cara kerja yang lebih terarah.</h2><p>Program ini dirancang untuk membantu affiliate mengedukasi calon peserta, mengarahkan mereka ke produk yang sesuai, dan membangun kepercayaan secara bertahap.</p></div><div className="benefit-grid">{benefits.map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section id="program" className="section affiliate-section standalone-affiliate"><div className="section-heading"><span>PROGRAM & KETENTUAN</span><h2>Pilih jalur yang sesuai dengan posisi Anda sekarang.</h2><p>Ketersediaan program, biaya, produk, serta ketentuan imbalan dikonfirmasi bersama admin. Akun mitra yang sudah aktif dapat mengakses tautan produk, status komisi, dan pengajuan pencairan. Persetujuan serta transfer pencairan tetap dilakukan admin.</p></div><div className="affiliate-grid">{affiliatePrograms.map((program) => <article className={program.featured ? 'affiliate-card official' : 'affiliate-card'} key={program.title}><small>{program.eyebrow}</small><h3>{program.title}</h3><div className="affiliate-price"><b>{program.price}</b><span>{program.priceNote}</span></div><p>{program.description}</p><ul>{program.features.map((point) => <li key={point}>✓ {point}</li>)}</ul><Link href="/kontak#affiliate">Ajukan kerja sama →</Link></article>)}</div></section>

      <section id="cara-kerja" className="process-section affiliate-process"><div><span>CARA KERJA</span><h2>Mulai dari informasi dan kesepakatan yang jelas.</h2><p>Affiliate tetap perlu menjelaskan dengan jujur. Jangan menjanjikan hasil tes, diagnosis, penghasilan, atau manfaat yang tidak dapat dibuktikan.</p></div><ol><li><b>01</b><div><h3>Aktifkan akun mitra</h3><p>Ajukan kerja sama dan tunggu aktivasi peran mitra dari admin. Satu akun dapat dipakai untuk belajar dan aktivitas mitra.</p></div></li><li><b>02</b><div><h3>Pilih tautan produk</h3><p>Buka pusat mitra, periksa produk serta aturan komisinya, lalu salin tautan promosi.</p></div></li><li><b>03</b><div><h3>Bagikan dengan edukasi</h3><p>Rekomendasikan produk sesuai kebutuhan. Untuk layanan tes, calon klien mengisi formulir dan persetujuan kontak.</p></div></li><li><b>04</b><div><h3>Pantau dan ajukan pencairan</h3><p>Komisi mengikuti pembayaran sah dan tinjauan admin. Saldo yang tersedia dapat diajukan untuk transfer manual.</p></div></li></ol></section>

      <section className="affiliate-ethics"><div><span>PROMOSI YANG MENJAGA KEPERCAYAAN</span><h2>Lebih baik relevan daripada ramai.</h2></div><ul><li>Gunakan informasi harga dan fasilitas yang sama dengan halaman produk.</li><li>Nyatakan hubungan affiliate dengan terbuka saat membagikan rekomendasi.</li><li>Jangan menjadikan hasil STIFIn sebagai diagnosis atau jaminan masa depan.</li><li>Jaga data calon peserta dan jangan meminta data sidik jari secara online.</li></ul></section>

      <section className="final-cta"><div><span>MULAI DARI JALUR YANG PALING RINGAN</span><h2>Kenali programnya, pahami aturannya, lalu mulai berbagi dengan cara yang baik.</h2><p>Hubungi tim untuk membicarakan ketersediaan dan ketentuan kerja sama.</p></div><div><Link className="public-cta big" href="/kontak#affiliate">Ajukan kerja sama →</Link><Link href="/jadi-promotor">Bandingkan dengan jalur promotor</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
