import type { StoredArticle } from '@/lib/article-store';

export type AuditCheck = {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  guidance: string;
};

export type ArticleAudit = {
  article: StoredArticle;
  score: number;
  grade: 'kuat' | 'cukup' | 'lemah';
  wordCount: number;
  headingCount: number;
  checks: AuditCheck[];
  conflicts: string[];
  suggestedLinks: Array<{ slug: string; title: string; score: number }>;
};

export type ContentCluster = {
  name: string;
  pillar?: StoredArticle;
  articles: StoredArticle[];
  averageScore: number;
};

const stopWords = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'atau', 'pada', 'dalam', 'ini', 'itu',
  'cara', 'adalah', 'sebagai', 'agar', 'lebih', 'bagi', 'tentang', 'melalui', 'anda', 'kita',
  'stifin', 'konsep', 'tes', 'menjadi', 'mengenal', 'memahami', 'panduan', 'mengapa',
]);

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value: string) {
  return [...new Set(normalize(value).split(/[\s-]+/).filter((token) => token.length > 2 && !stopWords.has(token)))];
}

function similarity(left: string, right: string) {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.min(a.size, b.size);
}

function ageInDays(article: StoredArticle) {
  const value = article.updatedAt || article.publishedAt;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor((Date.now() - time) / 86_400_000) : 9999;
}

export function detectCannibalization(articles: StoredArticle[]) {
  const pairs: Array<{ first: StoredArticle; second: StoredArticle; reason: string }> = [];
  for (let firstIndex = 0; firstIndex < articles.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < articles.length; secondIndex += 1) {
      const first = articles[firstIndex];
      const second = articles[secondIndex];
      const firstKeyword = normalize(first.primaryKeyword);
      const secondKeyword = normalize(second.primaryKeyword);
      if (firstKeyword && firstKeyword === secondKeyword) {
        pairs.push({ first, second, reason: `Keyword utama sama: “${first.primaryKeyword}”` });
        continue;
      }
      const sameCluster = normalize(first.topicCluster) && normalize(first.topicCluster) === normalize(second.topicCluster);
      const titleSimilarity = similarity(first.title, second.title);
      if (sameCluster && titleSimilarity >= 0.72) {
        pairs.push({ first, second, reason: `Judul sangat mirip dalam cluster ${first.topicCluster}` });
      }
    }
  }
  return pairs;
}

export function suggestInternalLinks(article: StoredArticle, articles: StoredArticle[]) {
  const sourceTokens = `${article.primaryKeyword} ${article.secondaryKeywords.join(' ')} ${article.title}`;
  return articles
    .filter((candidate) => candidate.slug !== article.slug && candidate.status === 'published')
    .map((candidate) => {
      let score = similarity(sourceTokens, `${candidate.primaryKeyword} ${candidate.secondaryKeywords.join(' ')} ${candidate.title}`) * 10;
      if (article.topicCluster && normalize(article.topicCluster) === normalize(candidate.topicCluster)) score += 7;
      if (article.category === candidate.category) score += 3;
      if (candidate.contentRole === 'pillar') score += 3;
      return { slug: candidate.slug, title: candidate.title, score: Math.round(score * 10) / 10 };
    })
    .filter((candidate) => candidate.score >= 2)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

export function auditArticle(article: StoredArticle, articles: StoredArticle[]): ArticleAudit {
  const keyword = normalize(article.primaryKeyword);
  const title = normalize(article.title);
  const excerpt = article.excerpt.trim();
  const wordCount = article.body.replace(/^##?\s+/gm, '').replace(/^[-*]\s+/gm, '').split(/\s+/).filter(Boolean).length;
  const headingCount = (article.body.match(/^##\s+/gm) || []).length;
  const conflicts = detectCannibalization(articles)
    .filter((pair) => pair.first.slug === article.slug || pair.second.slug === article.slug)
    .map((pair) => pair.first.slug === article.slug ? pair.second.title : pair.first.title);
  const suggestions = suggestInternalLinks(article, articles);
  const checks: AuditCheck[] = [
    { id: 'keyword', label: 'Keyword utama ditentukan', passed: keyword.length >= 3, points: 8, guidance: 'Tentukan satu frasa pencarian utama yang spesifik.' },
    { id: 'keyword-title', label: 'Keyword hadir pada judul', passed: Boolean(keyword && title.includes(keyword)), points: 8, guidance: 'Masukkan keyword secara alami pada judul.' },
    { id: 'title', label: 'Panjang judul efektif', passed: article.title.length >= 35 && article.title.length <= 70, points: 8, guidance: 'Pertahankan judul sekitar 35–70 karakter.' },
    { id: 'excerpt', label: 'Ringkasan siap untuk hasil pencarian', passed: excerpt.length >= 110 && excerpt.length <= 180, points: 7, guidance: 'Buat ringkasan 110–180 karakter yang langsung menjawab kebutuhan.' },
    { id: 'structure', label: 'Struktur jawaban bertahap', passed: headingCount >= 5, points: 8, guidance: 'Gunakan sedikitnya lima subjudul yang menjawab pertanyaan turunan.' },
    { id: 'depth', label: 'Kedalaman konten memadai', passed: wordCount >= 800, points: 10, guidance: 'Perdalam artikel hingga sedikitnya 800 kata yang benar-benar berguna.' },
    { id: 'sources', label: 'Memiliki jejak sumber', passed: article.sourceReferences.length > 0, points: 10, guidance: 'Hubungkan artikel dengan Pustaka STIFIn atau referensi yang dapat diperiksa.' },
    { id: 'experience', label: 'Memiliki pengalaman atau bukti nyata', passed: article.experienceEvidence.trim().length >= 40, points: 10, guidance: 'Tambahkan konteks kegiatan, lokasi, tanggal, atau pengalaman tim yang benar-benar terjadi.' },
    { id: 'reviewer', label: 'Sudah ditinjau manusia', passed: Boolean(article.reviewerName && article.reviewerRole && article.reviewedAt), points: 10, guidance: 'Isi nama, peran, dan tanggal reviewer sebelum publikasi.' },
    { id: 'links', label: 'Terhubung ke artikel terkait', passed: article.relatedSlugs.length >= 2, points: 8, guidance: `Tambahkan minimal dua internal link${suggestions.length ? `, misalnya ${suggestions.slice(0, 2).map((item) => item.title).join(' dan ')}` : ''}.` },
    { id: 'cluster', label: 'Masuk peta pilar–cluster', passed: Boolean(article.topicCluster && article.contentRole), points: 7, guidance: 'Tentukan nama cluster dan peran artikel sebagai pilar, cluster, atau pendukung.' },
    { id: 'freshness', label: 'Ditinjau dalam 180 hari', passed: ageInDays(article) <= 180, points: 6, guidance: 'Tinjau ulang informasi, tautan, harga, dan contoh artikel.' },
  ];
  const earned = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
  const penalty = Math.min(15, conflicts.length * 5);
  const score = Math.max(0, earned - penalty);
  return {
    article,
    score,
    grade: score >= 80 ? 'kuat' : score >= 60 ? 'cukup' : 'lemah',
    wordCount,
    headingCount,
    checks,
    conflicts,
    suggestedLinks: suggestions,
  };
}

export function buildContentIntelligence(articles: StoredArticle[]) {
  const audits = articles.map((article) => auditArticle(article, articles)).sort((left, right) => left.score - right.score);
  const auditBySlug = new Map(audits.map((audit) => [audit.article.slug, audit]));
  const clusterMap = new Map<string, StoredArticle[]>();
  for (const article of articles) {
    const name = article.topicCluster.trim() || article.category || 'Belum dipetakan';
    clusterMap.set(name, [...(clusterMap.get(name) || []), article]);
  }
  const clusters: ContentCluster[] = [...clusterMap.entries()].map(([name, clusterArticles]) => ({
    name,
    pillar: clusterArticles.find((article) => article.contentRole === 'pillar'),
    articles: clusterArticles.sort((left, right) => left.contentRole.localeCompare(right.contentRole)),
    averageScore: Math.round(clusterArticles.reduce((total, article) => total + (auditBySlug.get(article.slug)?.score || 0), 0) / clusterArticles.length),
  })).sort((left, right) => right.articles.length - left.articles.length);
  const conflicts = detectCannibalization(articles);
  return {
    audits,
    clusters,
    conflicts,
    metrics: {
      total: articles.length,
      published: articles.filter((article) => article.status === 'published').length,
      averageScore: articles.length ? Math.round(audits.reduce((total, audit) => total + audit.score, 0) / articles.length) : 0,
      strong: audits.filter((audit) => audit.grade === 'kuat').length,
      needsReview: audits.filter((audit) => audit.score < 60).length,
      unmapped: articles.filter((article) => !article.topicCluster || !article.primaryKeyword).length,
      conflicts: conflicts.length,
    },
  };
}
