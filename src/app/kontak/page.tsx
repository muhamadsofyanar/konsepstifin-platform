import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import PublicInterestAction from '../public-interest-action';

export const metadata: Metadata = { title: 'Kontak Konsep STIFIn | Konsep STIFIn', description: 'Hubungi Konsep STIFIn untuk kebutuhan Tes STIFIn, promotor, dan kerja sama wilayah.', alternates: { canonical: '/kontak' } };
export default function ContactPage() {
  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Bantuan layanan, pembelajaran, dan kerja sama mitra" ctaHref="#pilih-jalur" ctaLabel="Pilih kebutuhan" />
    <main id="main-content" className="trust-page">
      <section className="trust-hero">
        <span>KONTAK</span>
        <h1>Pilih tujuan Anda agar permintaan masuk ke tim dan alur yang tepat.</h1>
        <p>Pilih bantuan yang Anda butuhkan. Permintaan tes dan calon promotor masuk ke tim layanan. Bantuan pembelian, kelas, ebook, dan aktivasi affiliate tersedia melalui akun Anda.</p>
      </section>
      <section id="pilih-jalur" className="trust-grid">
        <article>
          <span>LAYANAN TES STIFIn</span>
          <h2>Untuk peserta tes</h2>
          <p>Sampaikan kota, jumlah peserta, dan kebutuhan Anda. Sistem menyimpan permintaan dan nomor referensi. Admin menindaklanjuti pencocokan promotor dan jadwal.</p>
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
      <section id="affiliate" className="trust-grid contact-support-grid"><article><span>KERJA SAMA AFFILIATE</span><h2>Ingin menjadi mitra rekomendasi?</h2><p>Gunakan akun Anda, lalu ajukan permohonan aktivasi affiliate melalui Bantuan. Jelaskan rencana kerja sama agar admin dapat meninjaunya. Pendaftaran akun peserta tidak otomatis mengaktifkan peran mitra.</p><Link className="public-cta" href="/akun/login?next=%2Fbelajar%3Ftab%3Dsupport">Masuk & ajukan bantuan →</Link><Link href="/affiliate">Pelajari cara kerja affiliate</Link></article><article><span>BANTUAN PESERTA</span><h2>Pembelian, kelas, atau ebook</h2><p>Sertakan nomor pesanan atau judul produk pada permintaan bantuan. Anda dapat membaca jawaban admin di akun yang sama.</p><Link className="public-cta" href="/akun/login?next=%2Fbelajar%3Ftab%3Dsupport">Buka bantuan akun →</Link><Link href="/belajar?tab=catalog">Kembali ke katalog produk</Link></article></section>
    </main>
    <PublicFooter />
  </div>;
}
