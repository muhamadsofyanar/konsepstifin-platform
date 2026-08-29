import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import PublicInterestAction from '../public-interest-action';

export const metadata: Metadata = { title: 'Kontak Konsep STIFIn | Konsep STIFIn', description: 'Hubungi Konsep STIFIn untuk kebutuhan Tes STIFIn, promotor, dan kerja sama wilayah.', alternates: { canonical: '/kontak' } };
export default function ContactPage() {
  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Pilih jalur Tes STIFIn atau konsultasi calon promotor" ctaHref="#pilih-jalur" ctaLabel="Pilih kebutuhan" />
    <main className="trust-page">
      <section className="trust-hero">
        <span>KONTAK</span>
        <h1>Pilih tujuan Anda agar permintaan masuk ke tim dan alur yang tepat.</h1>
        <p>Layanan tes dapat berlanjut ke pencocokan promotor dan checkout. Konsultasi calon promotor berhenti di pipeline tindak lanjut dan tidak menuju pembayaran tes.</p>
      </section>
      <section id="pilih-jalur" className="trust-grid">
        <article>
          <span>LAYANAN TES STIFIn</span>
          <h2>Untuk peserta tes</h2>
          <p>Sampaikan kota, jumlah peserta, dan kebutuhan Anda. Sistem mencatat permintaan, mencari promotor, lalu mengarahkan layanan tes ke checkout resmi.</p>
          <PublicInterestAction leadType="test_service" captureLead className="public-cta" linkKey="tesPersonal" label="Ajukan layanan tes →" service="Bantuan memilih layanan STIFIn" />
          <Link href="/tes-stifin#layanan">Bandingkan paket tes</Link>
        </article>
        <article>
          <span>JALUR CALON PROMOTOR</span>
          <h2>Untuk calon promotor</h2>
          <p>Sampaikan tahap yang ingin dipahami—Preview, WSL, atau aktivasi. Permintaan masuk ke antrean konsultasi dan tidak menuju pembayaran tes.</p>
          <PublicInterestAction leadType="promoter_candidate" captureLead className="public-cta" linkKey="previewPromotor" label="Minta konsultasi promotor →" service="Bantuan memahami tahapan promotor" />
          <Link href="/jadi-promotor">Pelajari seluruh tahap</Link>
        </article>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
