import { describe, expect, it } from 'vitest';
import type { StoredArticle } from './article-store';
import { filterAndPaginateArticles } from './article-admin';

const article = (id: number, status: StoredArticle['status']): StoredArticle => ({
  id,
  slug: `artikel-${id}`,
  category: id % 2 ? 'Keluarga' : 'Komunikasi',
  title: `Artikel panduan ${id}`,
  excerpt: 'Ringkasan artikel yang cukup panjang untuk pengujian daftar konten admin.',
  publishedAt: '2026-08-30',
  publishedLabel: '30 Agustus 2026',
  readTime: '5 menit baca',
  tone: 'forest',
  featured: false,
  body: '## Pembahasan\n\nIsi artikel untuk pengujian pagination dan filter status pada dashboard admin.',
  takeaway: 'Inti artikel untuk pengujian.',
  status,
  contentType: 'education',
  productName: '',
  productUrl: '',
  ctaLabel: 'Pilih layanan tes',
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

describe('article manager list', () => {
  it('membatasi daftar menjadi 20 artikel per halaman', () => {
    const articles = Array.from({ length: 45 }, (_, index) => article(index + 1, 'draft'));
    const result = filterAndPaginateArticles(articles, { query: '', status: 'all', page: 2 });

    expect(result.items).toHaveLength(20);
    expect(result.items[0].id).toBe(21);
    expect(result.pageCount).toBe(3);
    expect(result.total).toBe(45);
  });

  it('memadukan filter status dan pencarian serta menormalkan nomor halaman', () => {
    const articles = [article(1, 'published'), article(2, 'archived'), article(3, 'archived')];
    const result = filterAndPaginateArticles(articles, { query: '3', status: 'archived', page: 9 });

    expect(result.items.map((item) => item.id)).toEqual([3]);
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(1);
  });
});
