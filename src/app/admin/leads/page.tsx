import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getCrmLeads } from '@/lib/interest-store';
import LeadManager from './lead-manager';

export const metadata = { title: 'Klien & Promotor | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  let leads: Awaited<ReturnType<typeof getCrmLeads>> = { items: [], total: 0, page: 1, pageSize: 25, groups: {prospect:0,client:0,candidate:0,promoter:0}, metrics: {baru:0,terlambat:0,milestone:0,selesai:0,ditutup:0}, options:{province:[],regency:[],service:[],campaign:[]} };
  let initialError = '';
  if (databaseConfigured()) {
    try { leads = await getCrmLeads(); } catch (error) { console.error(error); initialError = 'Database lead belum dapat dibuka.'; }
  }
  return <LeadManager databaseReady={databaseConfigured()} initialPage={leads} initialError={initialError} />;
}
