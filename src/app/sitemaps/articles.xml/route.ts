import { articleSitemap, renderSitemap, xmlResponse } from '@/lib/seo-sitemaps';

export const dynamic = 'force-dynamic';
export async function GET() { return xmlResponse(renderSitemap(await articleSitemap())); }
