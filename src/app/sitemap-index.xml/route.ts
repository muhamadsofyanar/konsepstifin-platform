import { siteUrl, xmlResponse } from '@/lib/seo-sitemaps';

export function GET() {
  const lastmod = new Date().toISOString();
  const paths = ['/sitemaps/static.xml', '/sitemaps/articles.xml', '/sitemaps/regions.xml', '/sitemaps/promoters.xml'];
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<sitemap><loc>${siteUrl}${path}</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('')}</sitemapindex>`);
}
