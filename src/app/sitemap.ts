import type { MetadataRoute } from 'next';
import { articles } from './edukasi/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://konsepstifin.com';
  return [
    { url: baseUrl, lastModified: new Date('2026-07-15'), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/edukasi`, lastModified: new Date('2026-07-15'), changeFrequency: 'weekly', priority: 0.8 },
    ...articles.map((article) => ({ url: `${baseUrl}/edukasi/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}

