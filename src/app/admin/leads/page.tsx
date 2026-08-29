import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getLeads } from '@/lib/interest-store';
import LeadManager from './lead-manager';

export const metadata = { title: 'Koordinasi Lead | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  let leads = [] as Awaited<ReturnType<typeof getLeads>>;
  let initialError = '';
  if (databaseConfigured()) {
    try { leads = await getLeads(); } catch (error) { console.error(error); initialError = 'Database lead belum dapat dibuka.'; }
  }
  return <LeadManager databaseReady={databaseConfigured()} initialLeads={leads} initialError={initialError} />;
}
