import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { faqItems } from '../site-config';
import { getPublicManagedProducts } from '@/lib/product-store';

export const metadata: Metadata = {
  title: 'Jadi Promotor STIFIn — Dari Manfaat Pribadi Menjadi Jalan Profesi',
  description: 'Kenali peran Promotor STIFIn dan ikuti tahap Preview, WSL 1, WSL 2, hingga aktivasi ID dan alat sesuai ketentuan.',
  alternates: { canonical: '/jadi-promotor' },
  openGraph: {
    title: 'Jalur Promotor STIFIn | Konsep STIFIn',
    description: 'Kenali profesinya, pelajari ilmunya, lalu ikuti tahapan resmi sebelum aktivasi ID dan alat.',
    url: '/jadi-promotor',
  },
};
export const dynamic = 'force-dynamic';

export default async function PromoterLandingPage() {
  const promoterFaq = faqItems.filter((_, index) => [2, 3].includes(index));
  const promoterSteps = await getPublicManagedProducts('promoter');
  const mainInvestment = promoterSteps
    .filter((item) => ['wsl1', 'wsl2', 'idDanAlat'].includes(item.productKey))
    .reduce((total, item) => total + Number(item.price.replace(/\D/g, '') || 0), 0);

  return <div className="public-site journey-site promoter-landing">
    <PublicHeader active="promoter" announcement="Dari memahami diri, mendampingi orang lain, hingga membangun layanan STIFIn" ctaHref="#tahapan" ctaLabel="Lihat tahapan" />
    <main>
      <section className="promoter-hero">
        <div><span className="eyebrow">JALUR PROMOTOR STIFIn</span><h1>Manfaat yang Anda rasakan, bisa menjadi jalan untuk membantu orang lain.</h1><p>Menjadi promotor bukan sekadar memiliki alat. Anda belajar memahami ilmunya, melayani peserta dengan baik, dan membangun profesi melalui tahapan yang jelas.</p><div className="hub-actions"><Link className="public-cta big" href="#tahapan">Saya ingin tahu tahapannya →</Link><Link href="/affiliate">Belum siap? Mulai dari affiliate</Link></div></div>
        <figure className="journey-hero-media promoter-hero-media">
          <Image src="/images/hero-promotor-v3.webp" alt="Fasilitator Muslim Indonesia memandu kelompok belajar kecil" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 42vw" preload />
          <figcaption className="media-story-card promoter-story-card"><small>PETA PERJALANAN</small><b>Preview → WSL 1 → WSL 2</b><span>Lanjutkan ke ID & alat saat sudah siap</span></figcaption>
        </figure>
      </section>

      <section className="promoter-fit">
        <div><span>APAKAH JALUR INI UNTUK ANDA?</span><h2>Cocok untuk orang yang senang belajar, melayani, dan membangun kepercayaan.</h2></div>
        <div className="promoter-fit-grid"><article><b>01</b><h3>Senang menjelaskan</h3><p>Anda menikmati proses membuat hal yang rumit menjadi lebih mudah dipahami.</p></article><article><b>02</b><h3>Mau terus belajar</h3><p>Anda siap memperdalam materi, berlatih, dan mengikuti arahan yang berlaku.</p></article><article><b>03</b><h3>Nyaman membangun relasi</h3><p>Anda bersedia mendengar kebutuhan orang dan menindaklanjutinya dengan tertib.</p></article><article><b>04</b><h3>Menjaga amanah</h3><p>Anda memahami bahwa data, hasil tes, dan kepercayaan peserta harus dijaga.</p></article></div>
      </section>

      <section className="promoter-role"><div><span>SEBENARNYA, APA YANG DIKERJAKAN PROMOTOR?</span><h2>Bukan sekadar mengoperasikan alat tes. Promotor menemani orang memahami hasilnya.</h2></div><div className="role-grid"><article><b>01</b><h3>Menjalankan tes dengan benar</h3><p>Melakukan pemindaian secara langsung dan menjaga proses sesuai perangkat, alur, serta ketentuan yang berlaku.</p></article><article><b>02</b><h3>Membuat hasil lebih mudah dipahami</h3><p>Menjelaskan Mesin Kecerdasan peserta dengan bahasa yang dekat, tanpa memberi label atau membuat janji berlebihan.</p></article><article><b>03</b><h3>Menumbuhkan layanan dan jaringan</h3><p>Menjaga komunikasi, jadwal, tindak lanjut, serta hubungan baik agar manfaat STIFIn menjangkau lebih banyak orang.</p></article></div></section>

      <section id="tahapan" className="section promoter-section"><div className="section-heading"><span>PROGRAM, MANFAAT & BIAYA</span><h2>Mulai dari mengenal profesinya, bukan langsung membeli alat.</h2><p>Harga ditempatkan di setiap tahap agar Anda dapat menyiapkan perjalanan dengan tenang. Posisi harga dipilih di tengah: tidak menekan nilai pelatihan, tetapi tetap lebih terjangkau dibanding sejumlah penawaran pasar.</p></div><div className="promoter-path">{promoterSteps.map((step, index) => <article key={step.productKey}><div className="step-top"><b>{String(index + 1).padStart(2, '0')}</b><span>{step.eyebrow}</span></div><h3>{step.title}</h3><div className="promoter-price"><b>{step.price}</b><small>{step.priceNote}</small></div><p>{step.description}</p><ul>{step.features.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul><PublicInterestAction linkKey={step.productKey} checkoutUrl={step.checkoutUrl} label={`${step.action} →`} service={step.productKey === 'previewPromotor' ? 'Preview Calon Promotor' : step.productKey === 'idDanAlat' ? 'Informasi ID & Alat' : step.title} /></article>)}</div><div className="promoter-investment"><div><span>INVESTASI TAHAP UTAMA</span><strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(mainInvestment)}</strong><small>WSL 1 + WSL 2 + ID & scanner. Tes Personal prasyarat dan biaya lain di luar rincian ini.</small></div><p>Pembelian dilakukan bertahap mengikuti kelulusan dan persyaratan, sehingga Anda tidak harus membayar seluruhnya pada hari pertama.</p></div><div className="promoter-note"><div><b>Preview</b><span>Kenali profesinya</span></div><i>→</i><div><b>WSL 1</b><span>Bangun fondasi</span></div><i>→</i><div><b>WSL 2</b><span>Pendalaman</span></div><i>→</i><div><b>ID & scanner</b><span>Aktivasi sesuai syarat</span></div></div></section>

      <section className="promoter-expectation"><div><span>SUPAYA EKSPEKTASINYA SAMA</span><h2>Peluangnya nyata, tetapi tetap perlu belajar dan bergerak.</h2><p>Promotor dapat membangun layanan, relasi, dan aktivitas profesional melalui jaringan STIFIn. Namun hasilnya tidak datang otomatis. Kesiapan, kualitas pelayanan, konsistensi, wilayah, serta ketentuan resmi ikut menentukan perjalanan setiap orang.</p></div><ul><li>Pahami biaya, fasilitas, dan peran sebelum mendaftar.</li><li>Tanyakan jadwal, proses belajar, syarat, serta aktivasi.</li><li>Bangun kepercayaan melalui pelayanan dan komunikasi yang jujur.</li><li>Jaga privasi peserta dan gunakan data secara bertanggung jawab.</li></ul></section>

      <section className="section promoter-support"><div className="section-heading"><span>SETELAH AKTIF</span><h2>Yang perlu terus dibangun.</h2></div><div className="benefit-grid">{[
        ['01', 'Pemahaman materi', 'Belajar dari workbook, pelatihan, pembaruan, dan arahan resmi yang relevan.'],
        ['02', 'Kualitas komunikasi', 'Menjelaskan manfaat dan batasan secara jernih kepada calon peserta.'],
        ['03', 'Operasional layanan', 'Merapikan jadwal, pencatatan, tindak lanjut, dan pengalaman peserta.'],
        ['04', 'Etika promosi', 'Menghindari klaim medis, janji hasil, tekanan, dan penggunaan materi internal secara terbuka.'],
      ].map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum memilih jalur.</h2></div><div className="faq-list">{promoterFaq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>LANGKAH PERTAMA TIDAK HARUS BESAR</span><h2>Datang ke Preview, dengarkan penjelasannya, lalu putuskan dengan tenang.</h2><p>Anda akan mengenal peran, tahapan belajar, kebutuhan biaya, dan ketentuan terbaru sebelum menentukan langkah berikutnya.</p></div><div><PublicInterestAction className="public-cta big" linkKey="previewPromotor" label="Ikuti Preview →" service="Preview Calon Promotor" /><Link href="/edukasi">Pelajari STIFIn lebih dulu</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
