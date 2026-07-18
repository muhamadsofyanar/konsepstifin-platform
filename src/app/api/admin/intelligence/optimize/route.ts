import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getAdminArticles, updateArticle, validateArticleInput } from '@/lib/article-store';
import { buildContentIntelligence } from '@/lib/content-intelligence';
import {
  applyOptimizationPlan,
  buildBatchOptimizationPlan,
  storedArticleToInput,
} from '@/lib/content-optimizer';

type OptimizationRequest = {
  action?: 'preview' | 'apply';
  articleIds?: unknown[];
};

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  }
  try {
    const data = await request.json() as OptimizationRequest;
    const action = data.action === 'apply' ? 'apply' : 'preview';
    const articleIds = Array.isArray(data.articleIds)
      ? [...new Set(data.articleIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 100)
      : undefined;
    const articles = await getAdminArticles();
    const plans = buildBatchOptimizationPlan(articles, articleIds);
    const planBySlug = new Map(plans.map((plan) => [plan.slug, plan]));
    const projectedAt = new Date().toISOString();
    const projectedArticles = articles.map((article) => {
      const plan = planBySlug.get(article.slug);
      return plan ? { ...applyOptimizationPlan(article, plan), updatedAt: projectedAt } : article;
    });
    const before = buildContentIntelligence(articles).metrics;
    const after = buildContentIntelligence(projectedArticles).metrics;

    if (action === 'preview') {
      return Response.json({ plans, before, after });
    }

    let updated = 0;
    for (const plan of plans) {
      const current = articles.find((article) => article.slug === plan.slug);
      if (!current || typeof current.id !== 'number') continue;
      const optimized = applyOptimizationPlan(current, plan);
      await updateArticle(current.id, validateArticleInput(storedArticleToInput(optimized)));
      updated += 1;
    }
    return Response.json({ updated, before, after });
  } catch (error) {
    console.error('Optimasi Content Intelligence gagal.', error);
    return Response.json({
      message: error instanceof Error ? error.message : 'Optimasi konten gagal dijalankan.',
    }, { status: 400 });
  }
}
