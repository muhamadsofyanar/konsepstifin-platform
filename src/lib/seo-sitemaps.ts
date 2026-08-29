import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/article-store';
import { getServedRegionCodes } from '@/lib/promoter-store';
import { getWilayah, type Wilayah, wilayahChainPath } from '@/lib/wilayah';

export const siteUrl = 'https://konsepstifin.com';

export function staticSitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/tes-stifin`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/jadi-promotor`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/affiliate`, lastModified: now, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${siteUrl}/edukasi`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/wilayah`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/tentang`, lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${siteUrl}/kontak`, lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${siteUrl}/privasi`, lastModified: now, changeFrequency: 'yearly', priority: 0.35 },
    { url: `${siteUrl}/ketentuan`, lastModified: now, changeFrequency: 'yearly', priority: 0.35 },
  ];
}

export async function articleSitemap(): Promise<MetadataRoute.Sitemap> {
  return (await getPublishedArticles()).map((article) => ({
    url: `${siteUrl}/edukasi/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: article.contentRole === 'pillar' ? 0.78 : 0.7,
  }));
}

export async function regionSitemap(): Promise<MetadataRoute.Sitemap> {
  const provinces = await getWilayah('provinces').catch(() => []);
  const regencyGroups = await Promise.all(provinces.map(async (province) => ({
    province,
    regencies: await getWilayah('regencies', province.code).catch(() => []),
  })));
  const provinceByCode = new Map(provinces.map((province) => [province.code, province]));
  const regencyByCode = new Map<string, { province: Wilayah; regency: Wilayah }>();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  for (const { province, regencies } of regencyGroups) {
    entries.push({ url: `${siteUrl}${wilayahChainPath([province])}`, lastModified: now, changeFrequency: 'weekly', priority: 0.68 });
    for (const regency of regencies) {
      regencyByCode.set(regency.code, { province, regency });
      entries.push({ url: `${siteUrl}${wilayahChainPath([province, regency])}`, lastModified: now, changeFrequency: 'weekly', priority: 0.65 });
    }
  }
  const served = await getServedRegionCodes().catch(() => []);
  const districtParents = [...new Set(served.filter((code) => code.split('.').length === 3).map((code) => code.split('.').slice(0, 2).join('.')))];
  const districtGroups = await Promise.all(districtParents.map(async (parentCode) => ({
    parentCode,
    districts: await getWilayah('districts', parentCode).catch(() => []),
  })));
  const servedSet = new Set(served);
  for (const { parentCode, districts } of districtGroups) {
    const parents = regencyByCode.get(parentCode);
    if (!parents || !provinceByCode.has(parents.province.code)) continue;
    for (const district of districts.filter((item) => servedSet.has(item.code))) {
      entries.push({ url: `${siteUrl}${wilayahChainPath([parents.province, parents.regency, district])}`, lastModified: now, changeFrequency: 'weekly', priority: 0.55 });
    }
  }
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function renderSitemap(entries: MetadataRoute.Sitemap) {
  const urls = entries.map((entry) => `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : ''}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}${typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(2)}</priority>` : ''}</url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function xmlResponse(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
