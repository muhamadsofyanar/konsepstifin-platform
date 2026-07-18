'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ContentOptimizationPlan } from '@/lib/content-optimizer';

type Metrics = {
  averageScore: number;
  unmapped: number;
  conflicts: number;
};

type Preview = {
  plans: ContentOptimizationPlan[];
  before: Metrics;
  after: Metrics;
};

const roleLabels = { pillar: 'Pilar', cluster: 'Cluster', supporting: 'Pendukung' } as const;

export default function IntelligenceActions({ articleCount, databaseReady }: { articleCount: number; databaseReady: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function requestPreview() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/intelligence/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview' }),
      });
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pratinjau gagal dibuat.');
      setPreview(result);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Pratinjau gagal dibuat.');
    } finally {
      setLoading(false);
    }
  }

  async function applyPreview() {
    if (!preview || !window.confirm(`Terapkan pemetaan aman pada ${preview.plans.length} artikel? Isi artikel, bukti nyata, sumber, dan reviewer tidak akan diubah.`)) return;
    setApplying(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/intelligence/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', articleIds: preview.plans.map((plan) => plan.id) }),
      });
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pemetaan gagal diterapkan.');
      setMessage(`${result.updated} artikel berhasil dipetakan. Dashboard sedang diperbarui.`);
      setPreview(null);
      router.refresh();
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'Pemetaan gagal diterapkan.');
    } finally {
      setApplying(false);
    }
  }

  return <section className="intelligence-optimizer">
    <header><div><span>OPTIMASI OTOMATIS AMAN</span><h2>Petakan keyword, cluster, pilar, dan internal link</h2><p>Pratinjau dahulu sebelum menyimpan. Fitur ini tidak menulis ulang isi, tidak mengarang bukti, tidak menambahkan reviewer, dan tidak membuat sumber palsu.</p></div><button type="button" onClick={requestPreview} disabled={loading || applying || !databaseReady || articleCount === 0}>{loading ? 'Menganalisis…' : 'Analisis otomatis →'}</button></header>
    {error && <p className="optimizer-message error">{error}</p>}
    {message && <p className="optimizer-message success">✓ {message}</p>}
    {preview && <div className="optimizer-preview"><div className="optimizer-summary"><span><small>Artikel</small><b>{preview.plans.length}</b></span><span><small>Skor proyeksi</small><b>{preview.before.averageScore} → {preview.after.averageScore}</b></span><span><small>Belum dipetakan</small><b>{preview.before.unmapped} → {preview.after.unmapped}</b></span><span><small>Potensi benturan</small><b>{preview.before.conflicts} → {preview.after.conflicts}</b></span></div><div className="optimizer-plan-list">{preview.plans.slice(0, 12).map((plan) => <article key={plan.slug}><div><b>{plan.title}</b><small>Keyword: {plan.changes.primaryKeyword}</small></div><span>{plan.changes.topicCluster}</span><em>{roleLabels[plan.changes.contentRole]}</em><small>{plan.changes.relatedSlugs.length} internal link</small></article>)}</div>{preview.plans.length > 12 && <p className="optimizer-more">+ {preview.plans.length - 12} artikel lain ikut dipetakan.</p>}<footer><button type="button" onClick={() => setPreview(null)} disabled={applying}>Batalkan</button><button className="apply" type="button" onClick={applyPreview} disabled={applying}>{applying ? 'Menerapkan…' : `Terapkan ke ${preview.plans.length} artikel →`}</button></footer></div>}
  </section>;
}
