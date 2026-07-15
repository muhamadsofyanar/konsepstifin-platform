import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured, getAdminArticles, type StoredArticle } from '@/lib/article-store';
import ArticleEditor from './article-editor';

export const metadata = { title: 'Kelola Artikel | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminArticlePage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const databaseReady = databaseConfigured();
  let initialArticles: StoredArticle[] = [];
  let initialError = '';
  if (databaseReady) {
    try {
      initialArticles = await getAdminArticles();
    } catch (error) {
      console.error(error);
      initialError = 'Database sudah dikonfigurasi, tetapi belum dapat dihubungi.';
    }
  }
  return <ArticleEditor databaseReady={databaseReady} initialArticles={initialArticles} initialError={initialError} />;
}
