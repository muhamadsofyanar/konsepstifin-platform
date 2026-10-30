import type {
  ArticleInput,
  ContentRole,
  SearchIntent,
  StoredArticle,
} from '@/lib/article-store';

export type ContentOptimizationChanges = Pick<
  ArticleInput,
  'primaryKeyword' | 'secondaryKeywords' | 'searchIntent' | 'topicCluster' | 'contentRole' | 'relatedSlugs'
>;

export type ContentOptimizationPlan = {
  id: number | string;
  slug: string;
  title: string;
  changes: ContentOptimizationChanges;
};

const stopWords = new Set([
  'yang', 'dan', 'dari', 'untuk', 'dengan', 'dalam', 'pada', 'atau', 'ini', 'itu', 'ke', 'di',
  'sebuah', 'cara', 'melalui', 'mulai', 'lebih', 'tanpa', 'sebelum', 'menjadi', 'mengenal',
  'memahami', 'panduan', 'tentang', 'bagi', 'anda', 'kita', 'sebagai', 'agar', 'adalah',
]);

function normalized(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value: string) {
  return [...new Set(normalized(value).split(/[\s-]+/)
    .filter((token) => token.length > 2 && !stopWords.has(token)))];
}

function wordCount(article: StoredArticle) {
  return article.body.replace(/^##?\s+/gm, '').replace(/^[-*]\s+/gm, '').split(/\s+/).filter(Boolean).length;
}

function derivePrimaryKeyword(title: string) {
  const cleanTitle = title.replace(/[↗]/g, '').replace(/\s+/g, ' ').trim();
  const firstClause = cleanTitle.split(/\s*[:–—|]\s*/)[0]?.trim() || cleanTitle;
  const source = firstClause.split(/\s+/).length >= 3 ? firstClause : cleanTitle;
  return source.split(/\s+/).slice(0, 8).join(' ').toLowerCase().slice(0, 100);
}

function deriveSecondaryKeywords(article: StoredArticle, primaryKeyword: string) {
  const primaryTokens = new Set(tokens(primaryKeyword));
  const candidates = tokens(`${article.title} ${article.category} ${article.excerpt}`)
    .filter((token) => !primaryTokens.has(token));
  const phrases = candidates.slice(0, 6).map((token) => `${token} STIFIn`);
  return [...new Set([...article.secondaryKeywords, ...phrases])].slice(0, 10);
}

function deriveIntent(article: StoredArticle): SearchIntent {
  const haystack = normalized(`${article.title} ${article.category} ${article.contentType}`);
  if (article.contentType === 'affiliate') return 'commercial';
  if (article.contentType === 'product' || /\b(harga|paket|layanan|pesan|daftar|produk|promotor)\b/.test(haystack)) {
    return /\b(pesan|daftar|checkout|beli)\b/.test(haystack) ? 'transactional' : 'commercial';
  }
  return 'informational';
}

function deriveCluster(article: StoredArticle) {
  const haystack = normalized(`${article.title} ${article.category} ${article.primaryKeyword}`);
  const rules: Array<[RegExp, string]> = [
    [/\b(anak|belajar|sekolah|guru|pendidikan)\b/, 'STIFIn untuk Belajar & Anak'],
    [/\b(keluarga|pasangan|komunikasi|ayah|ibu|orang tua|kedekatan)\b/, 'STIFIn untuk Keluarga & Komunikasi'],
    [/\b(tim|kolaborasi|organisasi|kerja|kepemimpinan)\b/, 'STIFIn untuk Tim & Organisasi'],
    [/\b(promotor|affiliate|afiliasi|bisnis|pemasaran|lisensi)\b/, 'Jalur Promotor & Affiliate'],
    [/\b(sensing|thinking|intuiting|feeling|insting|mesin kecerdasan|cara kerja)\b/, 'Dasar & Cara Kerja STIFIn'],
    [/\b(diri|potensi|pengembangan|profesi|karier|bakat)\b/, 'Pengembangan Diri dengan STIFIn'],
  ];
  return rules.find(([pattern]) => pattern.test(haystack))?.[1]
    || article.topicCluster.trim()
    || article.category.trim()
    || 'Edukasi STIFIn';
}

function overlapScore(left: StoredArticle, right: StoredArticle, clusters: Map<string, string>) {
  const leftTokens = new Set(tokens(`${left.title} ${left.category}`));
  const rightTokens = new Set(tokens(`${right.title} ${right.category}`));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const sameCluster = clusters.get(left.slug) === clusters.get(right.slug) ? 20 : 0;
  const sameCategory = left.category === right.category ? 5 : 0;
  return sameCluster + sameCategory + overlap;
}

export function buildBatchOptimizationPlan(
  articles: StoredArticle[],
  selectedIds?: Array<number | string>,
): ContentOptimizationPlan[] {
  const selected = selectedIds ? new Set(selectedIds.map(String)) : null;
  const clusters = new Map(articles.map((article) => [article.slug, deriveCluster(article)]));
  const grouped = new Map<string, StoredArticle[]>();
  for (const article of articles) {
    const cluster = clusters.get(article.slug) || 'Edukasi STIFIn';
    grouped.set(cluster, [...(grouped.get(cluster) || []), article]);
  }
  const pillars = new Map<string, string>();
  for (const [cluster, members] of grouped) {
    const explicitPillar = members.find((article) => article.contentRole === 'pillar' && article.topicCluster.trim());
    const pillar = explicitPillar || [...members].sort((left, right) => wordCount(right) - wordCount(left))[0];
    if (pillar) pillars.set(cluster, pillar.slug);
  }

  return articles.filter((article) => !selected || selected.has(String(article.id))).map((article) => {
    const primaryKeyword = article.primaryKeyword.trim() || derivePrimaryKeyword(article.title);
    const topicCluster = clusters.get(article.slug) || 'Edukasi STIFIn';
    const isPillar = pillars.get(topicCluster) === article.slug;
    const contentRole: ContentRole = isPillar ? 'pillar' : wordCount(article) >= 500 ? 'cluster' : 'supporting';
    const relatedCandidates = articles
      .filter((candidate) => candidate.slug !== article.slug && candidate.status === 'published')
      .sort((left, right) => overlapScore(article, right, clusters) - overlapScore(article, left, clusters))
      .slice(0, 4)
      .map((candidate) => candidate.slug);
    const relatedSlugs = [...new Set([...article.relatedSlugs, ...relatedCandidates])].slice(0, 6);
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      changes: {
        primaryKeyword,
        secondaryKeywords: deriveSecondaryKeywords(article, primaryKeyword),
        searchIntent: deriveIntent(article),
        topicCluster,
        contentRole,
        relatedSlugs,
      },
    };
  });
}

export function applyOptimizationPlan(article: StoredArticle, plan: ContentOptimizationPlan): StoredArticle {
  return { ...article, ...plan.changes };
}

export function storedArticleToInput(article: StoredArticle): ArticleInput {
  const input: Partial<StoredArticle> = { ...article };
  delete input.id;
  delete input.publishedLabel;
  delete input.createdAt;
  delete input.updatedAt;
  return input as ArticleInput;
}
