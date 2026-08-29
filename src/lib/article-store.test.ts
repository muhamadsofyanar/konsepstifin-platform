import { describe, expect, it } from 'vitest';
import type { ArticleInput } from './article-store';
import { validateArticleInput } from './article-store';

const validArticle = (overrides: Partial<ArticleInput> = {}): ArticleInput => ({
  slug: 'panduan-komunikasi-keluarga',
  category: 'Keluarga',
  title: 'Panduan Komunikasi Keluarga yang Lebih Terarah',
  excerpt: 'Panduan praktis untuk memulai percakapan keluarga dengan konteks yang jelas dan langkah yang dapat dievaluasi.',
  publishedAt: '2026-08-30',
  readTime: '6 menit baca',
  tone: 'forest',
  featured: false,
  body: '## Mulai dari konteks\n\nSetiap keluarga memiliki situasi yang berbeda. Catat contoh nyata, bicarakan kebutuhan masing-masing, lalu evaluasi satu perubahan kecil bersama-sama.',
  takeaway: 'Gunakan hasil tes sebagai bahan percakapan, bukan keputusan tunggal.',
  status: 'draft',
  contentType: 'education',
  productName: '',
  productUrl: '',
  ctaLabel: 'Pilih layanan tes',
  scheduledAt: '',
  sourceReferences: [],
  primaryKeyword: 'komunikasi keluarga',
  secondaryKeywords: [],
  searchIntent: 'informational',
  topicCluster: 'STIFIn untuk Keluarga',
  contentRole: 'supporting',
  experienceEvidence: '',
  reviewerName: '',
  reviewerRole: '',
  reviewedAt: '',
  relatedSlugs: [],
  ...overrides,
});

describe('article input', () => {
  it('menerima status archived tanpa menjadikannya artikel publik', () => {
    expect(validateArticleInput(validArticle({ status: 'archived' })).status).toBe('archived');
  });

  it('menghapus script dan karakter kontrol sebelum konten disimpan', () => {
    const result = validateArticleInput(validArticle({
      title: 'Panduan\u0000 Komunikasi Keluarga yang Lebih Terarah',
      body: '## Mulai dari konteks\n\nSetiap keluarga memiliki situasi yang berbeda. <script>alert("rahasia")</script> Catat contoh nyata, bicarakan kebutuhan masing-masing, lalu evaluasi satu perubahan kecil bersama-sama.',
    }));

    expect(result.title).not.toContain('\u0000');
    expect(result.body).not.toMatch(/<script|rahasia|alert\(/i);
  });
});
