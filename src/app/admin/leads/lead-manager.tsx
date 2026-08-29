'use client';

import { useMemo, useState } from 'react';
import {
  promoterCandidateStatuses,
  testServiceStatuses,
  type LeadStatus,
  type LeadType,
  type PaymentStatus,
} from '@/lib/lead-domain';
import type { LeadHistoryEntry, StoredLead } from '@/lib/interest-store';

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
const paymentStatuses = Object.keys(paymentLabels) as PaymentStatus[];

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
function unique(leads: StoredLead[], key: 'provinceName' | 'regencyName' | 'service' | 'utmCampaign') {
  return [...new Set(leads.map((lead) => lead[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
}
function isOverdue(lead: StoredLead) {
  return !['selesai', 'ditutup'].includes(lead.status) && new Date(lead.responseDueAt).getTime() < Date.now();
}

export default function LeadManager({ databaseReady, initialLeads, initialError, initialHistories = {} }: {
  databaseReady: boolean;
  initialLeads: StoredLead[];
  initialError: string;
  initialHistories?: Record<number, LeadHistoryEntry[]>;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeType, setActiveType] = useState<LeadType>('test_service');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<StoredLead | null>(null);
  const [histories, setHistories] = useState(initialHistories);
  const [error, setError] = useState(initialError);
  const [saving, setSaving] = useState(false);

  const typeLeads = useMemo(() => leads.filter((lead) => lead.leadType === activeType), [activeType, leads]);
  const shown = useMemo(() => typeLeads.filter((lead) => {
    const haystack = `${lead.id} ${lead.name} ${lead.phone} ${lead.email} ${lead.assignedPromoterCode} ${lead.pic}`.toLocaleLowerCase('id-ID');
    const created = lead.createdAt.slice(0, 10);
    return (!filters.search || haystack.includes(filters.search.toLocaleLowerCase('id-ID')))
      && (!filters.status || lead.status === filters.status)
      && (!filters.province || lead.provinceName === filters.province)
      && (!filters.regency || lead.regencyName === filters.regency)
      && (!filters.service || lead.service === filters.service)
      && (!filters.campaign || lead.utmCampaign === filters.campaign)
      && (!filters.dateFrom || created >= filters.dateFrom)
      && (!filters.dateTo || created <= filters.dateTo);
  }), [filters, typeLeads]);
  const metrics = useMemo(() => ({
    baru: typeLeads.filter((lead) => lead.status === 'baru').length,
    terlambat: typeLeads.filter(isOverdue).length,
    milestone: typeLeads.filter((lead) => activeType === 'test_service' ? lead.status === 'dijadwalkan' : lead.status === 'aktivasi').length,
    selesai: typeLeads.filter((lead) => lead.status === 'selesai').length,
    ditutup: typeLeads.filter((lead) => lead.status === 'ditutup').length,
  }), [activeType, typeLeads]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value, ...(key === 'province' ? { regency: '' } : {}) }));
  }
  function selectType(type: LeadType) {
    setActiveType(type); setFilters(emptyFilters); setSelectedId(null); setDraft(null);
  }
  async function openLead(lead: StoredLead) {
    setSelectedId(lead.id); setDraft({ ...lead }); setError('');
    if (Object.prototype.hasOwnProperty.call(histories, lead.id)) return;
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`);
      const result = await response.json() as { history?: LeadHistoryEntry[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Riwayat belum dapat dimuat.');
      setHistories((current) => ({ ...current, [lead.id]: result.history || [] }));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Riwayat belum dapat dimuat.');
    }
  }
  function updateDraft<K extends keyof StoredLead>(key: K, value: StoredLead[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }
  async function save() {
    if (!draft) return;
    setSaving(true); setError('');
    const payload = {
      status: draft.status, assignedPromoterCode: draft.assignedPromoterCode, pic: draft.pic,
      scheduledAt: draft.scheduledAt, internalNotes: draft.internalNotes, paymentStatus: draft.paymentStatus,
      sejoliOrderId: draft.sejoliOrderId, saleAmount: draft.saleAmount,
      promoterPayout: draft.promoterPayout, otherCost: draft.otherCost,
    };
    try {
      const response = await fetch(`/api/admin/leads/${draft.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { lead?: StoredLead; error?: string };
      if (!response.ok) throw new Error(result.error || 'Perubahan belum tersimpan.');
      const updated = result.lead || { ...draft, margin: draft.saleAmount - draft.promoterPayout - draft.otherCost };
      setLeads((items) => items.map((item) => item.id === updated.id ? updated : item));
      setDraft(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Perubahan belum tersimpan.');
    } finally { setSaving(false); }
  }

  const statusOptions = statusesFor(activeType);
  const margin = draft ? draft.saleAmount - draft.promoterPayout - draft.otherCost : 0;
  const filteredRegencies = typeLeads.filter((lead) => !filters.province || lead.provinceName === filters.province);

  return <main className="lead-admin">
    <header><div><span>PUSAT LAYANAN NASIONAL</span><h1>Pipeline lead</h1><p>Dua funnel terpisah untuk layanan tes dan pengembangan calon promotor.</p></div><nav><a href="/admin/promotor">Promotor</a><a href="/admin/artikel">Artikel</a></nav></header>
    {!databaseReady && <p className="interest-error">DATABASE_URL belum dikonfigurasi.</p>}
    {error && <p className="interest-error" role="alert">{error}</p>}

    <div className="lead-tabs" role="tablist" aria-label="Jenis pipeline">
      <button role="tab" aria-selected={activeType === 'test_service'} onClick={() => selectType('test_service')}>Tes STIFIn <b>{leads.filter((lead) => lead.leadType === 'test_service').length}</b></button>
      <button role="tab" aria-selected={activeType === 'promoter_candidate'} onClick={() => selectType('promoter_candidate')}>Calon Promotor <b>{leads.filter((lead) => lead.leadType === 'promoter_candidate').length}</b></button>
    </div>

    <section className="lead-metrics" aria-label="Ringkasan pipeline">
      <article><b>{metrics.baru}</b><span>Baru</span></article><article className={metrics.terlambat ? 'warning' : ''}><b>{metrics.terlambat}</b><span>Lewat SLA</span></article>
      <article><b>{metrics.milestone}</b><span>{activeType === 'test_service' ? 'Dijadwalkan' : 'Aktivasi'}</span></article><article><b>{metrics.selesai}</b><span>Selesai</span></article><article><b>{metrics.ditutup}</b><span>Ditutup</span></article>
    </section>

    <section className="lead-filters" aria-label="Filter lead">
      <label>Cari lead<input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Nama, kontak, referensi" /></label>
      <details className="lead-status-filter"><summary>Status: {filters.status ? labels[filters.status as LeadStatus] : 'Semua'}</summary><div><button type="button" className={!filters.status ? 'active' : ''} onClick={() => updateFilter('status', '')}>Semua status</button>{statusOptions.map((status) => <button type="button" className={filters.status === status ? 'active' : ''} key={status} onClick={() => updateFilter('status', status)}>{labels[status]}</button>)}</div></details>
      <label>Provinsi<select value={filters.province} onChange={(event) => updateFilter('province', event.target.value)}><option value="">Semua provinsi</option>{unique(typeLeads, 'provinceName').map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Kabupaten/kota<select value={filters.regency} onChange={(event) => updateFilter('regency', event.target.value)}><option value="">Semua kabupaten/kota</option>{unique(filteredRegencies, 'regencyName').map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Layanan<select value={filters.service} onChange={(event) => updateFilter('service', event.target.value)}><option value="">Semua layanan</option>{unique(typeLeads, 'service').map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Kampanye<select value={filters.campaign} onChange={(event) => updateFilter('campaign', event.target.value)}><option value="">Semua kampanye</option>{unique(typeLeads, 'utmCampaign').map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Dari<input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} /></label>
      <label>Sampai<input type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} /></label>
      <button type="button" onClick={() => setFilters(emptyFilters)}>Reset filter</button>
    </section>

    <div className={`lead-workspace ${draft ? 'has-detail' : ''}`}>
      <section className="lead-table" aria-label={`Daftar ${activeType === 'test_service' ? 'lead tes' : 'calon promotor'}`}>
        <div className="lead-row lead-head"><span>Lead</span><span>Wilayah dan layanan</span><span>Masuk</span><span>Status</span></div>
        {shown.map((lead) => <article className={`lead-row ${selectedId === lead.id ? 'selected' : ''}`} key={lead.id}><span><b>{lead.name}</b><small>{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</small></span><span><b>{lead.regencyName || lead.city}</b><small>{lead.service}</small></span><span><b>{new Date(lead.createdAt).toLocaleDateString('id-ID')}</b><button type="button" onClick={() => openLead(lead)}>Ref. KSF-{lead.id}</button></span><span><b>{labels[lead.status]}</b>{isOverdue(lead) && <small className="overdue">Lewat SLA</small>}</span></article>)}
        {!shown.length && <p className="lead-empty">Belum ada lead pada filter ini.</p>}
      </section>

      {draft && <aside className="lead-detail" aria-label={`Detail Ref. KSF-${draft.id}`}>
        <div className="lead-detail-head"><div><small>Ref. KSF-{draft.id}</small><h2>{draft.name}</h2><p>{draft.phone}{draft.email ? ` · ${draft.email}` : ''}</p></div><button type="button" aria-label="Tutup detail" onClick={() => { setSelectedId(null); setDraft(null); }}>×</button></div>
        <section className="lead-detail-section"><h3>Pipeline dan penanggung jawab</h3>
          <label>Status<select value={draft.status} onChange={(event) => updateDraft('status', event.target.value as LeadStatus)}>{statusesFor(draft.leadType).map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
          {draft.leadType === 'test_service' ? <><label>Promotor ditugaskan<input value={draft.assignedPromoterCode} onChange={(event) => updateDraft('assignedPromoterCode', event.target.value)} /></label><label>Jadwal<input type="datetime-local" value={asDateInput(draft.scheduledAt)} onChange={(event) => updateDraft('scheduledAt', event.target.value ? new Date(event.target.value).toISOString() : null)} /></label><div className="lead-candidates"><b>Kandidat hasil matching</b><small>Metode: {draft.matchMethod} · Cabang: {draft.matchedBranchCode || '—'}</small>{draft.promoterCandidates.length ? <ul>{draft.promoterCandidates.map((candidate) => <li key={candidate.code}><strong>{candidate.name}</strong><span>{candidate.code} · {candidate.branchCode} · {candidate.area}</span><button type="button" onClick={() => updateDraft('assignedPromoterCode', candidate.code)}>Tugaskan</button></li>)}</ul> : <p>Belum ada kandidat.</p>}</div></> : <><label>PIC<input value={draft.pic} onChange={(event) => updateDraft('pic', event.target.value)} /></label><p className="lead-note">Funnel calon promotor tidak masuk checkout layanan tes.</p></>}
        </section>
        {draft.leadType === 'test_service' && <section className="lead-detail-section"><h3>Transaksi dan margin</h3><label>Status pembayaran<select value={draft.paymentStatus} onChange={(event) => updateDraft('paymentStatus', event.target.value as PaymentStatus)}>{paymentStatuses.map((status) => <option key={status} value={status}>{paymentLabels[status]}</option>)}</select></label><label>ID order SEJOLI<input value={draft.sejoliOrderId} onChange={(event) => updateDraft('sejoliOrderId', event.target.value)} /></label><div className="lead-money-grid"><label>Nilai penjualan<input type="number" min="0" value={draft.saleAmount} onChange={(event) => updateDraft('saleAmount', Number(event.target.value))} /></label><label>Bagian promotor<input type="number" min="0" value={draft.promoterPayout} onChange={(event) => updateDraft('promoterPayout', Number(event.target.value))} /></label><label>Biaya lain<input type="number" min="0" value={draft.otherCost} onChange={(event) => updateDraft('otherCost', Number(event.target.value))} /></label></div><div className="lead-margin"><span>Margin</span><b>{formatMoney(margin)}</b></div></section>}
        <section className="lead-detail-section"><h3>Atribusi dan persetujuan</h3><dl className="lead-facts"><div><dt>Sumber</dt><dd>{[draft.utmSource, draft.utmMedium, draft.utmCampaign].filter(Boolean).join(' · ') || 'Organik/tidak tersedia'}</dd></div><div><dt>Konten / istilah</dt><dd>{[draft.utmContent, draft.utmTerm].filter(Boolean).join(' · ') || '—'}</dd></div><div><dt>Halaman asal</dt><dd>{draft.sourcePath}</dd></div><div><dt>Referrer</dt><dd>{draft.referrer || '—'}</dd></div><div><dt>Persetujuan</dt><dd>{new Date(draft.consentAt).toLocaleString('id-ID')} · kontak {draft.consentToContact ? 'ya' : 'tidak'} · berbagi {draft.consentToShare ? 'ya' : 'tidak'}</dd></div><div><dt>Batas respons</dt><dd>{new Date(draft.responseDueAt).toLocaleString('id-ID')}</dd></div></dl><label>Catatan internal<textarea rows={4} value={draft.internalNotes} onChange={(event) => updateDraft('internalNotes', event.target.value)} /></label></section>
        <section className="lead-detail-section"><h3>Riwayat</h3>{histories[draft.id] ? (histories[draft.id].length ? <ol className="lead-history">{histories[draft.id].map((entry) => <li key={entry.id}><b>{entry.note || labels[entry.newStatus as LeadStatus] || entry.eventType}</b><span>{new Date(entry.createdAt).toLocaleString('id-ID')} · {entry.actor}</span></li>)}</ol> : <p className="lead-note">Belum ada riwayat tambahan.</p>) : <p className="lead-note">Memuat riwayat…</p>}</section>
        <button className="lead-save" type="button" disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
      </aside>}
    </div>
  </main>;
}
