// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredArticle } from '@/lib/article-store';
import ArticleAssistantPanel from './article-assistant-panel';

const article = (overrides: Partial<StoredArticle> = {}): StoredArticle => ({
  id: 9, slug: 'artikel-lama', category: 'Keluarga', title: 'Judul Artikel Lama',
  excerpt: 'Ringkasan artikel lama yang cukup lengkap untuk disimpan dan diperiksa oleh editor manusia.',
  publishedAt: '2026-08-01', publishedLabel: '1 Agustus 2026', readTime: '5 menit baca', tone: 'forest', featured: false,
  body: '## Bagian lama\n\nIsi artikel lama yang menjadi dasar revisi dan tidak boleh dianggap sebagai bukti tambahan.',
  takeaway: 'Inti artikel lama tetap menjadi dasar.', status: 'published', contentType: 'education',
  productName: '', productUrl: '', ctaLabel: 'Pilih layanan', scheduledAt: '2026-09-01T02:00:00.000Z',
  sourceReferences: [], primaryKeyword: 'judul artikel lama', secondaryKeywords: [], searchIntent: 'informational',
  topicCluster: 'Keluarga', contentRole: 'supporting', experienceEvidence: '', reviewerName: '', reviewerRole: '', reviewedAt: '', relatedSlugs: [],
  ...overrides,
});

const generated = {
  title: 'Cara Memulai Percakapan Keluarga dengan STIFIn',
  excerpt: 'Mulai dari situasi keluarga, pahami perbedaan yang terlihat, lalu pilih satu penyesuaian komunikasi yang dapat dicoba bersama.',
  body: '## Mulai dari situasi nyata\n\nSetiap keluarga menghadapi pola komunikasi yang berbeda. Amati situasinya sebelum memilih pendekatan.\n\n## Gunakan sebagai bahan percakapan\n\nHasil membantu memberi bahasa awal dan bukan keputusan tunggal.\n\n## Coba langkah kecil\n\nPilih satu perubahan, jalankan, lalu evaluasi bersama.',
  takeaway: 'Gunakan hasil sebagai awal percakapan keluarga yang lebih terarah.',
  readTime: '7 menit baca',
};

describe('ArticleAssistantPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });
  afterEach(() => cleanup());

  it('menampilkan pratinjau dan menyimpan hasil hanya sebagai review', async () => {
    const onApplied = vi.fn();
    const saved = article({ ...generated, status: 'review', scheduledAt: '' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ article: generated, editorialNotes: 'Periksa contoh.' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ article: saved }), { status: 200 }));

    render(<ArticleAssistantPanel article={article()} allArticles={[article()]} enabled onApplied={onApplied} />);
    await userEvent.click(screen.getByRole('button', { name: 'Siapkan revisi AI' }));

    expect(await screen.findByRole('heading', { name: 'Pratinjau revisi' })).toBeInTheDocument();
    expect(screen.getByText('Judul Artikel Lama')).toBeInTheDocument();
    expect(screen.getByText(generated.title)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Simpan ke Review' }));

    await waitFor(() => expect(onApplied).toHaveBeenCalledWith(saved));
    const saveRequest = vi.mocked(fetch).mock.calls[1];
    expect(saveRequest[0]).toBe('/api/admin/articles/9');
    const body = JSON.parse(String((saveRequest[1] as RequestInit).body));
    expect(body).toMatchObject({ status: 'review', scheduledAt: '', title: generated.title });
  });

  it('membatalkan pratinjau tanpa menyimpan perubahan', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ article: generated }), { status: 200 }));
    render(<ArticleAssistantPanel article={article()} allArticles={[article()]} enabled onApplied={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Siapkan revisi AI' }));
    expect(await screen.findByRole('heading', { name: 'Pratinjau revisi' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Batalkan revisi' }));

    expect(screen.queryByRole('heading', { name: 'Pratinjau revisi' })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
