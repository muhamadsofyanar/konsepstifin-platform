import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PublicInterestAction from '../public-interest-action';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import { affiliatePrograms, faqItems, promoterSteps } from '../site-config';

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

export default function PromoterLandingPage() {
  const promoterFaq = faqItems.filter((_, index) => [2, 3].includes(index));

  return <div className="public-site journey-site promoter-landing">
    <PublicHeader active="promoter" announcement="Dari memahami diri, mendampingi orang lain, hingga membangun layanan STIFIn" ctaHref="#tahapan" ctaLabel="Lihat tahapan" />
    <main>
      <section className="promoter-hero">
        <div><span className="eyebrow">JALUR PROMOTOR STIFIn</span><h1>Ingin membantu orang memahami dirinya—sekaligus membangun profesi?</h1><p>Mulai dengan mengenal perannya. Belajar, melayani, lalu bertumbuh bersama jaringan melalui tahapan yang jelas.</p><div className="hub-actions"><Link className="public-cta big" href="#tahapan">Saya ingin tahu tahapannya →</Link><Link href="#affiliate">Belum siap? Mulai dari affiliate</Link></div></div>
        <figure className="journey-hero-media promoter-hero-media">
          <Image src="/images/hero-promotor-v2.webp" alt="Fasilitator Indonesia memandu kelompok belajar kecil" width={1536} height={1024} sizes="(max-width: 1050px) 90vw, 42vw" preload />
          <figcaption className="media-story-card promoter-story-card"><small>PETA PERJALANAN</small><b>Preview → WSL 1 → WSL 2</b><span>Lanjutkan ke ID & alat saat sudah siap</span></figcaption>
        </figure>
      </section>

      <section className="promoter-role"><div><span>SEBENARNYA, APA YANG DIKERJAKAN PROMOTOR?</span><h2>Bukan sekadar mengoperasikan alat tes. Promotor menemani orang memahami hasilnya.</h2></div><div className="role-grid"><article><b>01</b><h3>Menjalankan tes dengan benar</h3><p>Melakukan pemindaian secara langsung dan menjaga proses sesuai perangkat, alur, serta ketentuan yang berlaku.</p></article><article><b>02</b><h3>Membuat hasil lebih mudah dipahami</h3><p>Menjelaskan Mesin Kecerdasan peserta dengan bahasa yang dekat, tanpa memberi label atau membuat janji berlebihan.</p></article><article><b>03</b><h3>Menumbuhkan layanan dan jaringan</h3><p>Menjaga komunikasi, jadwal, tindak lanjut, serta hubungan baik agar manfaat STIFIn menjangkau lebih banyak orang.</p></article></div></section>

      <section id="tahapan" className="section promoter-section"><div className="section-heading"><span>TAHAPAN RESMI</span><h2>Mulai dari mengenal profesinya, bukan langsung membeli alat.</h2><p>Setiap tahap memberi ruang untuk memahami ilmu, menilai kesiapan, dan melihat tanggung jawab yang akan dijalankan. Dengan begitu, keputusan menjadi promotor tidak dibuat karena ikut-ikutan.</p></div><div className="promoter-path">{promoterSteps.map((step) => <article key={step.number}><div className="step-top"><b>{step.number}</b><span>{step.label}</span></div><h3>{step.title}</h3><p>{step.description}</p><PublicInterestAction linkKey={step.linkKey} label={`${step.action} →`} service={step.title === 'Preview Promotor' ? 'Preview Calon Promotor' : step.title === 'ID & Alat Tes' ? 'Informasi ID & Alat' : step.title} /></article>)}</div><div className="promoter-note"><div><b>Preview</b><span>Kenali profesinya</span></div><i>→</i><div><b>WSL 1</b><span>Bangun fondasi</span></div><i>→</i><div><b>WSL 2</b><span>Pendalaman</span></div><i>→</i><div><b>ID & alat</b><span>Aktivasi sesuai syarat</span></div></div></section>

      <section className="promoter-expectation"><div><span>SUPAYA EKSPEKTASINYA SAMA</span><h2>Peluangnya nyata, tetapi tetap perlu belajar dan bergerak.</h2><p>Promotor dapat membangun layanan, relasi, dan aktivitas profesional melalui jaringan STIFIn. Namun hasilnya tidak datang otomatis. Kesiapan, kualitas pelayanan, konsistensi, wilayah, serta ketentuan resmi ikut menentukan perjalanan setiap orang.</p></div><ul><li>Pahami biaya, fasilitas, dan peran sebelum mendaftar.</li><li>Tanyakan jadwal, proses belajar, syarat, serta aktivasi.</li><li>Bangun kepercayaan melalui pelayanan dan komunikasi yang jujur.</li><li>Jaga privasi peserta dan gunakan data secara bertanggung jawab.</li></ul></section>

      <section id="affiliate" className="section affiliate-section"><div className="section-heading"><span>JALUR AFFILIATE</span><h2>Ingin mulai berbagi manfaat, tetapi belum siap menjalankan tes?</h2><p>Anda dapat memulai sebagai affiliate dengan merekomendasikan layanan melalui tautan referral. Perannya berbeda dengan promotor resmi, sehingga Anda bisa belajar membangun komunikasi dan jaringan tanpa melompati tahapan.</p></div><div className="affiliate-grid">{affiliatePrograms.map((program, index) => <article className={index === 1 ? 'affiliate-card official' : 'affiliate-card'} key={program.title}><small>{program.eyebrow}</small><h3>{program.title}</h3><p>{program.description}</p><ul>{program.points.map((point) => <li key={point}>✓ {point}</li>)}</ul><PublicInterestAction linkKey={program.linkKey} label={`${program.action} →`} service={program.title} /></article>)}</div><div className="affiliate-flow"><span>Bagikan tautan</span><i>→</i><span>Transaksi tervalidasi</span><i>→</i><span>Komisi tercatat</span><i>→</i><span>Evaluasi langkah berikutnya</span></div></section>

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
