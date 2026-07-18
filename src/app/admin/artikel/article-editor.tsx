'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleContentType, ArticleInput, ContentRole, SearchIntent, StoredArticle } from '@/lib/article-store';
import type { CommentStatus } from '@/lib/engagement-store';
import type { KnowledgeSource } from '@/lib/knowledge-store';

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
  metrics: { views: number; likes: number; shares: number; ctaClicks: number; approvedComments: number; pendingComments: number };
  comments: AdminComment[];
  topArticles: Array<{ id: number; title: string; slug: string; views: number; likes: number; shares: number; ctaClicks: number; comments: number }>;
};

const emptyEngagement: EngagementData = {
  metrics: { views: 0, likes: 0, shares: 0, ctaClicks: 0, approvedComments: 0, pendingComments: 0 },
  comments: [],
  topArticles: [],
};

const categoryOptions = [
  'Dasar STIFIn',
  'Pengembangan Diri',
  'Keluarga',
  'Belajar & Anak',
  'Komunikasi',
  'Tim & Organisasi',
  'Bisnis & Pemasaran',
  'Finansial',
  'Kesehatan',
  'Promotor & Lisensi',
];

const contentTypeLabels: Record<ArticleContentType, string> = {
  education: 'Edukasi umum',
  product: 'Edukasi + produk',
  affiliate: 'Affiliate SEJOLI',
};

function defaultScheduleStart() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(tomorrow);
  return `${date}T09:00`;
}

function wibIsoFromLocal(value: string) {
  if (!value) return '';
  return new Date(`${value}:00+07:00`).toISOString();
}

function wibDateFromIso(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}

function wibLocalFromIso(value: string) {
  if (!value) return defaultScheduleStart();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

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
  contentType: 'education',
  productName: '',
  productUrl: '',
  ctaLabel: 'Lihat pilihan layanan',
  scheduledAt: '',
  sourceReferences: [],
  primaryKeyword: '',
  secondaryKeywords: [],
  searchIntent: 'informational',
  topicCluster: '',
  contentRole: 'supporting',
  experienceEvidence: '',
  reviewerName: '',
  reviewerRole: '',
  reviewedAt: '',
  relatedSlugs: [],
});

const emptyAiForm = {
  topic: '',
  audience: 'Pembaca umum dan keluarga',
  objective: 'Memberi pemahaman praktis yang dapat diterapkan secara bertanggung jawab',
  categories: ['Pengembangan Diri'],
  keywords: '',
  sourceNotes: '',
  primaryKeyword: '',
  searchIntent: 'informational' as SearchIntent,
  topicCluster: '',
  contentRole: 'supporting' as ContentRole,
  experienceEvidence: '',
  length: 'sedang',
  tone: 'hangat',
  contentType: 'education' as ArticleContentType,
  productName: '',
  productUrl: '',
  ctaLabel: 'Lihat pilihan layanan',
  count: 1 as 1 | 3 | 5,
  resultMode: 'draft' as 'draft' | 'scheduled',
  scheduleStart: defaultScheduleStart(),
  scheduleIntervalDays: 2,
  useKnowledge: true,
  knowledgeSourceIds: [] as number[],
};

const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function articleToInput(article: StoredArticle): ArticleInput {
  return {
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
    contentType: article.contentType,
    productName: article.productName,
    productUrl: article.productUrl,
    ctaLabel: article.ctaLabel,
    scheduledAt: article.scheduledAt,
    sourceReferences: article.sourceReferences,
    primaryKeyword: article.primaryKeyword,
    secondaryKeywords: article.secondaryKeywords,
    searchIntent: article.searchIntent,
    topicCluster: article.topicCluster,
    contentRole: article.contentRole,
    experienceEvidence: article.experienceEvidence,
    reviewerName: article.reviewerName,
    reviewerRole: article.reviewerRole,
    reviewedAt: article.reviewedAt,
    relatedSlugs: article.relatedSlugs,
  };
}

export default function ArticleEditor({ databaseReady, aiReady, aiProvider, aiModel, initialArticles, initialKnowledgeSources, initialError, initialArticleId, focusOptimization }: { databaseReady: boolean; aiReady: boolean; aiProvider: string; aiModel: string; initialArticles: StoredArticle[]; initialKnowledgeSources: KnowledgeSource[]; initialError: string; initialArticleId: number | null; focusOptimization: boolean }) {
  const router = useRouter();
  const initialSelectedArticle = initialArticleId === null ? undefined : initialArticles.find((article) => article.id === initialArticleId);
  const [articles, setArticles] = useState<StoredArticle[]>(initialArticles);
  const [form, setForm] = useState<ArticleInput>(() => initialSelectedArticle ? articleToInput(initialSelectedArticle) : emptyArticle());
  const [editingId, setEditingId] = useState<number | null>(() => initialSelectedArticle && typeof initialSelectedArticle.id === 'number' ? initialSelectedArticle.id : null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(focusOptimization && initialSelectedArticle ? `Artikel “${initialSelectedArticle.title}” siap dioptimalkan dengan AI.` : '');
  const [error, setError] = useState(initialError);
  const [panel, setPanel] = useState<'articles' | 'engagement'>('articles');
  const [showAi, setShowAi] = useState(false);
  const [aiForm, setAiForm] = useState(emptyAiForm);
  const [generating, setGenerating] = useState(false);
  const [optimizingCurrent, setOptimizingCurrent] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
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
  const scheduledCount = articles.filter((article) => article.status === 'scheduled').length;
  const draftCount = articles.filter((article) => article.status === 'draft').length;
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
    setForm(articleToInput(article));
    setEditorialNotes('');
    setMessage(`Mengedit: ${article.title}`);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function generateWithAi(event: FormEvent) {
    event.preventDefault();
    if (!databaseReady) {
      setError('Hubungkan database sebelum membuat artikel AI.');
      return;
    }
    if (!aiForm.categories.length) {
      setError('Pilih minimal satu kategori.');
      return;
    }
    const scheduleStartIso = aiForm.resultMode === 'scheduled' ? wibIsoFromLocal(aiForm.scheduleStart) : '';
    if (aiForm.resultMode === 'scheduled' && (!scheduleStartIso || new Date(scheduleStartIso).getTime() <= Date.now())) {
      setError('Jadwal pertama harus berada di waktu yang akan datang.');
      return;
    }
    setGenerating(true);
    setGenerationProgress('Menyiapkan antrean artikel…');
    setMessage('');
    setError('');
    setEditorialNotes('');
    const created: StoredArticle[] = [];
    const notes: string[] = [];
    const usedTitles = articles.map((article) => article.title);
    const usedSlugs = new Set(articles.map((article) => article.slug));
    try {
      for (let index = 0; index < aiForm.count; index += 1) {
        setGenerationProgress(`AI sedang menulis artikel ${index + 1} dari ${aiForm.count}…`);
        const category = aiForm.categories[index % aiForm.categories.length];
        const generationResponse = await fetch('/api/admin/ai/article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...aiForm,
            category,
            variationNumber: index + 1,
            variationTotal: aiForm.count,
            avoidTitles: usedTitles.slice(-20),
          }),
        });
        const generated = await generationResponse.json();
        if (generationResponse.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!generationResponse.ok) throw new Error(generated.message ?? `Artikel ${index + 1} gagal dibuat.`);

        let slug = slugify(generated.article.slug || generated.article.title);
        if (usedSlugs.has(slug)) slug = `${slug.slice(0, 112)}-${index + 1}-${Date.now().toString(36).slice(-4)}`;
        usedSlugs.add(slug);
        usedTitles.push(generated.article.title);

        const scheduledAt = aiForm.resultMode === 'scheduled'
          ? new Date(new Date(scheduleStartIso).getTime() + index * aiForm.scheduleIntervalDays * 24 * 60 * 60 * 1000).toISOString()
          : '';
        const articleInput: ArticleInput = {
          ...generated.article,
          slug,
          category,
          status: aiForm.resultMode,
          scheduledAt,
          publishedAt: scheduledAt ? wibDateFromIso(scheduledAt) : generated.article.publishedAt,
          sourceReferences: Array.isArray(generated.sources) ? generated.sources : [],
          relatedSlugs: articles.filter((candidate) => candidate.status === 'published'
            && (candidate.topicCluster === aiForm.topicCluster || candidate.category === category))
            .slice(0, 4).map((candidate) => candidate.slug),
        };
        setGenerationProgress(`Menyimpan artikel ${index + 1} dari ${aiForm.count}…`);
        const saveResponse = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleInput),
        });
        const saved = await saveResponse.json();
        if (!saveResponse.ok) throw new Error(saved.message ?? `Artikel ${index + 1} gagal disimpan.`);
        created.push(saved.article);
        if (generated.editorialNotes) notes.push(`${index + 1}. ${generated.editorialNotes}`);
        if (Array.isArray(generated.sources) && generated.sources.length) {
          notes.push(`Sumber ${index + 1}: ${generated.sources.map((source: { title: string; pageNumber: number }) => `${source.title} hlm. ${source.pageNumber}`).join('; ')}`);
        }
        if (index < aiForm.count - 1) {
          setGenerationProgress(`Artikel ${index + 1} tersimpan. Menunggu antrean AI berikutnya…`);
          await wait(3_000);
        }
      }
      const first = created[0];
      if (first && typeof first.id === 'number') {
        edit(first);
      }
      setEditorialNotes(notes.join('\n') || 'Periksa seluruh isi sebelum diterbitkan.');
      setMessage(aiForm.resultMode === 'scheduled'
        ? `${created.length} artikel selesai dibuat dan dijadwalkan.`
        : `${created.length} draf artikel selesai dibuat dan tersimpan.`);
      setShowAi(false);
      await loadArticles();
    } catch (aiError) {
      const prefix = created.length ? `${created.length} artikel sudah berhasil disimpan. ` : '';
      setError(`${prefix}${aiError instanceof Error ? aiError.message : 'Artikel AI gagal dibuat.'}`);
      await loadArticles();
    } finally {
      setGenerating(false);
      setGenerationProgress('');
    }
  }

  async function optimizeCurrentWithAi() {
    if (!editingId || !databaseReady || !aiReady) {
      setError('Pilih artikel tersimpan dan pastikan AI serta database sudah aktif.');
      return;
    }
    if (!window.confirm('Buat pratinjau optimasi isi artikel ini? Hasil akan masuk ke form dan belum tersimpan sampai Anda menekan tombol Simpan.')) return;
    setOptimizingCurrent(true);
    setError('');
    setMessage('');
    setEditorialNotes('');
    try {
      const response = await fetch('/api/admin/ai/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: form.title,
          audience: 'Pembaca Konsep STIFIn yang mencari jawaban edukatif, praktis, dan bertanggung jawab',
          objective: 'Memperdalam artikel lama, memperjelas struktur jawaban, dan mempertahankan makna serta fakta yang sudah ada',
          category: form.category,
          keywords: form.secondaryKeywords.join(', '),
          sourceNotes: `ARTIKEL LAMA YANG HARUS MENJADI DASAR. Jangan menambah klaim, pengalaman, angka, atau sumber yang tidak tersedia:\n\n${form.body.slice(0, 5400)}`,
          primaryKeyword: form.primaryKeyword || form.title,
          searchIntent: form.searchIntent,
          topicCluster: form.topicCluster || form.category,
          contentRole: form.contentRole,
          experienceEvidence: form.experienceEvidence,
          length: form.body.split(/\s+/).length >= 900 ? 'mendalam' : 'sedang',
          tone: 'profesional',
          contentType: form.contentType,
          productName: form.productName,
          productUrl: form.productUrl,
          ctaLabel: form.ctaLabel,
          variationNumber: 1,
          variationTotal: 1,
          avoidTitles: articles.filter((article) => article.slug !== form.slug).map((article) => article.title).slice(0, 20),
          useKnowledge: form.sourceReferences.length > 0,
          knowledgeSourceIds: [...new Set(form.sourceReferences.map((source) => source.sourceId))],
        }),
      });
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const generated = await response.json();
      if (!response.ok) throw new Error(generated.message || 'Optimasi AI gagal dibuat.');
      setForm((current) => ({
        ...current,
        excerpt: generated.article.excerpt || current.excerpt,
        body: generated.article.body || current.body,
        takeaway: generated.article.takeaway || current.takeaway,
        readTime: generated.article.readTime || current.readTime,
        secondaryKeywords: generated.article.secondaryKeywords?.length
          ? generated.article.secondaryKeywords : current.secondaryKeywords,
        sourceReferences: Array.isArray(generated.sources) && generated.sources.length
          ? generated.sources : current.sourceReferences,
      }));
      setEditorialNotes(generated.editorialNotes || 'Periksa kembali fakta, struktur, dan nada sebelum menyimpan.');
      setMessage('Pratinjau optimasi AI sudah dimasukkan ke form. Periksa perubahan lalu klik Simpan jika disetujui.');
    } catch (optimizationError) {
      setError(optimizationError instanceof Error ? optimizationError.message : 'Optimasi AI gagal dibuat.');
    } finally {
      setOptimizingCurrent(false);
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
      setMessage(form.status === 'published'
        ? 'Artikel berhasil diterbitkan.'
        : form.status === 'scheduled' ? 'Artikel berhasil dijadwalkan.' : 'Draf berhasil disimpan.');
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
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Artikel & Edukasi</b></nav><div><Link href="/admin/intelligence">Content Intelligence</Link><Link href="/admin/produk">Produk & Harga</Link><Link href="/admin/pustaka">Pustaka STIFIn</Link><Link href="/edukasi" target="_blank">Lihat edukasi ↗</Link><button onClick={logout}>Keluar</button></div></header>
    <main>
      <section className="article-admin-title"><div><span>DASHBOARD KONTEN</span><h1>{panel === 'articles' ? 'Kelola artikel edukasi' : 'Interaksi pembaca'}</h1><p>{panel === 'articles' ? 'Buat dengan AI, jadwalkan, tinjau, lalu terbitkan ke website.' : 'Pantau performa dan moderasi percakapan pembaca.'}</p></div><div className="article-admin-metrics">{panel === 'articles' ? <><span><small>Total</small><b>{articles.length}</b></span><span><small>Terbit</small><b>{publishedCount}</b></span><span><small>Terjadwal</small><b>{scheduledCount}</b></span><span><small>Draf</small><b>{draftCount}</b></span></> : <><span><small>Dilihat</small><b>{engagement.metrics.views}</b></span><span><small>Bermanfaat</small><b>{engagement.metrics.likes}</b></span><span><small>Perlu diperiksa</small><b>{engagement.metrics.pendingComments}</b></span></>}</div></section>

      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> pada Environment Variables Coolify agar editor dan interaksi dapat disimpan.</p></section>}
      {message && <div className="admin-editor-message success">✓ {message}</div>}
      {error && <div className="admin-editor-message error">{error}</div>}
      <div className="article-admin-tabs"><button className={panel === 'articles' ? 'active' : ''} onClick={() => setPanel('articles')}>Artikel & AI</button><button className={panel === 'engagement' ? 'active' : ''} onClick={openEngagement}>Interaksi <em>{engagement.metrics.pendingComments || ''}</em></button></div>

      {panel === 'articles' ? <>
        <section className="ai-authoring-banner"><div><span>ASISTEN PENULISAN</span><h2>Buat hingga 5 artikel sekali jalan</h2><p>{aiReady ? `AI aktif: ${aiProvider}${aiModel ? ` · ${aiModel}` : ''}. ` : ''}Pilih kategori dan hasil akhirnya. Semua konten tetap tersimpan untuk ditinjau.</p></div><button onClick={() => setShowAi((current) => !current)}>{showAi ? 'Tutup' : '✨ Buat dengan AI'}</button></section>
        {showAi && <form className="ai-generator ai-simple" onSubmit={generateWithAi}>
          <header><div><span>GENERATOR ARTIKEL</span><h2>Pilih, isi topik, lalu buat</h2></div><small>AI tidak menerbitkan tanpa pilihan Anda.</small></header>
          {!aiReady && <div className="admin-setup-warning"><b>AI belum diaktifkan</b><p>Disarankan tambahkan <code>AI_PROVIDER=gemini</code>, <code>GEMINI_API_KEY</code>, dan <code>GEMINI_MODEL=gemini-3.1-flash-lite</code> di Coolify, lalu Redeploy.</p></div>}
          <div className="ai-option-group"><b>1. Jenis artikel</b><div className="ai-choice-row">{(Object.keys(contentTypeLabels) as ArticleContentType[]).map((type) => <button key={type} type="button" className={aiForm.contentType === type ? 'active' : ''} onClick={() => setAiForm((current) => ({ ...current, contentType: type }))}>{contentTypeLabels[type]}</button>)}</div></div>
          <label className="ai-topic">2. Topik utama<input value={aiForm.topic} onChange={(event) => setAiForm({ ...aiForm, topic: event.target.value })} placeholder={aiForm.contentType === 'education' ? 'Contoh: Cara mendampingi anak mengenali cara belajarnya' : 'Contoh: Panduan memilih layanan STIFIn untuk keluarga'} required /></label>
          <div className="ai-option-group"><b>3. Pilih kategori <small>(boleh lebih dari satu)</small></b><div className="ai-chip-row">{categoryOptions.map((category) => { const selected = aiForm.categories.includes(category); return <button key={category} type="button" className={selected ? 'active' : ''} aria-pressed={selected} onClick={() => setAiForm((current) => ({ ...current, categories: selected ? current.categories.filter((item) => item !== category) : [...current.categories, category] }))}>{selected ? '✓ ' : ''}{category}</button>; })}</div></div>
          <section className="ai-knowledge-picker"><header><label><input type="checkbox" checked={aiForm.useKnowledge} onChange={(event) => setAiForm((current) => ({ ...current, useKnowledge: event.target.checked }))} /><span><b>4. Gunakan Pustaka STIFIn</b><small>AI mengambil potongan halaman yang sesuai dan menyimpan jejak sumber.</small></span></label><Link href="/admin/pustaka">Kelola pustaka →</Link></header>{aiForm.useKnowledge && <>{initialKnowledgeSources.filter((source) => source.enabledForAi && source.status === 'ready').length ? <div className="ai-source-choices"><button type="button" className={!aiForm.knowledgeSourceIds.length ? 'active' : ''} onClick={() => setAiForm((current) => ({ ...current, knowledgeSourceIds: [] }))}><b>Otomatis</b><small>Pilih berdasarkan topik</small></button>{initialKnowledgeSources.filter((source) => source.enabledForAi && source.status === 'ready').map((source) => { const selected = aiForm.knowledgeSourceIds.includes(source.id); return <button type="button" key={source.id} className={`${selected ? 'active' : ''} ${source.accessLevel === 'restricted' ? 'restricted' : ''}`} onClick={() => setAiForm((current) => ({ ...current, knowledgeSourceIds: selected ? current.knowledgeSourceIds.filter((id) => id !== source.id) : [...current.knowledgeSourceIds, source.id] }))}><b>{selected ? '✓ ' : ''}{source.title}</b><small>{source.category} · {source.pageCount} hlm.</small></button>; })}</div> : <div className="ai-knowledge-empty">Belum ada sumber yang aktif. <Link href="/admin/pustaka">Unggah PDF dahulu.</Link></div>}</>}</section>
          <div className="ai-simple-grid">
            <div className="ai-option-group"><b>5. Jumlah artikel</b><div className="ai-choice-row compact">{([1, 3, 5] as const).map((count) => <button key={count} type="button" className={aiForm.count === count ? 'active' : ''} onClick={() => setAiForm((current) => ({ ...current, count }))}>{count} artikel</button>)}</div></div>
            <div className="ai-option-group"><b>6. Simpan sebagai</b><div className="ai-choice-row compact"><button type="button" className={aiForm.resultMode === 'draft' ? 'active' : ''} onClick={() => setAiForm((current) => ({ ...current, resultMode: 'draft' }))}>Draf</button><button type="button" className={aiForm.resultMode === 'scheduled' ? 'active' : ''} onClick={() => setAiForm((current) => ({ ...current, resultMode: 'scheduled' }))}>Terjadwal</button></div></div>
          </div>
          {aiForm.resultMode === 'scheduled' && <div className="ai-schedule-fields"><label>Artikel pertama terbit<input type="datetime-local" value={aiForm.scheduleStart} min={defaultScheduleStart()} onChange={(event) => setAiForm((current) => ({ ...current, scheduleStart: event.target.value }))} required /></label><label>Jarak antarartikel<select value={aiForm.scheduleIntervalDays} onChange={(event) => setAiForm((current) => ({ ...current, scheduleIntervalDays: Number(event.target.value) }))}><option value={1}>Setiap 1 hari</option><option value={2}>Setiap 2 hari</option><option value={3}>Setiap 3 hari</option><option value={7}>Setiap 7 hari</option></select></label><p>Jam mengikuti WIB. Artikel akan terbit otomatis saat halaman website diakses setelah jadwalnya.</p></div>}
          {aiForm.contentType !== 'education' && <div className="ai-product-fields"><header><div><b>Informasi produk SEJOLI</b><small>{aiForm.contentType === 'affiliate' ? 'Artikel akan menampilkan keterbukaan bahwa tautan bersifat affiliate.' : 'Produk dijelaskan secara edukatif, bukan janji hasil.'}</small></div></header><div><label>Nama produk<input value={aiForm.productName} onChange={(event) => setAiForm((current) => ({ ...current, productName: event.target.value }))} placeholder="Contoh: Tes STIFIn Personal" required /></label><label>URL produk/checkout SEJOLI<input type="url" value={aiForm.productUrl} onChange={(event) => setAiForm((current) => ({ ...current, productUrl: event.target.value }))} placeholder="https://..." required /></label><label>Teks tombol<input value={aiForm.ctaLabel} onChange={(event) => setAiForm((current) => ({ ...current, ctaLabel: event.target.value }))} placeholder="Lihat produk" /></label></div></div>}
          <section className="ai-intelligence-fields"><header><div><b>Strategi Content Intelligence</b><small>Metadata ini membantu pilar–cluster, intent, audit, dan internal link.</small></div><Link href="/admin/intelligence">Lihat dashboard →</Link></header><div><label>Keyword utama<input value={aiForm.primaryKeyword} onChange={(event) => setAiForm((current) => ({ ...current, primaryKeyword: event.target.value }))} placeholder="Kosongkan untuk memakai topik utama" /></label><label>Cluster topik<input value={aiForm.topicCluster} onChange={(event) => setAiForm((current) => ({ ...current, topicCluster: event.target.value }))} placeholder="Contoh: STIFIn untuk Keluarga" /></label><label>Search intent<select value={aiForm.searchIntent} onChange={(event) => setAiForm((current) => ({ ...current, searchIntent: event.target.value as SearchIntent }))}><option value="informational">Informasional</option><option value="commercial">Pertimbangan layanan</option><option value="transactional">Transaksional</option><option value="navigational">Navigasional</option></select></label><label>Peran konten<select value={aiForm.contentRole} onChange={(event) => setAiForm((current) => ({ ...current, contentRole: event.target.value as ContentRole }))}><option value="pillar">Pilar utama</option><option value="cluster">Artikel cluster</option><option value="supporting">Artikel pendukung</option></select></label><label className="wide">Bukti/pengalaman nyata<textarea rows={4} value={aiForm.experienceEvidence} onChange={(event) => setAiForm((current) => ({ ...current, experienceEvidence: event.target.value }))} placeholder="Contoh: dokumentasi workshop keluarga di Bandung, Januari 2026. Jangan masukkan data pribadi peserta." /><small>AI hanya boleh memakai fakta yang Anda tulis di sini dan dilarang mengarang pengalaman.</small></label></div></section>
          <details className="ai-advanced"><summary>Pengaturan lanjutan <span>opsional</span></summary><div className="ai-generator-grid"><label>Pembaca sasaran<input value={aiForm.audience} onChange={(event) => setAiForm({ ...aiForm, audience: event.target.value })} required /></label><label>Tujuan artikel<input value={aiForm.objective} onChange={(event) => setAiForm({ ...aiForm, objective: event.target.value })} required /></label><label>Kata kunci<input value={aiForm.keywords} onChange={(event) => setAiForm({ ...aiForm, keywords: event.target.value })} placeholder="belajar, keluarga, komunikasi" /></label><label>Panjang<select value={aiForm.length} onChange={(event) => setAiForm({ ...aiForm, length: event.target.value })}><option value="ringkas">Ringkas</option><option value="sedang">Sedang</option><option value="mendalam">Mendalam</option></select></label><label>Nada tulisan<select value={aiForm.tone} onChange={(event) => setAiForm({ ...aiForm, tone: event.target.value })}><option value="hangat">Hangat</option><option value="praktis">Praktis</option><option value="profesional">Profesional</option></select></label><label className="wide">Catatan sumber <small>(opsional, sangat dianjurkan)</small><textarea rows={5} value={aiForm.sourceNotes} onChange={(event) => setAiForm({ ...aiForm, sourceNotes: event.target.value })} placeholder="Tempel poin faktual atau sumber internal yang boleh dipakai. AI diperintahkan tidak mengarang sumber." /></label></div></details>
          <footer><div><p>Periksa fakta sebelum terbit. Jangan kirim data peserta, hasil tes, kata sandi, atau informasi rahasia ke AI.</p>{generationProgress && <strong className="ai-progress">{generationProgress}</strong>}</div><button type="submit" disabled={generating || !aiReady || !databaseReady}>{generating ? `Mengerjakan ${aiForm.count} artikel…` : `Buat ${aiForm.count} artikel →`}</button></footer>
        </form>}

        {editorialNotes && <section className="editorial-check"><b>Catatan pemeriksaan dari AI</b><p>{editorialNotes}</p></section>}

        <div className="article-admin-layout">
          <aside className="article-manager"><div className="article-manager-head"><div><b>Daftar artikel</b><small>{articles.length} konten tersimpan</small></div><button onClick={startNew}>＋ Baru</button></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau kategori…" />
            <div className="article-manager-list">{filtered.length ? filtered.map((article) => <article className={editingId === article.id ? 'active' : ''} key={article.id} onClick={() => edit(article)}><div><span className={`admin-tone ${article.tone}`}/><div><b>{article.title}</b><small>{article.category} · {article.status === 'scheduled' && article.scheduledAt ? formatAdminDate(article.scheduledAt) : article.publishedLabel}</small></div></div><footer><em className={article.status}>{article.status === 'published' ? 'Terbit' : article.status === 'scheduled' ? 'Terjadwal' : 'Draf'}</em><button onClick={(event) => { event.stopPropagation(); void remove(article); }} aria-label={`Hapus ${article.title}`}>×</button></footer></article>) : <p className="manager-empty">Belum ada artikel yang cocok.</p>}</div>
          </aside>

          <form className="article-editor-form" onSubmit={submit}><div className="article-editor-head"><div><span>{editingId ? 'EDIT ARTIKEL' : 'ARTIKEL BARU'}</span><h2>{editingId ? 'Perbarui konten' : 'Tulis konten edukasi'}</h2></div><div className="editor-status"><button type="button" className={form.status === 'draft' ? 'active' : ''} onClick={() => update('status','draft')}>Draf</button><button type="button" className={form.status === 'scheduled' ? 'active scheduled' : ''} onClick={() => setForm((current) => ({ ...current, status: 'scheduled', scheduledAt: current.scheduledAt || wibIsoFromLocal(defaultScheduleStart()) }))}>Jadwalkan</button><button type="button" className={form.status === 'published' ? 'active published' : ''} onClick={() => update('status','published')}>Terbitkan</button></div></div>
            {editingId && <section className="article-ai-optimization-callout"><div><span>OPTIMASI ARTIKEL TERPILIH</span><b>Perdalam struktur dan isi dengan AI</b><small>Hasil masuk sebagai pratinjau. Bukti nyata dan reviewer tidak akan dibuat oleh AI.</small></div><button type="button" onClick={optimizeCurrentWithAi} disabled={optimizingCurrent || !aiReady || !databaseReady}>{optimizingCurrent ? 'Mengoptimalkan…' : '✨ Optimalkan dengan AI →'}</button></section>}
            <div className="editor-grid"><label className="wide">Judul artikel<input value={form.title} onChange={(event) => { const title = event.target.value; update('title', title); if (!editingId) update('slug', slugify(title)); }} placeholder="Contoh: Cara Membangun Komunikasi yang Lebih Sadar" required /></label><label>Slug/alamat artikel<input value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} placeholder="alamat-artikel" required /></label><label>Kategori<select value={form.category} onChange={(event) => update('category', event.target.value)}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label><label>Jenis artikel<select value={form.contentType} onChange={(event) => update('contentType', event.target.value as ArticleContentType)}>{(Object.keys(contentTypeLabels) as ArticleContentType[]).map((type) => <option key={type} value={type}>{contentTypeLabels[type]}</option>)}</select></label><label>Tanggal terbit<input type="date" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} required /></label>{form.status === 'scheduled' && <label className="schedule-editor-field">Jadwal terbit (WIB)<input type="datetime-local" value={wibLocalFromIso(form.scheduledAt)} min={defaultScheduleStart()} onChange={(event) => { const scheduledAt = wibIsoFromLocal(event.target.value); setForm((current) => ({ ...current, scheduledAt, publishedAt: wibDateFromIso(scheduledAt) })); }} required /></label>}<label>Durasi baca<input value={form.readTime} onChange={(event) => update('readTime', event.target.value)} placeholder="5 menit baca" required /></label><label>Warna sampul<select value={form.tone} onChange={(event) => update('tone', event.target.value as ArticleInput['tone'])}><option value="forest">Hijau utama</option><option value="mint">Hijau muda</option><option value="leaf">Hijau daun</option><option value="sand">Cokelat hangat</option><option value="charcoal">Hijau gelap</option></select></label><label className="checkbox-label"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /> Jadikan artikel pilihan</label>{form.contentType !== 'education' && <div className="editor-product-fields wide"><b>Produk SEJOLI</b><label>Nama produk<input value={form.productName} onChange={(event) => update('productName', event.target.value)} required /></label><label>URL produk/checkout<input type="url" value={form.productUrl} onChange={(event) => update('productUrl', event.target.value)} required /></label><label>Teks tombol<input value={form.ctaLabel} onChange={(event) => update('ctaLabel', event.target.value)} /></label>{form.contentType === 'affiliate' && <p>Artikel publik akan menampilkan keterangan bahwa tautan ini bersifat affiliate.</p>}</div>}<label className="wide">Ringkasan<textarea rows={3} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="Ringkasan singkat yang tampil pada kartu artikel." required /></label><label className="wide body-field">Isi artikel<textarea rows={18} value={form.body} onChange={(event) => update('body', event.target.value)} required /><small>Gunakan <code>## Judul bagian</code> untuk subjudul dan <code>- Poin</code> untuk daftar.</small></label><label className="wide">Inti artikel<textarea rows={3} value={form.takeaway} onChange={(event) => update('takeaway', event.target.value)} placeholder="Satu kesimpulan utama untuk pembaca." required /></label>{form.sourceReferences.length > 0 && <section className="editor-source-references wide"><header><b>Sumber pustaka yang dipakai</b><small>Hanya terlihat oleh admin.</small></header><div>{form.sourceReferences.map((source) => <a key={`${source.sourceId}-${source.pageNumber}`} href={`/api/admin/knowledge/${source.sourceId}/file`} target="_blank" rel="noreferrer"><span>{source.title}</span><small>Halaman {source.pageNumber} · {source.category}</small></a>)}</div></section>}</div>
            <section className="content-intelligence-editor"><header><div><span>CONTENT INTELLIGENCE</span><h3>Intent, bukti, reviewer, dan hubungan artikel</h3></div><div className="content-intelligence-actions">{editingId && <button type="button" onClick={optimizeCurrentWithAi} disabled={optimizingCurrent || !aiReady || !databaseReady}>{optimizingCurrent ? 'Mengoptimalkan…' : '✨ Optimalkan isi dengan AI'}</button>}<Link href="/admin/intelligence">Buka audit lengkap →</Link></div></header><div className="intelligence-editor-grid"><label>Keyword utama<input value={form.primaryKeyword} onChange={(event) => update('primaryKeyword', event.target.value)} placeholder="Contoh: tes STIFIn untuk keluarga" /></label><label>Keyword sekunder<input value={form.secondaryKeywords.join(', ')} onChange={(event) => update('secondaryKeywords', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="komunikasi keluarga, mesin kecerdasan" /></label><label>Search intent<select value={form.searchIntent} onChange={(event) => update('searchIntent', event.target.value as SearchIntent)}><option value="informational">Informasional</option><option value="commercial">Pertimbangan layanan</option><option value="transactional">Transaksional</option><option value="navigational">Navigasional</option></select></label><label>Cluster topik<input value={form.topicCluster} onChange={(event) => update('topicCluster', event.target.value)} placeholder="Contoh: STIFIn untuk Keluarga" /></label><label>Peran konten<select value={form.contentRole} onChange={(event) => update('contentRole', event.target.value as ContentRole)}><option value="pillar">Pilar utama</option><option value="cluster">Artikel cluster</option><option value="supporting">Artikel pendukung</option></select></label><label>Tanggal review<input type="date" value={form.reviewedAt} onChange={(event) => update('reviewedAt', event.target.value)} /></label><label>Nama reviewer<input value={form.reviewerName} onChange={(event) => update('reviewerName', event.target.value)} placeholder="Nama pemeriksa manusia" /></label><label>Peran reviewer<input value={form.reviewerRole} onChange={(event) => update('reviewerRole', event.target.value)} placeholder="Contoh: Promotor STIFIn / Editor" /></label><label className="wide">Bukti atau pengalaman nyata<textarea rows={4} value={form.experienceEvidence} onChange={(event) => update('experienceEvidence', event.target.value)} placeholder="Tuliskan konteks kegiatan, lokasi, tanggal, atau pengalaman yang benar-benar terjadi. Hindari identitas dan data pribadi peserta." /></label><fieldset className="wide related-article-picker"><legend>Internal link terkait <small>pilih 2–6 artikel</small></legend><div>{articles.filter((article) => article.slug !== form.slug && article.status === 'published').map((article) => { const selected = form.relatedSlugs.includes(article.slug); return <label key={article.slug}><input type="checkbox" checked={selected} onChange={() => update('relatedSlugs', selected ? form.relatedSlugs.filter((slug) => slug !== article.slug) : [...form.relatedSlugs, article.slug].slice(0, 6))} /><span><b>{article.title}</b><small>{article.topicCluster || article.category}</small></span></label>; })}</div></fieldset></div></section>
            <div className="article-editor-actions"><button type="button" onClick={startNew}>Bersihkan form</button>{editingId && form.status === 'published' && <Link href={`/edukasi/${form.slug}`} target="_blank">Lihat artikel ↗</Link>}<button className="save" type="submit" disabled={saving || !databaseReady}>{saving ? 'Menyimpan…' : form.status === 'published' ? 'Simpan & terbitkan →' : form.status === 'scheduled' ? 'Simpan jadwal →' : 'Simpan draf →'}</button></div>
          </form>
        </div>
      </> : <section className="engagement-dashboard">
        {engagementLoading && <p className="engagement-loading">Memuat statistik…</p>}
        <div className="engagement-summary"><span><small>Dilihat</small><b>{engagement.metrics.views}</b></span><span><small>Bermanfaat</small><b>{engagement.metrics.likes}</b></span><span><small>Dibagikan</small><b>{engagement.metrics.shares}</b></span><span><small>Klik produk</small><b>{engagement.metrics.ctaClicks}</b></span><span><small>Komentar terbit</small><b>{engagement.metrics.approvedComments}</b></span><span><small>Menunggu</small><b>{engagement.metrics.pendingComments}</b></span></div>
        <div className="engagement-admin-grid"><section><header><div><span>PERFORMA KONTEN</span><h2>Artikel teratas</h2></div><button onClick={() => void loadEngagement()}>Muat ulang</button></header><div className="top-article-list">{engagement.topArticles.map((article, index) => <article key={article.id}><b>{index + 1}</b><div><Link href={`/edukasi/${article.slug}`} target="_blank">{article.title} ↗</Link><small>{article.views} dilihat · {article.likes} bermanfaat · {article.shares} dibagikan · {article.ctaClicks} klik produk · {article.comments} komentar</small></div></article>)}</div></section>
          <section className="comment-moderation"><header><div><span>MODERASI</span><h2>Komentar pembaca</h2></div><select value={commentFilter} onChange={(event) => setCommentFilter(event.target.value as CommentStatus | 'all')}><option value="pending">Menunggu</option><option value="approved">Terbit</option><option value="spam">Spam</option><option value="rejected">Ditolak</option><option value="all">Semua</option></select></header><div className="moderation-list">{filteredComments.length ? filteredComments.map((comment) => <article key={comment.id}><header><div><b>{comment.name}</b><small>{formatAdminDate(comment.createdAt)} · <Link href={`/edukasi/${comment.articleSlug}`} target="_blank">{comment.articleTitle}</Link></small></div><em className={comment.status}>{comment.status === 'pending' ? 'Menunggu' : comment.status === 'approved' ? 'Terbit' : comment.status}</em></header><p>{comment.body}</p>{comment.email && <small>Email pribadi: {comment.email}</small>}<footer>{comment.status !== 'approved' && <button className="approve" onClick={() => void moderateComment(comment.id, 'approved')}>Terbitkan</button>}{comment.status !== 'rejected' && <button onClick={() => void moderateComment(comment.id, 'rejected')}>Tolak</button>}{comment.status !== 'spam' && <button onClick={() => void moderateComment(comment.id, 'spam')}>Spam</button>}<button className="delete" onClick={() => void removeComment(comment.id)}>Hapus</button></footer></article>) : <div className="manager-empty">Tidak ada komentar pada status ini.</div>}</div></section>
        </div>
      </section>}
    </main>
  </div>;
}
