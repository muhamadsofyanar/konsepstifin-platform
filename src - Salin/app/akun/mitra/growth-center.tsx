'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type PortalData = { promoterCode: string; name: string; alias: string; url: string; aliases: string[] };
type ActivityData = { counts: Record<string, number> };
type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'offline';

type Campaign = {
  id: string;
  title: string;
  audience: string;
  destination: string;
  message: string;
  tip: string;
};

const campaigns: Campaign[] = [
  {
    id: 'tes-personal',
    title: 'Tes STIFIn Personal',
    audience: 'Orang yang ingin memahami dirinya',
    destination: '/produk/layanan/tesPersonal',
    message: 'Kalau kamu ingin mengenali kecenderungan diri dan membahas hasilnya secara langsung, informasi Tes STIFIn Personal bisa dilihat di tautan ini. Silakan baca detail layanan dan ajukan jika memang sesuai kebutuhanmu.',
    tip: 'Cocok untuk percakapan satu lawan satu. Mulai dengan bertanya apa yang sedang ingin dipahami, bukan langsung menawarkan paket.',
  },
  {
    id: 'tes-pasangan',
    title: 'Tes STIFIn Pasangan',
    audience: 'Pasangan yang ingin memperbaiki komunikasi',
    destination: '/produk/layanan/tesPasangan',
    message: 'Setiap orang bisa punya cara berbeda dalam memahami informasi dan merespons situasi. Kalau kalian ingin membahas perbedaan itu bersama, ini informasi Tes STIFIn Pasangan. Silakan pelajari detailnya terlebih dahulu.',
    tip: 'Hindari menyebut tes sebagai solusi semua konflik. Posisikan sebagai bahan percakapan dan refleksi bersama.',
  },
  {
    id: 'tes-keluarga',
    title: 'Tes STIFIn Keluarga',
    audience: 'Orang tua dan keluarga',
    destination: '/produk/layanan/paketKeluarga',
    message: 'Kalau keluarga ingin lebih memahami perbedaan cara belajar dan berkomunikasi di rumah, paket Tes STIFIn Keluarga bisa dipelajari di sini. Informasi ini membantu membandingkan layanan sebelum mengajukan jadwal.',
    tip: 'Mulai dari kebutuhan keluarga. Jangan memberi label kepada anak atau menjadikan hasil tes sebagai diagnosis.',
  },
  {
    id: 'sekolah-komunitas',
    title: 'Sekolah & Komunitas',
    audience: 'Sekolah, komunitas, dan institusi',
    destination: '/produk/layanan/sekolahKomunitas',
    message: 'Saya ingin berbagi informasi layanan STIFIn untuk sekolah, komunitas, atau tim yang ingin mengadakan kegiatan terjadwal. Detail awal dan formulir permintaan penawaran tersedia di tautan ini.',
    tip: 'Untuk institusi, siapkan jumlah peserta perkiraan, kota, tujuan kegiatan, dan rentang waktu yang diinginkan.',
  },
  {
    id: 'calon-promotor',
    title: 'Informasi Calon Promotor',
    audience: 'Orang yang bertanya tentang jalur promotor',
    destination: '/jadi-promotor',
    message: 'Kalau kamu ingin memahami peran, proses belajar, tahapan, biaya, dan tanggung jawab promotor STIFIn sebelum memutuskan, halaman ini merangkum informasi awalnya.',
    tip: 'Jelaskan tanggung jawab dan biaya secara terbuka. Jangan menjanjikan pendapatan atau hasil usaha.',
  },
];

export function buildPromoterCampaignLink(portalUrl: string, campaign: Campaign, channel: Channel, source = 'promotor') {
  const url = new URL(portalUrl);
  url.searchParams.set('to', campaign.destination);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', channel);
  url.searchParams.set('utm_campaign', campaign.id);
  url.searchParams.set('utm_content', 'pusat-mitra');
  return url.toString();
}

function campaignMessage(campaign: Campaign, link: string) {
  return `${campaign.message}\n\nInformasi lengkap: ${link}\n\nSilakan pelajari sesuai kebutuhan. Tes STIFIn bukan diagnosis medis atau psikologis.`;
}

export default function GrowthCenter({ roles }: { roles: readonly string[] }) {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const source = roles.includes('promoter') ? 'promotor' : 'affiliate';

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/account/referral', { cache: 'no-store' }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Tautan mitra belum dapat dimuat.');
        return data as PortalData;
      }),
      fetch('/api/account/referral/activity', { cache: 'no-store' }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Ringkasan aktivitas belum dapat dimuat.');
        return data as ActivityData;
      }),
    ]).then(([portalData, activityData]) => {
      if (!active) return;
      setPortal(portalData);
      setActivity(activityData);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Pusat akuisisi belum dapat dimuat.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const links = useMemo(() => portal ? Object.fromEntries(campaigns.map(campaign => [campaign.id, buildPromoterCampaignLink(portal.url, campaign, channel, source)])) as Record<string, string> : {}, [portal, channel, source]);

  async function copy(value: string, success: string) {
    setNotice('');
    try {
      await navigator.clipboard.writeText(value);
      setNotice(success);
    } catch {
      setNotice('Penyalinan otomatis gagal. Coba izinkan akses clipboard pada browser, lalu ulangi.');
    }
  }

  return <section className="lr-growth-center">
    <div className="lr-section-title">
      <div><span className="lr-eyebrow">PUSAT AKUISISI KLIEN</span><h2>Temukan calon klien, lalu arahkan ke layanan yang tepat.</h2><p className="lr-muted">Tautan membawa identitas referral dan label kampanye. Pengajuan yang selesai dikirim dapat dipantau di Aktivitas referral.</p></div>
      <Link className="lr-secondary lr-growth-activity-link" href="/akun/mitra?tab=activity">Lihat aktivitas →</Link>
    </div>
    {error && <div className="lr-notice lr-error" role="alert">{error}</div>}
    {notice && <div className="lr-notice" role="status">{notice}</div>}
    {loading && <p role="status">Menyiapkan tautan promosi dan ringkasan aktivitas…</p>}
    {portal && <>
      <div className="lr-stats lr-growth-stats">
        <div className="lr-stat"><span>Kunjungan referral tercatat</span><strong>{activity?.counts.visits ?? '—'}</strong><small>Catatan kunjungan referral</small></div>
        <div className="lr-stat"><span>Permintaan layanan</span><strong>{activity?.counts.requests ?? '—'}</strong><small>Lead yang mengirim formulir</small></div>
        <div className="lr-stat"><span>Akun baru</span><strong>{activity?.counts.registrations ?? '—'}</strong><small>Pendaftaran dari tautan mitra</small></div>
        <div className="lr-stat"><span>Pembelian tercatat</span><strong>{activity?.counts.purchases ?? '—'}</strong><small>Transaksi yang terkait referral</small></div>
      </div>
      <div className="lr-card lr-growth-controls">
        <div><h3>Siapkan tautan sesuai kanal</h3><p className="lr-muted">Setiap tautan mencatat jenis layanan, kanal pembagian, dan kampanye. Gunakan tautan yang berbeda untuk membandingkan sumber calon klien.</p></div>
        <label>Kanal pembagian<select value={channel} onChange={event => setChannel(event.target.value as Channel)}><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="offline">Pertemuan langsung / materi cetak</option></select></label>
      </div>
      <div className="lr-growth-grid">
        {campaigns.map(campaign => {
          const link = links[campaign.id];
          const message = campaignMessage(campaign, link);
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          return <article className="lr-card lr-growth-card" key={campaign.id}>
            <span className="lr-tag">{campaign.id === 'calon-promotor' ? 'JARINGAN' : 'LAYANAN KLIEN'}</span>
            <h3>{campaign.title}</h3><p className="lr-growth-audience">{campaign.audience}</p><p>{campaign.tip}</p>
            <label className="lr-growth-link-label">Tautan kampanye<input readOnly value={link} onFocus={event => event.currentTarget.select()} aria-label={`Tautan kampanye ${campaign.title}`} /></label>
            <div className="lr-actions lr-growth-actions">
              <button type="button" onClick={() => void copy(link, `Tautan ${campaign.title} disalin.`)}>Salin tautan</button>
              <button type="button" className="lr-secondary" onClick={() => void copy(message, `Pesan ${campaign.title} disalin.`)}>Salin pesan</button>
              {channel === 'whatsapp' && <a className="lr-button" href={whatsappUrl} target="_blank" rel="noreferrer">Bagikan via WhatsApp ↗</a>}
            </div>
          </article>;
        })}
      </div>
      <div className="lr-inline-notice"><b>Prinsip promosi:</b> sampaikan informasi sesuai halaman resmi, jelaskan bahwa jadwal dan biaya dikonfirmasi, jangan menjanjikan hasil tes atau pendapatan, dan jangan mengirim pesan massal tanpa persetujuan penerima.</div>
    </>}
  </section>;
}
