import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { getPublicManagedProducts } from '@/lib/product-store';

export const metadata: Metadata = {
  title: 'Affiliate Konsep STIFIn — Mulai Berbagi, Bangun Penghasilan',
  description: 'Kenali program Affiliate Umum dan Affiliate Promotor, manfaat, cara kerja, pencatatan transaksi, serta jalur pendaftarannya.',
  alternates: { canonical: '/affiliate' },
};
export const dynamic = 'force-dynamic';

const benefits = [
  ['01', 'Mulai tanpa menjalankan tes', 'Anda berfokus mengenalkan layanan dan mengarahkan calon peserta ke halaman produk yang tepat.'],
  ['02', 'Tautan referral pribadi', 'Setiap affiliate menggunakan tautan sendiri agar sumber transaksi dapat dikenali oleh sistem.'],
  ['03', 'Transaksi tercatat lebih rapi', 'Pesanan yang valid dicatat melalui SEJOLI sehingga proses evaluasi dan komisi lebih mudah ditelusuri.'],
  ['04', 'Materi promosi terarah', 'Gunakan materi kampanye, artikel edukasi, dan halaman produk tanpa harus menulis semuanya dari awal.'],
  ['05', 'Belajar membangun komunikasi', 'Latih cara menjelaskan manfaat secara jujur tanpa memaksa atau membuat janji berlebihan.'],
  ['06', 'Punya jalur untuk bertumbuh', 'Affiliate dapat menjadi langkah awal sebelum mempelajari jalur promotor lebih jauh.'],
];

export default async function AffiliateLandingPage() {
  const affiliatePrograms = await getPublicManagedProducts('affiliate');
  return <div className="public-site journey-site affiliate-landing">
    <PublicHeader active="affiliate" announcement="Program rekomendasi layanan STIFIn · Transaksi dan komisi dicatat melalui SEJOLI" ctaHref="#program" ctaLabel="Lihat program" />
    <main>
      <section className="affiliate-hero">
        <div><span className="eyebrow">PROGRAM AFFILIATE KONSEP STIFIn</span><h1>Mulai dari berbagi manfaat. Biarkan sistem membantu mencatat hasilnya.</h1><p>Rekomendasikan layanan yang memang relevan, gunakan tautan referral pribadi, lalu pantau transaksi valid melalui sistem SEJOLI.</p><div className="hub-actions"><Link className="public-cta big" href="#program">Pilih jalur affiliate →</Link><Link href="#cara-kerja">Lihat cara kerjanya</Link></div></div>
        <figure className="journey-hero-media affiliate-hero-media"><Image src="/images/hero-promotor-v3.webp" alt="Komunitas Muslim Indonesia belajar membangun komunikasi dan jaringan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload /><figcaption className="media-story-card"><small>ALUR SEDERHANA</small><b>Bagikan → Transaksi → Komisi</b><span>Edukasi yang baik lebih penting daripada sekadar menyebar tautan</span></figcaption></figure>
      </section>

      <section className="section affiliate-benefits"><div className="section-heading"><span>MANFAAT PROGRAM</span><h2>Bukan hanya mendapat tautan. Anda mendapat cara kerja yang lebih terarah.</h2><p>Program ini dirancang untuk membantu affiliate mengedukasi calon peserta, mengarahkan mereka ke produk yang sesuai, dan membangun kepercayaan secara bertahap.</p></div><div className="benefit-grid">{benefits.map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section id="program" className="section affiliate-section standalone-affiliate"><div className="section-heading"><span>PROGRAM & KETENTUAN</span><h2>Pilih jalur yang sesuai dengan posisi Anda sekarang.</h2><p>Biaya, persentase komisi, masa atribusi, dan produk yang dapat dipromosikan akan mengikuti pengaturan final di SEJOLI.</p></div><div className="affiliate-grid">{affiliatePrograms.map((program) => <article className={program.featured ? 'affiliate-card official' : 'affiliate-card'} key={program.title}><small>{program.eyebrow}</small><h3>{program.title}</h3><div className="affiliate-price"><b>{program.price}</b><span>{program.priceNote}</span></div><p>{program.description}</p><ul>{program.features.map((point) => <li key={point}>✓ {point}</li>)}</ul><PublicInterestAction linkKey={program.productKey} checkoutUrl={program.checkoutUrl} label={`${program.action} →`} service={program.title} /></article>)}</div></section>

      <section id="cara-kerja" className="process-section affiliate-process"><div><span>CARA KERJA</span><h2>Empat langkah dari rekomendasi sampai pencatatan komisi.</h2><p>Affiliate tetap perlu menjelaskan dengan jujur. Jangan menjanjikan hasil tes, diagnosis, penghasilan, atau manfaat yang tidak dapat dibuktikan.</p></div><ol><li><b>01</b><div><h3>Daftar dan aktifkan akun</h3><p>Pilih jalur affiliate lalu lengkapi data yang diperlukan.</p></div></li><li><b>02</b><div><h3>Ambil tautan referral</h3><p>Gunakan tautan pribadi untuk produk atau kampanye yang tersedia.</p></div></li><li><b>03</b><div><h3>Bagikan dengan edukasi</h3><p>Hubungkan produk dengan kebutuhan nyata calon peserta, bukan dengan tekanan.</p></div></li><li><b>04</b><div><h3>Transaksi divalidasi</h3><p>Komisi mengikuti transaksi valid dan ketentuan program yang berlaku.</p></div></li></ol></section>

      <section className="affiliate-ethics"><div><span>PROMOSI YANG MENJAGA KEPERCAYAAN</span><h2>Lebih baik relevan daripada ramai.</h2></div><ul><li>Gunakan informasi harga dan fasilitas yang sama dengan halaman produk.</li><li>Nyatakan hubungan affiliate dengan terbuka saat membagikan rekomendasi.</li><li>Jangan menjadikan hasil STIFIn sebagai diagnosis atau jaminan masa depan.</li><li>Jaga data calon peserta dan jangan meminta data sidik jari secara online.</li></ul></section>

      <section className="final-cta"><div><span>MULAI DARI JALUR YANG PALING RINGAN</span><h2>Kenali programnya, pahami aturannya, lalu mulai berbagi dengan cara yang baik.</h2><p>Setelah produk SEJOLI aktif, tombol pada halaman ini akan langsung mengarah ke pendaftaran atau checkout yang sesuai.</p></div><div><PublicInterestAction className="public-cta big" linkKey="affiliateUmum" label="Minat Affiliate Umum →" service="Affiliate Umum" /><Link href="/jadi-promotor">Bandingkan dengan jalur promotor</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
