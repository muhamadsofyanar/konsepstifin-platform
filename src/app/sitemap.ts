import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/article-store';
import { getWilayah, wilayahChainPath } from '@/lib/wilayah';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://konsepstifin.com';
  const articles = await getPublishedArticles();
  let provinces = [] as Awaited<ReturnType<typeof getWilayah>>;
  try { provinces = await getWilayah('provinces'); } catch { provinces = []; }
  return [
    { url: baseUrl, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/tes-stifin`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/jadi-promotor`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/affiliate`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.82 },
    { url: `${baseUrl}/edukasi`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/wilayah`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...provinces.map((province) => ({ url: `${baseUrl}${wilayahChainPath([province])}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.65 })),
    ...articles.map((article) => ({ url: `${baseUrl}/edukasi/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
