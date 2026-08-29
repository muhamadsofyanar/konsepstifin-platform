import { describe, expect, it } from 'vitest';
import { buildLocalCitySitemap, maxSitemapTimestamp, staticSitemap } from './seo-sitemaps';

const covered = [{
  canonicalSlug: 'kota-bandung-32-73',
  indexable: true,
  updatedAt: '2026-08-28T10:00:00.000Z',
}, {
  canonicalSlug: 'kota-tanpa-cakupan-99-99',
  indexable: false,
  updatedAt: '2026-08-29T10:00:00.000Z',
}];

describe('stable sitemap builders', () => {
  it('hanya memasukkan kota indexable dan tidak bergantung waktu eksekusi', () => {
    const first = buildLocalCitySitemap(covered, 'test');
    const second = buildLocalCitySitemap(covered, 'test');
    expect(second).toEqual(first);
    expect(first.map((entry) => entry.url)).toEqual([
      'https://konsepstifin.com/tes-stifin/kota-bandung-32-73',
    ]);
    expect(first.map((entry) => entry.url)).not.toContain(
      'https://konsepstifin.com/tes-stifin/kota-tanpa-cakupan-99-99',
    );
  });

  it('memakai tanggal sumber terbaru yang tersimpan', () => {
    const promoterEntries = buildLocalCitySitemap(covered, 'promoter');
    expect(promoterEntries[0].lastModified).toEqual(new Date('2026-08-28T10:00:00.000Z'));
    expect(maxSitemapTimestamp([...staticSitemap(), ...promoterEntries]))
      .toBe('2026-08-29T00:00:00.000Z');
  });
});
