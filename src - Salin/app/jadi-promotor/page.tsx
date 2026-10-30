import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { faqItems } from '../site-config';
import { promoterInvestment, formatRupiah } from '@/lib/catalog-presentation';
import { getPublicManagedProducts } from '@/lib/product-store';
import PublicPromotionBanner from '../public-promotion-banner';
import { getActivePromotion } from '@/lib/promotion-store';

export const metadata: Metadata = {
  title: 'Calon Promotor STIFIn — Peran, Tahap, dan Biaya',
  description: 'Kenali peran Promotor STIFIn dan ikuti tahap Preview, WSL 1, WSL 2, hingga aktivasi ID dan alat sesuai ketentuan.',
  alternates: { canonical: '/jadi-promotor' },
  openGraph: {
    title: 'Jalur Promotor STIFIn | Konsep STIFIn',
    description: 'Kenali peran, biaya, tanggung jawab, dan tahap belajar sebelum proses aktivasi ID dan alat.',
    url: '/jadi-promotor',
  },
};
export const dynamic = 'force-dynamic';

export default async function PromoterLandingPage() {
  const promoterFaq = faqItems.filter((_, index) => [2, 3].includes(index));
  const [allPromoterProducts, promo] = await Promise.all([getPublicManagedProducts('promoter'), getActivePromotion()]);
  const promoterSteps = allPromoterProducts.filter(item => item.productKey !== 'wst').map(item => {
    if (!promo.workshopActive || (item.productKey !== 'wsl1' && item.productKey !== 'wsl2')) return item;
    const promoPrice = item.productKey === 'wsl1' ? promo.settings.workshopPrices.wsl1 : promo.settings.workshopPrices.wsl2;
    return { ...item, price: `Rp${promoPrice.toLocaleString('id-ID')}`, priceNote: `harga promo pusat sampai ${promo.settings.endDate}` };
  });
  const investment=promoterInvestment(promoterSteps);
  const packageProduct=promoterSteps.find(item=>item.productKey==='paketPromotor');

  return <div className="public-site journey-site promoter-landing">
    <PublicHeader active="promoter" announcement="Jalur calon promotor terpisah dari pemesanan layanan tes" ctaHref="#tahapan" ctaLabel="Bandingkan tahapan" />
    <main id="main-content">
      <section className="promoter-hero">
        <div><span className="eyebrow">JALUR CALON PROMOTOR STIFIn</span><h1>Sebelum mendaftar, lihat pekerjaan, tahap belajar, dan komitmen biayanya.</h1><p>Promotor menjalankan tes, menjelaskan hasil, menjaga data peserta, serta mengelola tindak lanjut layanan. Bandingkan tahapannya lebih dulu; formulir di halaman ini masuk ke antrean konsultasi untuk ditindaklanjuti tim.</p><div className="hub-actions promoter-entry-actions"><Link className="public-cta big" href="#tahapan">Bandingkan tahap calon promotor →</Link><Link href="/akun/login?next=%2Fakun">Sudah menjadi promotor? Masuk ke portal →</Link><Link href="/affiliate">Ingin mulai dari rekomendasi layanan? Lihat affiliate</Link></div></div>
        <figure className="journey-hero-media promoter-hero-media">
          <Image src="/images/hero-promotor-v3.webp" alt="Fasilitator Muslim Indonesia memandu kelompok belajar kecil" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 42vw" preload />
          <figcaption className="media-story-card promoter-story-card"><small>PETA PERJALANAN</small><b>Preview → WSL 1 → WSL 2</b><span>Lanjutkan ke ID & alat saat sudah siap</span></figcaption>
        </figure>
      </section>

      <PublicPromotionBanner family={false} workshop compact />

      <section className="promoter-fit">
        <div><span>APAKAH JALUR INI UNTUK ANDA?</span><h2>Cocok untuk orang yang senang belajar, melayani, dan membangun kepercayaan.</h2></div>
        <div className="promoter-fit-grid"><article><b>01</b><h3>Senang menjelaskan</h3><p>Anda menikmati proses membuat hal yang rumit menjadi lebih mudah dipahami.</p></article><article><b>02</b><h3>Mau terus belajar</h3><p>Anda siap memperdalam materi, berlatih, dan mengikuti arahan yang berlaku.</p></article><article><b>03</b><h3>Nyaman membangun relasi</h3><p>Anda bersedia mendengar kebutuhan orang dan menindaklanjutinya dengan tertib.</p></article><article><b>04</b><h3>Menjaga amanah</h3><p>Anda memahami bahwa data, hasil tes, dan kepercayaan peserta harus dijaga.</p></article></div>
      </section>

      <section className="promoter-role"><div><span>SEBENARNYA, APA YANG DIKERJAKAN PROMOTOR?</span><h2>Bukan sekadar mengoperasikan alat tes. Promotor menemani orang memahami hasilnya.</h2></div><div className="role-grid"><article><b>01</b><h3>Menjalankan tes dengan benar</h3><p>Melakukan pemindaian secara langsung dan menjaga proses sesuai perangkat, alur, serta ketentuan yang berlaku.</p></article><article><b>02</b><h3>Membuat hasil lebih mudah dipahami</h3><p>Menjelaskan Mesin Kecerdasan peserta dengan bahasa yang dekat, tanpa memberi label atau membuat janji berlebihan.</p></article><article><b>03</b><h3>Menumbuhkan layanan dan jaringan</h3><p>Menjaga komunikasi, jadwal, tindak lanjut, serta hubungan baik agar manfaat STIFIn menjangkau lebih banyak orang.</p></article></div></section>

      <section id="tahapan" className="section promoter-section">
        <div className="section-heading"><span>PROGRAM, MANFAAT & BIAYA</span><h2>Mulai dari mengenal profesinya, bukan langsung membeli alat.</h2><p>Setiap kartu memakai katalog layanan yang dikelola admin. Permintaan masuk ke antrean konsultasi untuk mengonfirmasi tahapan, jadwal, dan biaya.</p></div>
        <div className="promoter-path">{promoterSteps.map((step, index) => {
          return <article key={step.productKey}>
            <div className="step-top"><b>{String(index + 1).padStart(2, '0')}</b><span>{step.eyebrow}</span></div>
            <h3>{step.title}</h3>
            <div className="promoter-price"><b>{step.price}</b><small>{step.priceNote}</small></div>
            <p>{step.description}</p><ul>{step.features.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul>
            <Link href={'/produk/layanan/'+step.productKey}>{step.action} →</Link>
          </article>;
        })}</div>
        <div className="promoter-investment">
          <div><span>{packageProduct ? 'PAKET TERPADU DI KATALOG' : 'TOTAL TAHAP UTAMA'}</span><strong>{investment.main===null?'Konfirmasi biaya':formatRupiah(investment.main)}</strong><small>{packageProduct ? 'WSL 1 + WSL 2 + ID aplikasi & scanner sesuai rincian Paket Lengkap.' : 'WSL 1 + WSL 2 + ID & scanner. Tes Personal dan biaya lain berada di luar rincian ini.'}</small></div>
          <div className="promoter-investment-detail">{investment.saving!==null && <div className="investment-saving"><small>Total harga tahap terpisah</small><s>{formatRupiah(investment.individual!)}</s><b>Selisih katalog {formatRupiah(investment.saving!)}</b></div>}<p>Pemenuhan tahap tetap mengikuti kelulusan dan persyaratan yang berlaku. Harga final dikonfirmasi bersama admin.</p>{packageProduct && <Link className="investment-checkout" href="/produk/layanan/paketPromotor">Konsultasikan Paket Lengkap →</Link>}</div>
        </div>
        <div className="promoter-note"><div><b>Preview</b><span>Kenali profesinya</span></div><i>→</i><div><b>WSL 1</b><span>Bangun fondasi</span></div><i>→</i><div><b>WSL 2</b><span>Pendalaman</span></div><i>→</i><div><b>ID & scanner</b><span>Aktivasi sesuai syarat</span></div></div>
      </section>

      {promo.workshopActive && <section id="year-end-workshop" className="section year-end-workshop"><div className="section-heading"><span>PROGRAM CABANG · PROMO PUSAT</span><h2>Year-End Workshop</h2><p>Harga berlaku pada {promo.settings.startDate} sampai {promo.settings.endDate}. Rincian kelas, jadwal, dan ketentuan final dikonfirmasi tim.</p></div><div className="family-promo-options workshop-promo-options"><article><small>WORKSHOP</small><h3>WSL 1</h3><strong>Rp{promo.settings.workshopPrices.wsl1.toLocaleString('id-ID')}</strong><Link href="/produk/layanan/wsl1">Tanyakan WSL 1 →</Link></article><article><small>WORKSHOP</small><h3>WSL 2</h3><strong>Rp{promo.settings.workshopPrices.wsl2.toLocaleString('id-ID')}</strong><Link href="/produk/layanan/wsl2">Tanyakan WSL 2 →</Link></article><article><small>WORKSHOP</small><h3>WST</h3><strong>Rp{promo.settings.workshopPrices.wst.toLocaleString('id-ID')}</strong><Link href="/produk/layanan/wst">Tanyakan WST →</Link></article></div></section>}

      <section className="promoter-expectation"><div><span>SUPAYA EKSPEKTASINYA SAMA</span><h2>Perannya nyata; hasil usaha atau penghasilan tidak dijanjikan.</h2><p>Menjadi promotor berarti belajar, melayani peserta, menjaga privasi, serta mengikuti ketentuan aktivasi. Hasil setiap orang dipengaruhi kesiapan, kualitas pelayanan, konsistensi, wilayah, dan banyak faktor lain.</p></div><ul><li>Pahami biaya, fasilitas, dan peran sebelum mendaftar.</li><li>Tanyakan jadwal, proses belajar, syarat, serta aktivasi.</li><li>Bangun kepercayaan melalui pelayanan dan komunikasi yang jujur.</li><li>Jaga privasi peserta dan gunakan data secara bertanggung jawab.</li></ul></section>

      <section className="section promoter-support"><div className="section-heading"><span>SETELAH AKTIF</span><h2>Yang perlu terus dibangun.</h2></div><div className="benefit-grid">{[
        ['01', 'Pemahaman materi', 'Belajar dari workbook, pelatihan, pembaruan, dan arahan yang berlaku.'],
        ['02', 'Kualitas komunikasi', 'Menjelaskan manfaat dan batasan secara jernih kepada calon peserta.'],
        ['03', 'Operasional layanan', 'Merapikan jadwal, pencatatan, tindak lanjut, dan pengalaman peserta.'],
        ['04', 'Etika promosi', 'Menghindari klaim medis, janji hasil, tekanan, dan penggunaan materi internal secara terbuka.'],
      ].map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum memilih jalur.</h2></div><div className="faq-list">{promoterFaq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>MULAI DARI INFORMASI, BUKAN TRANSAKSI</span><h2>Minta penjelasan Preview dan tahapan berikutnya sebelum berkomitmen.</h2><p>Permintaan Anda masuk ke pipeline calon promotor. Tim menindaklanjuti peran, proses belajar, biaya, dan ketentuan yang berlaku melalui konsultasi dengan admin.</p></div><div><Link className="public-cta big" href="/produk/layanan/previewPromotor">Minta informasi Preview →</Link><Link href="/edukasi">Pelajari STIFIn lebih dulu</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
