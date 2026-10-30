import type { ArticleStatus, StoredArticle } from './article-store';

export type ArticleManagerStatus = ArticleStatus | 'all';

export function filterAndPaginateArticles(
  articles: StoredArticle[],
  options: { query: string; status: ArticleManagerStatus; page: number; pageSize?: number },
) {
  const query = options.query.trim().toLocaleLowerCase('id-ID');
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 20, 100));
  const filtered = articles.filter((article) => {
    if (options.status !== 'all' && article.status !== options.status) return false;
    return !query || `${article.title} ${article.category} ${article.slug}`.toLocaleLowerCase('id-ID').includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.max(1, Math.min(Math.trunc(options.page) || 1, pageCount));
  const start = (page - 1) * pageSize;

  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageCount };
}
