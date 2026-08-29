import { renderSitemap, siteUrl, xmlResponse } from '@/lib/seo-sitemaps';

export function GET() { return xmlResponse(renderSitemap([{ url: `${siteUrl}/promotor`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.82 }])); }
