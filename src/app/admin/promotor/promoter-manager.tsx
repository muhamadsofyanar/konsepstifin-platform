'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicPromoter } from '@/lib/promoter-store';

export default function PromoterManager({ promoters }: { promoters: PublicPromoter[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(promoters.map((promoter) => [promoter.code, promoter.regionCodes.join(', ')])));
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function save(promoter: PublicPromoter) {
    setSaving(promoter.code); setMessage(''); setError('');
    try {
      const regionCodes = (values[promoter.code] || '').split(/[;,\s]+/).map((item) => item.trim()).filter(Boolean);
      const response = await fetch('/api/admin/promotor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoter.code, regionCodes }),
      });
      if (response.status === 401) { router.replace('/admin/login'); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pemetaan gagal disimpan.');
      const savedCodes = Array.isArray(result.mapping?.regionCodes) ? result.mapping.regionCodes : [];
      setMessage(`${promoter.name} dipetakan ke ${savedCodes.length} wilayah.`);
      setValues((current) => ({ ...current, [promoter.code]: savedCodes.join(', ') }));
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Pemetaan gagal disimpan.');
    } finally { setSaving(''); }
  }

  return <section className="promoter-mapping-list">
    {message && <p className="optimizer-message success">✓ {message}</p>}
    {error && <p className="optimizer-message error">{error}</p>}
    {promoters.map((promoter) => <article key={promoter.code}>
      <div><b>{promoter.name}</b><small>{promoter.code} · Cabang {promoter.branchCode || 'tidak diketahui'} · {promoter.active ? 'Aktif' : 'Tidak aktif'}</small></div>
      <label>Kode wilayah<input value={values[promoter.code] || ''} onChange={(event) => setValues((current) => ({ ...current, [promoter.code]: event.target.value }))} placeholder="Contoh: 12.71, 12.75" /></label>
      <button type="button" onClick={() => void save(promoter)} disabled={saving === promoter.code}>{saving === promoter.code ? 'Menyimpan…' : 'Simpan'}</button>
    </article>)}
  </section>;
}
