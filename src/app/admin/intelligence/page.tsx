import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured, getAdminArticles } from '@/lib/article-store';
import { buildContentIntelligence } from '@/lib/content-intelligence';

export const metadata = { title: 'Content Intelligence | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

const roleLabels = { pillar: 'Pilar', cluster: 'Cluster', supporting: 'Pendukung' } as const;

export default async function ContentIntelligencePage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const databaseReady = databaseConfigured();
  const articles = databaseReady ? await getAdminArticles() : [];
  const intelligence = buildContentIntelligence(articles);

  return <div className="article-admin intelligence-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Content Intelligence</b></nav><div><Link href="/admin/artikel">Artikel & AI</Link><Link href="/admin/produk">Produk & Harga</Link><Link href="/admin/pustaka">Pustaka STIFIn</Link><Link href="/edukasi" target="_blank">Lihat edukasi ↗</Link></div></header>
    <main>
      <section className="intelligence-hero"><div><span>SEO · AEO · GEO READINESS</span><h1>Pusat kendali topical authority.</h1><p>Audit ini mengukur faktor yang dapat dikendalikan tim: intent, pilar–cluster, kedalaman, sumber, pengalaman nyata, reviewer, freshness, dan internal link. Nilai bukan jaminan ranking atau kutipan AI.</p><div><Link className="public-cta" href="/admin/artikel">Perbaiki artikel →</Link><a href="/sitemap.xml" target="_blank" rel="noreferrer">Periksa sitemap ↗</a></div></div><aside><small>SKOR KESIAPAN RATA-RATA</small><strong>{intelligence.metrics.averageScore}</strong><span>dari 100</span></aside></section>

      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> agar dashboard dapat membaca dan mengaudit artikel.</p></section>}

      <section className="intelligence-metrics"><article><small>Total konten</small><b>{intelligence.metrics.total}</b><span>{intelligence.metrics.published} sudah terbit</span></article><article><small>Konten kuat</small><b>{intelligence.metrics.strong}</b><span>skor minimal 80</span></article><article><small>Prioritas perbaikan</small><b>{intelligence.metrics.needsReview}</b><span>skor di bawah 60</span></article><article><small>Belum dipetakan</small><b>{intelligence.metrics.unmapped}</b><span>keyword atau cluster kosong</span></article><article className={intelligence.metrics.conflicts ? 'warning' : ''}><small>Potensi kanibalisasi</small><b>{intelligence.metrics.conflicts}</b><span>pasangan konten perlu diperiksa</span></article></section>

      <div className="intelligence-layout">
        <section className="intelligence-panel priority-panel"><header><div><span>PRIORITAS EDITORIAL</span><h2>Artikel yang paling perlu diperbaiki</h2></div><Link href="/admin/artikel">Buka editor →</Link></header><div className="audit-priority-list">{intelligence.audits.slice(0, 12).map((audit) => <article key={audit.article.slug}><div className={`audit-score ${audit.grade}`}><b>{audit.score}</b><small>/100</small></div><div><Link href={`/edukasi/${audit.article.slug}`} target="_blank">{audit.article.title} ↗</Link><small>{audit.article.topicCluster || 'Belum ada cluster'} · {roleLabels[audit.article.contentRole]} · {audit.wordCount} kata</small><p>{audit.checks.filter((check) => !check.passed).slice(0, 3).map((check) => check.label).join(' · ') || 'Semua pemeriksaan utama terpenuhi.'}</p></div><Link className="edit-audit" href="/admin/artikel">Edit</Link></article>)}</div></section>

        <aside className="intelligence-panel conflict-panel"><header><div><span>ANTI-KANIBALISASI</span><h2>Konten yang saling berdekatan</h2></div></header>{intelligence.conflicts.length ? <div>{intelligence.conflicts.map((conflict) => <article key={`${conflict.first.slug}-${conflict.second.slug}`}><b>{conflict.reason}</b><span>{conflict.first.title}</span><i>berhadapan dengan</i><span>{conflict.second.title}</span></article>)}</div> : <p className="intelligence-empty">Tidak ditemukan keyword sama atau judul yang terlalu mirip dalam cluster yang sama.</p>}</aside>
      </div>

      <section className="intelligence-panel cluster-panel"><header><div><span>PETA TOPICAL AUTHORITY</span><h2>Pilar dan cluster konten</h2></div><small>{intelligence.clusters.length} cluster terdeteksi</small></header><div className="cluster-grid">{intelligence.clusters.map((cluster) => <article key={cluster.name}><header><div><small>CLUSTER</small><h3>{cluster.name}</h3></div><b>{cluster.averageScore}</b></header>{cluster.pillar ? <Link className="cluster-pillar" href={`/edukasi/${cluster.pillar.slug}`} target="_blank"><span>PILAR</span>{cluster.pillar.title}</Link> : <div className="missing-pillar"><span>!</span><p>Belum ada artikel pilar. Pilih satu artikel utama di editor.</p></div>}<ul>{cluster.articles.filter((article) => article.slug !== cluster.pillar?.slug).map((article) => <li key={article.slug}><span>{roleLabels[article.contentRole]}</span><Link href={`/edukasi/${article.slug}`} target="_blank">{article.title}</Link></li>)}</ul></article>)}</div></section>

      <section className="intelligence-panel audit-table-panel"><header><div><span>AUDIT PER ARTIKEL</span><h2>Masalah dan rekomendasi internal link</h2></div></header><div className="intelligence-table"><div className="intelligence-table-head"><span>Artikel</span><span>Intent</span><span>Skor</span><span>Tindakan utama</span><span>Link yang disarankan</span></div>{intelligence.audits.map((audit) => <article key={audit.article.slug}><div><b>{audit.article.title}</b><small>{audit.article.primaryKeyword || 'Keyword belum ditentukan'}</small></div><span>{audit.article.searchIntent}</span><strong className={audit.grade}>{audit.score}</strong><p>{audit.checks.filter((check) => !check.passed).slice(0, 2).map((check) => check.guidance).join(' ') || 'Siap dipertahankan dan dipantau.'}</p><small>{audit.suggestedLinks.slice(0, 2).map((link) => link.title).join(' · ') || 'Belum ada kandidat kuat'}</small></article>)}</div></section>
    </main>
  </div>;
}

