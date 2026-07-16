'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  KnowledgeAccessLevel,
  KnowledgeDocumentType,
  KnowledgeRiskLevel,
  KnowledgeSource,
} from '@/lib/knowledge-store';

type PreviewChunk = { pageNumber: number; chunkIndex: number; content: string; wordCount: number };
type PreviewData = { source: KnowledgeSource; chunks: PreviewChunk[] };

const accessLabels: Record<KnowledgeAccessLevel, string> = {
  reference: 'Rujukan artikel',
  internal: 'Internal',
  restricted: 'Terbatas',
};
const riskLabels: Record<KnowledgeRiskLevel, string> = {
  low: 'Risiko rendah',
  medium: 'Perlu ditinjau',
  high: 'Risiko tinggi',
};
const documentLabels: Record<KnowledgeDocumentType, string> = {
  workbook: 'Workbook',
  book: 'Buku',
  ebook: 'E-book',
  guide: 'Panduan',
  other: 'Lainnya',
};

function fileSize(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function KnowledgeManager({
  databaseReady,
  initialSources,
  initialError,
}: {
  databaseReady: boolean;
  initialSources: KnowledgeSource[];
  initialError: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [sources, setSources] = useState(initialSources);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(initialError);
  const [editing, setEditing] = useState<KnowledgeSource | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => sources.filter((source) =>
    `${source.title} ${source.category} ${source.originalFilename}`.toLowerCase().includes(query.toLowerCase()),
  ), [query, sources]);
  const totalPages = sources.reduce((total, source) => total + source.pageCount, 0);
  const activeCount = sources.filter((source) => source.enabledForAi && source.status === 'ready').length;
  const restrictedCount = sources.filter((source) => source.accessLevel === 'restricted').length;

  async function refresh() {
    const response = await fetch('/api/admin/knowledge', { cache: 'no-store' });
    if (response.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.message ?? 'Pustaka gagal dimuat.');
    setSources(result.sources);
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!files.length) return;
    setUploading(true);
    setMessage('');
    setError('');
    let success = 0;
    const failures: string[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setProgress(`Membaca ${index + 1} dari ${files.length}: ${file.name}`);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/admin/knowledge', { method: 'POST', body: formData });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!response.ok) throw new Error(result.message ?? 'Gagal diproses.');
        success += 1;
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : 'gagal'}`);
      }
    }
    await refresh().catch((refreshError) => setError(refreshError instanceof Error ? refreshError.message : 'Pustaka gagal dimuat ulang.'));
    setUploading(false);
    setProgress('');
    if (inputRef.current) inputRef.current.value = '';
    if (success) setMessage(`${success} PDF berhasil diubah menjadi data Pustaka STIFIn.`);
    if (failures.length) setError(failures.join(' | '));
  }

  async function openSource(source: KnowledgeSource) {
    setEditing(source);
    setPreview(null);
    setPreviewLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/knowledge/${source.id}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Pratinjau gagal dimuat.');
      setPreview(result);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Pratinjau gagal dimuat.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveSource(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    if (editing.accessLevel === 'restricted' && editing.enabledForAi
      && !window.confirm('Sumber terbatas akan dapat dikirim ke penyedia AI saat dipilih. Lanjutkan?')) return;
    setSaving(true);
    setError('');
    const response = await fetch(`/api/admin/knowledge/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.message ?? 'Sumber gagal diperbarui.');
      return;
    }
    setEditing(result.source);
    setPreview((current) => current ? { ...current, source: result.source } : current);
    setMessage('Pengaturan sumber berhasil disimpan.');
    await refresh();
  }

  async function removeSource(source: KnowledgeSource) {
    if (!window.confirm(`Hapus “${source.title}” beserta hasil ekstraksinya?`)) return;
    const response = await fetch(`/api/admin/knowledge/${source.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message ?? 'Sumber gagal dihapus.');
      return;
    }
    setEditing(null);
    setPreview(null);
    setMessage('Sumber dan data hasil ekstraksi telah dihapus.');
    await refresh();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return <div className="article-admin knowledge-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Pustaka STIFIn</b></nav><div><Link href="/admin/produk">Produk & Harga</Link><Link href="/admin/artikel">Kelola artikel</Link><Link href="/edukasi" target="_blank">Lihat edukasi ↗</Link><button onClick={logout}>Keluar</button></div></header>
    <main>
      <section className="article-admin-title"><div><span>PUSAT SUMBER</span><h1>Pustaka STIFIn terverifikasi</h1><p>Simpan PDF secara privat, periksa hasil ekstraksi, lalu izinkan sumber yang boleh dipakai AI.</p></div><div className="article-admin-metrics"><span><small>Sumber</small><b>{sources.length}</b></span><span><small>Halaman</small><b>{totalPages}</b></span><span><small>Aktif untuk AI</small><b>{activeCount}</b></span><span><small>Terbatas</small><b>{restrictedCount}</b></span></div></section>

      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> sebelum mengunggah sumber.</p></section>}
      {message && <div className="admin-editor-message success">✓ {message}</div>}
      {error && <div className="admin-editor-message error">{error}</div>}

      <section className="knowledge-upload-panel">
        <div><span>IMPORT MATERI</span><h2>Unggah PDF, sistem yang merapikan</h2><p>Boleh memilih banyak PDF sekaligus. Kategori dan tingkat risiko awal dibaca dari nama file, kemudian dapat Anda koreksi.</p></div>
        <label className={uploading || !databaseReady ? 'disabled' : ''}><input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple disabled={uploading || !databaseReady} onChange={uploadFiles} /><b>{uploading ? 'Sedang memproses…' : '＋ Pilih PDF'}</b><small>Maksimal 25 MB per file</small></label>
      </section>
      {progress && <div className="knowledge-progress"><i /><span>{progress}</span><small>Jangan tutup halaman sampai selesai.</small></div>}

      <div className="knowledge-layout">
        <section className="knowledge-list-panel"><header><div><h2>Daftar sumber</h2><small>{filtered.length} dari {sources.length} sumber</small></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau kategori…" /></header>
          <div className="knowledge-source-list">{filtered.length ? filtered.map((source) => <article key={source.id} className={editing?.id === source.id ? 'active' : ''} onClick={() => void openSource(source)}><div className="knowledge-file-icon">PDF</div><div className="knowledge-source-main"><b>{source.title}</b><small>{source.category} · {source.pageCount} halaman · {fileSize(source.fileSize)}</small><div><em className={`access ${source.accessLevel}`}>{accessLabels[source.accessLevel]}</em><em className={`risk ${source.riskLevel}`}>{riskLabels[source.riskLevel]}</em>{source.enabledForAi && <em className="ai-enabled">AI aktif</em>}</div></div><button type="button">Atur →</button></article>) : <div className="knowledge-empty"><b>Belum ada sumber</b><p>Unggah workbook, buku, atau e-book PDF untuk mulai membangun pustaka.</p></div>}</div>
        </section>

        <section className="knowledge-detail-panel">{editing ? <>
          <header><div><span>DETAIL SUMBER</span><h2>{editing.title}</h2><p>{editing.originalFilename}</p></div><button onClick={() => { setEditing(null); setPreview(null); }}>×</button></header>
          <form onSubmit={saveSource}><div className="knowledge-form-grid"><label className="wide">Judul sumber<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} required /></label><label>Kategori<input value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} required /></label><label>Jenis dokumen<select value={editing.documentType} onChange={(event) => setEditing({ ...editing, documentType: event.target.value as KnowledgeDocumentType })}>{Object.entries(documentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Tahun terbit<input type="number" min="1900" max="2100" value={editing.publicationYear ?? ''} onChange={(event) => setEditing({ ...editing, publicationYear: event.target.value ? Number(event.target.value) : null })} /></label><label>Hak akses<select value={editing.accessLevel} onChange={(event) => setEditing({ ...editing, accessLevel: event.target.value as KnowledgeAccessLevel })}><option value="reference">Rujukan artikel</option><option value="internal">Internal</option><option value="restricted">Terbatas</option></select></label><label>Tingkat risiko<select value={editing.riskLevel} onChange={(event) => setEditing({ ...editing, riskLevel: event.target.value as KnowledgeRiskLevel })}><option value="low">Rendah</option><option value="medium">Perlu ditinjau</option><option value="high">Tinggi</option></select></label><label className="knowledge-ai-toggle wide"><input type="checkbox" checked={editing.enabledForAi} onChange={(event) => setEditing({ ...editing, enabledForAi: event.target.checked })} /><span><b>Izinkan dipakai generator AI</b><small>{editing.accessLevel === 'restricted' ? 'Materi terbatas hanya boleh diaktifkan setelah izin dan ruang lingkupnya jelas.' : 'AI hanya menerima potongan halaman yang relevan, bukan seluruh PDF.'}</small></span></label><label className="wide">Catatan editorial<textarea rows={3} value={editing.notes} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} placeholder="Batas penggunaan, edisi, pemilik hak, atau catatan validasi…" /></label></div><footer><a href={`/api/admin/knowledge/${editing.id}/file`} target="_blank" rel="noreferrer">Buka PDF asli ↗</a><button type="button" className="delete" onClick={() => void removeSource(editing)}>Hapus</button><button type="submit" className="save" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan pengaturan'}</button></footer></form>
          <section className="knowledge-preview"><header><div><b>Pratinjau data hasil ekstraksi</b><small>{editing.chunkCount} potongan dari {editing.pageCount} halaman</small></div></header>{previewLoading ? <p>Memuat teks…</p> : preview?.chunks.length ? <div>{preview.chunks.map((chunk) => <article key={`${chunk.pageNumber}-${chunk.chunkIndex}`}><span>Halaman {chunk.pageNumber}</span><p>{chunk.content}</p></article>)}</div> : <p>Belum ada teks yang dapat ditampilkan.</p>}</section>
        </> : <div className="knowledge-detail-empty"><span>01</span><h2>Pilih sumber untuk diperiksa</h2><p>Anda dapat mengubah kategori, akses, risiko, status AI, dan melihat teks yang berhasil diambil dari PDF.</p><Link href="/admin/artikel">Buka generator artikel →</Link></div>}</section>
      </div>
    </main>
  </div>;
}
