'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  promoterCandidateStatuses,
  testServiceStatuses,
  type LeadStatus,
  type LeadType,
  type PaymentStatus,
} from '@/lib/lead-domain';
import type { LeadHistoryEntry, StoredLead, getCrmLeads } from '@/lib/interest-store';
import { crmGroup, crmGroups, crmLabels, crmType, type CrmGroup } from '@/lib/crm-domain';
import ContactCreate from './contact-create';
import type { CommerceOrder } from '@/lib/commerce-store';

const labels: Record<LeadStatus, string> = {
  baru: 'Baru', mencari_promotor: 'Mencari promotor', ditawarkan: 'Ditawarkan', diklaim: 'Diklaim',
  dijadwalkan: 'Dijadwalkan', dihubungi: 'Dihubungi', konsultasi: 'Konsultasi',
  mengikuti_preview: 'Mengikuti Preview', mengikuti_wsl: 'Mengikuti WSL', aktivasi: 'Aktivasi',
  selesai: 'Selesai', ditutup: 'Ditutup',
};

const paymentLabels: Record<PaymentStatus, string> = {
  belum_dicek: 'Belum dicek', menunggu: 'Menunggu pembayaran', dibayar: 'Dibayar',
  gagal: 'Gagal', dikembalikan: 'Dikembalikan',
};


type Filters = {
  search: string; status: string; province: string; regency: string; service: string;
  campaign: string; dateFrom: string; dateTo: string;
};
const emptyFilters: Filters = {
  search: '', status: '', province: '', regency: '', service: '', campaign: '', dateFrom: '', dateTo: '',
};

function statusesFor(type: LeadType) {
  return type === 'test_service' ? testServiceStatuses : promoterCandidateStatuses;
}
function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}
function asDateInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
function isOverdue(lead: StoredLead) {
  return !['selesai', 'ditutup'].includes(lead.status) && new Date(lead.responseDueAt).getTime() < Date.now();
}

export default function LeadManager({ databaseReady, initialPage, initialError, initialHistories = {} }: {
  databaseReady: boolean;
  initialPage: Awaited<ReturnType<typeof getCrmLeads>>;
  initialError: string;
  initialHistories?: Record<number, LeadHistoryEntry[]>;
}) {
  const [result, setResult] = useState(initialPage);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestSequence = useRef(0);
  const detailSequence = useRef(0);
  const selectedRef = useRef<number | null>(null);
  const firstRequest = useRef(true);
  const [activeGroup, setActiveGroup] = useState<CrmGroup>('prospect');
  const activeType = crmType(activeGroup);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<StoredLead | null>(null);
  const [orders, setOrders] = useState<Record<number, (CommerceOrder | null)[]>>({});
  const [histories, setHistories] = useState(initialHistories);
  const [error, setError] = useState(initialError);
  const [saving, setSaving] = useState(false);

  const shown = result.items;
  const metrics = result.metrics;
  useEffect(() => {
    if (firstRequest.current) { firstRequest.current = false; return; }
    const sequence = ++requestSequence.current;
    const controller = new AbortController();
    const params = new URLSearchParams({group: activeGroup,page:String(page),q:filters.search,...Object.fromEntries(Object.entries(filters).filter(([key])=>key!=='search'))});
    setLoading(true);
    fetch(`/api/admin/leads?${params}`, {signal:controller.signal,cache:'no-store'}).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Daftar belum dapat dimuat.');
      if (!Array.isArray(data.items) || !data.groups || !data.options || !data.metrics) throw new Error('Respons daftar tidak lengkap.');
      if(sequence===requestSequence.current) { setResult(data); setError(''); }
    }).catch(error => {
      if(sequence===requestSequence.current && !controller.signal.aborted) setError(error instanceof Error ? error.message : 'Daftar belum dapat dimuat.');
    }).finally(()=>{if(sequence===requestSequence.current) setLoading(false);});
    return ()=> { controller.abort(); requestSequence.current = sequence+1; };
  },[activeGroup,filters,page,revision]);

  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('leadId'));
    if (!Number.isSafeInteger(id) || id<1) return;
    const controller = new AbortController(); const sequence = ++detailSequence.current;
    fetch(`/api/admin/leads/${id}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{
      const data=await response.json();
      if (!response.ok || !data.lead) throw new Error(data.error || 'Lead belum dapat dibuka.');
      if (sequence!==detailSequence.current) return;
      selectedRef.current=id;setSelectedId(id);setDraft(data.lead);
      setHistories(current=>({...current,[id]:data.history || []}));setOrders(current=>({...current,[id]:data.orders || []}));
    }).catch(error=>{if(!controller.signal.aborted && sequence===detailSequence.current) setError(error instanceof Error?error.message:'Lead belum dapat dibuka.');});
    return ()=>controller.abort();
  },[]);

  function updateFilter(key: keyof Filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value, ...(key === 'province' ? { regency: '' } : {}) }));
  }
  function selectGroup(group: CrmGroup) {
    ++detailSequence.current; selectedRef.current = null; setPage(1); setActiveGroup(group); setFilters(emptyFilters); setSelectedId(null); setDraft(null);
  }
  async function openLead(lead: StoredLead) {
    const sequence = ++detailSequence.current; selectedRef.current = lead.id;
    setSelectedId(lead.id); setDraft({ ...lead }); setError('');
    if (Object.prototype.hasOwnProperty.call(histories, lead.id)) return;
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`);
      const result = await response.json() as { history?: LeadHistoryEntry[]; orders?: (CommerceOrder | null)[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Riwayat belum dapat dimuat.');
      setHistories((current) => ({ ...current, [lead.id]: result.history || [] }));
      setOrders(current=>({...current,[lead.id]:result.orders || []}));
    } catch (fetchError) {
      if(sequence===detailSequence.current) setError(fetchError instanceof Error ? fetchError.message : 'Riwayat belum dapat dimuat.');
    }
  }
  function updateDraft<K extends keyof StoredLead>(key: K, value: StoredLead[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }
  async function save() {
    if (!draft) return;
    const savedId = draft.id; const selectionVersion = detailSequence.current;
    setSaving(true); setError('');
    const payload = {
      name: draft.name, phone: draft.phone, email: draft.email, city: draft.city,
      status: draft.status, assignedPromoterCode: draft.assignedPromoterCode, pic: draft.pic,
      scheduledAt: draft.scheduledAt, internalNotes: draft.internalNotes,
    };
    try {
      const response = await fetch(`/api/admin/leads/${draft.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { lead?: StoredLead; error?: string };
      if (!response.ok) throw new Error(result.error || 'Perubahan belum tersimpan.');
      if (!result.lead) throw new Error('Respons penyimpanan tidak lengkap. Muat ulang sebelum mencoba lagi.');
      const updated = result.lead;
      setRevision(value=>value+1);
      if(selectedRef.current===savedId && selectionVersion===detailSequence.current) setDraft(updated);
      setHistories(current => { const next = { ...current }; delete next[updated.id]; return next; });
      try {
        const historyResponse = await fetch(`/api/admin/leads/${updated.id}`);
        const historyResult = await historyResponse.json();
        if (historyResponse.ok && historyResult.history) setHistories(current => ({ ...current, [updated.id]: historyResult.history }));
      } catch { /* Riwayat dapat dimuat ulang saat detail dibuka lagi. */ }
    } catch (saveError) {
      if(selectedRef.current===savedId && selectionVersion===detailSequence.current) setError(saveError instanceof Error ? saveError.message : 'Perubahan belum tersimpan.');
    } finally { setSaving(false); }
  }

  const statusOptions = statusesFor(activeType);


  return <main className="lead-admin">
    <header><div><span>PORTAL TIM · CRM</span><h1>Klien & Promotor</h1><p>Kelola relasi, tindak lanjut, dan perkembangan jaringan dalam satu dashboard.</p></div><nav><a href="/admin/promotor">Direktori nasional</a><a href="/admin/artikel">Artikel & AI</a><Link href="/admin/pesanan">Pesanan & Pembayaran</Link></nav></header>
    {!databaseReady && <p className="interest-error">DATABASE_URL belum dikonfigurasi.</p>}
    {error && <p className="interest-error" role="alert">{error}</p>}

    <div className="lead-tabs" role="tablist" aria-label="Jenis pipeline">
      {crmGroups.map(group => <button key={group} role="tab" aria-selected={activeGroup === group} onClick={() => selectGroup(group)}>{crmLabels[group]} <b>{result.groups[group]}</b></button>)}
    </div>
    <div className="crm-toolbar"><p>Klien = tes selesai. Promotor Jaringan = proses aktivasi selesai. Pembayaran dikelola melalui Pesanan & Pembayaran.</p><button type="button" disabled={!databaseReady} onClick={() => setCreating(true)}>+ Tambah data</button></div>
    {creating && <ContactCreate onClose={() => setCreating(false)} onCreated={lead => {
      selectGroup(crmGroup(lead)); setRevision(value=>value+1); setCreating(false); void openLead(lead);
    }} />}

    <section className="lead-metrics" aria-label="Ringkasan pipeline">
      <article><b>{metrics.baru}</b><span>Baru</span></article><article className={metrics.terlambat ? 'warning' : ''}><b>{metrics.terlambat}</b><span>Lewat SLA</span></article>
      <article><b>{metrics.milestone}</b><span>{activeType === 'test_service' ? 'Dijadwalkan' : 'Aktivasi'}</span></article><article><b>{metrics.selesai}</b><span>Selesai</span></article><article><b>{metrics.ditutup}</b><span>Ditutup</span></article>
    </section>

    <section className="lead-filters" aria-label="Filter lead">
      <label>Cari lead<input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Nama, kontak, referensi" /></label>
      <details className="lead-status-filter"><summary>Status: {filters.status ? labels[filters.status as LeadStatus] : 'Semua'}</summary><div><button type="button" className={!filters.status ? 'active' : ''} onClick={() => updateFilter('status', '')}>Semua status</button>{statusOptions.map((status) => <button type="button" className={filters.status === status ? 'active' : ''} key={status} onClick={() => updateFilter('status', status)}>{labels[status]}</button>)}</div></details>
      <label>Provinsi<select value={filters.province} onChange={(event) => updateFilter('province', event.target.value)}><option value="">Semua provinsi</option>{result.options.province.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Kabupaten/kota<select value={filters.regency} onChange={(event) => updateFilter('regency', event.target.value)}><option value="">Semua kabupaten/kota</option>{result.options.regency.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Layanan<select value={filters.service} onChange={(event) => updateFilter('service', event.target.value)}><option value="">Semua layanan</option>{result.options.service.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Kampanye<select value={filters.campaign} onChange={(event) => updateFilter('campaign', event.target.value)}><option value="">Semua kampanye</option>{result.options.campaign.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Dari<input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} /></label>
      <label>Sampai<input type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} /></label>
      <button type="button" onClick={() => {setFilters(emptyFilters);setPage(1);}}>Reset filter</button>
    </section>

    <nav aria-label="Halaman lead"><button disabled={loading || page<=1} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><span> Halaman {page} · {result.total} data </span><button disabled={loading || page*result.pageSize>=result.total} onClick={()=>setPage(value=>value+1)}>Berikutnya</button>{loading && <span role="status">Memuat daftar…</span>}</nav>
    <div className={`lead-workspace ${draft ? 'has-detail' : ''}`}>
      <section className="lead-table" aria-label={`Daftar ${activeType === 'test_service' ? 'lead tes' : 'calon promotor'}`}>
        <div className="lead-row lead-head"><span>Lead</span><span>Wilayah dan layanan</span><span>Masuk</span><span>Status</span></div>
        {shown.map((lead) => <article className={`lead-row ${selectedId === lead.id ? 'selected' : ''}`} key={lead.id}><span><b>{lead.name}</b><small>{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</small></span><span><b>{lead.regencyName || lead.city}</b><small>{lead.service}</small></span><span><b>{new Date(lead.createdAt).toLocaleDateString('id-ID')}</b><button type="button" onClick={() => openLead(lead)}>Ref. KSF-{lead.id}</button></span><span><b>{labels[lead.status]}</b>{isOverdue(lead) && <small className="overdue">Lewat SLA</small>}</span></article>)}
        {!shown.length && <p className="lead-empty">Belum ada lead pada filter ini.</p>}
      </section>

      {draft && <aside className="lead-detail" aria-label={`Detail Ref. KSF-${draft.id}`}>
        <div className="lead-detail-head"><div><small>Ref. KSF-{draft.id}</small><h2>{draft.name}</h2><p>{draft.phone}{draft.email ? ` · ${draft.email}` : ''}</p></div><button type="button" aria-label="Tutup detail" onClick={() => { ++detailSequence.current; selectedRef.current=null; setSelectedId(null); setDraft(null); }}>×</button></div>
        <section className="lead-detail-section"><h3>Pipeline dan penanggung jawab</h3>
          <label>Nama lengkap<input value={draft.name} onChange={event => updateDraft('name', event.target.value)} /></label>
          <label>Nomor WhatsApp<input value={draft.phone} onChange={event => updateDraft('phone', event.target.value)} /></label>
          <label>Email<input type="email" value={draft.email} onChange={event => updateDraft('email', event.target.value)} /></label>
          <label>Domisili<input value={draft.city} onChange={event => updateDraft('city', event.target.value)} /></label>
          <p className="lead-note">Catatan awal: {draft.notes || '—'}</p>
          <p className="lead-note">Status Selesai memindahkan data ke {draft.leadType === 'test_service' ? 'Klien' : 'Promotor Jaringan'}. Gunakan Ditutup untuk prospek yang tidak berlanjut. Perubahan domisili menghapus kode wilayah lama; periksa kembali penugasan promotor.</p>
          <label>Status<select value={draft.status} onChange={(event) => updateDraft('status', event.target.value as LeadStatus)}>{statusesFor(draft.leadType).map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
          {draft.leadType === 'test_service' ? <><label>Promotor ditugaskan<input value={draft.assignedPromoterCode} onChange={(event) => updateDraft('assignedPromoterCode', event.target.value)} /></label><label>Jadwal<input type="datetime-local" value={asDateInput(draft.scheduledAt)} onChange={(event) => updateDraft('scheduledAt', event.target.value ? new Date(event.target.value).toISOString() : null)} /></label><div className="lead-candidates"><b>Kandidat hasil matching</b><small>Metode: {draft.matchMethod} · Cabang: {draft.matchedBranchCode || '—'}</small>{draft.promoterCandidates.length ? <ul>{draft.promoterCandidates.map((candidate) => <li key={candidate.code}><strong>{candidate.name}</strong><span>{candidate.code} · {candidate.branchCode} · {candidate.area}</span><button type="button" onClick={() => updateDraft('assignedPromoterCode', candidate.code)}>Tugaskan</button></li>)}</ul> : <p>Belum ada kandidat.</p>}</div></> : <><label>PIC<input value={draft.pic} onChange={(event) => updateDraft('pic', event.target.value)} /></label><p className="lead-note">Funnel calon promotor tidak masuk checkout layanan tes.</p></>}
        </section>
        <section className="lead-detail-section"><h3>Pesanan & Pembayaran</h3><Link href={`/admin/pesanan?leadId=${draft.id}`}>Lihat / buat pesanan terkait</Link>{orders[draft.id]?.filter(order=>order!==null).map(order=><p key={order.id}><Link href={`/admin/pesanan/${order.id}`}>{order.number}</Link> · {order.state} · {order.paymentStatus} · Total {formatMoney(order.total)} · Saldo {formatMoney(order.balance)}</p>)}<details><summary>Referensi transaksi lama (hanya baca)</summary><p>Status: {paymentLabels[draft.paymentStatus]} · ID order lama: {draft.sejoliOrderId || '—'}</p><p>Penjualan: {formatMoney(draft.saleAmount)} · Bagian promotor: {formatMoney(draft.promoterPayout)} · Biaya lain: {formatMoney(draft.otherCost)}</p></details></section>
        <section className="lead-detail-section"><h3>Atribusi dan persetujuan</h3><dl className="lead-facts"><div><dt>Sumber</dt><dd>{[draft.utmSource, draft.utmMedium, draft.utmCampaign].filter(Boolean).join(' · ') || 'Organik/tidak tersedia'}</dd></div><div><dt>Konten / istilah</dt><dd>{[draft.utmContent, draft.utmTerm].filter(Boolean).join(' · ') || '—'}</dd></div><div><dt>Halaman asal</dt><dd>{draft.sourcePath}</dd></div><div><dt>Referrer</dt><dd>{draft.referrer || '—'}</dd></div><div><dt>Persetujuan</dt><dd>{new Date(draft.consentAt).toLocaleString('id-ID')} · kontak {draft.consentToContact ? 'ya' : 'tidak'} · berbagi {draft.consentToShare ? 'ya' : 'tidak'}</dd></div><div><dt>Batas respons</dt><dd>{new Date(draft.responseDueAt).toLocaleString('id-ID')}</dd></div></dl><label>Catatan internal<textarea rows={4} value={draft.internalNotes} onChange={(event) => updateDraft('internalNotes', event.target.value)} /></label></section>
        <section className="lead-detail-section"><h3>Riwayat</h3>{histories[draft.id] ? (histories[draft.id].length ? <ol className="lead-history">{histories[draft.id].map((entry) => <li key={entry.id}><b>{entry.note || labels[entry.newStatus as LeadStatus] || entry.eventType}</b><span>{new Date(entry.createdAt).toLocaleString('id-ID')} · {entry.actor}</span></li>)}</ol> : <p className="lead-note">Belum ada riwayat tambahan.</p>) : <p className="lead-note">Memuat riwayat…</p>}</section>
        <button className="lead-save" type="button" disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
      </aside>}
    </div>
  </main>;
}
