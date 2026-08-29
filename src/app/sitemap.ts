import type { MetadataRoute } from 'next';
import { articleSitemap, promoterSitemap, regionSitemap, staticSitemap } from '@/lib/seo-sitemaps';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, regions, promoters] = await Promise.all([
    articleSitemap().catch(() => []),
    regionSitemap().catch(() => []),
    promoterSitemap().catch(() => []),
  ]);
  return [...new Map([...staticSitemap(), ...articles, ...regions, ...promoters]
    .map((entry) => [entry.url, entry])).values()];
}
