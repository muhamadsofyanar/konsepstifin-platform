import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/article-store';
import { PublicFooter, PublicHeader } from './public-site-shell';
import PublicPromotionBanner from './public-promotion-banner';
import ActivityGallery from './activity-gallery';
import PublicInterestAction from './public-interest-action';
import { getActivePromotion } from '@/lib/promotion-store';
import VisitorPathFinder from './visitor-path-finder';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tes STIFIn untuk Diri, Keluarga & Sekolah | KonsepSTIFIn',
  description: 'Temukan layanan Tes STIFIn untuk diri sendiri, pasangan, keluarga, sekolah, atau organisasi. Pilih kebutuhan, pahami prosesnya, dan ajukan layanan tanpa harus membuat akun terlebih dahulu.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Temukan Layanan Tes STIFIn | KonsepSTIFIn', description: 'Pilih layanan untuk diri sendiri, keluarga, sekolah, atau organisasi. Pelajari proses dan langkah berikutnya dengan jelas.', url: '/', type: 'website' },
};

const journeys = [
  { number: '01', eyebrow: 'UNTUK DIRI SENDIRI', title: 'Tes Personal', description: 'Mulai dengan satu peserta. Pelajari layanan, proses pemindaian, pembahasan hasil, dan cara mengajukan jadwal.', href: '/produk/layanan/tesPersonal', action: 'Lihat Tes Personal', tone: 'forest' },
  { number: '02', eyebrow: 'UNTUK PASANGAN & KELUARGA', title: 'Tes Keluarga', description: 'Bandingkan layanan pasangan, keluarga, dan Family Test. Promo pusat ditampilkan jika sedang aktif.', href: '/produk/layanan/paketKeluarga', action: 'Bandingkan paket keluarga', tone: 'sand' },
  { number: '03', eyebrow: 'UNTUK SEKOLAH & ORGANISASI', title: 'Tes Kelompok', description: 'Ajukan kebutuhan untuk sekolah, komunitas, lembaga, atau tim. Jumlah peserta dan jadwal dikonfirmasi bersama tim.', href: '/produk/layanan/sekolahKomunitas', action: 'Minta penawaran kelompok', tone: 'mint' },
  { number: '04', eyebrow: 'UNTUK CALON MITRA', title: 'Promotor & Workshop', description: 'Pelajari tahapan, persyaratan, workshop, dan perbedaan jalur promotor dengan affiliate sebelum memutuskan.', href: '/jadi-promotor', action: 'Pelajari jalur kemitraan', tone: 'forest' },
];

export default async function Home() {
  const [latestArticles, promo] = await Promise.all([getPublishedArticles(3), getActivePromotion()]);


  return <div className="public-site journey-site">
    <PublicHeader active="home" announcement="Tes STIFIn personal, pasangan, keluarga, dan institusi · Jadwal dikonfirmasi bersama tim" />
    <main id="main-content">
      <section className="hub-hero">
        <div className="hub-hero-copy">
          <span className="eyebrow">KONSEP STIFIN · DALAM JARINGAN STIFIN GENETIC</span>
          <h1>Tes STIFIn untuk memahami diri dan keluarga.<br/><em>Mulai dari kebutuhan Anda.</em></h1>
          <p>Pilih layanan sesuai kebutuhan. Anda dapat mengajukan permintaan tanpa akun; tim akan mengonfirmasi promotor, lokasi, jadwal, promo, dan biaya sebelum pembayaran.</p>
          <div className="hub-actions"><Link className="public-cta big" href="/tes-stifin#layanan">Pilih layanan Tes STIFIn →</Link><PublicInterestAction className="public-cta big home-help-cta" linkKey="tesPersonal" label="Bantu saya memilih" service="Bantuan memilih layanan STIFIn" leadType="test_service" familyPromo={promo.familyActive ? { minimumPaidTestPrice: promo.settings.minimumPaidTestPrice, schemes: promo.settings.familySchemes } : undefined} /></div><div className="public-proof-strip"><span>✓ Tes tatap muka</span><span>✓ Pembahasan bersama promotor</span><span>✓ Jadwal dikonfirmasi</span></div>
        </div>
        <figure className="journey-hero-media home-hero-media">
          <Image src="/images/hero-home-v3.webp" alt="Keluarga Muslim Indonesia berbincang dan saling mendengarkan" width={1586} height={992} sizes="(max-width: 1050px) 90vw, 45vw" preload />
          <figcaption className="media-story-card"><small>PERJALANAN ANDA</small><b>Kenali diri</b><span>Pahami perbedaan · Tumbuh bersama</span></figcaption>
        </figure>
      </section>

      <PublicPromotionBanner />

      <VisitorPathFinder />

      <section className="journey-grid home-primary-journeys" aria-label="Mulai dari kebutuhan Anda">
        {journeys.map((item) => <article className={`journey-card ${item.tone}`} key={item.href}>
          <header><span>{item.eyebrow}</span><b>{item.number}</b></header>
          <h2>{item.title}</h2><p>{item.description}</p>
          <Link href={item.href}>{item.action} <span>→</span></Link>
        </article>)}
      </section>


      <section className="life-situations" aria-label="Kebutuhan calon peserta Tes STIFIn">
        <article><small>DI RUMAH</small><p>“Sudah dijelaskan berkali-kali, kenapa cara menangkapnya tetap berbeda?”</p><span>Pahami cara belajar dan berkomunikasi.</span></article>
        <article><small>DALAM DIRI</small><p>“Saya bisa banyak hal, tetapi mana yang paling alami untuk saya?”</p><span>Kenali pola kerja yang terasa lebih mengalir.</span></article>
        <article><small>DI TEMPAT KERJA</small><p>“Mengapa satu cara memotivasi tidak cocok untuk semua orang?”</p><span>Lihat perbedaan sebagai petunjuk, bukan hambatan.</span></article>
      </section>

      <section className="hub-purpose">
        <div><span>PERNAH MERASAKANNYA?</span><h2>Sering kali bukan kurang usaha. Kita hanya belum memahami cara kerjanya.</h2></div>
        <p>Ada yang datang karena ingin lebih paham dirinya. Ada yang sedang mencari cara berkomunikasi dengan pasangan atau anak. Ada pula yang ingin menjadikan STIFIn sebagai jalan belajar dan profesi. Mulailah dari kebutuhan yang paling dekat dengan Anda.</p>
      </section>


      <section className="home-process section" aria-labelledby="home-process-title">
        <div className="section-heading"><span>ALUR YANG JELAS</span><h2 id="home-process-title">Dari memilih layanan sampai jadwal dikonfirmasi.</h2><p>Anda tidak harus memahami seluruh katalog atau membuat akun terlebih dahulu untuk meminta layanan tes.</p></div>
        <ol className="home-process-grid">
          <li><b>01</b><h3>Pilih kebutuhan</h3><p>Personal, pasangan, keluarga, atau kelompok. Jika belum yakin, gunakan bantuan memilih.</p></li>
          <li><b>02</b><h3>Kirim data inti</h3><p>Isi nama, WhatsApp, kota, dan persetujuan kontak. Detail lain bersifat opsional.</p></li>
          <li><b>03</b><h3>Tim mengonfirmasi</h3><p>Tim meninjau cakupan promotor, jumlah peserta, promo, harga, dan jadwal yang tersedia.</p></li>
          <li><b>04</b><h3>Lanjut setelah setuju</h3><p>Anda menerima instruksi berikutnya. Pembayaran diverifikasi sebelum layanan dijadwalkan final.</p></li>
        </ol>
      </section>

      <ActivityGallery />

      <section className="home-preparation" aria-labelledby="home-preparation-title">
        <div className="home-preparation-heading">
          <span className="section-kicker">AGAR TINDAK LANJUT LEBIH CEPAT</span>
          <h2 id="home-preparation-title">Siapkan informasi inti saja.</h2>
          <p>Anda tidak perlu mengisi formulir panjang di awal. Tiga informasi ini membantu tim memahami kebutuhan Anda tanpa mengumpulkan data berlebihan.</p>
        </div>
        <div className="home-preparation-grid">
          <article><span>01</span><div><h3>Kota atau wilayah</h3><p>Digunakan untuk memeriksa cakupan promotor. Alamat lengkap tidak perlu diberikan pada tahap awal.</p></div></article>
          <article><span>02</span><div><h3>Jumlah peserta</h3><p>Mulai dari satu peserta, keluarga, atau perkiraan jumlah peserta kelompok.</p></div></article>
          <article><span>03</span><div><h3>Tujuan Anda</h3><p>Misalnya memahami diri, mendampingi keluarga, atau mengadakan program di sekolah dan organisasi.</p></div></article>
        </div>
        <p className="home-preparation-privacy"><span aria-hidden="true">✓</span> Data tambahan hanya diminta jika memang diperlukan. Jangan mengirim data sensitif melalui formulir awal.</p>
      </section>

      <section className="home-decision-info" aria-label="Informasi penting sebelum mengajukan layanan">
        <div><span>SEBELUM MENGAJUKAN</span><h2>Informasi penting, tanpa janji yang tidak pasti.</h2><p>KonsepSTIFIn membantu menghubungkan kebutuhan Anda dengan layanan dan tim yang sesuai. Beberapa hal baru dapat dipastikan setelah tim memeriksa permintaan.</p></div>
        <div className="home-decision-grid">
          <article><b>Harga dan promo</b><p>Harga akhir, skema promo, dan rincian layanan dikonfirmasi sebelum pembayaran.</p></article>
          <article><b>Lokasi dan jadwal</b><p>Tes dilakukan tatap muka. Wilayah layanan tidak otomatis berarti jadwal tersedia.</p></article>
          <article><b>Data pribadi</b><p>Nomor kontak dibagikan secara terbatas sesuai persetujuan. Jangan kirim data sidik jari atau kata sandi.</p></article>
          <article><b>Batas penggunaan hasil</b><p>Materi dan tes bersifat edukatif, bukan diagnosis medis atau psikologis.</p></article>
        </div>
      </section>

      <section className="hub-foundation">
        <div className="hub-foundation-copy"><span>SETELAH TAHU HASILNYA</span><h2>Tes memberi nama pada pola. Pemahaman membuatnya berguna.</h2><p>Hasil STIFIn adalah awal percakapan tentang cara Anda menyerap informasi, mengambil keputusan, bergerak, dan bertumbuh. Nilainya terasa ketika hasil dibahas dengan baik lalu diterapkan sesuai situasi nyata, bukan ketika dipakai untuk membatasi diri.</p><Link href="/edukasi">Lihat cara menerapkannya →</Link></div>
        <div className="hub-principles">
          <article><b>01</b><div><h3>Kenali Mesin Kecerdasan</h3><p>Pahami kecenderungan dominan yang ditemukan melalui proses tes.</p></div></article>
          <article><b>02</b><div><h3>Bahas, jangan hanya membaca</h3><p>Promotor membantu menerjemahkan hasil ke dalam bahasa yang lebih mudah dipahami.</p></div></article>
          <article><b>03</b><div><h3>Coba dalam kehidupan nyata</h3><p>Mulai dari perubahan kecil dalam belajar, bekerja, dan berkomunikasi.</p></div></article>
        </div>
      </section>

      {latestArticles.length > 0 && <section className="section home-education hub-education">
        <div className="education-section-head"><div><span>ARTIKEL TERBARU</span><h2>Belajar dari situasi yang dekat dengan keseharian.</h2></div><div><p>Pahami konsep STIFIn melalui contoh tentang diri, keluarga, pendidikan, pekerjaan, dan organisasi.</p><Link href="/edukasi">Lihat semua artikel →</Link></div></div>
        <div className="home-article-grid">{latestArticles.map((article, index) => <article key={article.slug}>
          <Link className={`article-cover ${article.tone}`} href={`/edukasi/${article.slug}`}><span>{article.category}</span><b>{String(index + 1).padStart(2, '0')}</b><small>{article.readTime}</small></Link>
          <div><span>{article.category}</span><h3><Link href={`/edukasi/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link href={`/edukasi/${article.slug}`}>Baca artikel →</Link></div>
        </article>)}</div>
      </section>}

      <section className="home-faq section" aria-labelledby="home-faq-title">
        <div className="section-heading"><span>PERTANYAAN SEBELUM MEMULAI</span><h2 id="home-faq-title">Hal yang perlu Anda ketahui.</h2></div>
        <div className="faq-list">
          <details><summary>Apakah saya harus membuat akun untuk mengajukan tes?<span>＋</span></summary><p>Tidak. Pengunjung dapat mengirim permintaan layanan tanpa akun. Akun berguna untuk akses kelas, ebook, pembelian, dan aktivitas mitra.</p></details>
          <details><summary>Apa yang terjadi setelah saya mengirim formulir?<span>＋</span></summary><p>Anda menerima nomor referensi. Tim akan meninjau kebutuhan dan mengonfirmasi cakupan promotor, jadwal, harga, serta instruksi pembayaran. Formulir bukan bukti pembayaran atau kepastian jadwal.</p></details>
          <details><summary>Apakah tes bisa dilakukan secara online?<span>＋</span></summary><p>Pemindaian sidik jari untuk layanan tes yang ditampilkan dilakukan secara tatap muka. Hubungi tim untuk memastikan pilihan wilayah dan jadwal.</p></details>
          <details><summary>Apakah hasil STIFIn merupakan diagnosis?<span>＋</span></summary><p>Bukan. Informasi dan pembahasan STIFIn digunakan untuk edukasi dan refleksi pengembangan diri. Hasilnya tidak menggantikan penilaian profesional atau diagnosis medis dan psikologis.</p></details>
          <details><summary>Apakah ada promo untuk keluarga atau workshop?<span>＋</span></summary><p>Program promo pusat ditampilkan pada website selama periode aktif. Skema Family Test dan harga workshop mengikuti ketentuan pusat serta dikonfirmasi kembali sebelum pembayaran.</p></details>
        </div>
      </section>

      <section className="home-entry-paths" aria-labelledby="home-entry-paths-title">
        <div className="home-entry-heading"><span>SUDAH TERDAFTAR?</span><h2 id="home-entry-paths-title">Lanjutkan dari akun yang sesuai.</h2><p>Pengunjung baru dapat langsung melihat layanan. Jika sudah memiliki akun, pilih jalur masuk di bawah.</p></div>
        <div className="home-entry-grid">
          <article className="home-entry-card">
            <span className="home-entry-icon" aria-hidden="true">01</span><div><h3>Pelanggan atau anggota</h3><p>Masuk untuk memeriksa aktivitas, kelas, pembelian, atau pesanan yang terkait dengan akun Anda.</p></div><Link href="/akun/login?next=%2Fakun">Masuk ke akun <span aria-hidden="true">→</span></Link>
          </article>
          <article className="home-entry-card featured">
            <span className="home-entry-icon" aria-hidden="true">02</span><div><h3>Promotor aktif</h3><p>Buka pusat promotor untuk melanjutkan aktivitas sesuai peran dan akses yang telah diberikan.</p></div><Link href="/akun/login?next=%2Fakun">Masuk ke portal promotor <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>


      <section className="hub-final">
        <div><span>PILIH SATU LANGKAH</span><h2>Tidak perlu memahami semua pilihan sekaligus. Pilih kebutuhan utama Anda, lalu tim membantu langkah berikutnya.</h2></div>
        <div><Link className="public-cta big" href="/tes-stifin">Saya ingin tes STIFIn →</Link><Link href="/jadi-promotor#year-end-workshop">Saya dari cabang / ingin bermitra</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
