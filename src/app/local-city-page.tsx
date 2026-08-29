import Link from 'next/link';
import JsonLd from '@/app/json-ld';
import PublicInterestAction from '@/app/public-interest-action';
import { promoterProfileSlug, type LocalPageData } from '@/lib/local-seo';

export default function LocalCityPage({ data, intent }: { data: LocalPageData; intent: 'test' | 'promoter' }) {
  const isTest = intent === 'test';
  const route = isTest ? 'tes-stifin' : 'promotor-stifin';
  const canonical = `https://konsepstifin.com/${route}/${data.canonicalSlug}`;
  const title = isTest ? `Tes STIFIn di ${data.regency.name}` : `Promotor STIFIn di ${data.regency.name}`;
  const faqs = isTest ? [
    { question: `Bagaimana proses Tes STIFIn di ${data.regency.name}?`, answer: 'Permintaan dicatat lebih dulu, lalu tim mencocokkan promotor dan mengonfirmasi jadwal. Pemindaian sidik jari dilakukan secara tatap muka.' },
    { question: 'Apakah jadwal langsung tersedia?', answer: 'Jadwal berdasarkan konfirmasi dengan promotor yang ditugaskan.' },
    { question: 'Apakah formulir ini meminta data sidik jari?', answer: 'Tidak. Formulir hanya meminta data kontak dan kebutuhan layanan. Jangan mengirim data sidik jari atau dokumen identitas.' },
  ] : [
    { question: `Apakah promotor yang tampil aktif untuk ${data.regency.name}?`, answer: data.promoters.length ? 'Ya. Daftar ini berasal dari data promotor aktif dan cakupan wilayah yang telah dipetakan.' : 'Cakupan layanan ditandai melalui override admin yang memiliki catatan bukti. Promotor akan dikonfirmasi setelah permintaan masuk.' },
    { question: 'Apakah nomor pribadi promotor ditampilkan?', answer: 'Tidak. Kontak pribadi tidak dibuka di halaman publik. Koordinasi awal dilakukan melalui formulir layanan.' },
    { question: 'Bagaimana memastikan jadwal?', answer: 'Kirim kebutuhan dan lokasi Anda. Jadwal berdasarkan konfirmasi dengan promotor yang ditugaskan.' },
  ];
  const breadcrumbs = [
    { name: 'Beranda', url: 'https://konsepstifin.com/' },
    { name: isTest ? 'Tes STIFIn' : 'Direktori Promotor', url: `https://konsepstifin.com/${isTest ? 'tes-stifin' : 'promotor'}` },
    { name: data.regency.name, url: canonical },
  ];

  return <main className="region-page local-city-page">
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Service', name: title, areaServed: { '@type': 'AdministrativeArea', name: data.regency.name }, url: canonical, provider: { '@type': 'Organization', name: 'Konsep STIFIn', url: 'https://konsepstifin.com' } },
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) },
      { '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
    ] }} />
    <nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / </span><Link href={isTest ? '/tes-stifin' : '/promotor'}>{isTest ? 'Tes STIFIn' : 'Promotor'}</Link><span> / {data.regency.name}</span></nav>
    <header className="region-hero">
      <span>{isTest ? 'LAYANAN TES BERDASARKAN WILAYAH' : 'JARINGAN PROMOTOR AKTIF'}</span>
      <h1>{title}</h1>
      <p>{isTest ? `Mulai dari kebutuhan Anda, lalu tim membantu mencocokkan promotor dan mengonfirmasi jadwal layanan di ${data.regency.name}.` : `Lihat promotor aktif dengan cakupan ${data.regency.name}. Kontak pribadi tidak ditampilkan dan jadwal dikoordinasikan setelah permintaan dikirim.`}</p>
      <PublicInterestAction leadType="test_service" captureLead linkKey="tesPersonal" label={isTest ? 'Ajukan layanan tes →' : 'Minta koordinasi promotor →'} service="Tes STIFIn Personal" className="public-cta big" provinceCode={data.province.code} provinceName={data.province.name} regencyCode={data.regency.code} regencyName={data.regency.name} />
    </header>

    <section className="region-section local-proof">
      <span>BUKTI CAKUPAN</span><h2>{data.promoters.length ? `${data.promoters.length} promotor aktif terpetakan` : 'Cakupan layanan terverifikasi admin'}</h2>
      <p>{data.promoters.length ? `Promotor berikut mempunyai pemetaan cakupan yang relevan dengan ${data.regency.name}. Penugasan akhir mempertimbangkan kebutuhan dan konfirmasi jadwal.` : `Belum ada kartu promotor publik untuk ${data.regency.name}, tetapi cakupan ini memiliki override layanan dengan catatan bukti yang tersimpan. Penugasan tetap dikonfirmasi setelah permintaan masuk.`}</p>
      {data.promoters.length ? <div className="region-promoters promoter-card-grid">{data.promoters.slice(0, 24).map((promoter) => <article key={promoter.code}><span>PROMOTOR AKTIF</span><h3><Link href={`/promotor/${promoterProfileSlug(promoter)}`}>{promoter.name}</Link></h3><p>KodeID {promoter.code}</p><p>{[promoter.area, promoter.province].filter(Boolean).join(', ')}</p><small>Jadwal berdasarkan konfirmasi</small></article>)}</div> : null}
    </section>

    <section className="region-section local-process"><span>{isTest ? 'ALUR LAYANAN' : 'KOORDINASI AMAN'}</span><h2>{isTest ? 'Tiga langkah sebelum jadwal dipastikan' : 'Temukan promotor tanpa membuka kontak pribadi'}</h2><div className="local-process-grid">{(isTest ? [
      ['1', 'Kirim kebutuhan', 'Pilih layanan, isi domisili, dan sampaikan preferensi jadwal.'],
      ['2', 'Pencocokan promotor', 'Sistem mencari kandidat berdasarkan cakupan wilayah yang aman.'],
      ['3', 'Konfirmasi dan checkout', 'Setelah lead tersimpan, layanan tes dapat diteruskan ke checkout resmi.'],
    ] : [
      ['1', 'Pilih dari data aktif', 'Identitas publik terbatas pada nama, KodeID, cabang, dan area.'],
      ['2', 'Kirim permintaan', 'Kontak Anda hanya dibagikan kepada promotor yang akhirnya ditugaskan dengan persetujuan.'],
      ['3', 'Konfirmasi jadwal', 'Lokasi dan waktu tidak diasumsikan tersedia sebelum promotor mengonfirmasi.'],
    ]).map(([number, heading, body]) => <article key={number}><b>{number}</b><h3>{heading}</h3><p>{body}</p></article>)}</div></section>

    <section className="region-section region-faq"><span>PERTANYAAN UMUM</span><h2>Informasi untuk {data.regency.name}</h2><div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
    <section className="region-section region-cta"><h2>Butuh bantuan menentukan layanan?</h2><p>Tim akan mencatat kebutuhan, mencocokkan cakupan, dan membantu konfirmasi langkah berikutnya.</p><PublicInterestAction leadType="test_service" captureLead linkKey="tesPersonal" label="Kirim kebutuhan →" service="Bantuan memilih layanan STIFIn" className="dark-button" provinceCode={data.province.code} provinceName={data.province.name} regencyCode={data.regency.code} regencyName={data.regency.name} /></section>
  </main>;
}
