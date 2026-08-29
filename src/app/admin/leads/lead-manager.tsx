'use client';

import { useMemo, useState } from 'react';
import type { LeadAdminUpdate, LeadStatus, PaymentStatus, StoredLead } from '@/lib/interest-store';
import type { PublicPromoter } from '@/lib/promoter-domain';

const statuses: LeadStatus[] = ['baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup'];
const payments: PaymentStatus[] = ['belum_dicek', 'dibayar', 'dibatalkan', 'dikembalikan'];
const labels: Record<LeadStatus, string> = { baru: 'Baru', mencari_promotor: 'Mencari promotor', ditawarkan: 'Ditawarkan', diklaim: 'Diklaim', dijadwalkan: 'Dijadwalkan', selesai: 'Selesai', ditutup: 'Ditutup' };
const paymentLabels: Record<PaymentStatus, string> = { belum_dicek: 'Belum dicek', dibayar: 'Dibayar', dibatalkan: 'Dibatalkan', dikembalikan: 'Dikembalikan' };
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
function calculateDraftMargin(values: Pick<LeadAdminUpdate, 'saleAmount' | 'promoterPayout' | 'otherCost'>) {
  return values.saleAmount - values.promoterPayout - values.otherCost;
}
function editorFromLead(lead: StoredLead): LeadAdminUpdate {
  return { status: lead.status, assignedPromoterCode: lead.assignedPromoterCode, scheduledAt: lead.scheduledAt,
    internalNotes: lead.internalNotes, paymentStatus: lead.paymentStatus, sejoliOrderId: lead.sejoliOrderId,
    saleAmount: lead.saleAmount, promoterPayout: lead.promoterPayout, otherCost: lead.otherCost };
}
function dateTimeLocal(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ''; }

export default function LeadManager({ databaseReady, initialLeads, initialPromoters, initialError }: {
  databaseReady: boolean; initialLeads: StoredLead[]; initialPromoters: PublicPromoter[]; initialError: string;
}) {
  const [leads, setLeads] = useState(initialLeads), [filter, setFilter] = useState(''), [error, setError] = useState(initialError);
  const [saving, setSaving] = useState(0), [selectedId, setSelectedId] = useState<number | null>(null), [editor, setEditor] = useState<LeadAdminUpdate | null>(null);
  const shown = useMemo(() => leads.filter((lead) => !filter || lead.status === filter), [leads, filter]);
  const totals = useMemo(() => Object.fromEntries(statuses.map((status) => [status, leads.filter((lead) => lead.status === status).length])), [leads]);
  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const margin = editor ? calculateDraftMargin(editor) : 0;
  function openLead(lead: StoredLead) { setSelectedId(lead.id); setEditor(editorFromLead(lead)); setError(''); }
  function change<K extends keyof LeadAdminUpdate>(key: K, value: LeadAdminUpdate[K]) { setEditor((current) => current ? { ...current, [key]: value } : current); }
  async function save() {
    if (!selected || !editor) return;
    setSaving(selected.id); setError('');
    try {
      const response = await fetch(`/api/admin/leads/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editor) });
      const result = await response.json() as { error?: string; lead?: StoredLead };
      if (!response.ok || !result.lead) setError(result.error || 'Perubahan belum tersimpan.');
      else { setLeads((items) => items.map((item) => item.id === selected.id ? result.lead! : item)); setEditor(editorFromLead(result.lead)); }
    } catch { setError('Perubahan belum tersimpan.'); }
    setSaving(0);
  }
  return <main className="lead-admin"><header><div><span>PUSAT LAYANAN NASIONAL</span><h1>Koordinasi lead</h1><p>Rekonsiliasi order, pembayaran, promotor, jadwal, biaya, dan margin.</p></div><div className="lead-admin-links"><a href="/admin/promotor">Pemetaan promotor →</a><a href="/admin/artikel">Dashboard artikel →</a></div></header>
    {!databaseReady && <p className="interest-error">DATABASE_URL belum dikonfigurasi.</p>}{error && <p className="interest-error">{error}</p>}
    <section className="lead-metrics">{statuses.slice(0, 5).map((status) => <button type="button" key={status} onClick={() => setFilter(filter === status ? '' : status)} className={filter === status ? 'active' : ''}><b>{totals[status]}</b><span>{labels[status]}</span></button>)}</section>
    <section className="lead-table"><div className="lead-row lead-head"><span>Konsumen</span><span>Wilayah dan layanan</span><span>Masuk</span><span>Status</span></div>{shown.map((lead) => <div className="lead-row" key={lead.id}><span><b>{lead.name}</b><small>{lead.phone} · {lead.email}</small></span><span><b>{lead.regencyName || lead.city}</b><small>{lead.service}</small></span><span><b>{new Date(lead.createdAt).toLocaleDateString('id-ID')}</b><small>{paymentLabels[lead.paymentStatus]}</small></span><button type="button" className="lead-open" onClick={() => openLead(lead)}>Ref. KSF-{lead.id} · {labels[lead.status]}</button></div>)}{!shown.length && <p className="lead-empty">Belum ada lead pada filter ini.</p>}</section>
    {selected && editor && <section className="lead-editor" aria-label={`Detail KSF-${selected.id}`}><header><div><span>REF. KSF-{selected.id}</span><h2>{selected.name}</h2><p>{selected.phone} · {selected.email}</p></div><button type="button" onClick={() => { setSelectedId(null); setEditor(null); }} aria-label="Tutup detail">×</button></header>
      <div className="lead-snapshot"><div><small>KANDIDAT AWAL</small><b>{selected.matchedPromoterName || 'Belum ada kandidat'}</b><span>{selected.matchedBranchCode || 'Tanpa kode cabang'} · {selected.matchMethod}</span></div><div><small>WILAYAH</small><b>{selected.regencyName}</b><span>{selected.provinceName}</span></div></div>
      <div className="lead-editor-grid"><label>Status lead<select aria-label="Status lead" value={editor.status} onChange={(e) => change('status', e.target.value as LeadStatus)}>{statuses.map((item) => <option value={item} key={item}>{labels[item]}</option>)}</select></label>
        <label>Status pembayaran<select aria-label="Status pembayaran" value={editor.paymentStatus} onChange={(e) => change('paymentStatus', e.target.value as PaymentStatus)}>{payments.map((item) => <option value={item} key={item}>{paymentLabels[item]}</option>)}</select></label>
        <label>Promotor final<select aria-label="Promotor final" value={initialPromoters.some((item) => item.code === editor.assignedPromoterCode) ? editor.assignedPromoterCode : ''} onChange={(e) => change('assignedPromoterCode', e.target.value)}><option value="">Pilih dari daftar</option>{initialPromoters.map((item) => <option value={item.code} key={item.code}>{item.code} · {item.name}</option>)}</select></label>
        <label>Kode promotor manual<input aria-label="Kode promotor manual" value={editor.assignedPromoterCode} onChange={(e) => change('assignedPromoterCode', e.target.value.toUpperCase())} /></label>
        <label>ID order SEJOLI<input aria-label="ID order SEJOLI" value={editor.sejoliOrderId} onChange={(e) => change('sejoliOrderId', e.target.value)} /></label>
        <label>Jadwal<input aria-label="Jadwal" type="datetime-local" value={dateTimeLocal(editor.scheduledAt)} onChange={(e) => change('scheduledAt', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
        <label>Nilai penjualan<input aria-label="Nilai penjualan" inputMode="numeric" type="number" min="0" value={editor.saleAmount} onChange={(e) => change('saleAmount', Number(e.target.value))} /></label>
        <label>Bagian promotor<input aria-label="Bagian promotor" inputMode="numeric" type="number" min="0" value={editor.promoterPayout} onChange={(e) => change('promoterPayout', Number(e.target.value))} /></label>
        <label>Biaya lain<input aria-label="Biaya lain" inputMode="numeric" type="number" min="0" value={editor.otherCost} onChange={(e) => change('otherCost', Number(e.target.value))} /></label>
        <label className="lead-notes">Catatan internal<textarea aria-label="Catatan internal" rows={4} value={editor.internalNotes} onChange={(e) => change('internalNotes', e.target.value)} /></label></div>
      <footer><div className={margin < 0 ? 'margin-total negative' : 'margin-total'}><small>MARGIN</small><b>{rupiah.format(margin)}</b></div><button type="button" onClick={() => void save()} disabled={saving === selected.id}>{saving === selected.id ? 'Menyimpan…' : 'Simpan perubahan'}</button></footer>
    </section>}
  </main>;
}
