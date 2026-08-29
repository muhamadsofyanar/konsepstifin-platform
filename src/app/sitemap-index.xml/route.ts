import {
  articleSitemap,
  maxSitemapTimestamp,
  promoterSitemap,
  regionSitemap,
  renderSitemapIndex,
  siteUrl,
  staticSitemap,
  xmlResponse,
} from '@/lib/seo-sitemaps';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [articles, regions, promoters] = await Promise.all([
    articleSitemap().catch(() => []),
    regionSitemap().catch(() => []),
    promoterSitemap().catch(() => []),
  ]);
  const children = [
    { url: `${siteUrl}/sitemaps/static.xml`, lastModified: maxSitemapTimestamp(staticSitemap()) },
    { url: `${siteUrl}/sitemaps/articles.xml`, lastModified: maxSitemapTimestamp(articles) },
    { url: `${siteUrl}/sitemaps/regions.xml`, lastModified: maxSitemapTimestamp(regions) },
    { url: `${siteUrl}/sitemaps/promoters.xml`, lastModified: maxSitemapTimestamp(promoters) },
  ];
  return xmlResponse(renderSitemapIndex(children));
}
