import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/article-store';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://konsepstifin.com';
  const articles = await getPublishedArticles();
  return [
    { url: baseUrl, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/tes-stifin`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/jadi-promotor`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/edukasi`, lastModified: new Date('2026-07-16'), changeFrequency: 'weekly', priority: 0.8 },
    ...articles.map((article) => ({ url: `${baseUrl}/edukasi/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
