'use client';

import { useMemo, useState } from 'react';
import type { LeadStatus, StoredLead } from '@/lib/interest-store';

const leadStatuses: LeadStatus[] = ['baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup'];

const labels: Record<LeadStatus, string> = { baru: 'Baru', mencari_promotor: 'Mencari promotor', ditawarkan: 'Ditawarkan', diklaim: 'Diklaim', dijadwalkan: 'Dijadwalkan', selesai: 'Selesai', ditutup: 'Ditutup' };

export default function LeadManager({ databaseReady, initialLeads, initialError }: { databaseReady: boolean; initialLeads: StoredLead[]; initialError: string }) {
  const [leads, setLeads] = useState(initialLeads); const [filter, setFilter] = useState(''); const [error, setError] = useState(initialError); const [saving, setSaving] = useState(0);
  const shown = useMemo(() => leads.filter((lead) => !filter || lead.status === filter), [leads, filter]);
  const totals = useMemo(() => Object.fromEntries(leadStatuses.map((status) => [status, leads.filter((lead) => lead.status === status).length])), [leads]);
  async function changeStatus(lead: StoredLead, status: LeadStatus) {
    setSaving(lead.id); setError('');
    const response = await fetch(`/api/admin/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, assignedPromoterCode: lead.assignedPromoterCode, internalNotes: lead.internalNotes, scheduledAt: lead.scheduledAt }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error || 'Perubahan belum tersimpan.'); else setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, status } : item));
    setSaving(0);
  }
  return <main className="lead-admin"><header><div><span>PUSAT LAYANAN NASIONAL</span><h1>Koordinasi lead</h1><p>Kelola permintaan konsumen tanpa membuka data pribadi di halaman publik.</p></div><a href="/admin/artikel">Dashboard artikel →</a></header>
    {!databaseReady && <p className="interest-error">DATABASE_URL belum dikonfigurasi.</p>}{error && <p className="interest-error">{error}</p>}
    <section className="lead-metrics">{leadStatuses.slice(0, 5).map((status) => <button key={status} onClick={() => setFilter(filter === status ? '' : status)} className={filter === status ? 'active' : ''}><b>{totals[status]}</b><span>{labels[status]}</span></button>)}</section>
    <section className="lead-table"><div className="lead-row lead-head"><span>Konsumen</span><span>Wilayah dan layanan</span><span>Masuk</span><span>Status</span></div>{shown.map((lead) => <div className="lead-row" key={lead.id}><span><b>{lead.name}</b><small>{lead.phone}</small></span><span><b>{lead.regencyName || lead.city}</b><small>{lead.service}</small></span><span><b>{new Date(lead.createdAt).toLocaleDateString('id-ID')}</b><small>Ref. KSF-{lead.id}</small></span><select disabled={saving === lead.id} value={lead.status} onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}>{leadStatuses.map((status) => <option value={status} key={status}>{labels[status]}</option>)}</select></div>)}{!shown.length && <p className="lead-empty">Belum ada lead pada filter ini.</p>}</section>
  </main>;
}
