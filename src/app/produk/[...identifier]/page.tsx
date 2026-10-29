import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLearningService } from '@/lib/learning-store';
import { getPublicProductByKey } from '@/lib/product-store';
import { getAccountPrincipal } from '@/lib/identity/server';
import { statusLabel } from '@/lib/portal-ui';
import { currentPublicCopy, formatRupiah } from '@/lib/catalog-presentation';
import { productPath } from '@/lib/product-links';
import PublicInterestAction from '../../public-interest-action';
import type { ProductKey } from '../../site-config';
import ProductCheckout from '../product-checkout';
import { getActivePromotion } from '@/lib/promotion-store';
import { PublicFooter, PublicHeader } from '../../public-site-shell';
import '../../belajar/learning.css';

export const dynamic = 'force-dynamic';
const loadProduct = cache(async (key: string, service: boolean) => getLearningService().publicProduct(key, service));

type ProductNarrative = {
  audience: string;
  purpose: string;
  process: string[];
  beforeOrder: string[];
  faqs: Array<[string, string]>;
};

function narrativeFor(key: string, service: boolean): ProductNarrative {
  const testProcess = [
    'Ajukan layanan dan isi data kontak serta domisili.',
    'Tim memeriksa cakupan promotor, jumlah peserta, dan kebutuhan Anda.',
    'Tim mengonfirmasi harga akhir, lokasi, jadwal, serta instruksi pembayaran.',
    'Setelah detail disepakati, ikuti tes dan pembahasan sesuai jadwal yang dikonfirmasi.',
  ];
  const commonTestFaqs: Array<[string, string]> = [
    ['Apakah pengajuan ini langsung menjadi pesanan?', 'Belum. Pengajuan menghasilkan nomor referensi. Tim mengonfirmasi cakupan layanan, jadwal, harga, dan instruksi pembayaran sebelum pesanan disepakati.'],
    ['Apakah tes dilakukan secara online?', 'Layanan Tes STIFIn yang ditampilkan di halaman ini menggunakan pemindaian sidik jari secara tatap muka. Kota dan jadwal harus dikonfirmasi terlebih dahulu.'],
    ['Apakah hasil tes merupakan diagnosis?', 'Bukan. Tes dan pembahasan bersifat edukatif untuk refleksi dan pengembangan diri. Hasilnya tidak menggantikan diagnosis medis atau psikologis maupun penilaian profesional.'],
    ['Bagaimana data saya digunakan?', 'Data kontak dan domisili digunakan untuk menindaklanjuti permintaan serta mencocokkan cakupan layanan. Pembagian kontak kepada promotor dilakukan secara terbatas sesuai persetujuan. Baca kebijakan privasi untuk detailnya.'],
  ];

  if (!service) return {
    audience: 'Peserta yang ingin mengikuti materi digital atau kelas melalui akun KonsepSTIFIn.',
    purpose: 'Produk digital memiliki alur akses berbeda dari layanan tes. Periksa deskripsi, durasi akses, harga, dan persyaratan sebelum membuat pesanan.',
    process: ['Masuk atau buat akun peserta.', 'Periksa detail produk dan harga yang tercantum.', 'Buat pesanan dari akun.', 'Periksa status pembayaran dan akses pada menu Pembelian atau Akses saya.'],
    beforeOrder: ['Akun diperlukan untuk mengakses materi digital.', 'Harga akhir dan diskon dihitung oleh server saat pesanan dibuat.', 'Akses akan mengikuti status pesanan dan ketentuan produk.', 'Gunakan email aktif yang dapat Anda akses.'],
    faqs: [
      ['Apakah saya perlu akun?', 'Ya. Kelas dan ebook digital diakses melalui akun KonsepSTIFIn.'],
      ['Di mana saya melihat pesanan?', 'Masuk ke akun, lalu buka menu Pembelian untuk memeriksa status pesanan.'],
      ['Kapan akses tersedia?', 'Akses diberikan sesuai status pesanan dan ketentuan produk. Jika status belum berubah setelah pembayaran diverifikasi, hubungi bantuan.'],
    ],
  };

  if (key === 'tesPersonal') return {
    audience: 'Individu yang ingin memahami kecenderungan diri dan membahas cara menerapkannya dalam belajar, bekerja, serta berkomunikasi.',
    purpose: 'Mulai dari satu peserta. Tim akan membantu memastikan wilayah, jadwal, harga akhir, dan siapa yang mendampingi proses tes.',
    process: testProcess,
    beforeOrder: ['Layanan menggunakan pemindaian sidik jari secara tatap muka.', 'Pembahasan hasil disesuaikan dengan layanan yang disepakati.', 'Harga dan jadwal final dikonfirmasi sebelum pembayaran.', 'Tes bukan diagnosis dan tidak menentukan keputusan hidup secara tunggal.'],
    faqs: commonTestFaqs,
  };
  if (key === 'tesPasangan') return {
    audience: 'Dua orang pasangan yang ingin membahas perbedaan kecenderungan dan cara berkomunikasi secara lebih terarah.',
    purpose: 'Permintaan dicatat untuk dua peserta. Tim mengonfirmasi kebutuhan pembahasan, cakupan promotor, jadwal, dan harga sebelum pembayaran.',
    process: testProcess,
    beforeOrder: ['Pastikan kedua peserta bersedia mengikuti tes.', 'Jadwal untuk dua peserta perlu dikonfirmasi bersama tim.', 'Hasil membantu membuka percakapan, bukan menggantikan konseling pasangan.', 'Harga akhir mengikuti rincian layanan yang disepakati.'],
    faqs: commonTestFaqs,
  };
  if (key === 'paketKeluarga' || key === 'paketKeluargaPlus') return {
    audience: 'Keluarga yang ingin mengajukan tes untuk beberapa anggota dalam satu rangkaian layanan.',
    purpose: 'Paket membantu mengoordinasikan jumlah peserta dan jadwal keluarga. Jika promo Family Test aktif, pilih skema dan lihat nilai minimum sebelum mengirim permintaan.',
    process: ['Pilih skema keluarga dan hitung jumlah peserta.', 'Kirim nama kontak utama, WhatsApp, dan kota pelaksanaan.', 'Tim mengonfirmasi cakupan promotor, jumlah peserta, harga, serta jadwal.', 'Lanjutkan setelah rincian dan instruksi pembayaran disepakati.'],
    beforeOrder: ['Harga minimum promo dihitung dari jumlah tes berbayar, bukan seluruh peserta termasuk bonus.', 'Promo berlaku hanya pada periode dan skema yang ditetapkan pusat.', 'Jadwal keluarga disepakati bersama tim.', 'Pastikan Anda memiliki persetujuan untuk mengirim data kontak anggota lain.'],
    faqs: [
      ['Bagaimana menghitung promo Family Test?', 'Kalikan jumlah tes berbayar dalam skema aktif dengan harga minimum Rp500.000 per tes berbayar. Tes gratis tidak menambah nominal minimum. Tim mengonfirmasi total akhir.'],
      ['Apakah promo wajib digunakan?', 'Tidak. Program bersifat opsional. Tim akan mengonfirmasi skema yang dipilih dan ketentuan yang berlaku.'],
      ...commonTestFaqs.slice(0, 2),
      commonTestFaqs[3],
    ],
  };
  if (key === 'sekolahKomunitas') return {
    audience: 'Sekolah, lembaga, komunitas, organisasi, atau perusahaan yang ingin mengajukan program untuk kelompok.',
    purpose: 'Tim memerlukan gambaran jumlah peserta, lokasi, dan kebutuhan program agar dapat menyiapkan penawaran yang sesuai.',
    process: ['Ajukan permintaan penawaran dan cantumkan kebutuhan utama.', 'Tim menindaklanjuti untuk memastikan jumlah peserta, wilayah, serta tujuan program.', 'Rincian layanan, harga, jadwal, dan kebutuhan teknis disepakati.', 'Pelaksanaan dimulai setelah konfirmasi dan persetujuan kedua pihak.'],
    beforeOrder: ['Harga bukan tarif final sebelum ruang lingkup program disepakati.', 'Jadwal dan kapasitas pelaksanaan bergantung pada koordinasi tim dan promotor.', 'Jangan mengirim data pribadi peserta secara massal sebelum mekanisme pengumpulan disepakati.', 'Tes tidak menggantikan penilaian akademik, klinis, atau kompetensi profesional.'],
    faqs: [
      ['Data apa yang perlu disiapkan?', 'Mulai dengan nama penanggung jawab, WhatsApp, kota, perkiraan jumlah peserta, dan kebutuhan umum. Daftar peserta rinci dapat dibahas setelah tim menindaklanjuti.'],
      ['Apakah harga langsung muncul?', 'Tidak selalu. Penawaran bergantung pada jumlah peserta, wilayah, jadwal, dan ruang lingkup program.'],
      ['Apakah program bisa untuk kantor?', 'Ajukan kebutuhan institusi. Tim akan memeriksa cakupan dan kesesuaian program sebelum memberikan konfirmasi.'],
    ],
  };
  if (['wsl1', 'wsl2', 'wst'].includes(key)) return {
    audience: 'Calon peserta workshop yang ingin memahami tahapan belajar, jadwal, biaya, dan persyaratan program sebelum mendaftar.',
    purpose: 'Halaman ini mencatat minat dan membantu tim mengonfirmasi paket workshop yang sesuai. Promo Year-End Workshop hanya berlaku sesuai periode dan ketentuan pusat yang aktif.',
    process: ['Pilih program workshop yang ingin ditanyakan.', 'Kirim kontak dan kota/domisili.', 'Tim mengonfirmasi jadwal, format pelaksanaan, persyaratan, dan harga yang berlaku.', 'Lanjutkan pendaftaran setelah seluruh rincian disepakati.'],
    beforeOrder: ['Jadwal, format online atau offline, dan persyaratan perlu dikonfirmasi oleh tim.', 'Harga promo pusat dapat berbeda dari harga katalog reguler selama periode promo aktif.', 'Jangan membayar berdasarkan pesan yang belum dikonfirmasi melalui kanal resmi.', 'Pendaftaran belum berarti kursi atau jadwal telah dikonfirmasi.'],
    faqs: [
      ['Apakah harga yang ditampilkan sudah final?', 'Harga mengikuti program dan periode yang berlaku. Tim mengonfirmasi nominal, cakupan, serta instruksi pembayaran sebelum transaksi.'],
      ['Apakah workshop online?', 'Program Year-End Workshop yang diumumkan pusat mencakup penyesuaian harga workshop online. Format dan jadwal setiap program tetap perlu dikonfirmasi oleh tim.'],
      ['Apakah saya langsung terdaftar setelah mengirim formulir?', 'Belum. Anda akan menerima nomor referensi. Tim akan menindaklanjuti dan mengonfirmasi proses pendaftaran.'],
    ],
  };
  if (key === 'previewPromotor' || key === 'paketPromotor' || key === 'idDanAlat') return {
    audience: 'Orang yang sedang mempelajari jalur menjadi promotor dan ingin memahami peran, tahapan, kebutuhan belajar, serta persyaratan sebelum memutuskan.',
    purpose: 'Tim akan menjelaskan tahap yang relevan berdasarkan kondisi Anda. Pengajuan informasi bukan persetujuan otomatis untuk menjadi promotor aktif.',
    process: ['Ajukan konsultasi awal.', 'Tim menjelaskan peran, tahapan, biaya, persyaratan, dan jadwal.', 'Tinjau ketentuan sebelum memilih workshop atau paket.', 'Lanjutkan setiap tahap setelah persyaratan terkait dikonfirmasi.'],
    beforeOrder: ['Status promotor aktif mengikuti persyaratan dan proses yang berlaku.', 'Biaya dan komponen paket dikonfirmasi sebelum pembayaran.', 'Jangan menganggap pengajuan informasi sebagai aktivasi.', 'Affiliate dan promotor memiliki peran serta ketentuan yang berbeda.'],
    faqs: [
      ['Apakah saya langsung menjadi promotor setelah mengajukan?', 'Tidak. Pengajuan hanya mencatat minat. Tim akan menjelaskan tahapan dan persyaratan yang berlaku.'],
      ['Apakah ada biaya?', 'Biaya bergantung pada tahap atau paket yang dipilih. Rincian final dikonfirmasi oleh tim sebelum pembayaran.'],
      ['Apa perbedaan promotor dan affiliate?', 'Affiliate merekomendasikan layanan sesuai ketentuan kerja sama. Promotor aktif menjalankan layanan tes setelah memenuhi tahap dan ketentuan yang berlaku.'],
    ],
  };

  return {
    audience: 'Pengunjung yang ingin memahami produk, persyaratan, biaya, dan langkah berikutnya sebelum mengirim permintaan.',
    purpose: 'Pilih kebutuhan yang paling sesuai. Tim akan mengonfirmasi detail yang belum tersedia pada halaman ini sebelum transaksi.',
    process: ['Pelajari ringkasan dan fasilitas.', 'Kirim permintaan dengan kontak aktif.', 'Tunggu konfirmasi detail dari tim.', 'Lanjutkan setelah rincian disepakati.'],
    beforeOrder: ['Harga dan persyaratan dapat bergantung pada program aktif.', 'Pengajuan tidak berarti layanan atau jadwal telah dikonfirmasi.', 'Baca kebijakan privasi sebelum mengirim data kontak.'],
    faqs: [
      ['Apa yang terjadi setelah formulir dikirim?', 'Anda menerima nomor referensi untuk tindak lanjut.'],
      ['Apakah harga sudah final?', 'Tim mengonfirmasi harga dan ketentuan sebelum pembayaran.'],
      ['Bagaimana data digunakan?', 'Data digunakan untuk menindaklanjuti permintaan sesuai kebijakan privasi.'],
    ],
  };
}

export async function generateMetadata({ params }: { params: Promise<{ identifier: string[] }> }): Promise<Metadata> {
  const { identifier } = await params;
  const service = identifier.length === 2 && identifier[0] === 'layanan';
  const key = service ? identifier[1] : identifier[0];
  if ((!service && identifier.length !== 1) || !key || !/^[a-zA-Z0-9-]{1,100}$/.test(key)) return { title: 'Produk tidak ditemukan', robots: { index: false, follow: false } };
  const product = await loadProduct(key, service);
  if (!product) return { title: 'Produk tidak tersedia', robots: { index: false, follow: false } };
  const title = String(product.title) + ' | KonsepSTIFIn';
  const description = currentPublicCopy(String(product.description)).slice(0, 160);
  const url = productPath(product);
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } };
}

export default async function Page({ params }: { params: Promise<{ identifier: string[] }> }) {
  const { identifier } = await params;
  const service = identifier.length === 2 && identifier[0] === 'layanan';
  const key = service ? identifier[1] : identifier[0];
  if ((!service && identifier.length !== 1) || !/^[a-zA-Z0-9-]{1,100}$/.test(key)) notFound();
  const learning = getLearningService();
  const product = await loadProduct(key, service);
  if (!product) notFound();
  const [legacy, promo, account] = await Promise.all([
    service ? getPublicProductByKey(key) : Promise.resolve(null),
    getActivePromotion(),
    getAccountPrincipal().catch(() => null),
  ]);
  if (service && key === 'wst' && !promo.workshopActive) notFound();
  const signedIn = Boolean(account?.active && account.sessionValid);
  const owned = signedIn && !service ? await learning.hasProductAccess(account!.userId, Number(product.id)) : false;
  const workshopPromoPrice = service && promo.workshopActive && ['wsl1', 'wsl2', 'wst'].includes(key)
    ? promo.settings.workshopPrices[key as 'wsl1' | 'wsl2' | 'wst'] : null;
  const familyPromo = service && promo.familyActive && ['paketKeluarga', 'paketKeluargaPlus'].includes(key)
    ? { minimumPaidTestPrice: promo.settings.minimumPaidTestPrice, schemes: promo.settings.familySchemes } : undefined;
  const price = formatRupiah(workshopPromoPrice ?? Number(product.price));
  const priceNote = familyPromo
    ? 'Pilih skema Family Test. Harga minimum dihitung dari jumlah tes berbayar dan dikonfirmasi admin.'
    : workshopPromoPrice !== null
      ? `Harga promo pusat berlaku sampai ${promo.settings.endDate}. Format, jadwal, persyaratan, dan rincian program dikonfirmasi tim.`
      : currentPublicCopy(String(product.price_note));
  const narrative = narrativeFor(key, service);
  const isPromoterProduct = ['previewPromotor', 'wsl1', 'wsl2', 'wst', 'idDanAlat', 'paketPromotor'].includes(key);
  const activePage: 'promoter' | 'test' | 'catalog' = isPromoterProduct ? 'promoter' : service ? 'test' : 'catalog';
  const headerAnnouncement = service
    ? 'Ajukan kebutuhan terlebih dahulu · Harga, cakupan, dan jadwal dikonfirmasi sebelum pembayaran'
    : 'Kelas dan ebook digital · Akses dikelola melalui akun KonsepSTIFIn';

  return <div className="public-site journey-site product-landing-site">
    <PublicHeader active={activePage} announcement={headerAnnouncement} ctaHref={service ? (isPromoterProduct ? '/jadi-promotor#tahapan' : '/tes-stifin#layanan') : '/belajar?tab=catalog'} ctaLabel={service ? (isPromoterProduct ? 'Lihat tahapan' : 'Bandingkan layanan') : 'Lihat katalog'} />
    <main id="main-content" className="learning-app lr-product-detail">
      <nav className="lr-breadcrumb" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href={service ? (isPromoterProduct ? '/jadi-promotor' : '/tes-stifin') : '/belajar?tab=catalog'}>{service ? (isPromoterProduct ? 'Promotor & workshop' : 'Tes STIFIn') : 'Kelas & ebook'}</Link><span>/</span><span>{String(product.title)}</span></nav>
      <div className="lr-product-layout">
        <article className="lr-card lr-product-main-card">
          <div className="lr-course-cover"><span>{service ? 'LAYANAN KONSEPSTIFIN' : statusLabel(product.kind).toUpperCase()}</span><b aria-hidden="true">◌</b></div>
          <span className="lr-eyebrow">{legacy?.eyebrow ?? (service ? 'PILIHAN LAYANAN' : 'PILIHAN KONSEPSTIFIN')}</span>
          <h1>{String(product.title)}</h1>
          <p className="lr-product-description">{currentPublicCopy(String(product.description))}</p>
          <div className="lr-product-audience"><small>COCOK UNTUK</small><p>{narrative.audience}</p></div>
          {familyPromo && <section className="lr-inline-notice"><h3>Promo Family Test dari pusat</h3><p>Promo berlaku {promo.settings.startDate} sampai {promo.settings.endDate}. Harga jual minimal Rp{familyPromo.minimumPaidTestPrice.toLocaleString('id-ID')} per tes berbayar. Pilih skema aktif saat mengajukan permintaan.</p><ul className="lr-benefits">{familyPromo.schemes.map(item => <li key={item.key}>{item.label} · {item.paidTests + item.freeTests} peserta · minimum Rp{(item.paidTests * familyPromo.minimumPaidTestPrice).toLocaleString('id-ID')}</li>)}</ul></section>}
          {workshopPromoPrice !== null && <section className="lr-inline-notice"><h3>Harga promo pusat</h3><p>Harga ini berlaku selama periode promo yang ditampilkan. Tim akan mengonfirmasi format pelaksanaan, jadwal, persyaratan, dan instruksi pembayaran.</p></section>}
          {!!legacy?.features.length && <><h2>Yang Anda dapatkan</h2><ul className="lr-benefits">{legacy.features.map(item => <li key={item}>✓ {item}</li>)}</ul></>}
          {!!legacy?.bonuses.length && <section className="lr-inline-notice"><h3>Bonus atau materi pendukung</h3><ul className="lr-benefits">{legacy.bonuses.map(item => <li key={item}>{item}</li>)}</ul></section>}
          <p className="lr-muted">{service ? narrative.purpose : product.access_days ? `${product.access_days} hari akses` : 'Akses mengikuti ketentuan produk dan status pesanan Anda.'}</p>
        </article>
        <aside className="lr-card lr-product-purchase">
          <span className="lr-eyebrow">{service ? 'LANGKAH BERIKUTNYA' : 'AKSES PRODUK'}</span>
          <div className="lr-price">{familyPromo ? 'Harga sesuai skema promo' : service && !Number(product.price) && workshopPromoPrice === null ? 'Minta penawaran' : (workshopPromoPrice !== null || Number(product.price)) ? price : 'Gratis'}</div>
          {workshopPromoPrice !== null && <span className="promo-product-badge">PROMO PUSAT</span>}
          <p>{service ? priceNote : product.access_days ? `${product.access_days} hari akses` : 'Akses sesuai ketentuan produk'}</p>
          {service ? <><PublicInterestAction linkKey={key as ProductKey} service={String(product.title)} label={legacy?.action || 'Ajukan layanan ini →'} className="lr-button" familyPromo={familyPromo} /><p className="lr-muted">Tidak wajib membuat akun untuk mengajukan layanan. Setelah formulir dikirim, simpan nomor referensi. Pengajuan belum berarti pesanan lunas atau jadwal terkonfirmasi.</p><div className="lr-product-support-links"><Link href="/kontak">Ada pertanyaan? Hubungi tim</Link><Link href="/privasi">Cara data Anda digunakan</Link></div></> : <ProductCheckout product={product} signedIn={signedIn} owned={owned} path={productPath(product)} />}
          {!signedIn && !service ? <p className="lr-muted">Untuk produk digital, masuk atau daftar agar akses dan pesanan tercatat pada akun Anda.</p> : null}
        </aside>
      </div>

      <section className="lr-product-detail-section">
        <div className="lr-product-section-heading"><span className="lr-eyebrow">BAGAIMANA PROSESNYA</span><h2>{service ? 'Langkah dari pengajuan sampai layanan dikonfirmasi.' : 'Cara mendapatkan akses produk.'}</h2><p>{narrative.purpose}</p></div>
        <ol className="lr-product-steps">{narrative.process.map((step, index) => <li key={step}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></li>)}</ol>
      </section>

      <section className="lr-product-detail-section lr-product-before-order">
        <div className="lr-product-section-heading"><span className="lr-eyebrow">INFORMASI PENTING</span><h2>Sebelum Anda melanjutkan.</h2><p>Kami ingin Anda memahami apa yang sudah pasti dan apa yang masih perlu dikonfirmasi.</p></div>
        <ul>{narrative.beforeOrder.map(item => <li key={item}>{item}</li>)}</ul>
        <div className="lr-product-contact-strip"><div><b>Masih ragu memilih?</b><span>Tim dapat membantu menjelaskan layanan dan langkah berikutnya.</span></div><Link className="lr-button lr-secondary" href="/kontak">Hubungi tim →</Link></div>
      </section>

      <section className="lr-product-detail-section lr-product-faq">
        <div className="lr-product-section-heading"><span className="lr-eyebrow">PERTANYAAN UMUM</span><h2>Yang sering ditanyakan.</h2></div>
        {narrative.faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}
      </section>
      <div className="lr-product-bottom-cta"><div><span className="lr-eyebrow">LANGKAH SELANJUTNYA</span><h2>{service ? 'Mulai dengan permintaan sederhana.' : 'Lanjutkan dengan akun Anda.'}</h2><p>{service ? 'Isi data inti saja. Tim mengonfirmasi detail sebelum Anda memutuskan.' : 'Periksa detail produk, buat pesanan, lalu pantau akses melalui akun.'}</p></div>{service ? <PublicInterestAction linkKey={key as ProductKey} service={String(product.title)} label="Ajukan sekarang →" className="lr-button" familyPromo={familyPromo} /> : <Link className="lr-button" href={signedIn ? '/belajar?tab=orders' : '/akun/login?next=' + encodeURIComponent(productPath(product))}>{signedIn ? 'Lihat pembelian' : 'Masuk untuk melanjutkan'} →</Link>}</div>
    </main>
    <PublicFooter />
  </div>;
}
