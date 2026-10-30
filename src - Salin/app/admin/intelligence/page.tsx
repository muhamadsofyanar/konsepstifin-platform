import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured, getAdminArticles } from '@/lib/article-store';
import { buildContentIntelligence } from '@/lib/content-intelligence';
import { getPublicPromoters } from '@/lib/promoter-store';
import { getWilayah } from '@/lib/wilayah';
import IntelligenceActions from './intelligence-actions';

export const metadata = { title: 'Content Intelligence | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

const roleLabels = { pillar: 'Pilar', cluster: 'Cluster', supporting: 'Pendukung' } as const;

export default async function ContentIntelligencePage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const databaseReady = databaseConfigured();
  const [articles, provinces, promoters] = await Promise.all([
    databaseReady ? getAdminArticles() : Promise.resolve([]),
    getWilayah('provinces').catch(() => []),
    getPublicPromoters().catch(() => []),
  ]);
  const intelligence = buildContentIntelligence(articles);
  const localSeoRows = provinces.map((province) => {
    const coverage = promoters.filter((promoter) => promoter.active && promoter.regionCodes.some((code) => code === province.code || code.startsWith(`${province.code}.`)));
    return { province, coverage };
  }).sort((left, right) => right.coverage.length - left.coverage.length || left.province.name.localeCompare(right.province.name, 'id'));

  return <div className="article-admin intelligence-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Content Intelligence</b></nav><div><Link href="/admin/artikel">Artikel & AI</Link><Link href="/admin/produk">Produk & Harga</Link><Link href="/admin/pustaka">Pustaka STIFIn</Link><Link href="/admin/promotor">Pemetaan Promotor</Link><Link href="/edukasi" target="_blank">Lihat edukasi ↗</Link></div></header>
    <main>
      <section className="intelligence-hero"><div><span>SEO · AEO · GEO READINESS</span><h1>Pusat kendali topical authority.</h1><p>Audit ini mengukur faktor yang dapat dikendalikan tim: intent, pilar–cluster, kedalaman, sumber, pengalaman nyata, reviewer, freshness, dan internal link. Nilai bukan jaminan ranking atau kutipan AI.</p><div><Link className="public-cta" href="/admin/artikel">Perbaiki artikel →</Link><a href="/sitemap-index.xml" target="_blank" rel="noreferrer">Periksa sitemap ↗</a></div></div><aside className="readiness-scores"><span><small>SEO</small><strong>{intelligence.metrics.averageSeo}</strong></span><span><small>AEO</small><strong>{intelligence.metrics.averageAeo}</strong></span><span><small>GEO</small><strong>{intelligence.metrics.averageGeo}</strong></span></aside></section>

      {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> agar dashboard dapat membaca dan mengaudit artikel.</p></section>}

      <IntelligenceActions articleCount={articles.length} databaseReady={databaseReady} />

      <section className="intelligence-metrics"><article><small>Total konten</small><b>{intelligence.metrics.total}</b><span>{intelligence.metrics.published} sudah terbit</span></article><article><small>Konten kuat</small><b>{intelligence.metrics.strong}</b><span>skor minimal 80</span></article><article><small>Prioritas perbaikan</small><b>{intelligence.metrics.needsReview}</b><span>skor di bawah 60</span></article><article><small>Belum dipetakan</small><b>{intelligence.metrics.unmapped}</b><span>keyword atau cluster kosong</span></article><article className={intelligence.metrics.conflicts ? 'warning' : ''}><small>Potensi kanibalisasi</small><b>{intelligence.metrics.conflicts}</b><span>pasangan konten perlu diperiksa</span></article></section>

      <div className="intelligence-layout">
        <section className="intelligence-panel priority-panel"><header><div><span>PRIORITAS EDITORIAL</span><h2>Pilih satu artikel untuk disiapkan ke tahap review</h2></div><Link href="/admin/artikel">Buka editor →</Link></header><div className="audit-priority-list">{intelligence.audits.slice(0, 12).map((audit) => <article key={audit.article.slug}><div className={`audit-score ${audit.grade}`}><b>{audit.score}</b><small>/100</small></div><div><Link href={`/edukasi/${audit.article.slug}`} target="_blank">{audit.article.title} ↗</Link><small>{audit.article.topicCluster || 'Belum ada cluster'} · {roleLabels[audit.article.contentRole]} · {audit.wordCount} kata</small><p>{audit.checks.filter((check) => !check.passed).slice(0, 3).map((check) => check.label).join(' · ') || 'Semua pemeriksaan utama terpenuhi.'}</p></div>{typeof audit.article.id === 'number' ? <Link className="edit-audit ai-audit-action" href={`/admin/artikel?edit=${audit.article.id}&optimize=1`}>Siapkan revisi AI</Link> : <Link className="edit-audit" href="/admin/artikel">Edit</Link>}</article>)}</div></section>

        <aside className="intelligence-panel conflict-panel"><header><div><span>ANTI-KANIBALISASI</span><h2>Konten yang saling berdekatan</h2></div></header>{intelligence.conflicts.length ? <div>{intelligence.conflicts.map((conflict) => <article key={`${conflict.first.slug}-${conflict.second.slug}`}><b>{conflict.reason}</b><span>{conflict.first.title}</span><i>berhadapan dengan</i><span>{conflict.second.title}</span></article>)}</div> : <p className="intelligence-empty">Tidak ditemukan keyword sama atau judul yang terlalu mirip dalam cluster yang sama.</p>}</aside>
      </div>

      <section className="intelligence-panel cluster-panel"><header><div><span>PETA TOPICAL AUTHORITY</span><h2>Pilar dan cluster konten</h2></div><small>{intelligence.clusters.length} cluster terdeteksi</small></header><div className="cluster-grid">{intelligence.clusters.map((cluster) => <article key={cluster.name}><header><div><small>CLUSTER</small><h3>{cluster.name}</h3></div><b>{cluster.averageScore}</b></header>{cluster.pillar ? <Link className="cluster-pillar" href={`/edukasi/${cluster.pillar.slug}`} target="_blank"><span>PILAR</span>{cluster.pillar.title}</Link> : <div className="missing-pillar"><span>!</span><p>Belum ada artikel pilar. Pilih satu artikel utama di editor.</p></div>}<ul>{cluster.articles.filter((article) => article.slug !== cluster.pillar?.slug).map((article) => <li key={article.slug}><span>{roleLabels[article.contentRole]}</span><Link href={`/edukasi/${article.slug}`} target="_blank">{article.title}</Link></li>)}</ul></article>)}</div></section>

      <section className="intelligence-panel local-seo-panel"><header><div><span>LOCAL SEO PLANNER</span><h2>Cakupan wilayah dan kesiapan halaman lokal</h2></div><small>{localSeoRows.filter((row) => row.coverage.length).length} dari {localSeoRows.length} provinsi memiliki pemetaan</small></header><div className="local-seo-rules"><span><b>Provinsi</b> Index</span><span><b>Kabupaten/kota</b> Index</span><span><b>Kecamatan</b> Index jika ada promotor</span><span><b>Desa/kelurahan</b> Noindex</span></div><div className="local-seo-table">{localSeoRows.map(({ province, coverage }) => <article key={province.code}><div><b>{province.name}</b><small>Kode {province.code}</small></div><strong>{coverage.length}</strong><span>{coverage.length ? 'Memiliki cakupan promotor' : 'Butuh pemetaan atau konten lokal'}</span></article>)}</div><footer><a href="/sitemaps/regions.xml" target="_blank" rel="noreferrer">Sitemap wilayah ↗</a><span>Search Console dan Core Web Vitals: integrasi tahap berikutnya</span></footer></section>

      <section className="intelligence-panel audit-table-panel"><header><div><span>AUDIT PER ARTIKEL</span><h2>Masalah dan rekomendasi internal link</h2></div></header><div className="intelligence-table"><div className="intelligence-table-head"><span>Artikel</span><span>Intent</span><span>Skor</span><span>Tindakan utama</span><span>Link yang disarankan</span></div>{intelligence.audits.map((audit) => <article key={audit.article.slug}><div><b>{audit.article.title}</b><small>{audit.article.primaryKeyword || 'Keyword belum ditentukan'}</small></div><span>{audit.article.searchIntent}<small className="dimension-score">SEO {audit.scores.seo} · AEO {audit.scores.aeo} · GEO {audit.scores.geo}</small></span><strong className={audit.grade}>{audit.score}</strong><p>{audit.checks.filter((check) => !check.passed).slice(0, 2).map((check) => check.guidance).join(' ') || 'Siap dipertahankan dan dipantau.'}</p><small>{audit.suggestedLinks.slice(0, 2).map((link) => link.title).join(' · ') || 'Belum ada kandidat kuat'}</small></article>)}</div></section>
    </main>
  </div>;
}
