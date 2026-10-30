import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getKnowledgeSources, type KnowledgeSource } from '@/lib/knowledge-store';
import KnowledgeManager from './knowledge-manager';

export const metadata = { title: 'Pustaka STIFIn | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminKnowledgePage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const databaseReady = databaseConfigured();
  let sources: KnowledgeSource[] = [];
  let initialError = '';
  if (databaseReady) {
    try {
      sources = await getKnowledgeSources();
    } catch (error) {
      console.error(error);
      initialError = 'Database sudah dikonfigurasi, tetapi Pustaka belum dapat dibuka.';
    }
  }
  return <KnowledgeManager databaseReady={databaseReady} initialSources={sources} initialError={initialError} />;
}
