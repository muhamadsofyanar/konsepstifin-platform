'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InterestLead, LeadStatus } from '@/lib/interest-store';
import type { PublicPromoter } from '@/lib/promoter-store';

const leadStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'closed'];

const statusLabels: Record<LeadStatus, string> = {
  new: 'Baru',
  contacted: 'Sudah dihubungi',
  qualified: 'Terkualifikasi',
  converted: 'Konversi',
  closed: 'Ditutup',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

export default function LeadManager({
  databaseReady,
  initialLeads,
  initialPromoters,
  initialError,
}: {
  databaseReady: boolean;
  initialLeads: InterestLead[];
  initialPromoters: PublicPromoter[];
  initialError: string;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [editingId, setEditingId] = useState<number | null>(initialLeads[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(initialError);

  const editing = leads.find((lead) => lead.id === editingId) ?? null;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const statusMatches = statusFilter === 'all' || lead.status === statusFilter;
      const textMatches = !needle || [lead.name, lead.phone, lead.city, lead.service, lead.assignedTo]
        .some((value) => value.toLowerCase().includes(needle));
      return statusMatches && textMatches;
    });
  }, [leads, query, statusFilter]);

  function update<K extends 'status' | 'assignedTo' | 'adminNotes'>(key: K, value: InterestLead[K]) {
    if (editingId === null) return;
    setLeads((current) => current.map((lead) => lead.id === editingId ? { ...lead, [key]: value } : lead));
    setMessage('');
    setError('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/leads/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editing.status,
          assignedTo: editing.assignedTo,
          adminNotes: editing.adminNotes,
        }),
      });
      const result = await response.json() as { lead?: InterestLead; error?: string };
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.lead) throw new Error(result.error || 'Lead gagal disimpan.');
      setLeads((current) => current.map((lead) => lead.id === result.lead!.id ? result.lead! : lead));
      setMessage('Status, penanggung jawab, dan catatan lead berhasil disimpan.');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Lead gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return <div className="article-admin lead-admin">
    <header className="article-admin-header">
      <Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link>
      <nav><span>Portal Tim</span><b>Lead & Tindak Lanjut</b></nav>
      <div><Link href="/admin/artikel">Artikel</Link><Link href="/admin/produk">Produk</Link><Link href="/admin/pustaka">Pustaka</Link><Link href="/" target="_blank">Lihat website ↗</Link><button onClick={logout}>Keluar</button></div>
    </header>
    <main>
      <section className="article-admin-title">
        <div><span>PUSAT LEAD</span><h1>Kelola permintaan dari formulir publik</h1><p>Prioritaskan lead baru, tetapkan penanggung jawab, lalu simpan riwayat tindak lanjut tanpa mengubah data awal pengunjung.</p></div>
        <div className="article-admin-metrics"><span><small>Total</small><b>{leads.length}</b></span><span><small>Baru</small><b>{leads.filter((lead) => lead.status === 'new').length}</b></span><span><small>Diproses</small><b>{leads.filter((lead) => ['contacted', 'qualified'].includes(lead.status)).length}</b></span><span><small>Konversi</small><b>{leads.filter((lead) => lead.status === 'converted').length}</b></span></div>
      </section>
      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan DATABASE_URL agar formulir publik dan dashboard lead dapat digunakan.</p></section>}
      <section className="lead-filters" aria-label="Filter lead">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, WhatsApp, kota, layanan, atau penanggung jawab" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)}><option value="all">Semua status</option>{leadStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>
      </section>
      <div className="lead-admin-layout">
        <aside className="lead-list">
          {visible.length ? visible.map((lead) => <button type="button" key={lead.id} className={editingId === lead.id ? 'active' : ''} onClick={() => { setEditingId(lead.id); setMessage(''); setError(''); }}>
            <span><b>{lead.name}</b><small>{lead.city} · {formatDate(lead.createdAt)}</small></span>
            <em className={`lead-status ${lead.status}`}>{statusLabels[lead.status]}</em>
            <p>{lead.service}</p>
          </button>) : <div className="lead-empty"><b>Belum ada lead yang cocok</b><p>Ubah filter atau tunggu formulir baru masuk.</p></div>}
        </aside>
        {editing ? <form className="lead-detail" onSubmit={save}>
          <header><div><span>LEAD #{editing.id}</span><h2>{editing.name}</h2><p>Diterima {formatDate(editing.createdAt)}</p></div><a href={`https://wa.me/${editing.phone.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer">Hubungi WhatsApp ↗</a></header>
          <div className="lead-original-data"><dl><div><dt>Nomor WhatsApp</dt><dd>{editing.phone}</dd></div><div><dt>Kota</dt><dd>{editing.city}</dd></div><div><dt>Layanan</dt><dd>{editing.service}</dd></div><div><dt>Halaman asal</dt><dd><Link href={editing.sourcePath} target="_blank">{editing.sourcePath} ↗</Link></dd></div></dl><div><b>Kebutuhan pengunjung</b><p>{editing.notes || 'Tidak ada catatan tambahan.'}</p></div></div>
          <div className="lead-edit-fields">
            <label>Status<select value={editing.status} onChange={(event) => update('status', event.target.value as LeadStatus)}>{leadStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
            <label>Penanggung jawab<input list="lead-promoters" value={editing.assignedTo} onChange={(event) => update('assignedTo', event.target.value)} placeholder="Koordinasi nasional atau nama promotor" /><datalist id="lead-promoters"><option value="Koordinasi Nasional" />{initialPromoters.filter((promoter) => promoter.active).map((promoter) => <option key={promoter.code} value={`${promoter.name} (${promoter.code})`} />)}</datalist></label>
            <label className="wide">Catatan tindak lanjut<textarea rows={7} value={editing.adminNotes} onChange={(event) => update('adminNotes', event.target.value)} placeholder="Contoh: Sudah dihubungi 29 Agustus 2026, menunggu konfirmasi jadwal." maxLength={2000} /><small>{editing.adminNotes.length}/2000 karakter. Hindari menyimpan kata sandi, sidik jari, atau dokumen identitas.</small></label>
          </div>
          {message && <p className="admin-success">{message}</p>}
          {error && <p className="interest-error" role="alert">{error}</p>}
          <footer><small>Terakhir diperbarui {formatDate(editing.updatedAt)}</small><button type="submit" disabled={saving || !databaseReady}>{saving ? 'Menyimpan…' : 'Simpan tindak lanjut →'}</button></footer>
        </form> : <section className="lead-detail lead-empty"><b>Pilih satu lead</b><p>Data dan kolom tindak lanjut akan tampil di sini.</p></section>}
      </div>
    </main>
  </div>;
}
