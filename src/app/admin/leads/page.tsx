import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import LeadsDashboard from './leads-dashboard';

export const metadata = { title: 'Lead Nasional | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  return (
    <div className="article-admin leads-admin-shell">
      <LeadsDashboard />
    </div>
  );
}
