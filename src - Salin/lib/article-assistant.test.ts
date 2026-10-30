import { describe, expect, it } from 'vitest';
import type { StoredArticle } from './article-store';
import { buildArticleRevisionPreview } from './article-assistant';

const article = (overrides: Partial<StoredArticle> = {}): StoredArticle => ({
  id: 1,
  slug: 'cara-belajar-anak',
  category: 'Belajar & Anak',
  title: 'Cara Belajar Anak dengan STIFIn',
  excerpt: 'Ringkasan artikel lama yang menjelaskan cara belajar anak secara singkat dan bertanggung jawab.',
  publishedAt: '2026-08-01',
  publishedLabel: '1 Agustus 2026',
  readTime: '5 menit baca',
  tone: 'forest',
  featured: false,
  body: '## Pembuka\n\nIsi artikel lama yang cukup panjang untuk menjadi dasar revisi dan tetap dipertahankan sebagai konteks.',
  takeaway: 'Setiap pendekatan belajar perlu disesuaikan dengan konteks anak.',
  status: 'published',
  contentType: 'education',
  productName: '',
  productUrl: '',
  ctaLabel: 'Pilih layanan',
  scheduledAt: '2026-09-01T02:00:00.000Z',
  sourceReferences: [{ sourceId: 7, title: 'Workbook STIFIn', category: 'Workbook', pageNumber: 12, accessLevel: 'reference' }],
  primaryKeyword: 'cara belajar anak',
  secondaryKeywords: ['belajar STIFIn'],
  searchIntent: 'informational',
  topicCluster: 'STIFIn untuk Belajar & Anak',
  contentRole: 'cluster',
  experienceEvidence: 'Kegiatan pendampingan keluarga di Bandung pada Januari 2026.',
  reviewerName: 'Editor Manusia',
  reviewerRole: 'Editor',
  reviewedAt: '2026-08-02',
  relatedSlugs: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  ...overrides,
});

describe('article assistant', () => {
  it('membuat revisi lengkap tetapi selalu menyimpannya sebagai review', () => {
    const original = article();
    const preview = buildArticleRevisionPreview(original, {
      title: 'Cara Mendampingi Anak Belajar dengan STIFIn',
      excerpt: 'Kenali situasi belajar anak, pahami pola yang terlihat, lalu pilih penyesuaian kecil yang dapat dicoba di rumah bersama keluarga.',
      body: '## Mulai dari situasi anak\n\nAnak dapat merespons cara belajar yang sama dengan hasil berbeda. Orang tua perlu mengamati konteks sebelum memilih penyesuaian.\n\n## Gunakan hasil sebagai bahan percakapan\n\nHasil tes membantu menyediakan bahasa awal, bukan keputusan tunggal.\n\n## Langkah praktis\n\nCoba satu perubahan, amati respons, lalu evaluasi bersama anak.',
      takeaway: 'Gunakan hasil sebagai awal percakapan dan uji penyesuaian kecil dalam situasi nyata.',
      readTime: '7 menit baca',
      editorialNotes: 'Periksa kembali contoh penerapan sebelum terbit.',
    }, [original]);

    expect(preview.after).toMatchObject({
      title: 'Cara Mendampingi Anak Belajar dengan STIFIn',
      status: 'review',
      scheduledAt: '',
      primaryKeyword: 'cara mendampingi anak belajar dengan stifin',
    });
    expect(preview.after.sourceReferences).toEqual(original.sourceReferences);
    expect(preview.after.experienceEvidence).toBe(original.experienceEvidence);
    expect(preview.after.reviewerName).toBe(original.reviewerName);
    expect(preview.summary.afterWords).toBeGreaterThan(preview.summary.beforeWords);
    expect(preview.editorialNotes).toContain('Periksa kembali');
  });

  it('menampilkan konflik keyword tanpa menghapus artikel lain', () => {
    const original = article();
    const competitor = article({ id: 2, slug: 'panduan-belajar-anak', title: 'Panduan Belajar Anak', primaryKeyword: 'cara mendampingi anak belajar dengan stifin' });
    const preview = buildArticleRevisionPreview(original, {
      title: 'Cara Mendampingi Anak Belajar dengan STIFIn',
    }, [original, competitor]);

    expect(preview.conflicts.join(' ')).toContain('Panduan Belajar Anak');
    expect(preview.after.relatedSlugs).toContain('panduan-belajar-anak');
  });
});
