import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { faqItems, publicProducts } from '../site-config';

export const metadata: Metadata = {
  title: 'Tes STIFIn Offline — Kenali Mesin Kecerdasan Anda',
  description: 'Kenali Mesin Kecerdasan melalui pemindaian sepuluh sidik jari dan pembahasan langsung bersama promotor STIFIn.',
  alternates: { canonical: '/tes-stifin' },
  openGraph: {
    title: 'Tes STIFIn Offline | Konsep STIFIn',
    description: 'Kenali Mesin Kecerdasan Anda melalui tes offline dan pembahasan langsung bersama promotor.',
    url: '/tes-stifin',
  },
};

export default function TestLandingPage() {
  const testFaq = faqItems.filter((_, index) => [0, 1, 4].includes(index));

  return <div className="public-site journey-site test-landing">
    <PublicHeader active="test" announcement="Tes dilakukan offline · Pemesanan dan pembayaran diarahkan melalui SEJOLI" />
    <main>
      <section className="hero test-hero">
        <div className="hero-copy"><div className="eyebrow">TES STIFIn RESMI · OFFLINE</div><h1>Bukan Anda yang kurang mampu. Bisa jadi, caranya yang belum pas.</h1><p>Kenali Mesin Kecerdasan dominan Anda melalui pemindaian sepuluh sidik jari, lalu bahas hasilnya langsung bersama promotor.</p><div className="hero-actions"><Link className="public-cta big" href="#layanan">Lihat pilihan layanan <span>→</span></Link><Link href="#proses">Bagaimana proses tesnya?</Link></div><div className="trust-row"><span><b>Offline</b><small>pemindaian langsung</small></span><span><b>Terjadwal</b><small>sesuai kota peserta</small></span><span><b>Dibahas</b><small>bersama promotor</small></span></div></div>
        <figure className="journey-hero-media test-hero-media">
          <Image src="/images/hero-tes-v2.webp" alt="Peserta menerima penjelasan hasil secara langsung dari promotor" width={1536} height={1024} sizes="(max-width: 900px) 90vw, 45vw" preload />
          <figcaption className="media-story-card test-story-card"><small>TIDAK BERHENTI DI HASIL</small><b>Dibahas bersama promotor</b><span>Offline · Personal · Lebih mudah dipahami</span></figcaption>
        </figure>
      </section>

      <section className="test-reassurance"><span>PERSONAL</span><span>KELUARGA</span><span>SEKOLAH</span><span>KOMUNITAS</span><span>INSTITUSI</span></section>

      <section className="section test-benefits"><div className="section-heading"><span>YANG AKAN ANDA PAHAMI</span><h2>Bukan hanya mendapat hasil. Anda pulang dengan bahasa yang lebih mudah untuk memahami diri.</h2><p>Promotor membantu menjelaskan arti hasil dan menghubungkannya dengan situasi yang sedang Anda hadapi—dalam belajar, bekerja, berkomunikasi, maupun bertumbuh.</p></div><div className="benefit-grid">{[
        ['01', 'Mesin Kecerdasan dominan', 'Kenali kecenderungan Sensing, Thinking, Intuiting, Feeling, atau Insting yang terdeteksi melalui tes.'],
        ['02', 'Cara alami Anda bergerak', 'Pahami pola dasar saat menyerap informasi, merespons keadaan, dan menjalankan aktivitas.'],
        ['03', 'Bahasa untuk memahami perbedaan', 'Lihat mengapa cara pasangan, anak, rekan, atau anggota tim tidak selalu sama dengan cara Anda.'],
        ['04', 'Arah penerapan yang realistis', 'Pilih satu atau dua penyesuaian kecil yang dapat dicoba setelah pembahasan hasil.'],
      ].map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section id="layanan" className="section product-section"><div className="section-heading"><span>PILIHAN LAYANAN</span><h2>Pilih untuk diri sendiri, keluarga, atau kelompok Anda.</h2><p>Tidak yakin paket mana yang paling sesuai? Pilih yang paling mendekati kebutuhan Anda. Tim akan membantu mengonfirmasi kota, jumlah peserta, dan jadwal sebelum pelaksanaan.</p></div><div className="product-grid">{publicProducts.map((product) => <article className={product.featured ? 'product-card featured-product' : 'product-card'} key={product.title}>{product.featured && <div className="product-ribbon">PALING SERING DIPILIH</div>}<small>{product.category}</small><h3>{product.title}</h3><p className="product-description">{product.description}</p><div className="product-price"><b>{product.price}</b><span>{product.priceNote}</span></div><div className="product-list"><strong>Yang didapat</strong>{product.features.map((item) => <span key={item}>✓ {item}</span>)}</div><div className="bonus-box"><strong>Bonus pilihan</strong>{product.bonuses.map((item) => <span key={item}>＋ {item}</span>)}</div><PublicInterestAction className="product-action" linkKey={product.linkKey} label={`${product.action} →`} service={product.title} /></article>)}</div><p className="price-note">Harga dan fasilitas final mengikuti informasi pada checkout SEJOLI. Tes STIFIn bukan layanan diagnosis medis atau psikologis.</p></section>

      <section id="proses" className="process-section"><div><span>PROSES TES</span><h2>Dari pemesanan sampai pembahasan, alurnya dibuat sederhana.</h2><p>Anda memilih layanan secara online. Setelah itu, tim membantu menemukan promotor dan jadwal di kota Anda. Pemindaian sepuluh sidik jari serta pembahasan hasil tetap dilakukan secara tatap muka.</p><Link className="dark-button" href="#layanan">Pilih layanan →</Link></div><ol><li><b>01</b><div><h3>Pilih layanan & checkout</h3><p>Pilih paket yang paling dekat dengan kebutuhan lalu selesaikan pemesanan melalui SEJOLI.</p></div></li><li><b>02</b><div><h3>Atur kota & jadwal</h3><p>Tim menghubungi Anda untuk mencocokkan lokasi, promotor, dan waktu pelaksanaan.</p></div></li><li><b>03</b><div><h3>Ikuti tes offline</h3><p>Promotor melakukan pemindaian sepuluh sidik jari menggunakan perangkat tes.</p></div></li><li><b>04</b><div><h3>Bahas hasilnya</h3><p>Anda menerima hasil dan penjelasan awal agar tahu bagian mana yang dapat mulai diterapkan.</p></div></li></ol></section>

      <section className="section test-boundary"><div><span>GUNAKAN SECARA BIJAK</span><h2>Apa yang dapat dan tidak dapat dijawab oleh tes?</h2></div><div className="boundary-grid"><article><b>Dapat membantu</b><ul><li>Membuka refleksi dan percakapan</li><li>Memberi bahasa awal tentang kecenderungan</li><li>Mencoba pendekatan belajar atau komunikasi</li><li>Menyusun pertanyaan untuk pembahasan</li></ul></article><article><b>Tidak menggantikan</b><ul><li>Diagnosis medis atau psikologis</li><li>Penilaian kompetensi profesional</li><li>Keputusan pendidikan atau karier tunggal</li><li>Konseling dan layanan profesional</li></ul></article></div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum Anda memesan.</h2></div><div className="faq-list">{testFaq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>MASIH PENASARAN DENGAN CARA ALAMI ANDA?</span><h2>Mulai dari satu tes, lalu bicarakan hasilnya dengan orang yang tepat.</h2><p>Pilih layanan dan kota pelaksanaan. Tim akan membantu mencocokkan promotor serta jadwal yang tersedia.</p></div><div><Link className="public-cta big" href="#layanan">Lihat pilihan layanan →</Link><Link href="/edukasi">Saya ingin belajar dulu</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
