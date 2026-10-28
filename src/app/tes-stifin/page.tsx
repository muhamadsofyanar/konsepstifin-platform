import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { faqItems } from '../site-config';
import { catalogAmount } from '@/lib/catalog-presentation';
import { getPublicManagedProducts } from '@/lib/product-store';
import ActivityGallery from '../activity-gallery';
import JsonLd from '../json-ld';

export const metadata: Metadata = {
  title: 'Tes STIFIn Offline — Pilihan Layanan dan Prosesnya',
  description: 'Kenali Mesin Kecerdasan melalui pemindaian sepuluh sidik jari dan pembahasan langsung bersama promotor STIFIn.',
  alternates: { canonical: '/tes-stifin' },
  openGraph: {
    title: 'Tes STIFIn Offline | Konsep STIFIn',
    description: 'Kenali Mesin Kecerdasan Anda melalui tes offline dan pembahasan langsung bersama promotor.',
    url: '/tes-stifin',
  },
};
export const dynamic = 'force-dynamic';

export default async function TestLandingPage() {
  const testFaq = faqItems.filter((_, index) => [0, 1, 4].includes(index));
  const publicProducts = await getPublicManagedProducts('test');
  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pilihan layanan Tes STIFIn',
    itemListElement: publicProducts.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: product.title,
        description: product.description,
        provider: { '@id': 'https://konsepstifin.com/#organization' },
        areaServed: { '@type': 'Country', name: 'Indonesia' },
        ...(catalogAmount(product.price)!==null&&catalogAmount(product.price)!>0?{offers: {
          '@type': 'Offer',
          price: String(catalogAmount(product.price)),
          priceCurrency: 'IDR',
          url: 'https://konsepstifin.com/produk/layanan/'+product.productKey,
        }}:{}),
      },
    })),
  };

  return <div className="public-site journey-site test-landing">
    <JsonLd data={servicesSchema} />
    <PublicHeader active="test" announcement="Tes dilakukan offline · Permintaan dan pembayaran dikonfirmasi admin" />
    <main id="main-content">
      <section className="hero test-hero">
        <div className="hero-copy"><div className="eyebrow">LAYANAN TES STIFIn · OFFLINE</div><h1>Satu langkah untuk lebih memahami diri dan keluarga.</h1><p>Tes dimulai dari pemindaian sepuluh sidik jari secara langsung. Hasil kemudian dibahas bersama promotor sebagai bahan refleksi untuk belajar, bekerja, dan berkomunikasi—bukan sebagai diagnosis atau keputusan tunggal.</p><div className="hero-actions"><Link className="public-cta big" href="#layanan">Bandingkan layanan tes <span>→</span></Link><Link href="#proses">Lihat alur dari formulir hingga tes</Link></div><div className="trust-row"><span><b>Offline</b><small>pemindaian langsung</small></span><span><b>Terjadwal</b><small>berdasarkan konfirmasi</small></span><span><b>Dibahas</b><small>bersama promotor</small></span></div></div>
        <figure className="journey-hero-media test-hero-media">
          <Image src="/images/hero-tes-v3.webp" alt="Peserta Muslim menerima penjelasan langsung dari promotor perempuan" width={1586} height={992} sizes="(max-width: 900px) 90vw, 45vw" preload />
          <figcaption className="media-story-card test-story-card"><small>TIDAK BERHENTI DI HASIL</small><b>Dibahas bersama promotor</b><span>Offline · Personal · Lebih mudah dipahami</span></figcaption>
        </figure>
      </section>

      <section className="test-reassurance"><span>PERSONAL</span><span>KELUARGA</span><span>SEKOLAH</span><span>KOMUNITAS</span><span>INSTITUSI</span></section>

      <section className="test-problem-story">
        <div><span>MUNGKIN INI TERASA DEKAT</span><h2>Kita sering menuntut hasil, sebelum memahami cara alaminya.</h2></div>
        <div className="problem-story-grid"><article><b>01</b><p>Anak dianggap tidak fokus, padahal mungkin cara belajarnya berbeda.</p></article><article><b>02</b><p>Pasangan dianggap sulit memahami, padahal cara mengolah informasinya tidak sama.</p></article><article><b>03</b><p>Diri sendiri terus dipaksa mengikuti cara orang lain hingga cepat lelah.</p></article></div>
        <p className="story-bridge">Tes bukan jawaban untuk semua hal. Namun hasilnya dapat menjadi awal percakapan yang lebih jernih—tentang cara belajar, bekerja, dan saling memahami.</p>
      </section>

      <section className="section test-benefits"><div className="section-heading"><span>SETELAH HASIL DITERIMA</span><h2>Gunakan pembahasan untuk menyusun pertanyaan yang lebih tepat tentang diri Anda.</h2><p>Promotor membantu menjelaskan istilah pada hasil dan menghubungkannya dengan situasi yang Anda ceritakan—dalam belajar, bekerja, berkomunikasi, maupun bertumbuh.</p></div><div className="benefit-grid">{[
        ['01', 'Mesin Kecerdasan dominan', 'Kenali kecenderungan Sensing, Thinking, Intuiting, Feeling, atau Insting yang terdeteksi melalui tes.'],
        ['02', 'Cara alami Anda bergerak', 'Pahami pola dasar saat menyerap informasi, merespons keadaan, dan menjalankan aktivitas.'],
        ['03', 'Bahasa untuk memahami perbedaan', 'Lihat mengapa cara pasangan, anak, rekan, atau anggota tim tidak selalu sama dengan cara Anda.'],
        ['04', 'Arah penerapan yang realistis', 'Pilih satu atau dua penyesuaian kecil yang dapat dicoba setelah pembahasan hasil.'],
      ].map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section id="layanan" className="section product-section"><div className="section-heading"><span>PILIHAN LAYANAN</span><h2>Pilih untuk diri sendiri, keluarga, atau kelompok Anda.</h2><p>Bandingkan jumlah peserta dan fasilitasnya. Buka detail produk untuk mengajukan layanan, lalu pengelola membantu mengonfirmasi wilayah, promotor, dan jadwal.</p></div><div className="product-grid">{publicProducts.map((product) => <article className={product.featured ? 'product-card featured-product' : 'product-card'} key={product.title}>{product.featured && <div className="product-ribbon">MULAI DARI 1 PESERTA</div>}<small>{product.eyebrow}</small><h3>{product.title}</h3><p className="product-description">{product.description}</p><div className="product-price"><b>{product.price}</b><span>{product.priceNote}</span></div><div className="product-list"><strong>Yang didapat</strong>{product.features.map((item) => <span key={item}>✓ {item}</span>)}</div>{product.bonuses.length > 0 && <div className="bonus-box"><strong>Bonus pilihan</strong>{product.bonuses.map((item) => <span key={item}>＋ {item}</span>)}</div>}<Link className="product-action" href={'/produk/layanan/'+product.productKey}>{product.action} →</Link></article>)}</div><div className="catalog-support"><div><b>Belum yakin memilih paket?</b><span>Tim dapat membantu mencocokkan jumlah peserta, kota, dan kebutuhan Anda.</span></div><PublicInterestAction leadType="test_service" captureLead className="catalog-support-action" linkKey="tesPersonal" label="Butuh bantuan memilih? →" service="Bantuan memilih layanan STIFIn" /></div><p className="price-note">Harga pada katalog menjadi informasi awal. Nominal dan instruksi pembayaran dikonfirmasi admin sebelum pembayaran. Tes STIFIn bukan layanan diagnosis medis atau psikologis.</p></section>

      <ActivityGallery />

      <section id="proses" className="process-section"><div><span>PROSES TES</span><h2>Dari kebutuhan sampai pembahasan, setiap langkah mempunyai tujuan.</h2><p>Formulir awal mencatat kota dan persetujuan kontak. Admin mengonfirmasi promotor, jadwal, harga, dan instruksi pembayaran. Pemindaian dan pembahasan tetap dilakukan secara tatap muka.</p><Link className="dark-button" href="#layanan">Pilih layanan →</Link></div><ol><li><b>01</b><div><h3>Kirim kebutuhan</h3><p>Pilih layanan, isi domisili, dan berikan persetujuan kontak serta penugasan promotor.</p></div></li><li><b>02</b><div><h3>Pencocokan promotor</h3><p>Sistem mencari kandidat berdasarkan cakupan wilayah; jadwal tetap berdasarkan konfirmasi.</p></div></li><li><b>03</b><div><h3>Konfirmasi bersama admin</h3><p>Setelah permintaan tersimpan, admin meninjau kebutuhan dan menyampaikan instruksi pembayaran. Transfer diverifikasi admin.</p></div></li><li><b>04</b><div><h3>Ikuti tes dan pembahasan</h3><p>Promotor melakukan pemindaian sepuluh sidik jari lalu menjelaskan hasil awalnya.</p></div></li></ol></section>

      <section className="section test-boundary"><div><span>GUNAKAN SECARA BIJAK</span><h2>Apa yang dapat dan tidak dapat dijawab oleh tes?</h2></div><div className="boundary-grid"><article><b>Dapat membantu</b><ul><li>Membuka refleksi dan percakapan</li><li>Memberi bahasa awal tentang kecenderungan</li><li>Mencoba pendekatan belajar atau komunikasi</li><li>Menyusun pertanyaan untuk pembahasan</li></ul></article><article><b>Tidak menggantikan</b><ul><li>Diagnosis medis atau psikologis</li><li>Penilaian kompetensi profesional</li><li>Keputusan pendidikan atau karier tunggal</li><li>Konseling dan layanan profesional</li></ul></article></div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum Anda memesan.</h2></div><div className="faq-list">{testFaq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>SIAP MEMBANDINGKAN PILIHAN?</span><h2>Pilih berdasarkan jumlah peserta dan kebutuhan pembahasan.</h2><p>Kirim kota pelaksanaan agar sistem dapat mencari promotor berdasarkan cakupan. Jadwal tetap berdasarkan konfirmasi.</p></div><div><Link className="public-cta big" href="#layanan">Bandingkan layanan tes →</Link><Link href="/edukasi">Baca materi sebelum memilih</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
