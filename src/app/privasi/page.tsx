import type { Metadata } from 'next';
import { PublicFooter, PublicHeader } from '../public-site-shell';
import TrustPageSchema from '../trust-page-schema';

export const metadata: Metadata = { title: 'Kebijakan Privasi | Konsep STIFIn', description: 'Kebijakan privasi dan pemrosesan data pada Konsep STIFIn.', alternates: { canonical: '/privasi' } };

export default function PrivacyPage() {
  return <div className="public-site journey-site">
    <TrustPageSchema path="/privasi" name="Kebijakan Privasi" description="Kebijakan privasi dan pemrosesan data pada Konsep STIFIn." />
    <PublicHeader active="home" announcement="Kebijakan privasi Konsep STIFIn" />
    <main className="trust-page">
      <section className="trust-hero"><span>KEBIJAKAN PRIVASI</span><h1>Data Anda digunakan seperlunya.</h1><p>Kami mengumpulkan data yang Anda kirimkan melalui formulir untuk menindaklanjuti kebutuhan layanan. Kami tidak menyimpan data sidik jari di platform ini.</p></section>
      <section className="trust-copy"><h2>Penggunaan data</h2><p>Data kontak dan kebutuhan layanan dipakai untuk komunikasi, penjadwalan, dan pencocokan promotor. Data tidak ditampilkan di halaman publik dan tidak dijual.</p><h2>Kontrol Anda</h2><p>Anda dapat meminta koreksi atau penghapusan data melalui kanal kontak layanan. Checkout dan akun transaksi dikelola di app.konsepstifin.com sesuai kebijakan layanannya.</p></section>
    </main>
    <PublicFooter />
  </div>;
}
