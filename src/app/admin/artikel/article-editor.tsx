'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleInput, StoredArticle } from '@/lib/article-store';
import type { CommentStatus } from '@/lib/engagement-store';

type AdminComment = {
  id: number;
  name: string;
  email: string;
  body: string;
  status: CommentStatus;
  articleTitle: string;
  articleSlug: string;
  createdAt: string;
};

type EngagementData = {
  metrics: { views: number; likes: number; shares: number; approvedComments: number; pendingComments: number };
  comments: AdminComment[];
  topArticles: Array<{ id: number; title: string; slug: string; views: number; likes: number; shares: number; comments: number }>;
};

const emptyEngagement: EngagementData = {
  metrics: { views: 0, likes: 0, shares: 0, approvedComments: 0, pendingComments: 0 },
  comments: [],
  topArticles: [],
};

const emptyArticle = (): ArticleInput => ({
  slug: '',
  category: 'Pengembangan Diri',
  title: '',
  excerpt: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: '5 menit baca',
  tone: 'forest',
  featured: false,
  body: '## Judul bagian pertama\n\nTulis paragraf pembuka artikel di sini. Jelaskan gagasan dengan bahasa yang ringan dan bertanggung jawab.\n\n## Langkah yang dapat dilakukan\n\nTulis penjelasan praktis di sini.\n\n- Poin pertama.\n- Poin kedua.\n- Poin ketiga.',
  takeaway: 'Tuliskan satu kesimpulan utama yang ingin diingat oleh pembaca.',
  status: 'draft',
});

const emptyAiForm = {
  topic: '',
  audience: 'Pembaca umum dan keluarga',
  objective: 'Memberi pemahaman praktis yang dapat diterapkan secara bertanggung jawab',
  category: 'Pengembangan Diri',
  keywords: '',
  sourceNotes: '',
  length: 'sedang',
  tone: 'hangat',
};

const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function ArticleEditor({ databaseReady, aiReady, initialArticles, initialError }: { databaseReady: boolean; aiReady: boolean; initialArticles: StoredArticle[]; initialError: string }) {
  const router = useRouter();
  const [articles, setArticles] = useState<StoredArticle[]>(initialArticles);
  const [form, setForm] = useState<ArticleInput>(emptyArticle);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(initialError);
  const [panel, setPanel] = useState<'articles' | 'engagement'>('articles');
  const [showAi, setShowAi] = useState(false);
  const [aiForm, setAiForm] = useState(emptyAiForm);
  const [generating, setGenerating] = useState(false);
  const [editorialNotes, setEditorialNotes] = useState('');
  const [engagement, setEngagement] = useState<EngagementData>(emptyEngagement);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [commentFilter, setCommentFilter] = useState<CommentStatus | 'all'>('pending');

  const loadArticles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/articles', { cache: 'no-store' });
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Artikel gagal dimuat.');
      setArticles(result.articles);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Artikel gagal dimuat.');
    }
  }, [router]);

  const loadEngagement = useCallback(async () => {
    if (!databaseReady) return;
    setEngagementLoading(true);
    try {
      const response = await fetch('/api/admin/engagement', { cache: 'no-store' });
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Interaksi gagal dimuat.');
      setEngagement(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Interaksi gagal dimuat.');
    } finally {
      setEngagementLoading(false);
    }
  }, [databaseReady, router]);

  const filtered = useMemo(() => articles.filter((article) => `${article.title} ${article.category}`.toLowerCase().includes(query.toLowerCase())), [articles, query]);
  const publishedCount = articles.filter((article) => article.status === 'published').length;
  const filteredComments = engagement.comments.filter((comment) => commentFilter === 'all' || comment.status === commentFilter);

  function update<K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyArticle());
    setEditorialNotes('');
    setMessage('Form artikel baru siap diisi.');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function edit(article: StoredArticle) {
    if (typeof article.id !== 'number') return;
    setEditingId(article.id);
    setForm({
      slug: article.slug,
      category: article.category,
      title: article.title,
      excerpt: article.excerpt,
      publishedAt: article.publishedAt,
      readTime: article.readTime,
      tone: article.tone,
      featured: article.featured,
      body: article.body,
      takeaway: article.takeaway,
      status: article.status,
    });
    setEditorialNotes('');
    setMessage(`Mengedit: ${article.title}`);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function generateWithAi(event: FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setMessage('');
    setError('');
    setEditorialNotes('');
    try {
      const response = await fetch('/api/admin/ai/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok) throw new Error(result.message ?? 'Artikel AI gagal dibuat.');
      setEditingId(null);
      setForm({ ...result.article, status: 'draft' });
      setEditorialNotes(result.editorialNotes || 'Periksa seluruh isi sebelum diterbitkan.');
      setMessage('Draf AI selesai. Tinjau, perbaiki, lalu simpan sebagai draf.');
      setShowAi(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (aiError) {
      setError(aiError instanceof Error ? aiError.message : 'Artikel AI gagal dibuat.');
    } finally {
      setGenerating(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(editingId ? `/api/admin/articles/${editingId}` : '/api/admin/articles', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok) throw new Error(result.message ?? 'Artikel gagal disimpan.');
      setEditingId(typeof result.article.id === 'number' ? result.article.id : null);
      setMessage(form.status === 'published' ? 'Artikel berhasil diterbitkan.' : 'Draf berhasil disimpan.');
      await loadArticles();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Artikel gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(article: StoredArticle) {
    if (typeof article.id !== 'number' || !window.confirm(`Hapus artikel “${article.title}”? Tindakan ini juga menghapus interaksi artikelnya.`)) return;
    setError('');
    const response = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message ?? 'Artikel gagal dihapus.');
      return;
    }
    if (editingId === article.id) startNew();
    setMessage('Artikel berhasil dihapus.');
    await loadArticles();
  }

  async function moderateComment(id: number, status: CommentStatus) {
    const response = await fetch(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message ?? 'Komentar gagal diperbarui.');
      return;
    }
    setMessage(status === 'approved' ? 'Komentar diterbitkan.' : 'Status komentar diperbarui.');
    await loadEngagement();
  }

  async function removeComment(id: number) {
    if (!window.confirm('Hapus komentar ini secara permanen?')) return;
    const response = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message ?? 'Komentar gagal dihapus.');
      return;
    }
    setMessage('Komentar dihapus.');
    await loadEngagement();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  function openEngagement() {
    setPanel('engagement');
    void loadEngagement();
  }

  return <div className="article-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Artikel & Edukasi</b></nav><div><Link href="/edukasi" target="_blank">Lihat edukasi ↗</Link><button onClick={logout}>Keluar</button></div></header>
    <main>
      <section className="article-admin-title"><div><span>DASHBOARD KONTEN</span><h1>{panel === 'articles' ? 'Kelola artikel edukasi' : 'Interaksi pembaca'}</h1><p>{panel === 'articles' ? 'Buat dengan AI, tinjau isinya, lalu terbitkan ke website.' : 'Pantau performa dan moderasi percakapan pembaca.'}</p></div><div className="article-admin-metrics">{panel === 'articles' ? <><span><small>Total artikel</small><b>{articles.length}</b></span><span><small>Sudah terbit</small><b>{publishedCount}</b></span><span><small>Masih draf</small><b>{articles.length - publishedCount}</b></span></> : <><span><small>Dilihat</small><b>{engagement.metrics.views}</b></span><span><small>Bermanfaat</small><b>{engagement.metrics.likes}</b></span><span><small>Perlu diperiksa</small><b>{engagement.metrics.pendingComments}</b></span></>}</div></section>

      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> pada Environment Variables Coolify agar editor dan interaksi dapat disimpan.</p></section>}
      {message && <div className="admin-editor-message success">✓ {message}</div>}
      {error && <div className="admin-editor-message error">{error}</div>}
      <div className="article-admin-tabs"><button className={panel === 'articles' ? 'active' : ''} onClick={() => setPanel('articles')}>Artikel & AI</button><button className={panel === 'engagement' ? 'active' : ''} onClick={openEngagement}>Interaksi <em>{engagement.metrics.pendingComments || ''}</em></button></div>

      {panel === 'articles' ? <>
        <section className="ai-authoring-banner"><div><span>ASISTEN PENULISAN</span><h2>Buat draf artikel dengan AI</h2><p>Masukkan topik dan arahan. AI mengisi form, tetapi tidak akan menerbitkan artikel secara otomatis.</p></div><button onClick={() => setShowAi((current) => !current)}>{showAi ? 'Tutup' : '✨ Buat dengan AI'}</button></section>
        {showAi && <form className="ai-generator" onSubmit={generateWithAi}><header><div><span>DRAF AI BARU</span><h2>Arahkan isi artikelnya</h2></div><small>Hasil selalu berstatus draf.</small></header>{!aiReady && <div className="admin-setup-warning"><b>AI belum diaktifkan</b><p>Tambahkan <code>OPENAI_API_KEY</code> dan <code>AI_MODEL</code> di Environment Variables Coolify, lalu Redeploy.</p></div>}<div className="ai-generator-grid"><label className="wide">Topik utama<input value={aiForm.topic} onChange={(event) => setAiForm({ ...aiForm, topic: event.target.value })} placeholder="Contoh: Cara mendampingi anak mengenali cara belajarnya" required /></label><label>Pembaca sasaran<input value={aiForm.audience} onChange={(event) => setAiForm({ ...aiForm, audience: event.target.value })} required /></label><label>Kategori<input value={aiForm.category} onChange={(event) => setAiForm({ ...aiForm, category: event.target.value })} required /></label><label className="wide">Tujuan artikel<input value={aiForm.objective} onChange={(event) => setAiForm({ ...aiForm, objective: event.target.value })} required /></label><label>Kata kunci<input value={aiForm.keywords} onChange={(event) => setAiForm({ ...aiForm, keywords: event.target.value })} placeholder="belajar, keluarga, komunikasi" /></label><label>Panjang<select value={aiForm.length} onChange={(event) => setAiForm({ ...aiForm, length: event.target.value })}><option value="ringkas">Ringkas</option><option value="sedang">Sedang</option><option value="mendalam">Mendalam</option></select></label><label>Nada tulisan<select value={aiForm.tone} onChange={(event) => setAiForm({ ...aiForm, tone: event.target.value })}><option value="hangat">Hangat</option><option value="praktis">Praktis</option><option value="profesional">Profesional</option></select></label><label className="wide">Catatan sumber <small>(opsional, sangat dianjurkan)</small><textarea rows={5} value={aiForm.sourceNotes} onChange={(event) => setAiForm({ ...aiForm, sourceNotes: event.target.value })} placeholder="Tempel poin faktual atau sumber internal yang boleh dipakai. AI diperintahkan tidak mengarang sumber." /></label></div><footer><p>Periksa fakta, nada, dan kesesuaian merek sebelum menerbitkan.</p><button type="submit" disabled={generating || !aiReady}>{generating ? 'AI sedang menulis…' : 'Buat draf artikel →'}</button></footer></form>}

        {editorialNotes && <section className="editorial-check"><b>Catatan pemeriksaan dari AI</b><p>{editorialNotes}</p></section>}

        <div className="article-admin-layout">
          <aside className="article-manager"><div className="article-manager-head"><div><b>Daftar artikel</b><small>{articles.length} konten tersimpan</small></div><button onClick={startNew}>＋ Baru</button></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau kategori…" />
            <div className="article-manager-list">{filtered.length ? filtered.map((article) => <article className={editingId === article.id ? 'active' : ''} key={article.id} onClick={() => edit(article)}><div><span className={`admin-tone ${article.tone}`}/><div><b>{article.title}</b><small>{article.category} · {article.publishedLabel}</small></div></div><footer><em className={article.status}>{article.status === 'published' ? 'Terbit' : 'Draf'}</em><button onClick={(event) => { event.stopPropagation(); void remove(article); }} aria-label={`Hapus ${article.title}`}>×</button></footer></article>) : <p className="manager-empty">Belum ada artikel yang cocok.</p>}</div>
          </aside>

          <form className="article-editor-form" onSubmit={submit}><div className="article-editor-head"><div><span>{editingId ? 'EDIT ARTIKEL' : 'ARTIKEL BARU'}</span><h2>{editingId ? 'Perbarui konten' : 'Tulis konten edukasi'}</h2></div><div className="editor-status"><button type="button" className={form.status === 'draft' ? 'active' : ''} onClick={() => update('status','draft')}>Draf</button><button type="button" className={form.status === 'published' ? 'active published' : ''} onClick={() => update('status','published')}>Terbitkan</button></div></div>
            <div className="editor-grid"><label className="wide">Judul artikel<input value={form.title} onChange={(event) => { const title = event.target.value; update('title', title); if (!editingId) update('slug', slugify(title)); }} placeholder="Contoh: Cara Membangun Komunikasi yang Lebih Sadar" required /></label><label>Slug/alamat artikel<input value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} placeholder="alamat-artikel" required /></label><label>Kategori<input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Keluarga" required /></label><label>Tanggal terbit<input type="date" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} required /></label><label>Durasi baca<input value={form.readTime} onChange={(event) => update('readTime', event.target.value)} placeholder="5 menit baca" required /></label><label>Warna sampul<select value={form.tone} onChange={(event) => update('tone', event.target.value as ArticleInput['tone'])}><option value="forest">Hijau utama</option><option value="mint">Hijau muda</option><option value="leaf">Hijau daun</option><option value="sand">Cokelat hangat</option><option value="charcoal">Hijau gelap</option></select></label><label className="checkbox-label"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /> Jadikan artikel pilihan</label><label className="wide">Ringkasan<textarea rows={3} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="Ringkasan singkat yang tampil pada kartu artikel." required /></label><label className="wide body-field">Isi artikel<textarea rows={18} value={form.body} onChange={(event) => update('body', event.target.value)} required /><small>Gunakan <code>## Judul bagian</code> untuk subjudul dan <code>- Poin</code> untuk daftar.</small></label><label className="wide">Inti artikel<textarea rows={3} value={form.takeaway} onChange={(event) => update('takeaway', event.target.value)} placeholder="Satu kesimpulan utama untuk pembaca." required /></label></div>
            <div className="article-editor-actions"><button type="button" onClick={startNew}>Bersihkan form</button>{editingId && form.status === 'published' && <Link href={`/edukasi/${form.slug}`} target="_blank">Lihat artikel ↗</Link>}<button className="save" type="submit" disabled={saving || !databaseReady}>{saving ? 'Menyimpan…' : form.status === 'published' ? 'Simpan & terbitkan →' : 'Simpan draf →'}</button></div>
          </form>
        </div>
      </> : <section className="engagement-dashboard">
        {engagementLoading && <p className="engagement-loading">Memuat statistik…</p>}
        <div className="engagement-summary"><span><small>Dilihat</small><b>{engagement.metrics.views}</b></span><span><small>Bermanfaat</small><b>{engagement.metrics.likes}</b></span><span><small>Dibagikan</small><b>{engagement.metrics.shares}</b></span><span><small>Komentar terbit</small><b>{engagement.metrics.approvedComments}</b></span><span><small>Menunggu</small><b>{engagement.metrics.pendingComments}</b></span></div>
        <div className="engagement-admin-grid"><section><header><div><span>PERFORMA KONTEN</span><h2>Artikel teratas</h2></div><button onClick={() => void loadEngagement()}>Muat ulang</button></header><div className="top-article-list">{engagement.topArticles.map((article, index) => <article key={article.id}><b>{index + 1}</b><div><Link href={`/edukasi/${article.slug}`} target="_blank">{article.title} ↗</Link><small>{article.views} dilihat · {article.likes} bermanfaat · {article.shares} dibagikan · {article.comments} komentar</small></div></article>)}</div></section>
          <section className="comment-moderation"><header><div><span>MODERASI</span><h2>Komentar pembaca</h2></div><select value={commentFilter} onChange={(event) => setCommentFilter(event.target.value as CommentStatus | 'all')}><option value="pending">Menunggu</option><option value="approved">Terbit</option><option value="spam">Spam</option><option value="rejected">Ditolak</option><option value="all">Semua</option></select></header><div className="moderation-list">{filteredComments.length ? filteredComments.map((comment) => <article key={comment.id}><header><div><b>{comment.name}</b><small>{formatAdminDate(comment.createdAt)} · <Link href={`/edukasi/${comment.articleSlug}`} target="_blank">{comment.articleTitle}</Link></small></div><em className={comment.status}>{comment.status === 'pending' ? 'Menunggu' : comment.status === 'approved' ? 'Terbit' : comment.status}</em></header><p>{comment.body}</p>{comment.email && <small>Email pribadi: {comment.email}</small>}<footer>{comment.status !== 'approved' && <button className="approve" onClick={() => void moderateComment(comment.id, 'approved')}>Terbitkan</button>}{comment.status !== 'rejected' && <button onClick={() => void moderateComment(comment.id, 'rejected')}>Tolak</button>}{comment.status !== 'spam' && <button onClick={() => void moderateComment(comment.id, 'spam')}>Spam</button>}<button className="delete" onClick={() => void removeComment(comment.id)}>Hapus</button></footer></article>) : <div className="manager-empty">Tidak ada komentar pada status ini.</div>}</div></section>
        </div>
      </section>}
    </main>
  </div>;
}
