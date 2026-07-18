import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured, getAdminArticles, type StoredArticle } from '@/lib/article-store';
import ArticleEditor from './article-editor';
import { getAiConfiguration } from '@/lib/openai-content';
import { getKnowledgeSources, type KnowledgeSource } from '@/lib/knowledge-store';

export const metadata = { title: 'Kelola Artikel | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; optimize?: string }>;
}) {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const query = await searchParams;
  const initialArticleId = Number(query.edit);
  const databaseReady = databaseConfigured();
  const ai = getAiConfiguration();
  let initialArticles: StoredArticle[] = [];
  let initialKnowledgeSources: KnowledgeSource[] = [];
  let initialError = '';
  if (databaseReady) {
    try {
      initialArticles = await getAdminArticles();
      initialKnowledgeSources = await getKnowledgeSources();
    } catch (error) {
      console.error(error);
      initialError = 'Database sudah dikonfigurasi, tetapi belum dapat dihubungi.';
    }
  }
  return <ArticleEditor databaseReady={databaseReady} aiReady={ai.ready} aiProvider={ai.providerLabel} aiModel={ai.model} initialArticles={initialArticles} initialKnowledgeSources={initialKnowledgeSources} initialError={initialError} initialArticleId={Number.isInteger(initialArticleId) && initialArticleId > 0 ? initialArticleId : null} focusOptimization={query.optimize === '1'} />;
}
