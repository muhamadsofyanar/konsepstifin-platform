'use client';

import { useState } from 'react';
import type { StoredArticle } from '@/lib/article-store';
import {
  buildArticleRevisionPreview,
  type ArticleRevisionPreview,
  type GeneratedArticleRevision,
} from '@/lib/article-assistant';

type GenerationResponse = {
  article?: GeneratedArticleRevision;
  editorialNotes?: string;
  message?: string;
};

export default function ArticleAssistantPanel({
  article,
  allArticles,
  enabled,
  onApplied,
}: {
  article: StoredArticle;
  allArticles: StoredArticle[];
  enabled: boolean;
  onApplied: (article: StoredArticle) => void;
}) {
  const [preview, setPreview] = useState<ArticleRevisionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function prepareRevision() {
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const response = await fetch('/api/admin/ai/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: article.title,
          audience: 'Pembaca Konsep STIFIn yang membutuhkan jawaban praktis dan bertanggung jawab',
          objective: 'Memperjelas judul, struktur, manfaat, dan langkah praktis tanpa menambah klaim yang tidak tersedia',
          category: article.category,
          keywords: article.secondaryKeywords.join(', '),
          sourceNotes: `ARTIKEL LAMA SEBAGAI DASAR. Jangan menambah klaim, angka, pengalaman, atau sumber yang tidak tersedia:\n\n${article.body.slice(0, 5400)}`,
          primaryKeyword: article.primaryKeyword || article.title,
          searchIntent: article.searchIntent,
          topicCluster: article.topicCluster || article.category,
          contentRole: article.contentRole,
          experienceEvidence: article.experienceEvidence,
          length: article.body.split(/\s+/).length >= 900 ? 'mendalam' : 'sedang',
          tone: 'profesional',
          contentType: article.contentType,
          productName: article.productName,
          productUrl: article.productUrl,
          ctaLabel: article.ctaLabel,
          variationNumber: 1,
          variationTotal: 1,
          avoidTitles: allArticles.filter((item) => item.slug !== article.slug).map((item) => item.title).slice(0, 20),
          useKnowledge: article.sourceReferences.length > 0,
          knowledgeSourceIds: [...new Set(article.sourceReferences.map((source) => source.sourceId))],
        }),
      });
      const result = await response.json() as GenerationResponse;
      if (!response.ok || !result.article) throw new Error(result.message || 'Revisi AI belum dapat dibuat.');
      setPreview(buildArticleRevisionPreview(article, {
        ...result.article,
        editorialNotes: result.editorialNotes || result.article.editorialNotes,
      }, allArticles));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Revisi AI belum dapat dibuat.');
    } finally {
      setLoading(false);
    }
  }

  async function applyRevision() {
    if (!preview || typeof article.id !== 'number') return;
    if (!window.confirm('Simpan revisi ini ke tahap Review? Artikel tidak akan terbit otomatis.')) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview.after),
      });
      const result = await response.json() as { article?: StoredArticle; message?: string };
      if (!response.ok || !result.article) throw new Error(result.message || 'Revisi belum dapat disimpan.');
      onApplied(result.article);
      setPreview(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Revisi belum dapat disimpan.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="article-assistant-panel">
    <header>
      <div><span>ASISTEN REVISI SATU KLIK</span><b>Siapkan revisi lengkap, lalu periksa sebelum menyimpan</b><small>AI tidak menerbitkan artikel, tidak membuat reviewer, dan tidak mengarang bukti.</small></div>
      <button type="button" onClick={prepareRevision} disabled={!enabled || loading || saving}>{loading ? 'Menyiapkan revisi…' : 'Siapkan revisi AI'}</button>
    </header>
    {!enabled ? <p className="optimizer-message error">Aktifkan database dan penyedia AI untuk memakai asisten revisi.</p> : null}
    {error ? <p className="optimizer-message error" role="alert">{error}</p> : null}
    {preview ? <div className="article-assistant-preview">
      <header><div><span>SEBELUM → SESUDAH</span><h3>Pratinjau revisi</h3></div><small>{preview.summary.beforeWords} → {preview.summary.afterWords} kata · {preview.summary.internalLinks} internal link</small></header>
      <div className="article-assistant-comparison">
        <article><small>JUDUL LAMA</small><b>{preview.before.title}</b><p>{preview.before.excerpt}</p></article>
        <article><small>JUDUL REVISI</small><b>{preview.after.title}</b><p>{preview.after.excerpt}</p></article>
      </div>
      <div className="article-assistant-notes"><b>Yang berubah</b><p>{preview.summary.changedFields.join(', ') || 'Tidak ada perubahan terdeteksi.'}</p><b>Catatan pemeriksaan</b><p>{preview.editorialNotes}</p></div>
      {preview.conflicts.length ? <aside><b>Potensi benturan artikel</b>{preview.conflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}</aside> : null}
      <footer><button type="button" onClick={() => setPreview(null)} disabled={saving}>Batalkan revisi</button><button className="apply" type="button" onClick={applyRevision} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan ke Review'}</button></footer>
    </div> : null}
  </section>;
}
