'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleInput, StoredArticle } from '@/lib/article-store';

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

const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);

export default function ArticleEditor({ databaseReady, initialArticles, initialError }: { databaseReady: boolean; initialArticles: StoredArticle[]; initialError: string }) {
  const router = useRouter();
  const [articles, setArticles] = useState<StoredArticle[]>(initialArticles);
  const [form, setForm] = useState<ArticleInput>(emptyArticle);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(initialError);

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

  const filtered = useMemo(() => articles.filter((article) => `${article.title} ${article.category}`.toLowerCase().includes(query.toLowerCase())), [articles, query]);
  const publishedCount = articles.filter((article) => article.status === 'published').length;

  function update<K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyArticle());
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
    setMessage(`Mengedit: ${article.title}`);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (typeof article.id !== 'number' || !window.confirm(`Hapus artikel “${article.title}”? Tindakan ini tidak dapat dibatalkan.`)) return;
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

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return <div className="article-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Artikel & Edukasi</b></nav><div><Link href="/edukasi" target="_blank">Lihat edukasi ↗</Link><button onClick={logout}>Keluar</button></div></header>
    <main>
      <section className="article-admin-title"><div><span>DASHBOARD KONTEN</span><h1>Kelola artikel edukasi</h1><p>Siapkan draf, tinjau isinya, lalu terbitkan ke website.</p></div><div className="article-admin-metrics"><span><small>Total artikel</small><b>{articles.length}</b></span><span><small>Sudah terbit</small><b>{publishedCount}</b></span><span><small>Masih draf</small><b>{articles.length - publishedCount}</b></span></div></section>

      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> pada Environment Variables Coolify agar editor dapat menyimpan artikel. Website publik tetap menampilkan artikel bawaan.</p></section>}
      {message && <div className="admin-editor-message success">✓ {message}</div>}
      {error && <div className="admin-editor-message error">{error}</div>}

      <div className="article-admin-layout">
        <aside className="article-manager"><div className="article-manager-head"><div><b>Daftar artikel</b><small>{articles.length} konten tersimpan</small></div><button onClick={startNew}>＋ Baru</button></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau kategori…" />
          <div className="article-manager-list">{filtered.length ? filtered.map((article) => <article className={editingId === article.id ? 'active' : ''} key={article.id} onClick={() => edit(article)}><div><span className={`admin-tone ${article.tone}`}/><div><b>{article.title}</b><small>{article.category} · {article.publishedLabel}</small></div></div><footer><em className={article.status}>{article.status === 'published' ? 'Terbit' : 'Draf'}</em><button onClick={(event) => { event.stopPropagation(); void remove(article); }} aria-label={`Hapus ${article.title}`}>×</button></footer></article>) : <p className="manager-empty">Belum ada artikel yang cocok.</p>}</div>
        </aside>

        <form className="article-editor-form" onSubmit={submit}><div className="article-editor-head"><div><span>{editingId ? 'EDIT ARTIKEL' : 'ARTIKEL BARU'}</span><h2>{editingId ? 'Perbarui konten' : 'Tulis konten edukasi'}</h2></div><div className="editor-status"><button type="button" className={form.status === 'draft' ? 'active' : ''} onClick={() => update('status','draft')}>Draf</button><button type="button" className={form.status === 'published' ? 'active published' : ''} onClick={() => update('status','published')}>Terbitkan</button></div></div>
          <div className="editor-grid"><label className="wide">Judul artikel<input value={form.title} onChange={(event) => { const title = event.target.value; update('title', title); if (!editingId) update('slug', slugify(title)); }} placeholder="Contoh: Cara Membangun Komunikasi yang Lebih Sadar" required /></label><label>Slug/alamat artikel<input value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} placeholder="alamat-artikel" required /></label><label>Kategori<input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Keluarga" required /></label><label>Tanggal terbit<input type="date" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} required /></label><label>Durasi baca<input value={form.readTime} onChange={(event) => update('readTime', event.target.value)} placeholder="5 menit baca" required /></label><label>Warna sampul<select value={form.tone} onChange={(event) => update('tone', event.target.value as ArticleInput['tone'])}><option value="forest">Hijau utama</option><option value="mint">Hijau muda</option><option value="leaf">Hijau daun</option><option value="sand">Cokelat hangat</option><option value="charcoal">Hijau gelap</option></select></label><label className="checkbox-label"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /> Jadikan artikel pilihan</label><label className="wide">Ringkasan<textarea rows={3} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="Ringkasan singkat yang tampil pada kartu artikel." required /></label><label className="wide body-field">Isi artikel<textarea rows={18} value={form.body} onChange={(event) => update('body', event.target.value)} required /><small>Gunakan <code>## Judul bagian</code> untuk subjudul dan <code>- Poin</code> untuk daftar.</small></label><label className="wide">Inti artikel<textarea rows={3} value={form.takeaway} onChange={(event) => update('takeaway', event.target.value)} placeholder="Satu kesimpulan utama untuk pembaca." required /></label></div>
          <div className="article-editor-actions"><button type="button" onClick={startNew}>Bersihkan form</button>{editingId && form.status === 'published' && <Link href={`/edukasi/${form.slug}`} target="_blank">Lihat artikel ↗</Link>}<button className="save" type="submit" disabled={saving || !databaseReady}>{saving ? 'Menyimpan…' : form.status === 'published' ? 'Simpan & terbitkan →' : 'Simpan draf →'}</button></div>
        </form>
      </div>
    </main>
  </div>;
}
