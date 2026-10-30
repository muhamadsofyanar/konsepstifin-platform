import { NextRequest } from 'next/server';
import { getPublishedArticles } from '@/lib/article-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') ?? 0);
  const limit = requestedLimit > 0 ? Math.min(requestedLimit, 20) : undefined;
  const articles = await getPublishedArticles(limit);
  const previews = articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt,
    publishedLabel: article.publishedLabel,
    readTime: article.readTime,
    tone: article.tone,
    featured: article.featured,
    status: article.status,
  }));
  return Response.json({ articles: previews }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
