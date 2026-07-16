import type { Metadata } from 'next';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { faqItems, publicProducts } from '../site-config';

export const metadata: Metadata = {
  title: 'Tes STIFIn Offline — Personal, Keluarga, dan Institusi',
  description: 'Pilih layanan Tes STIFIn untuk personal, keluarga, sekolah, komunitas, atau institusi. Tes dilakukan offline bersama promotor.',
  alternates: { canonical: '/tes-stifin' },
  openGraph: {
    title: 'Tes STIFIn Offline | Konsep STIFIn',
    description: 'Pilih layanan, konfirmasi kota dan jadwal, lalu ikuti tes secara offline bersama promotor.',
    url: '/tes-stifin',
  },
};

export default function TestLandingPage() {
  const testFaq = faqItems.filter((_, index) => [0, 1, 4].includes(index));

  return <div className="public-site journey-site test-landing">
    <PublicHeader active="test" announcement="Tes dilakukan offline · Pemesanan dan pembayaran diarahkan melalui SEJOLI" />
    <main>
      <section className="hero test-hero">
        <div className="hero-copy"><div className="eyebrow">TES STIFIn RESMI · OFFLINE</div><h1>Pilih layanan tes sesuai kebutuhan Anda.</h1><p>Untuk personal, keluarga, sekolah, komunitas, atau institusi. Proses pemindaian dan pembahasan hasil dilakukan langsung bersama promotor.</p><div className="hero-actions"><Link className="public-cta big" href="#layanan">Lihat pilihan layanan <span>→</span></Link><Link href="#proses">Pelajari prosesnya</Link></div><div className="trust-row"><span><b>Offline</b><small>bersama promotor</small></span><span><b>Terjadwal</b><small>sesuai kota peserta</small></span><span><b>Terarah</b><small>ada pembahasan hasil</small></span></div></div>
        <div className="hero-visual"><div className="orb orb-one"/><div className="orb orb-two"/><div className="result-card"><small>PERJALANAN PESERTA</small><div className="result-type"><span>01</span><div><b>Pilih layanan</b><small>Personal · Keluarga · Institusi</small></div></div><div className="journey-mini"><span><i/>Checkout aman di SEJOLI</span><span><i/>Konfirmasi lokasi & jadwal</span><span><i/>Tes offline dan penjelasan</span></div><p>“Satu alur yang jelas dari pemesanan hingga pembahasan.”</p></div><div className="floating-card"><span>✓</span><div><b>Bonus pembelajaran</b><small>Sesuai paket pilihan</small></div></div></div>
      </section>

      <section className="test-reassurance"><span>PERSONAL</span><span>KELUARGA</span><span>SEKOLAH</span><span>KOMUNITAS</span><span>INSTITUSI</span></section>

      <section className="section test-benefits"><div className="section-heading"><span>MENGAPA MENGIKUTI TES?</span><h2>Gunakan hasil sebagai bahan memahami dan berdiskusi.</h2><p>Hasil tidak dimaksudkan untuk membatasi seseorang. Ia dapat menjadi titik awal untuk membahas kebiasaan belajar, komunikasi, kerja sama, dan pengembangan diri.</p></div><div className="benefit-grid">{[
        ['01', 'Mengenali kecenderungan', 'Dapatkan bahasa awal untuk merefleksikan cara menerima dan mengolah informasi.'],
        ['02', 'Membuka percakapan', 'Bahas perbedaan dalam keluarga atau tim dengan sudut pandang yang lebih terbuka.'],
        ['03', 'Menyusun langkah praktis', 'Terjemahkan pembahasan hasil menjadi eksperimen kecil dalam kegiatan sehari-hari.'],
        ['04', 'Tetap melihat konteks', 'Gunakan hasil bersama pengalaman, kemampuan, kondisi, dan tujuan nyata seseorang.'],
      ].map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section id="layanan" className="section product-section"><div className="section-heading"><span>PILIHAN LAYANAN</span><h2>Mulai dari kebutuhan yang paling sesuai.</h2><p>Jika tautan SEJOLI sudah diaktifkan, tombol menuju checkout. Jika belum, formulir minat akan menyimpan permintaan Anda untuk ditindaklanjuti tim.</p></div><div className="product-grid">{publicProducts.map((product) => <article className={product.featured ? 'product-card featured-product' : 'product-card'} key={product.title}>{product.featured && <div className="product-ribbon">REKOMENDASI</div>}<small>{product.category}</small><h3>{product.title}</h3><p className="product-description">{product.description}</p><div className="product-price"><b>{product.price}</b><span>{product.priceNote}</span></div><div className="product-list"><strong>Yang didapat</strong>{product.features.map((item) => <span key={item}>✓ {item}</span>)}</div><div className="bonus-box"><strong>Bonus pilihan</strong>{product.bonuses.map((item) => <span key={item}>＋ {item}</span>)}</div><PublicInterestAction className="product-action" linkKey={product.linkKey} label={`${product.action} →`} service={product.title} /></article>)}</div><p className="price-note">Harga dan fasilitas final mengikuti informasi pada checkout SEJOLI. Tes STIFIn bukan layanan diagnosis medis atau psikologis.</p></section>

      <section id="proses" className="process-section"><div><span>PROSES TES</span><h2>Dipesan secara digital, dilakukan secara tatap muka.</h2><p>Website membantu memilih layanan dan mencatat kebutuhan. Pemindaian sidik jari tetap dilakukan langsung menggunakan perangkat bersama promotor.</p><Link className="dark-button" href="#layanan">Pilih layanan →</Link></div><ol><li><b>01</b><div><h3>Pilih layanan & checkout</h3><p>Pilih paket yang sesuai dan selesaikan pemesanan melalui SEJOLI.</p></div></li><li><b>02</b><div><h3>Konfirmasi kota & jadwal</h3><p>Tim mencocokkan peserta dengan promotor dan waktu yang tersedia.</p></div></li><li><b>03</b><div><h3>Pelaksanaan tes offline</h3><p>Pemindaian dilakukan secara langsung bersama promotor.</p></div></li><li><b>04</b><div><h3>Pembahasan hasil</h3><p>Peserta menerima hasil, penjelasan, dan fasilitas sesuai paket.</p></div></li></ol></section>

      <section className="section test-boundary"><div><span>GUNAKAN SECARA BIJAK</span><h2>Apa yang dapat dan tidak dapat dijawab oleh tes?</h2></div><div className="boundary-grid"><article><b>Dapat membantu</b><ul><li>Membuka refleksi dan percakapan</li><li>Memberi bahasa awal tentang kecenderungan</li><li>Mencoba pendekatan belajar atau komunikasi</li><li>Menyusun pertanyaan untuk pembahasan</li></ul></article><article><b>Tidak menggantikan</b><ul><li>Diagnosis medis atau psikologis</li><li>Penilaian kompetensi profesional</li><li>Keputusan pendidikan atau karier tunggal</li><li>Konseling dan layanan profesional</li></ul></article></div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum Anda memesan.</h2></div><div className="faq-list">{testFaq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>SIAP MEMULAI?</span><h2>Pilih layanan dan tentukan kota pelaksanaan.</h2><p>Tim akan membantu mencocokkan paket, promotor, lokasi, dan jadwal yang tersedia.</p></div><div><Link className="public-cta big" href="#layanan">Lihat pilihan layanan →</Link><Link href="/edukasi">Baca artikel dahulu</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
