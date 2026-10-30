'use client';

import { useState } from 'react';
import type { PublicPromoter } from '@/lib/promoter-store';

export default function PromoterRegionManager({ databaseReady, initialError, initialPromoters }: { databaseReady: boolean; initialError: string; initialPromoters: PublicPromoter[] }) {
  const [promoters, setPromoters] = useState(initialPromoters);
  const [drafts, setDrafts] = useState<Record<string, string>>(Object.fromEntries(initialPromoters.map((promoter) => [promoter.code, promoter.regionCodes.join(', ')])));
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState(initialError);

  async function save(promoter: PublicPromoter) {
    setSaving(promoter.code); setMessage('');
    const regionCodes = (drafts[promoter.code] || '').split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
    const response = await fetch('/api/admin/promotor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoter.code, regionCodes }) });
    const result = await response.json() as { message?: string; mapping?: { code: string; regionCodes: string[] } };
    if (!response.ok || !result.mapping) setMessage(result.message || 'Pemetaan belum tersimpan.');
    else {
      setPromoters((items) => items.map((item) => item.code === promoter.code ? { ...item, regionCodes: result.mapping!.regionCodes } : item));
      setDrafts((items) => ({ ...items, [promoter.code]: result.mapping!.regionCodes.join(', ') }));
      setMessage(`Pemetaan ${promoter.name} tersimpan.`);
    }
    setSaving('');
  }

  return <section className="promoter-mapping-panel">
    <header><div><span>FORMAT KODE WILAYAH</span><h2>Provinsi, kabupaten, kecamatan, atau desa</h2><p>Contoh: <code>31</code>, <code>31.74</code>, <code>31.74.09</code>, atau <code>31.74.09.1001</code>. Pisahkan beberapa kode dengan koma.</p></div><a href="/wilayah" target="_blank" rel="noreferrer">Lihat halaman wilayah ↗</a></header>
    {message && <p className={message.includes('tersimpan') ? 'admin-success' : 'interest-error'}>{message}</p>}
    <div className="promoter-mapping-list">{promoters.map((promoter) => <article key={promoter.code}>
      <div><span>{promoter.active ? 'AKTIF' : 'NONAKTIF'}</span><h3>{promoter.name}</h3><small>{promoter.code} · {promoter.branchCode || 'cabang belum tersedia'}</small></div>
      <label>Kode wilayah layanan<input value={drafts[promoter.code] || ''} onChange={(event) => setDrafts((items) => ({ ...items, [promoter.code]: event.target.value }))} placeholder="31.74, 32.75" /></label>
      <button type="button" disabled={!databaseReady || saving === promoter.code} onClick={() => save(promoter)}>{saving === promoter.code ? 'Menyimpan…' : 'Simpan wilayah'}</button>
    </article>)}</div>
    {!promoters.length && !initialError && <p className="lead-empty">Belum ada promotor dari API pusat atau konfigurasi manual.</p>}
  </section>;
}
