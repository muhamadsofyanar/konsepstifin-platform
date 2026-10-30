import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/article-store';
import { getIndexableRegions, type LocalRegionSummary } from '@/lib/local-seo';
import { getPromoterCatalogStatus, getServedRegionCodes } from '@/lib/promoter-store';
import { getServiceCoverageOverrides } from '@/lib/service-coverage-store';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';

export const siteUrl = 'https://konsepstifin.com';
const STATIC_UPDATED_AT = new Date('2026-08-29T00:00:00.000Z');

type LocalSitemapInput = Pick<LocalRegionSummary, 'canonicalSlug' | 'indexable' | 'updatedAt'>;

function storedDate(value: string | Date | null | undefined, fallback = STATIC_UPDATED_AT) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function staticSitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: STATIC_UPDATED_AT, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/tes-stifin`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/jadi-promotor`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/promotor`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'daily', priority: 0.82 },
    { url: `${siteUrl}/affiliate`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${siteUrl}/edukasi`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/wilayah`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'weekly', priority: 0.68 },
    { url: `${siteUrl}/tentang`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${siteUrl}/kontak`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${siteUrl}/privasi`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'yearly', priority: 0.35 },
    { url: `${siteUrl}/ketentuan`, lastModified: STATIC_UPDATED_AT, changeFrequency: 'yearly', priority: 0.35 },
  ];
}

export async function articleSitemap(): Promise<MetadataRoute.Sitemap> {
  return (await getPublishedArticles()).map((article) => ({
    url: `${siteUrl}/edukasi/${article.slug}`,
    lastModified: storedDate(article.updatedAt || article.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: article.contentRole === 'pillar' ? 0.78 : 0.7,
  }));
}

export function buildLocalCitySitemap(
  regions: LocalSitemapInput[],
  intent: 'test' | 'promoter',
): MetadataRoute.Sitemap {
  const route = intent === 'test' ? 'tes-stifin' : 'promotor-stifin';
  const priority = intent === 'test' ? 0.78 : 0.7;
  return regions.filter((region) => region.indexable).map((region) => ({
    url: `${siteUrl}/${route}/${region.canonicalSlug}`,
    lastModified: storedDate(region.updatedAt),
    changeFrequency: 'weekly' as const,
    priority,
  }));
}

async function directlyCoveredDistrictSitemap(regions: LocalRegionSummary[]): Promise<MetadataRoute.Sitemap> {
  const [served, overrides] = await Promise.all([
    getServedRegionCodes().catch(() => []),
    getServiceCoverageOverrides().catch(() => []),
  ]);
  const overrideDistricts = overrides.filter((item) => item.serviceable && item.evidenceNote.trim().length >= 10).map((item) => item.regionCode);
  const directDistricts = [...new Set([...served, ...overrideDistricts].filter((code) => code.split('.').length === 3))];
  const regionByCode = new Map(regions.map((region) => [region.regency.code, region]));
  const grouped = new Map<string, string[]>();
  for (const code of directDistricts) {
    const parent = code.split('.').slice(0, 2).join('.');
    grouped.set(parent, [...(grouped.get(parent) || []), code]);
  }
  const entries: MetadataRoute.Sitemap = [];
  for (const [parent, codes] of grouped) {
    const local = regionByCode.get(parent);
    if (!local) continue;
    const districts = await getWilayah('districts', parent).catch(() => []);
    for (const district of districts.filter((item) => codes.includes(item.code))) {
      entries.push({
        url: `${siteUrl}${wilayahChainPath([local.province, local.regency, district])}`,
        lastModified: storedDate(local.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.55,
      });
    }
  }
  return entries;
}

export async function regionSitemap(): Promise<MetadataRoute.Sitemap> {
  const regions = await getIndexableRegions();
  return [...buildLocalCitySitemap(regions, 'test'), ...await directlyCoveredDistrictSitemap(regions)];
}

export async function promoterSitemap(): Promise<MetadataRoute.Sitemap> {
  const [regions, status] = await Promise.all([
    getIndexableRegions(),
    getPromoterCatalogStatus().catch(() => null),
  ]);
  return [{
    url: `${siteUrl}/promotor`,
    lastModified: storedDate(status?.updatedAt || status?.source.lastSuccessAt),
    changeFrequency: 'daily',
    priority: 0.82,
  }, ...buildLocalCitySitemap(regions, 'promoter')];
}

export function maxSitemapTimestamp(entries: MetadataRoute.Sitemap) {
  return entries.reduce((latest, entry) => {
    const current = storedDate(entry.lastModified).toISOString();
    return current > latest ? current : latest;
  }, STATIC_UPDATED_AT.toISOString());
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function renderSitemap(entries: MetadataRoute.Sitemap) {
  const urls = entries.map((entry) => `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${storedDate(entry.lastModified).toISOString()}</lastmod>` : ''}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}${typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(2)}</priority>` : ''}</url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function renderSitemapIndex(items: Array<{ url: string; lastModified: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map((item) => `<sitemap><loc>${escapeXml(item.url)}</loc><lastmod>${storedDate(item.lastModified).toISOString()}</lastmod></sitemap>`).join('')}</sitemapindex>`;
}

export function xmlResponse(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
