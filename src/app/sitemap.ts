import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/article-store';
import { getWilayahChainByCode, wilayahChainPath } from '@/lib/wilayah';
import { getServedRegionCodes } from '@/lib/promoter-store';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://konsepstifin.com';
  const articles = await getPublishedArticles();
  let servedChains: NonNullable<Awaited<ReturnType<typeof getWilayahChainByCode>>>[] = [];
  try {
    const codes = await getServedRegionCodes();
    const resolved = await Promise.all(codes.map((code) => getWilayahChainByCode(code)));
    servedChains = resolved.filter((chain): chain is NonNullable<typeof chain> => Boolean(chain));
  } catch { servedChains = []; }
  const serviceRegionEntries = [...new Map(servedChains.flatMap((chain) => chain.slice(0, 2).map((_, index) => {
    const targetChain = chain.slice(0, index + 1);
    const current = targetChain.at(-1)!;
    return [current.code, { url: `${baseUrl}${wilayahChainPath(targetChain)}`, lastModified: new Date('2026-08-29'), changeFrequency: 'weekly' as const, priority: targetChain.length === 1 ? 0.72 : 0.68 }];
  }))).values()];
  return [
    { url: baseUrl, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/tes-stifin`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/jadi-promotor`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/promotor`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.82 },
    { url: `${baseUrl}/tentang`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.55 },
    { url: `${baseUrl}/kontak`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.55 },
    { url: `${baseUrl}/privasi`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.35 },
    { url: `${baseUrl}/ketentuan`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.35 },
    { url: `${baseUrl}/affiliate`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.82 },
    { url: `${baseUrl}/edukasi`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/wilayah`, lastModified: new Date('2026-08-29'), changeFrequency: 'daily', priority: 0.9 },
    ...serviceRegionEntries,
    ...articles.map((article) => ({ url: `${baseUrl}/edukasi/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
