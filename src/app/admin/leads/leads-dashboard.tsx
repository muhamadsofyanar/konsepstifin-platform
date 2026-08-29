'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { VALID_LEAD_STATUSES, VALID_STATUS_TRANSITIONS, type LeadCounts, type LeadStatus, type StoredLead } from '@/lib/interest-store';

const STATUS_LABEL: Record<LeadStatus, string> = {
  baru: 'Baru',
  mencari_promotor: 'Mencari Promotor',
  ditawarkan: 'Ditawarkan',
  diklaim: 'Diklaim',
  dijadwalkan: 'Dijadwalkan',
  selesai: 'Selesai',
  ditutup: 'Ditutup',
};

const STATUS_TONE: Record<LeadStatus, string> = {
  baru: '--forest',
  mencari_promotor: '--sand',
  ditawarkan: '--mint',
  diklaim: '--leaf',
  dijadwalkan: '--charcoal',
  selesai: '--forest',
  ditutup: 'grey',
};

type Candidate = { code: string; name: string; branchCode?: string; wilayahTeks?: string; active?: boolean };
type HistoryEntry = { id: number; oldStatus: string; newStatus: string; note?: string; actor: string; createdAt: string };
type Claim = { id: number; promoterCode: string; claimStatus: 'diajukan' | 'disetujui' | 'ditolak'; claimedAt: string; adminDecision?: string; decidedBy?: string };
type ClaimLink = { id: number; tokenHash: string; expiresAt: string; active: boolean; createdAt: string; createdBy: string };
type Templates = { groupPromoter: string; assignedPromoter: string; consumer: string };

type LeadDetail = {
  lead: StoredLead;
  history: HistoryEntry[];
  claims: Claim[];
  claimLinks: ClaimLink[];
  candidates: Candidate[];
  templates: Templates;
};

const emptyCounts = Object.fromEntries(VALID_LEAD_STATUSES.map((s) => [s, 0])) as LeadCounts;

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function formatDate(value?: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return value; }
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('62')) return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
  return value;
}

function copyToClipboard(text: string, label?: string) {
  navigator.clipboard.writeText(text).then(() => {
    if (label) {
      window.alert(`Template ${label} disalin ke papan klip.`);
    }
  }).catch(() => {
    window.prompt('Salin teks berikut:', text);
  });
}

export default function LeadsDashboard() {
  const [counts, setCounts] = useState<LeadCounts>(emptyCounts);
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
  const [textFilter, setTextFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadList() {
    setLoading(true); setError('');
    try {
      const [countsRes, listRes] = await Promise.all([
        fetch('/api/admin/leads?view=counts').then((r) => r.json() as Promise<{ counts: LeadCounts }>),
        fetch(`/api/admin/leads?limit=300${statusFilter.length ? `&status=${statusFilter.join(',')}` : ''}`).then((r) => r.json() as Promise<{ leads: StoredLead[] }>),
      ]);
      setCounts(countsRes.counts || emptyCounts);
      setLeads(listRes.leads || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: number) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`);
      const json = await res.json() as LeadDetail;
      setDetail(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => { void loadList(); }, []);
  useEffect(() => { void loadList(); }, [statusFilter.length && statusFilter.join(',')]);

  const filteredLeads = useMemo(() => {
    if (!textFilter.trim()) return leads;
    const q = textFilter.toLowerCase();
    return leads.filter((l) => [l.name, l.phone, l.city, l.service, l.regencyName || '', l.provinceName || '', l.notes, `KSF-${String(l.id).padStart(5, '0')}`].join(' ').toLowerCase().includes(q));
  }, [leads, textFilter]);

  async function postAction<T = unknown>(body: Record<string, unknown>): Promise<T | null> {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, actor: 'admin' }),
      });
      const json = await res.json() as T & { message?: string };
      if (!res.ok) throw new Error(json.message || 'Permintaan gagal.');
      return json as T;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal.');
      return null;
    }
  }

  async function updateStatus(status: LeadStatus, note?: string) {
    if (!selectedId) return;
    const ok = await postAction<{ lead: StoredLead }>({ action: 'update_status', leadId: selectedId, status, note });
    if (ok) { await loadList(); await loadDetail(selectedId); }
  }

  async function assignPromoter(code: string) {
    if (!selectedId) return;
    const ok = await postAction<{ lead: StoredLead }>({ action: 'assign_promoter', leadId: selectedId, promoterCode: code });
    if (ok) { await loadList(); await loadDetail(selectedId); }
  }

  async function setSchedule(value: string) {
    if (!selectedId || !value) return;
    const ok = await postAction<{ lead: StoredLead }>({ action: 'set_schedule', leadId: selectedId, scheduleAt: value });
    if (ok) { await loadList(); await loadDetail(selectedId); }
  }

  async function saveNotes(notes: string) {
    if (!selectedId) return;
    const ok = await postAction<{ lead: StoredLead }>({ action: 'update_notes', leadId: selectedId, internalNotes: notes });
    if (ok) { await loadDetail(selectedId); }
  }

  async function createClaimLink() {
    if (!selectedId) return;
    const res = await postAction<{ link: { id: number; token: string } }>({ action: 'create_claim_link', leadId: selectedId, expiresInHours: 48 });
    if (res?.link) {
      const url = `${window.location.origin}/klaim/${res.link.token}`;
      window.prompt('Tautan klaim (berlaku 48 jam):', url);
      await loadDetail(selectedId);
    }
  }

  async function deactivateLink(id: number) {
    if (!confirm('Nonaktifkan tautan klaim ini?')) return;
    await postAction({ action: 'deactivate_claim_link', linkId: id });
    if (selectedId) await loadDetail(selectedId);
  }

  async function decideClaim(claimId: number, decision: 'disetujui' | 'ditolak') {
    const note = decision === 'ditolak' ? window.prompt('Alasan penolakan (opsional):') || '' : '';
    await postAction({ action: 'decide_claim', claimId, decision, note });
    if (selectedId) { await loadList(); await loadDetail(selectedId); }
  }

  const lead = detail?.lead;
  const validNext = lead ? VALID_STATUS_TRANSITIONS[lead.status] || [] : [];

  return (
    <div className="leads-admin">
      <header className="article-admin-header">
        <Link href="/"><img src="/stifin-konsep-wordmark.png" alt="Konsep STIFIn" style={{ height: 42 }} /></Link>
        <nav><span>Portal Tim</span><b>Pusat Layanan Nasional · Lead</b></nav>
        <div>
          <Link href="/admin/artikel">Artikel &amp; AI</Link>
          <Link href="/admin/produk">Produk</Link>
          <Link href="/admin/pustaka">Pustaka</Link>
          <Link href="/admin/intelligence">Intelligence</Link>
          <Link className="active" href="/admin/leads">Lead</Link>
        </div>
      </header>

      <main className="leads-layout">
        <section className="leads-stats">
          {Object.entries(STATUS_LABEL).map(([status, label]) => {
            const key = status as LeadStatus;
            return (
              <article
                key={key}
                className={classNames('stat-card', statusFilter.includes(key) && 'active')}
                onClick={() => setStatusFilter((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key])}
                style={{ cursor: 'pointer' }}
              >
                <small>{label}</small>
                <b>{counts[key] || 0}</b>
              </article>
            );
          })}
        </section>

        <section className="leads-toolbar">
          <input
            type="search"
            placeholder="Cari nama, WA, kota, layanan, atau KSF-XXXXX"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
          />
          {statusFilter.length > 0 && (
            <button type="button" className="ghost-btn" onClick={() => setStatusFilter([])}>
              Hapus filter status ({statusFilter.length})
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={() => { void loadList(); }} title="Muat ulang">
            ↻ Segarkan
          </button>
          {selectedId && (
            <button type="button" className="ghost-btn" onClick={() => { setSelectedId(null); setDetail(null); }}>
              Tutup detail
            </button>
          )}
          {error && <span style={{ color: 'crimson' }}>{error}</span>}
        </section>

        <section className="leads-grid">
          <div className="leads-list">
          {loading ? <p>Memuat data…</p> : filteredLeads.length === 0 ? (
            <p className="leads-empty">Tidak ada lead sesuai filter. {leads.length ? 'Coba hapus filter atau perbarui.' : 'Belum ada lead yang masuk. Mulai dari formulir publik /tes-stifin atau /wilayah.'}</p>
          ) : (
            <table className="leads-table">
              <thead><tr>
                <th>Ref</th><th>Status</th><th>Nama</th><th>Wilayah</th><th>Layanan</th>
                <th>Promotor</th><th>Masuk</th>
              </tr></thead>
              <tbody>
                {filteredLeads.map((l) => (
                  <tr
                    key={l.id}
                    className={selectedId === l.id ? 'selected' : ''}
                    onClick={() => { setSelectedId(l.id); void loadDetail(l.id); }}
                  >
                    <td><b>KSF-{String(l.id).padStart(5, '0')}</b></td>
                    <td><span className={`lead-badge ${STATUS_TONE[l.status]}`}>{STATUS_LABEL[l.status]}</span></td>
                    <td><div>{l.name}<small>{formatPhone(l.phone)}</small></div></td>
                    <td>{[l.regencyName, l.provinceName].filter(Boolean).join(', ') || l.city}</td>
                    <td>{l.service}</td>
                    <td>{l.assignedPromoterCode || '—'}</td>
                    <td><small>{formatDate(l.createdAt)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>

          <aside className="leads-detail">
            {!selectedId ? (
              <div className="leads-detail-empty">
                <h3>Detail lead</h3>
                <p>Pilih salah satu lead pada tabel untuk melihat data lengkap, mencocokkan kandidat promotor, mengubah status, dan menyalin template WhatsApp.</p>
                <small style={{ display: 'block', marginTop: 12, opacity: 0.7 }}>
                  Total lead terdaftar: {leads.length}
                </small>
              </div>
            ) : loadingDetail && !detail ? (<p>Memuat detail…</p>) : lead ? (
              <>
                <div className="leads-detail-head">
                  <div>
                  <small>REF · {`KSF-${String(lead.id).padStart(5, '0')}`}</small>
                  <h3>{lead.name} · <span className={`lead-badge ${STATUS_TONE[lead.status]}`}>{STATUS_LABEL[lead.status]}</span></h3>
                  <p><b>WA:</b> <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{formatPhone(lead.phone)}</a> · <b>Layanan:</b> {lead.service}</p>
                  <p><b>Wilayah:</b> {[lead.regencyName, lead.provinceName].filter(Boolean).join(', ') || lead.city || '-'}</p>
                  <p><b>Catatan calon:</b> {lead.notes || '-'}</p>
                  <p><b>Sumber:</b> {lead.sourcePath} · <b>Masuk:</b> {formatDate(lead.createdAt)}</p>
                  <p><b>Tenggat respons:</b> {formatDate(lead.responseDeadlineAt)}{lead.assignedPromoterCode ? <> · <b>Promotor ditugaskan:</b> {lead.assignedPromoterCode}</> : ''}</p>
                  </div>
                </div>

                {validNext.length > 0 && (
                  <fieldset className="leads-fieldset"><legend>Ubah status</legend><div className="row-chips">
                    {validNext.map((s) => (
                      <button key={s} type="button" className={`chip ${STATUS_TONE[s]}`} onClick={() => updateStatus(s)}>
                        {STATUS_LABEL[s]} →
                      </button>
                    ))}
                  </div></fieldset>
                )}

                <fieldset className="leads-fieldset"><legend>Kandidat promotor & penugasan</legend>
                  {detail.candidates?.length ? (
                    <ul className="candidate-list">
                      {detail.candidates.map((c) => (
                        <li key={c.code}>
                          <div>
                            <b>{c.name}</b> <small>{c.code}{c.branchCode ? ` · ${c.branchCode}` : ''}</small>
                            {c.wilayahTeks && <small style={{ display: 'block', opacity: 0.8 }}>Wilayah layanan: {c.wilayahTeks}</small>}
                          </div>
                          <button type="button" className="ghost-btn small" onClick={() => assignPromoter(c.code)} disabled={lead.assignedPromoterCode === c.code}>
                            {lead.assignedPromoterCode === c.code ? 'Ditugaskan' : 'Tugaskan'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : <p>Belum ada kandidat otomatis. Gunakan kolom di bawah untuk menetapkan promotor dengan kode.</p>}
                  <label className="inline-assign">
                    Atau masukkan kode ID:
                    <input
                      type="text"
                      placeholder="Contoh: ABC123"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const el = e.currentTarget;
                          if (el.value.trim()) { assignPromoter(el.value.trim().toUpperCase()); el.value = ''; }
                        }
                      }}
                    />
                    <small style={{ opacity: 0.7 }}>Tekan Enter untuk menetapkan.</small>
                  </label>
                </fieldset>

                <fieldset className="leads-fieldset"><legend>Jadwal</legend>
                  <label className="inline-assign">
                    Tanggal & jam:
                    <input
                      type="datetime-local"
                      defaultValue={lead.scheduleAt ? new Date(lead.scheduleAt).toISOString().slice(0, 16) : ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = (e.currentTarget as HTMLInputElement).value;
                          if (v) setSchedule(v);
                        }
                      }}
                    />
                    {lead.scheduleAt && <small>Saat ini: {formatDate(lead.scheduleAt)}</small>}
                  </label>
                </fieldset>

                <fieldset className="leads-fieldset"><legend>Catatan internal</legend>
                  <textarea
                    rows={3}
                    defaultValue={lead.internalNotes || ''}
                    onBlur={(e) => saveNotes(e.currentTarget.value)}
                    placeholder="Hanya untuk tim internal."
                  />
                </fieldset>

                <fieldset className="leads-fieldset"><legend>Tautan klaim promotor</legend>
                  <button type="button" className="ghost-btn" onClick={() => createClaimLink()}>
                    + Buat tautan klaim (48 jam)
                  </button>
                  {detail.claimLinks?.length ? (
                    <ul className="claim-links-list">
                      {detail.claimLinks.map((cl) => (
                        <li key={cl.id}>
                          <span className={cl.active ? 'badge-on' : 'badge-off'}>{cl.active ? 'AKTIF' : 'NONAKTIF'} · Kadaluarsa: {formatDate(cl.expiresAt)}</span>
                          <small>Dibuat: {formatDate(cl.createdAt)} oleh {cl.createdBy}</small>
                          {cl.active && (
                            <button type="button" className="ghost-btn small" onClick={() => deactivateLink(cl.id)}>Nonaktifkan</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ opacity: 0.7 }}>Belum ada tautan klaim dibuat.</p>}

                  {detail.claims?.length ? (
                    <>
                      <h4 style={{ margin: '14px 0 6px' }}>Pengajuan klaim</h4>
                      <ul className="claims-list">
                        {detail.claims.map((cl) => (
                          <li key={cl.id}>
                            <div>
                              <b>{cl.promoterCode}</b> · {cl.claimStatus} · {formatDate(cl.claimedAt)}
                              {cl.adminDecision && <small style={{ display: 'block' }}>Keputusan: {cl.adminDecision} {cl.decidedBy ? `(${cl.decidedBy})` : ''}</small>}
                            </div>
                            {cl.claimStatus === 'diajukan' && (
                              <span className="claim-actions">
                                <button type="button" className="public-cta small" onClick={() => decideClaim(cl.id, 'disetujui')}>Setujui</button>
                                <button type="button" className="ghost-btn small" onClick={() => decideClaim(cl.id, 'ditolak')}>Tolak</button>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </fieldset>

                <fieldset className="leads-fieldset"><legend>Template WhatsApp</legend>
                  <div className="template-list">
                    <article>
                      <header><b>1. Grup promotor (tanpa PII)</b><button type="button" className="ghost-btn small" onClick={() => copyToClipboard(detail.templates.groupPromoter, 'grup promotor')}>Salin</button></header>
                      <pre>{detail.templates.groupPromoter}</pre>
                    </article>
                    <article>
                      <header><b>2. Promotor ditugaskan</b><button type="button" className="ghost-btn small" onClick={() => copyToClipboard(detail.templates.assignedPromoter, 'promotor')}>Salin</button></header>
                      <pre>{detail.templates.assignedPromoter}</pre>
                    </article>
                    <article>
                      <header><b>3. Calon konsumen</b><button type="button" className="ghost-btn small" onClick={() => copyToClipboard(detail.templates.consumer, 'calon konsumen')}>Salin</button></header>
                      <pre>{detail.templates.consumer}</pre>
                    </article>
                  </div>
                </fieldset>

                <fieldset className="leads-fieldset"><legend>Riwayat</legend>
                  <ul className="history-list">
                    {(detail.history || []).map((h) => (
                      <li key={h.id}>
                        <small>{formatDate(h.createdAt)} · {h.actor}</small>
                        <div>{h.oldStatus && <><span className={`lead-badge ${STATUS_TONE[(h.oldStatus as LeadStatus)] || 'grey'}`}>{h.oldStatus}</span> → </>}<span className={`lead-badge ${STATUS_TONE[(h.newStatus as LeadStatus)] || 'grey'}`}>{h.newStatus}</span></div>
                        {h.note && <p>{h.note}</p>}
                      </li>
                    ))}
                  </ul>
                </fieldset>
              </>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  );
}
