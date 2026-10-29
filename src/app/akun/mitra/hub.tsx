'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReferralActivity from './activity';
import PromotionList from '../produk/promotion-list';
import Partner from '../komisi/partner';
import ReferralForm from '../tautan/referral-form';
import MemberMenu from '../components/member-menu';
import GrowthCenter from './growth-center';
import { Notice } from '../../belajar/ui';

type ReferralPortal = { alias: string; url: string; aliases: string[] };
const TAB_IDS = ['growth', 'products', 'activity', 'commissions', 'links'];

function ReferralPanel() {
  const [data, setData] = useState<ReferralPortal | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/account/referral', { cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      if (active) setData(result);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Tautan belum dapat dimuat.');
    });
    return () => { active = false; };
  }, []);
  return <section className="lr-card"><h2>Tautan & identitas affiliate</h2><p>Alias pribadi menghubungkan tautan promosi dengan akun Anda. Gunakan tautan per produk pada tab Produk promosi.</p><Notice message={error} error />{data ? <ReferralForm initial={data} /> : !error && <p role="status">Memuat tautan…</p>}</section>;
}

export default function PartnerHub({ roles, initialTab = 'growth' }: { roles: readonly string[]; initialTab?: string }) {
  const tabs = [
    ['growth', 'Dapatkan klien'],
    ['products', 'Produk promosi'],
    ['activity', 'Aktivitas referral'],
    ['commissions', 'Komisi & pencairan'],
    ['links', 'Tautan affiliate'],
  ];
  const [tab, setTab] = useState(TAB_IDS.includes(initialTab) ? initialTab : 'growth');
  useEffect(() => {
    const sync = () => {
      const current = new URL(window.location.href).searchParams.get('tab') ?? 'growth';
      setTab(TAB_IDS.includes(current) ? current : 'growth');
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  function selectTab(id: string) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    window.history.pushState(null, '', url);
  }
  return <main className="learning-app">
    <header className="lr-topbar"><Link className="lr-brand" href="/">KonsepSTIFIn</Link><Link href="/akun">Akun saya</Link></header>
    <MemberMenu roles={roles} active="/akun/mitra" />
    <header className="lr-heading"><div><span className="lr-eyebrow">PUSAT MITRA KONSEPSTIFIN</span><h1>Bangun jaringan dan dapatkan calon klien dengan alur yang jelas.</h1><p>Buat tautan sesuai kebutuhan calon klien, bagikan pesan yang relevan, lalu pantau permintaan layanan dan transaksi dari referral Anda.</p></div></header>
    <nav className="lr-member-menu" aria-label="Menu pusat mitra">{tabs.map(([id, label]) => <button key={id} className={tab === id ? '' : 'lr-secondary'} aria-current={tab === id ? 'page' : undefined} onClick={() => selectTab(id)}>{label}</button>)}</nav>
    {tab === 'growth' ? <GrowthCenter roles={roles} /> : tab === 'products' ? <PromotionList /> : tab === 'activity' ? <ReferralActivity /> : tab === 'commissions' ? <Partner roles={roles} embedded /> : <ReferralPanel />}
  </main>;
}
