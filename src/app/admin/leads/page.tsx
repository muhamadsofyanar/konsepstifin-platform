import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getLeads, type InterestLead } from '@/lib/interest-store';
import { getPublicPromoters, type PublicPromoter } from '@/lib/promoter-store';
import LeadManager from './lead-manager';

export const metadata = { title: 'Lead & Tindak Lanjut | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');

  const databaseReady = databaseConfigured();
  let leads: InterestLead[] = [];
  let promoters: PublicPromoter[] = [];
  let initialError = '';

  if (databaseReady) {
    try {
      leads = await getLeads();
    } catch (error) {
      console.error('Gagal membuka lead admin.', error);
      initialError = 'Database lead belum dapat dibuka.';
    }
  }

  try {
    promoters = await getPublicPromoters();
  } catch (error) {
    console.error('Daftar promotor belum dapat dibuka untuk penugasan lead.', error);
  }

  return <LeadManager
    databaseReady={databaseReady}
    initialLeads={leads}
    initialPromoters={promoters}
    initialError={initialError}
  />;
}
