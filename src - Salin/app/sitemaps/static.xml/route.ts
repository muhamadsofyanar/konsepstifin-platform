import { renderSitemap, staticSitemap, xmlResponse } from '@/lib/seo-sitemaps';

export function GET() { return xmlResponse(renderSitemap(staticSitemap())); }
