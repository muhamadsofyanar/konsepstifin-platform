import type { Metadata } from 'next';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { affiliatePrograms, faqItems, promoterSteps } from '../site-config';

export const metadata: Metadata = {
  title: 'Jadi Promotor STIFIn — Tahapan Preview, WSL 1, dan WSL 2',
  description: 'Pelajari peran, tanggung jawab, dan tahapan resmi menuju Promotor STIFIn: Preview, WSL 1, WSL 2, hingga aktivasi ID dan alat.',
  alternates: { canonical: '/jadi-promotor' },
  openGraph: {
    title: 'Jalur Promotor STIFIn | Konsep STIFIn',
    description: 'Kenali profesinya dan ikuti tahap pembelajaran sebelum aktivasi ID dan alat.',
    url: '/jadi-promotor',
  },
};

export default function PromoterLandingPage() {
  const promoterFaq = faqItems.filter((_, index) => [2, 3].includes(index));

  return <div className="public-site journey-site promoter-landing">
    <PublicHeader active="promoter" announcement="Kenali profesinya dahulu · Ikuti tahapan sesuai ketentuan resmi" ctaHref="#tahapan" ctaLabel="Lihat tahapan" />
    <main>
      <section className="promoter-hero">
        <div><span className="eyebrow">JALUR PROMOTOR STIFIn</span><h1>Bangun profesi melalui proses yang jelas.</h1><p>Menjadi promotor bukan sekadar membeli alat. Mulailah dengan memahami peran, belajar melalui tahapan resmi, lalu aktifkan layanan ketika persyaratan telah terpenuhi.</p><div className="hub-actions"><Link className="public-cta big" href="#tahapan">Pelajari tahapannya →</Link><Link href="#affiliate">Mulai dari affiliate</Link></div></div>
        <aside><small>PETA PERJALANAN</small>{promoterSteps.map((step) => <div key={step.number}><b>{step.number}</b><span><strong>{step.title}</strong><small>{step.label}</small></span></div>)}</aside>
      </section>

      <section className="promoter-role"><div><span>PERAN PROMOTOR</span><h2>Mendampingi proses, menjaga kualitas, dan terus belajar.</h2></div><div className="role-grid"><article><b>01</b><h3>Menjalankan proses tes</h3><p>Melaksanakan pemindaian secara langsung sesuai perangkat, alur, dan ketentuan yang berlaku.</p></article><article><b>02</b><h3>Menjelaskan dengan bertanggung jawab</h3><p>Membantu peserta memahami hasil tanpa diagnosis, label yang membatasi, atau janji berlebihan.</p></article><article><b>03</b><h3>Membangun layanan</h3><p>Mengelola jadwal, komunikasi, tindak lanjut, dan jaringan dengan standar pelayanan yang baik.</p></article></div></section>

      <section id="tahapan" className="section promoter-section"><div className="section-heading"><span>TAHAPAN RESMI</span><h2>Jangan melompat langsung ke alat tes.</h2><p>Setiap tahap membantu calon promotor menilai kesiapan, membangun fondasi, dan memahami tanggung jawab sebelum aktivasi.</p></div><div className="promoter-path">{promoterSteps.map((step) => <article key={step.number}><div className="step-top"><b>{step.number}</b><span>{step.label}</span></div><h3>{step.title}</h3><p>{step.description}</p><PublicInterestAction linkKey={step.linkKey} label={`${step.action} →`} service={step.title === 'Preview Promotor' ? 'Preview Calon Promotor' : step.title === 'ID & Alat Tes' ? 'Informasi ID & Alat' : step.title} /></article>)}</div><div className="promoter-note"><div><b>Preview</b><span>Kenali profesinya</span></div><i>→</i><div><b>WSL 1</b><span>Bangun fondasi</span></div><i>→</i><div><b>WSL 2</b><span>Pendalaman</span></div><i>→</i><div><b>ID & alat</b><span>Aktivasi sesuai syarat</span></div></div></section>

      <section className="promoter-expectation"><div><span>TRANSPARANSI PELUANG</span><h2>Profesi perlu proses, aktivitas, dan tanggung jawab.</h2><p>Program tidak menjanjikan penghasilan tetap atau hasil instan. Perkembangan jaringan dipengaruhi kesiapan, aktivitas, kualitas layanan, wilayah, biaya, dan ketentuan resmi yang dapat berubah.</p></div><ul><li>Pelajari biaya dan fasilitas final sebelum mendaftar.</li><li>Tanyakan jadwal, syarat kelulusan, serta proses aktivasi.</li><li>Gunakan materi promosi yang jujur dan tidak membuat klaim mutlak.</li><li>Jaga privasi peserta dan jangan meminta data rahasia melalui kanal publik.</li></ul></section>

      <section id="affiliate" className="section affiliate-section"><div className="section-heading"><span>JALUR AFFILIATE</span><h2>Belum siap menjadi promotor? Mulai dari rekomendasi.</h2><p>Affiliate dan promotor memiliki peran berbeda. Affiliate mengarahkan pembeli melalui tautan referral; promotor resmi menjalankan proses tes setelah memenuhi tahapan.</p></div><div className="affiliate-grid">{affiliatePrograms.map((program, index) => <article className={index === 1 ? 'affiliate-card official' : 'affiliate-card'} key={program.title}><small>{program.eyebrow}</small><h3>{program.title}</h3><p>{program.description}</p><ul>{program.points.map((point) => <li key={point}>✓ {point}</li>)}</ul><PublicInterestAction linkKey={program.linkKey} label={`${program.action} →`} service={program.title} /></article>)}</div><div className="affiliate-flow"><span>Bagikan tautan</span><i>→</i><span>Transaksi tervalidasi</span><i>→</i><span>Komisi tercatat</span><i>→</i><span>Evaluasi langkah berikutnya</span></div></section>

      <section className="section promoter-support"><div className="section-heading"><span>SETELAH AKTIF</span><h2>Yang perlu terus dibangun.</h2></div><div className="benefit-grid">{[
        ['01', 'Pemahaman materi', 'Belajar dari workbook, pelatihan, pembaruan, dan arahan resmi yang relevan.'],
        ['02', 'Kualitas komunikasi', 'Menjelaskan manfaat dan batasan secara jernih kepada calon peserta.'],
        ['03', 'Operasional layanan', 'Merapikan jadwal, pencatatan, tindak lanjut, dan pengalaman peserta.'],
        ['04', 'Etika promosi', 'Menghindari klaim medis, janji hasil, tekanan, dan penggunaan materi internal secara terbuka.'],
      ].map((item) => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum memilih jalur.</h2></div><div className="faq-list">{promoterFaq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>MULAI DENGAN INFORMASI</span><h2>Kenali profesinya sebelum membuat keputusan.</h2><p>Ikuti Preview untuk memahami peran, tahapan, kebutuhan biaya, dan ketentuan terbaru.</p></div><div><PublicInterestAction className="public-cta big" linkKey="previewPromotor" label="Ikuti Preview →" service="Preview Calon Promotor" /><Link href="/edukasi">Baca pusat edukasi</Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
