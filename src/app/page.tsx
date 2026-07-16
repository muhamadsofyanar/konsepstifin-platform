'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { articles, type ArticlePreview } from './edukasi/articles';
import { affiliatePrograms, faqItems, promoterSteps, publicProducts, sejoliLinks, type SejoliLinkKey } from './site-config';
import MobileNavigation from './mobile-navigation';

type Tab = 'ringkasan' | 'pesanan' | 'pelanggan' | 'promotor' | 'voucher' | 'program' | 'laporan' | 'pengaturan';
type BookingStatus = 'Lead Baru' | 'Dihubungi' | 'Terjadwal' | 'Selesai' | 'Batal';

type Booking = {
  id: number;
  name: string;
  phone: string;
  city: string;
  service: string;
  schedule: string;
  source: string;
  status: BookingStatus;
};

type Promoter = {
  id: string;
  name: string;
  city: string;
  phone: string;
  tests: number;
  status: 'Aktif' | 'Perlu Aktivasi';
};

const money = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value);

const seedBookings: Booking[] = [
  { id: 1001, name: 'Aisyah Rahma', phone: '0812 3456 7811', city: 'Bandung', service: 'Tes STIFIn Individu', schedule: '16 Jul 2026 · 10.00', source: 'Instagram', status: 'Terjadwal' },
  { id: 1002, name: 'Keluarga Bapak Irfan', phone: '0813 2221 1800', city: 'Sumedang', service: 'Paket Keluarga (4 orang)', schedule: '17 Jul 2026 · 13.00', source: 'Referensi', status: 'Dihubungi' },
  { id: 1003, name: 'Nadia Putri', phone: '0857 9900 1122', city: 'Jakarta', service: 'Tes STIFIn Individu', schedule: 'Menunggu konfirmasi', source: 'Website', status: 'Lead Baru' },
  { id: 1004, name: 'Sekolah Bina Insan', phone: '0819 7123 4500', city: 'Subang', service: 'Tes Kelompok/Sekolah', schedule: '20 Jul 2026 · 09.00', source: 'Mitra', status: 'Terjadwal' },
];

const seedPromoters: Promoter[] = [
  { id: 'BKS-HRA-40', name: 'Muhamad Sofyan AR', city: 'Jatinangor, Sumedang', phone: '08•• •••• ••64', tests: 18, status: 'Aktif' },
  { id: 'KHU-ABU-01', name: 'Fauzi Abdul Rohim M.T.', city: 'Pekalongan', phone: '08•• •••• ••85', tests: 12, status: 'Aktif' },
  { id: 'KHU-ABU-02', name: 'Muhammad Galang Rusdiansyah', city: 'Bandung', phone: '08•• •••• ••54', tests: 9, status: 'Aktif' },
  { id: 'KHU-ABU-03', name: 'Mujahid Ayyasy Alfaqih', city: 'Jakarta', phone: '08•• •••• ••31', tests: 8, status: 'Aktif' },
  { id: 'KHU-ABU-04', name: 'Mochamad Rizki Ismail', city: 'Subang', phone: '08•• •••• ••49', tests: 6, status: 'Aktif' },
  { id: 'KHU-ABU-05', name: 'Gunawan Mansur', city: 'Bekasi', phone: '08•• •••• ••01', tests: 4, status: 'Perlu Aktivasi' },
  { id: 'KHU-ABU-06', name: 'Muchamad Luqman', city: 'Pekalongan', phone: '08•• •••• ••70', tests: 3, status: 'Aktif' },
  { id: 'KHU-ABU-07', name: 'Ridwan Setiawan', city: 'Bandung', phone: '08•• •••• ••06', tests: 2, status: 'Perlu Aktivasi' },
  { id: 'KHU-ABU-08', name: 'Fadlan Ahya Imani', city: 'Jakarta', phone: '08•• •••• ••22', tests: 2, status: 'Aktif' },
  { id: 'KHU-ABU-09', name: 'Fitriani', city: 'Sumedang', phone: '08•• •••• ••86', tests: 1, status: 'Perlu Aktivasi' },
  { id: 'KHU-ABU-10', name: 'Yeni Sri Yulianti', city: 'Pekalongan', phone: '08•• •••• ••34', tests: 1, status: 'Aktif' },
];

const nav: { id: Tab; label: string; icon: string }[] = [
  { id: 'ringkasan', label: 'Ringkasan', icon: '▦' },
  { id: 'pesanan', label: 'Pemesanan Tes', icon: '◷' },
  { id: 'pelanggan', label: 'Pelanggan & CRM', icon: '◎' },
  { id: 'promotor', label: 'Jaringan Promotor', icon: '◇' },
  { id: 'voucher', label: 'Voucher & Stok', icon: '▣' },
  { id: 'program', label: 'WSL & Program', icon: '△' },
  { id: 'laporan', label: 'Laporan', icon: '↗' },
  { id: 'pengaturan', label: 'Pengaturan', icon: '⚙' },
];

export default function Home() {
  const [mode, setMode] = useState<'website' | 'dashboard'>('website');
  const [tab, setTab] = useState<Tab>('ringkasan');
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('konsepstifin-bookings');
    if (!stored) return;
    const timer = window.setTimeout(() => {
      try {
        setBookings(JSON.parse(stored));
      } catch {
        localStorage.removeItem('konsepstifin-bookings');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveBookings = (next: Booking[]) => {
    setBookings(next);
    localStorage.setItem('konsepstifin-bookings', JSON.stringify(next));
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  if (mode === 'website') {
    return <>
      <PublicSite onAdmin={() => { window.location.href = '/admin/login'; }} onBook={() => setBookingOpen(true)} notify={notify} />
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} onSave={(booking) => { saveBookings([booking, ...bookings]); setBookingOpen(false); notify('Permintaan berhasil dikirim'); }} />}
      {toast && <div className="toast">✓ {toast}</div>}
    </>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setMode('website')}>
          <span className="brand-mark">K</span><span><b>Konsep</b> STIFIn<small>Growth Platform</small></span>
        </button>
        <div className="workspace"><span>KS</span><div><small>Workspace</small><b>Konsep STIFIn</b></div><i>⌄</i></div>
        <nav>{nav.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><i>{item.icon}</i>{item.label}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="goal-mini"><div><span>Target bulan ini</span><b>67%</b></div><div className="progress"><i style={{ width: '67%' }} /></div><small>20 dari 30 tes</small></div>
          <button className="profile"><span>MS</span><div><b>Muhamad Sofyan</b><small>Branch Manager</small></div><i>•••</i></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><b>{nav.find(n => n.id === tab)?.label}</b><span> / Juli 2026</span></div>
          <div className="top-actions"><button className="icon-button">⌕</button><button className="icon-button">♢<i /></button><button className="ghost" onClick={() => setMode('website')}>Lihat website</button><button className="primary" onClick={() => setBookingOpen(true)}>＋ Pemesanan baru</button></div>
        </header>
        <section className="content">
          {tab === 'ringkasan' && <Dashboard bookings={bookings} onNavigate={setTab} />}
          {tab === 'pesanan' && <Bookings bookings={bookings} setBookings={saveBookings} query={query} setQuery={setQuery} onAdd={() => setBookingOpen(true)} />}
          {tab === 'pelanggan' && <Customers bookings={bookings} />}
          {tab === 'promotor' && <Promoters query={query} setQuery={setQuery} />}
          {tab === 'voucher' && <Vouchers notify={notify} />}
          {tab === 'program' && <Programs notify={notify} />}
          {tab === 'laporan' && <Reports bookings={bookings} />}
          {tab === 'pengaturan' && <Settings notify={notify} />}
        </section>
      </main>
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} onSave={(booking) => { saveBookings([booking, ...bookings]); setBookingOpen(false); notify('Pemesanan berhasil disimpan'); }} />}
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function PublicSite({ onAdmin, onBook, notify }: { onAdmin: () => void; onBook: () => void; notify: (message: string) => void }) {
  const [educationArticles, setEducationArticles] = useState<ArticlePreview[]>(articles);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/articles?limit=3', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Artikel tidak tersedia.')))
      .then((result: { articles?: ArticlePreview[] }) => {
        if (result.articles?.length) setEducationArticles(result.articles);
      })
      .catch((error: Error) => { if (error.name !== 'AbortError') console.error(error); });
    return () => controller.abort();
  }, []);

  const checkout = (linkKey: SejoliLinkKey) => {
    const url = sejoliLinks[linkKey];
    if (url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    notify('Link SEJOLI sedang disiapkan. Silakan isi formulir, tim kami akan membantu.');
    onBook();
  };

  return <div className="public-site">
    <div className="announcement">Tes dilakukan offline · Pemesanan dan pembayaran diarahkan melalui SEJOLI</div>
    <header className="public-nav">
      <a className="public-brand logo-brand" href="#" aria-label="STIFIn Konsep - kembali ke beranda">
        <Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority />
      </a>
      <nav><a href="#manfaat">Manfaat</a><a href="#produk">Produk</a><a href="#proses">Cara Tes</a><a href="#promotor">Jadi Promotor</a><a href="#affiliate">Affiliate</a><Link href="/edukasi">Edukasi</Link></nav>
      <div><MobileNavigation links={[{ href: '#manfaat', label: 'Manfaat' }, { href: '#produk', label: 'Produk' }, { href: '#proses', label: 'Cara Tes' }, { href: '#promotor', label: 'Jadi Promotor' }, { href: '#affiliate', label: 'Affiliate' }, { href: '/edukasi', label: 'Edukasi' }]} /><button className="text-button" onClick={onAdmin}>Masuk tim</button><a className="public-cta" href="#produk">Pilih layanan</a></div>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow">TES STIFIn RESMI · OFFLINE</div><h1>Kenali diri. Bangun hubungan. Tumbuh lebih terarah.</h1><p>Pilih layanan Tes STIFIn untuk personal, keluarga, atau institusi. Proses tes dilakukan langsung bersama promotor di kota terdekat.</p><div className="hero-actions"><a className="public-cta big" href="#produk">Lihat pilihan layanan <span>→</span></a><a href="#promotor">Saya ingin jadi promotor</a></div><div className="trust-row"><span><b>Offline</b><small>bersama promotor</small></span><span><b>Terjadwal</b><small>sesuai kota peserta</small></span><span><b>Nasional</b><small>jaringan lintas kota</small></span></div></div>
        <div className="hero-visual"><div className="orb orb-one"/><div className="orb orb-two"/><div className="result-card"><small>Perjalanan peserta</small><div className="result-type"><span>01</span><div><b>Pilih layanan</b><small>Personal · Keluarga · Institusi</small></div></div><div className="journey-mini"><span><i/>Checkout aman di SEJOLI</span><span><i/>Konfirmasi lokasi & jadwal</span><span><i/>Tes offline dan penjelasan</span></div><p>“Satu pintu untuk tes, pembelajaran, dan pertumbuhan jaringan.”</p></div><div className="floating-card"><span>✓</span><div><b>Bonus pembelajaran</b><small>E-book dan video pilihan</small></div></div></div>
      </section>
      <section className="logo-strip"><span>Jaringan layanan untuk keluarga, sekolah, komunitas, dan profesional di berbagai kota</span><div><b>JAKARTA</b><b>BANDUNG</b><b>SUMEDANG</b><b>SUBANG</b><b>PEKALONGAN</b></div></section>

      <section id="manfaat" className="section"><div className="section-heading"><span>MENGAPA MEMULAI?</span><h2>Dari hasil, menuju langkah yang lebih praktis.</h2><p>Hasil tes dibahas dengan bahasa yang mudah dipahami agar dapat menjadi bahan refleksi dan pengembangan diri sehari-hari.</p></div><div className="benefit-grid">{[['01','Belajar lebih terarah','Gunakan hasil sebagai bahan mengenali kecenderungan cara menerima dan mengolah informasi.'],['02','Komunikasi lebih sadar','Bangun percakapan yang lebih sesuai dalam keluarga, pasangan, komunitas, atau tim.'],['03','Pengembangan diri','Susun langkah pertumbuhan yang realistis berdasarkan pembahasan hasil bersama promotor.'],['04','Kolaborasi lebih sehat','Kenali perbedaan agar pembagian peran dan cara bekerja sama dapat dibahas lebih terbuka.']].map(x=><article key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></section>

      <section id="produk" className="section product-section"><div className="section-heading"><span>PRODUK UTAMA</span><h2>Pilih layanan yang paling sesuai.</h2><p>Setiap pemesanan akan diteruskan ke checkout SEJOLI. Setelah pembayaran, tim membantu mencocokkan kota, promotor, dan jadwal.</p></div><div className="product-grid">{publicProducts.map(product=><article className={product.featured?'product-card featured-product':'product-card'} key={product.title}>{product.featured&&<div className="product-ribbon">REKOMENDASI</div>}<small>{product.category}</small><h3>{product.title}</h3><p className="product-description">{product.description}</p><div className="product-price"><b>{product.price}</b><span>{product.priceNote}</span></div><div className="product-list"><strong>Yang didapat</strong>{product.features.map(item=><span key={item}>✓ {item}</span>)}</div><div className="bonus-box"><strong>Bonus pilihan</strong>{product.bonuses.map(item=><span key={item}>＋ {item}</span>)}</div><button onClick={()=>checkout(product.linkKey)}>{product.action} →</button></article>)}</div><p className="price-note">Harga dan fasilitas final mengikuti informasi yang tampil pada checkout SEJOLI. Tes ini bukan layanan diagnosis medis atau psikologis.</p></section>

      <section id="proses" className="process-section"><div><span>PROSES TES</span><h2>Mudah dipesan, tetap dilakukan secara tatap muka.</h2><p>Website membantu proses pemilihan layanan dan pembayaran. Pemindaian sidik jari tetap dilakukan secara langsung bersama promotor.</p><a className="dark-button" href="#produk">Pilih layanan →</a></div><ol><li><b>01</b><div><h3>Pilih produk & checkout</h3><p>Pilih layanan lalu selesaikan pemesanan melalui SEJOLI.</p></div></li><li><b>02</b><div><h3>Konfirmasi kota & jadwal</h3><p>Tim mencocokkan peserta dengan promotor dan waktu yang tersedia.</p></div></li><li><b>03</b><div><h3>Pelaksanaan tes offline</h3><p>Pemindaian dilakukan langsung menggunakan alat resmi.</p></div></li><li><b>04</b><div><h3>Terima hasil & fasilitas</h3><p>Dapatkan penjelasan hasil serta bonus sesuai paket yang dipilih.</p></div></li></ol></section>

      <section id="promotor" className="section promoter-section"><div className="section-heading"><span>JALUR PROMOTOR</span><h2>Bertumbuh melalui tahapan yang jelas.</h2><p>Calon promotor tidak langsung membeli alat. Ikuti urutan pembelajaran dan aktivasi sesuai ketentuan yang berlaku.</p></div><div className="promoter-path">{promoterSteps.map(step=><article key={step.number}><div className="step-top"><b>{step.number}</b><span>{step.label}</span></div><h3>{step.title}</h3><p>{step.description}</p><button onClick={()=>checkout(step.linkKey)}>{step.action} →</button></article>)}</div><div className="promoter-note"><div><b>Preview</b><span>Kenali profesinya</span></div><i>→</i><div><b>WSL 1</b><span>Bangun fondasi</span></div><i>→</i><div><b>WSL 2</b><span>Pendalaman</span></div><i>→</i><div><b>ID & alat</b><span>Aktivasi sesuai syarat</span></div></div></section>

      <section id="affiliate" className="section affiliate-section"><div className="section-heading"><span>PROGRAM AFFILIATE</span><h2>Dua jalur untuk ikut bertumbuh.</h2><p>Mulai dari merekomendasikan layanan, membangun penghasilan, dan bila sesuai melanjutkan perjalanan menuju promotor resmi.</p></div><div className="affiliate-grid">{affiliatePrograms.map((program,index)=><article className={index===1?'affiliate-card official':'affiliate-card'} key={program.title}><small>{program.eyebrow}</small><h3>{program.title}</h3><p>{program.description}</p><ul>{program.points.map(point=><li key={point}>✓ {point}</li>)}</ul><button onClick={()=>checkout(program.linkKey)}>{program.action} →</button></article>)}</div><div className="affiliate-flow"><span>Bagikan tautan</span><i>→</i><span>Transaksi tervalidasi</span><i>→</i><span>Komisi tercatat</span><i>→</i><span>Tumbuh ke tahap berikutnya</span></div></section>

      <section className="section home-education"><div className="education-section-head"><div><span>PUSAT EDUKASI</span><h2>Wawasan umum untuk bertumbuh lebih sadar.</h2></div><div><p>Artikel praktis tentang pengembangan diri, keluarga, belajar, dan kolaborasi.</p><Link href="/edukasi">Lihat semua artikel →</Link></div></div><div className="home-article-grid">{educationArticles.slice(0,3).map((article,index)=><article key={article.slug}><Link className={`article-cover ${article.tone}`} href={`/edukasi/${article.slug}`}><span>{article.category}</span><b>{String(index+1).padStart(2,'0')}</b><small>{article.readTime}</small></Link><div><span>{article.category}</span><h3><Link href={`/edukasi/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link href={`/edukasi/${article.slug}`}>Baca artikel →</Link></div></article>)}</div></section>

      <section className="section faq-section"><div className="section-heading"><span>PERTANYAAN UMUM</span><h2>Sebelum Anda memilih.</h2></div><div className="faq-list">{faqItems.map(([question,answer],index)=><details key={question} open={index===0}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div><span>SIAP MEMULAI?</span><h2>Pilih jalur yang sesuai dengan tujuan Anda.</h2><p>Pesan tes untuk diri dan keluarga, ajukan program kelompok, atau mulai perjalanan sebagai affiliate maupun calon promotor.</p></div><div><a className="public-cta big" href="#produk">Pilih layanan tes →</a><a href="#promotor">Lihat jalur promotor</a></div></section>
    </main>
    <footer><div className="public-brand logo-brand footer-logo"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} /></div><div className="footer-links"><a href="#produk">Produk</a><a href="#proses">Cara Tes</a><a href="#promotor">Promotor</a><a href="#affiliate">Affiliate</a><Link href="/edukasi">Edukasi</Link></div><p>Platform edukasi, layanan Tes STIFIn offline, dan pengembangan jaringan promotor Indonesia.</p><small>Identitas cabang resmi dicantumkan pada dokumen dan kegiatan formal sesuai ketentuan. Informasi harga, bonus, komisi, dan persyaratan final mengikuti halaman checkout serta kebijakan resmi yang berlaku.</small></footer>
  </div>;
}

function Dashboard({ bookings, onNavigate }: { bookings: Booking[]; onNavigate: (tab: Tab) => void }) {
  const newLeads = bookings.filter(b => b.status === 'Lead Baru').length;
  return <><div className="page-title"><div><h1>Selamat pagi, Pak Sofyan 👋</h1><p>Berikut kondisi jaringan dan penjualan Konsep STIFIn hari ini.</p></div><div className="date-filter">◷ 1–31 Juli 2026⌄</div></div>
    <div className="metric-grid"><Metric label="Tes bulan ini" value="20" change="↑ 25%" helper="Target 30 tes" accent="purple"/><Metric label="Omzet tercatat" value="Rp11 jt" change="↑ 18%" helper="Estimasi dari tes selesai" accent="green"/><Metric label="Promotor aktif" value="8" change="dari 11" helper="3 perlu diaktivasi" accent="blue"/><Metric label="Lead baru" value={String(newLeads + 12)} change="↑ 7" helper="Dalam 7 hari terakhir" accent="orange"/></div>
    <div className="dashboard-grid"><article className="panel chart-panel"><PanelHead title="Pertumbuhan tes" subtitle="Jumlah tes per minggu" action="Lihat laporan"/><div className="chart"><div className="y-labels"><span>10</span><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span></div><div className="chart-area"><svg viewBox="0 0 600 180" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7158e8" stopOpacity=".28"/><stop offset="1" stopColor="#7158e8" stopOpacity="0"/></linearGradient></defs><path className="area" d="M0 152 C65 145 80 112 145 120 S220 74 290 94 S375 42 435 60 S520 20 600 34 L600 180 L0 180Z"/><path className="line" d="M0 152 C65 145 80 112 145 120 S220 74 290 94 S375 42 435 60 S520 20 600 34"/></svg><div className="x-labels"><span>1 Jul</span><span>8 Jul</span><span>15 Jul</span><span>22 Jul</span><span>31 Jul</span></div></div></div><div className="chart-legend"><span><i className="purple-dot"/>Tes selesai <b>20</b></span><span><i className="gray-dot"/>Target <b>30</b></span></div></article>
      <article className="panel target-panel"><PanelHead title="Target bulan ini" subtitle="Progress keseluruhan"/><div className="donut"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="48"/><circle className="done" cx="60" cy="60" r="48"/></svg><div><b>67%</b><span>tercapai</span></div></div><div className="target-stats"><span><i className="purple-dot"/><small>Tercapai</small><b>20 tes</b></span><span><i className="gray-dot"/><small>Sisa target</small><b>10 tes</b></span></div><div className="projection"><span>Proyeksi akhir bulan</span><b>32 tes <i>↑ 7%</i></b></div></article>
    </div>
    <div className="dashboard-grid lower"><article className="panel"><PanelHead title="Pemesanan terbaru" subtitle="Perlu ditindaklanjuti" action="Lihat semua" onAction={() => onNavigate('pesanan')}/><div className="mini-list">{bookings.slice(0,4).map(b=><div key={b.id}><span className="avatar">{b.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><b>{b.name}</b><small>{b.service} · {b.city}</small></div><Status value={b.status}/></div>)}</div></article>
      <article className="panel"><PanelHead title="Aktivitas promotor" subtitle="Performa 30 hari terakhir" action="Kelola promotor" onAction={() => onNavigate('promotor')}/><div className="rank-list">{seedPromoters.slice(0,5).map((p,i)=><div key={p.id}><b className="rank">{i+1}</b><span className="avatar promoter-avatar">{p.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><b>{p.name}</b><small>{p.city}</small></div><strong>{p.tests}<small> tes</small></strong></div>)}</div></article>
    </div>
  </>;
}

function Metric({ label, value, change, helper, accent }: { label: string; value: string; change: string; helper: string; accent: string }) { return <article className={`metric ${accent}`}><div><span>{label}</span><i>•••</i></div><b>{value}</b><p><strong>{change}</strong> {helper}</p></article>; }
function PanelHead({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) { return <div className="panel-head"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action} →</button>}</div>; }
function Status({ value }: { value: BookingStatus }) { return <span className={`status status-${value.toLowerCase().replace(' ', '-')}`}>{value}</span>; }

function Bookings({ bookings, setBookings, query, setQuery, onAdd }: { bookings: Booking[]; setBookings: (x: Booking[]) => void; query: string; setQuery: (x:string)=>void; onAdd:()=>void }) {
  const filtered = bookings.filter(b => `${b.name} ${b.city} ${b.phone}`.toLowerCase().includes(query.toLowerCase()));
  const update = (id: number, status: BookingStatus) => setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  return <><PageHead title="Pemesanan Tes" desc="Kelola lead hingga pelaksanaan tes offline." button="Pemesanan baru" onClick={onAdd}/><div className="pipeline">{(['Lead Baru','Dihubungi','Terjadwal','Selesai'] as BookingStatus[]).map(s=><div key={s}><span>{s}</span><b>{bookings.filter(b=>b.status===s).length}</b></div>)}</div><article className="panel table-panel"><TableTools query={query} setQuery={setQuery} placeholder="Cari nama, kota, atau WhatsApp..."/><div className="data-table"><div className="tr th"><span>Pelanggan</span><span>Layanan</span><span>Jadwal</span><span>Sumber</span><span>Status</span></div>{filtered.map(b=><div className="tr" key={b.id}><span className="person-cell"><i className="avatar">{b.name.slice(0,2).toUpperCase()}</i><span><b>{b.name}</b><small>{b.phone} · {b.city}</small></span></span><span>{b.service}</span><span>{b.schedule}</span><span>{b.source}</span><span><select value={b.status} onChange={e=>update(b.id,e.target.value as BookingStatus)}>{['Lead Baru','Dihubungi','Terjadwal','Selesai','Batal'].map(s=><option key={s}>{s}</option>)}</select></span></div>)}</div></article></>;
}

function Customers({ bookings }: { bookings: Booking[] }) { return <><PageHead title="Pelanggan & CRM" desc="Satu tempat untuk riwayat interaksi dan tindak lanjut."/><div className="metric-grid compact"><Metric label="Total kontak" value={String(bookings.length+146)} change="↑ 12" helper="bulan ini" accent="purple"/><Metric label="Perlu follow-up" value="9" change="Hari ini" helper="dan besok" accent="orange"/><Metric label="Pelanggan kembali" value="28%" change="↑ 4%" helper="dari bulan lalu" accent="green"/><Metric label="Sumber terbaik" value="Referensi" change="41%" helper="dari semua lead" accent="blue"/></div><article className="panel table-panel"><div className="data-table customer-table"><div className="tr th"><span>Nama</span><span>Segmen</span><span>Lokasi</span><span>Interaksi terakhir</span><span>Nilai</span></div>{bookings.concat(seedBookings).slice(0,7).map((b,i)=><div className="tr" key={`${b.id}-${i}`}><span className="person-cell"><i className="avatar">{b.name.slice(0,2).toUpperCase()}</i><span><b>{b.name}</b><small>{b.phone}</small></span></span><span><em className="tag">{b.service.includes('Keluarga')?'Keluarga':b.service.includes('Sekolah')?'Institusi':'Individu'}</em></span><span>{b.city}</span><span>{i+1} hari lalu</span><span><b>{money(i%2?550000:2200000)}</b></span></div>)}</div></article></> }

function Promoters({ query, setQuery }: { query:string; setQuery:(x:string)=>void }) { const list=seedPromoters.filter(p=>`${p.name} ${p.city} ${p.id}`.toLowerCase().includes(query.toLowerCase())); return <><PageHead title="Jaringan Promotor" desc="Kelola promotor lintas kota yang menginduk ke cabang." button="Tambah kandidat"/><div className="network-banner"><div><small>JARINGAN NASIONAL</small><h3>11 promotor · 7 kota</h3><p>Identitas Pekalongan digunakan untuk administrasi internal dan kegiatan formal.</p></div><div className="city-pills"><span>Bandung 2</span><span>Jakarta 2</span><span>Pekalongan 3</span><span>+4 kota</span></div></div><article className="panel table-panel"><TableTools query={query} setQuery={setQuery} placeholder="Cari promotor, ID, atau kota..."/><div className="data-table promoter-table"><div className="tr th"><span>Promotor</span><span>ID</span><span>Domisili</span><span>Tes 30 hari</span><span>Status</span></div>{list.map(p=><div className="tr" key={p.id}><span className="person-cell"><i className="avatar promoter-avatar">{p.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</i><span><b>{p.name}</b><small>{p.phone}</small></span></span><span><code>{p.id}</code></span><span>{p.city}</span><span><b>{p.tests}</b> tes</span><span><em className={`tag ${p.status==='Aktif'?'green-tag':'orange-tag'}`}>{p.status}</em></span></div>)}</div></article></>; }

function Vouchers({ notify }: { notify:(x:string)=>void }) { const [stock,setStock]=useState(38); return <><PageHead title="Voucher & Stok" desc="Pantau voucher tes, pemakaian, dan distribusi ke promotor." button="Catat pembelian"/><div className="metric-grid compact"><Metric label="Voucher tersedia" value={String(stock)} change="Aman" helper="untuk stok saat ini" accent="green"/><Metric label="Terpakai bulan ini" value="20" change="↑ 25%" helper="dari bulan lalu" accent="purple"/><Metric label="Dititip promotor" value="12" change="6 orang" helper="belum terpakai" accent="blue"/><Metric label="Batas pesan ulang" value="15" change={stock>15?'Belum perlu':'Segera'} helper="restock" accent="orange"/></div><div className="dashboard-grid"><article className="panel stock-card"><PanelHead title="Stok voucher" subtitle="Pergerakan bulan Juli"/><div className="stock-number"><b>{stock}</b><span>voucher siap pakai</span></div><div className="progress stock-progress"><i style={{width:`${Math.min(stock/60*100,100)}%`}}/></div><div className="stock-actions"><button onClick={()=>{setStock(stock+10);notify('Stok ditambah 10 voucher')}}>＋ Tambah stok</button><button onClick={()=>{if(stock){setStock(stock-1);notify('Pemakaian voucher dicatat')}}}>− Catat pemakaian</button></div></article><article className="panel"><PanelHead title="Distribusi terbaru" subtitle="Voucher pada promotor"/><div className="simple-list">{seedPromoters.slice(1,6).map((p,i)=><div key={p.id}><span className="avatar">{p.name.slice(0,2)}</span><div><b>{p.name}</b><small>{p.city}</small></div><strong>{[4,3,2,2,1][i]} voucher</strong></div>)}</div></article></div></>; }

function Programs({ notify }: { notify:(x:string)=>void }) { return <><PageHead title="WSL & Program" desc="Kelola agenda edukasi, rekrutmen, dan aktivasi promotor." button="Buat kegiatan"/><div className="program-grid">{[{type:'WSL 1',title:'Workshop Lisensi Dasar',date:'27 Jul 2026',city:'Bandung',seat:'8 / 20 peserta',color:'purple'},{type:'WSL 2',title:'Pendalaman & Praktik Promotor',date:'10 Agu 2026',city:'Jakarta',seat:'5 / 15 peserta',color:'blue'},{type:'ONLINE',title:'Preview Profesi Promotor',date:'Setiap Kamis',city:'Zoom',seat:'32 pendaftar',color:'orange'}].map(p=><article className="program-card" key={p.type}><div className={`program-cover ${p.color}`}><span>{p.type}</span><i>↗</i></div><div><small>{p.date} · {p.city}</small><h3>{p.title}</h3><p>{p.seat}</p><div className="progress"><i style={{width:p.type==='WSL 1'?'40%':p.type==='WSL 2'?'33%':'70%'}}/></div><button onClick={()=>notify(`Detail ${p.type} dibuka`)}>Kelola kegiatan →</button></div></article>)}</div><article className="panel candidate-panel"><PanelHead title="Pipeline calon promotor" subtitle="Dari minat hingga aktivasi"/><div className="candidate-steps">{[['Tertarik','24'],['Ikut preview','14'],['Daftar WSL 1','8'],['Lulus WSL 2','5'],['Aktif','3']].map((x,i)=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><i style={{height:`${35+i*12}px`}}/></div>)}</div></article></>; }

function Reports({ bookings }: { bookings:Booking[] }) { const completed=bookings.filter(b=>b.status==='Selesai').length+20; return <><PageHead title="Laporan" desc="Pantau pertumbuhan tes, omzet, dan produktivitas jaringan." button="Ekspor laporan"/><div className="metric-grid compact"><Metric label="Tes tercatat" value={String(completed)} change="↑ 25%" helper="periode ini" accent="purple"/><Metric label="Rata-rata harga" value="Rp568 rb" change="Rentang" helper="Rp550–650 rb" accent="green"/><Metric label="Konversi lead" value="36%" change="↑ 6%" helper="bulan ini" accent="blue"/><Metric label="Produktivitas" value="2,5" change="tes" helper="per promotor aktif" accent="orange"/></div><div className="dashboard-grid"><article className="panel report-bars"><PanelHead title="Tes berdasarkan kota" subtitle="Juli 2026"/>{[['Bandung',18],['Pekalongan',14],['Jakarta',12],['Sumedang',9],['Subang',6]].map(([city,n])=><div key={city}><span>{city}</span><i><b style={{width:`${Number(n)/18*100}%`}}/></i><strong>{n}</strong></div>)}</article><article className="panel report-bars"><PanelHead title="Sumber lead" subtitle="Kontribusi kanal"/>{[['Referensi',41],['Instagram',27],['Website',18],['Mitra',9],['Lainnya',5]].map(([source,n])=><div key={source}><span>{source}</span><i><b style={{width:`${n}%`}}/></i><strong>{n}%</strong></div>)}</article></div></>; }

function Settings({ notify }: { notify:(x:string)=>void }) { return <><PageHead title="Pengaturan" desc="Konfigurasi merek, operasional, dan integrasi."/><div className="settings-layout"><aside><button className="active">Profil bisnis</button><button>Lokasi & jadwal</button><button>Harga & layanan</button><button>Integrasi</button><button>Pengguna & akses</button><button>Keamanan</button></aside><article className="panel settings-card"><h3>Profil bisnis</h3><p>Informasi yang tampil pada website dan komunikasi pelanggan.</p><label>Nama publik<input defaultValue="Konsep STIFIn"/></label><label>Deskripsi<textarea defaultValue="Platform edukasi, layanan tes STIFIn, dan pengembangan jaringan promotor Indonesia."/></label><div className="form-row"><label>Harga mulai<input defaultValue="550000"/></label><label>Mata uang<select><option>IDR — Rupiah</option></select></label></div><label>Identitas administratif<input defaultValue="STIFIn Cabang Khusus Kabupaten Pekalongan"/></label><div className="integration-row"><span><b>WhatsApp · StarSender</b><small>Belum dihubungkan secara aman</small></span><em>Segera</em></div><div className="integration-row"><span><b>Email · Mailketing</b><small>Siap dikonfigurasi melalui environment variable</small></span><em>Segera</em></div><div className="integration-row"><span><b>Automation · n8n</b><small>Webhook akan dipasang pada fase database</small></span><em>Segera</em></div><button className="primary save-settings" onClick={()=>notify('Pengaturan demo tersimpan')}>Simpan perubahan</button></article></div></>; }

function PageHead({ title, desc, button, onClick }: { title:string; desc:string; button?:string; onClick?:()=>void }) { return <div className="page-title"><div><h1>{title}</h1><p>{desc}</p></div>{button&&<button className="primary" onClick={onClick}>＋ {button}</button>}</div>; }
function TableTools({ query,setQuery,placeholder }: {query:string;setQuery:(x:string)=>void;placeholder:string}) { return <div className="table-tools"><div className="search-box">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></div><button>☷ Filter</button><button>⇅ Urutkan</button><button>⇩ Ekspor</button></div>; }

function BookingModal({ onClose, onSave }: { onClose:()=>void; onSave:(b:Booking)=>void }) {
  const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const fd=new FormData(e.currentTarget);onSave({id:Date.now(),name:String(fd.get('name')),phone:String(fd.get('phone')),city:String(fd.get('city')),service:String(fd.get('service')),schedule:String(fd.get('schedule')||'Menunggu konfirmasi'),source:'Website',status:'Lead Baru'});};
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><div className="modal-head"><span>FORMULIR MINAT</span><h2>Mulai dari kebutuhan Anda.</h2><p>Isi data singkat berikut. Tim kami akan menghubungi Anda untuk membantu memilih layanan, lokasi, atau tahapan yang sesuai.</p></div><form onSubmit={submit}><label>Nama lengkap<input name="name" required placeholder="Nama Anda"/></label><label>Nomor WhatsApp<input name="phone" required placeholder="08xx xxxx xxxx"/></label><div className="form-row"><label>Kota/domisili<input name="city" required placeholder="Contoh: Bandung"/></label><label>Pilihan layanan<select name="service"><option>Tes STIFIn Personal</option><option>Paket Tes Keluarga</option><option>Sekolah & Komunitas</option><option>Preview Calon Promotor</option><option>WSL 1</option><option>WSL 2</option><option>Informasi ID & Alat</option><option>Affiliate Umum</option><option>Affiliate Promotor Resmi</option></select></label></div><label>Jadwal atau kebutuhan tambahan<input name="schedule" placeholder="Contoh: Sabtu pagi / ingin informasi WSL 1"/></label><div className="privacy-note">Tes STIFIn dilakukan offline karena memerlukan pemindaian sidik jari. Jangan kirim data sidik jari, kata sandi, atau informasi rahasia melalui formulir ini.</div><button className="public-cta big" type="submit">Kirim permintaan →</button></form></div></div>;
}
